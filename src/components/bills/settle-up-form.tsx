'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { CreditCard, Banknote, Smartphone, Check, Loader2, TrendingDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CurrencyDisplay } from '@/components/shared/currency-display'
import { UserAvatar } from '@/components/shared/user-avatar'
import { useCreateSettlement, useUserPosition } from '@/hooks/use-bill-data'
import { useRoomMembers } from '@/hooks/use-room-data'
import { Bill, Room, PaymentMethod, CreateSettlementData } from '@/types'
import { toast } from 'sonner'
import { deriveSuggestedTransfersFromCalculations } from '@/lib/settlement-utils'

interface SettleUpFormProps {
  bill: Bill
  room: Room
  currentUserId: string
  onSuccess?: () => void
}

const paymentMethods: { id: PaymentMethod; label: string; icon: typeof CreditCard }[] = [
  { id: 'cash', label: 'Cash', icon: Banknote },
  { id: 'mobile_wallet', label: 'Mobile Wallet', icon: Smartphone },
  { id: 'bank_transfer', label: 'Bank Transfer', icon: CreditCard }
]

export function SettleUpForm({ bill, room, currentUserId, onSuccess }: SettleUpFormProps) {
  const { data: roomMembers = [] } = useRoomMembers(room.id)
  const { data: userPositions } = useUserPosition(room.id)
  const createSettlementMutation = useCreateSettlement()

  // Get current user's position from the database views (this already includes all settlements)
  // net_after_settlement is the final amount: negative = user owes money, positive = user is owed money
  const userPosition = userPositions?.find(p => p.bill_id === bill.id && p.user_id === currentUserId)
  const userCalculation = bill.is_advanced
    ? bill.calculations?.find(calc => calc.user_id === currentUserId)
    : undefined
  const advancedTransfers = bill.is_advanced && bill.calculations?.length
    ? deriveSuggestedTransfersFromCalculations(bill.calculations, bill.id)
    : []

  const calculationRemaining = userCalculation ? userCalculation.remaining_paisa / 100 : undefined

  const userNetDebt = userCalculation
    ? Math.abs(Math.min(0, calculationRemaining ?? 0))
    : userPosition
      ? Math.abs(Math.min(0, userPosition.net_after_settlement))
      : 0
  const maxSettlementAmount = userNetDebt

  // For display purposes
  const userShare = userCalculation
    ? userCalculation.owed_paisa / 100
    : userPosition?.share_amount || 0
  const userPaid = userCalculation
    ? userCalculation.covered_paisa / 100
    : userPosition?.amount_paid || 0

  // Form state
  const [amount, setAmount] = useState(maxSettlementAmount.toString())
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash')
  const [note, setNote] = useState('')

  // Update amount when input changes
  const handleAmountChange = (value: string) => {
    setAmount(value)
  }

  // Calculate who should receive the settlement
  const getSettlementRecipients = (): Array<{
    userId: string
    name: string
    amount: number
  }> => {
    const settlementAmount = parseFloat(amount) || 0

    if (settlementAmount <= 0) {
      return []
    }

    if (bill.is_advanced && bill.calculations?.length) {
      const requestedPaisa = Math.max(0, Math.round(settlementAmount * 100))
      const maxPaisa = Math.max(0, Math.round(maxSettlementAmount * 100))
      const amountPaisa = Math.min(requestedPaisa, maxPaisa)

      if (amountPaisa <= 0) {
        return []
      }

      const userTransfers = advancedTransfers.filter(transfer => transfer.from_user_id === currentUserId)

      if (userTransfers.length === 0) {
        return []
      }

      let remainingPaisa = amountPaisa
      const derivedRecipients: Array<{ userId: string; name: string; amount: number }> = []

      for (const transfer of userTransfers) {
        if (remainingPaisa <= 0) break

        const transferPaisa = Number(transfer.amount_paisa || 0)
        const amountToThisCreditor = Math.min(transferPaisa, remainingPaisa)

        if (amountToThisCreditor > 0) {
          const profile =
            bill.calculations?.find(calc => calc.user_id === transfer.to_user_id)?.profile ||
            bill.participants?.find(p => p.user_id === transfer.to_user_id)?.profile ||
            roomMembers?.find(member => member.user_id === transfer.to_user_id)?.profile

          derivedRecipients.push({
            userId: transfer.to_user_id,
            name: profile?.full_name || 'User',
            amount: amountToThisCreditor / 100
          })

          remainingPaisa -= amountToThisCreditor
        }
      }

      return derivedRecipients
    }

    if (!userPositions) {
      return []
    }

    const recipients: Array<{ userId: string; name: string; amount: number }> = []

    // Find creditors (people who are owed money on this bill - positive net_after_settlement)
    const creditors = userPositions
      .filter(p => p.bill_id === bill.id && p.user_id !== currentUserId && p.net_after_settlement > 0)
      .sort((a, b) => b.net_after_settlement - a.net_after_settlement)

    let remainingSettlement = settlementAmount

    for (const creditor of creditors) {
      if (remainingSettlement <= 0) break

      const amountToThisCreditor = Math.min(creditor.net_after_settlement, remainingSettlement)

      if (amountToThisCreditor > 0) {
        const creditorMember = roomMembers?.find(m => m.user_id === creditor.user_id)
        recipients.push({
          userId: creditor.user_id,
          name: creditorMember?.profile?.full_name || 'User',
          amount: amountToThisCreditor
        })
        remainingSettlement -= amountToThisCreditor
      }
    }

    return recipients
  }

  const recipients = getSettlementRecipients()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const settlementAmount = parseFloat(amount)
    if (!settlementAmount || settlementAmount <= 0) {
      toast.error('Please enter a valid settlement amount')
      return
    }

    if (settlementAmount - maxSettlementAmount > 0.009) {
      toast.error(`Settlement amount cannot exceed ${maxSettlementAmount.toFixed(2)}`)
      return
    }

    if (recipients.length === 0) {
      toast.error('No one to settle with on this bill')
      return
    }

    try {
      // Create settlements for each recipient
      // IMPORTANT: When a debtor pays a creditor, the settlement is recorded as
      // the debtor paying the creditor (from_user: debtor, to_user: creditor)
      // This creates an outgoing_settlement for the debtor, reducing their debt
      for (const recipient of recipients) {
        const settlementData: CreateSettlementData = {
          bill_id: bill.id,
          from_user: currentUserId,     // Debtor is paying
          to_user: recipient.userId,   // Creditor is receiving
          amount: recipient.amount,
          method: selectedMethod,
          note: note || undefined
        }

        await createSettlementMutation.mutateAsync(settlementData)
      }

      toast.success('Settlement recorded successfully!')
      onSuccess?.()
    } catch (error) {
      console.error('Settlement error:', error)
      toast.error('Failed to record settlement. Please try again.')
    }
  }

  const isSubmitting = createSettlementMutation.isPending

  // If user doesn't owe anything
  if (userNetDebt <= 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-8"
      >
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">All Settled!</h3>
        <p className="text-gray-600">You don&apos;t owe anything on this bill.</p>
      </motion.div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Settlement Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-red-200">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">You owe on this bill</h3>
              <CurrencyDisplay
                amount={userNetDebt}
                currency={bill.currency}
                className="text-2xl font-bold text-red-600"
              />
              <p className="text-sm text-gray-600 mt-2">
                Your share: <CurrencyDisplay amount={userShare} currency={bill.currency} /> •
                You paid: <CurrencyDisplay amount={userPaid} currency={bill.currency} />
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Amount Input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              How much are you settling?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Large amount input */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl font-bold text-gray-600">
                  {bill.currency}
                </span>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className="text-center text-3xl font-bold border-0 bg-transparent focus:ring-0 focus:outline-none p-2 max-w-[200px]"
                  min="0"
                  max={maxSettlementAmount.toFixed(2)}
                  step="0.01"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Quick amount buttons */}
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAmount((maxSettlementAmount * 0.25).toFixed(2))}
                disabled={isSubmitting}
                className="text-xs"
              >
                25%
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAmount((maxSettlementAmount * 0.5).toFixed(2))}
                disabled={isSubmitting}
                className="text-xs"
              >
                50%
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAmount(maxSettlementAmount.toFixed(2))}
                disabled={isSubmitting}
                className="text-xs"
              >
                All
              </Button>
            </div>

            {/* Progress indicator */}
            <div className="bg-gray-100 rounded-lg p-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Settlement progress:</span>
                <span className="font-medium">
                  <CurrencyDisplay amount={parseFloat(amount) || 0} currency={bill.currency} /> of{' '}
                  <CurrencyDisplay amount={maxSettlementAmount} currency={bill.currency} />
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, maxSettlementAmount > 0 ? ((parseFloat(amount) || 0) / maxSettlementAmount) * 100 : 0)}%`
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recipients */}
      {recipients.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">
                Paying to
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recipients.map((recipient) => (
                  <div
                    key={recipient.userId}
                    className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200"
                  >
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        user={roomMembers?.find(m => m.user_id === recipient.userId)?.profile || { full_name: 'User', avatar_url: undefined }}
                        size="sm"
                      />
                      <span className="font-medium text-gray-900">
                        {recipient.name}
                      </span>
                    </div>
                    <CurrencyDisplay
                      amount={recipient.amount}
                      currency={bill.currency}
                      className="font-semibold text-green-600"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Payment Method */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Payment method
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setSelectedMethod(method.id)}
                  disabled={isSubmitting}
                  className={`
                    p-4 rounded-xl border-2 transition-all duration-300 flex flex-col items-center gap-2
                    ${selectedMethod === method.id
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }
                  `}
                >
                  <method.icon className="h-6 w-6" />
                  <span className="text-sm font-medium">{method.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Note (optional) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      >
        <Card className="shadow-lg">
          <CardContent className="p-4">
            <Label htmlFor="note" className="text-sm font-medium text-gray-700">
              Add a note (optional)
            </Label>
            <Input
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g., Paid via EasyPaisa"
              className="mt-1"
              disabled={isSubmitting}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Submit Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.5 }}
        className="sticky bottom-4 pt-4"
      >
        <Button
          type="submit"
          disabled={isSubmitting || !amount || parseFloat(amount) <= 0}
          className={`
            w-full h-14 rounded-2xl text-lg font-semibold
            bg-gradient-to-r from-green-500 to-emerald-600
            hover:from-green-600 hover:to-emerald-700
            text-white shadow-lg hover:shadow-2xl
            transition-all duration-300
            ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}
          `}
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Recording Settlement...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5" />
              <span>Record Payment</span>
            </div>
          )}
        </Button>
      </motion.div>
    </form>
  )
}