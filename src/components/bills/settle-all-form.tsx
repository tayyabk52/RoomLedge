'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { CreditCard, Banknote, Smartphone, Check, Loader2, AlertTriangle, Users, Receipt } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { EmptyState } from '@/components/shared/empty-state'
import { CurrencyDisplay } from '@/components/shared/currency-display'
import { UserAvatar } from '@/components/shared/user-avatar'
import { useCreateSettlement, useSettlementOpportunities } from '@/hooks/use-bill-data'
import { useRoomMembers } from '@/hooks/use-room-data'
import { Room, PaymentMethod, CreateSettlementData, RoomCurrency } from '@/types'
import { toast } from 'sonner'

interface SettleAllFormProps {
  room: Room
  currentUserId: string
  onSuccess?: () => void
}

const paymentMethods: { id: PaymentMethod; label: string; icon: typeof CreditCard }[] = [
  { id: 'cash', label: 'Cash', icon: Banknote },
  { id: 'mobile_wallet', label: 'Mobile Wallet', icon: Smartphone },
  { id: 'bank_transfer', label: 'Bank Transfer', icon: CreditCard }
]

export function SettleAllForm({ room, currentUserId, onSuccess }: SettleAllFormProps) {
  const { data: roomMembers = [] } = useRoomMembers(room.id)
  const { data: opportunities, isLoading } = useSettlementOpportunities(room.id)
  const createSettlementMutation = useCreateSettlement()

  // Form state
  const [selectedPerson, setSelectedPerson] = useState<string>('')
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash')
  const [note, setNote] = useState('')

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!opportunities || opportunities.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <EmptyState
          icon={<Check className="h-12 w-12" />}
          title="All settled up!"
          description="You don't have any outstanding debts to settle."
        />
      </motion.div>
    )
  }

  // Group opportunities by recipient
  const groupedByPerson = opportunities.reduce((acc, opp) => {
    opp.recipients.forEach(recipient => {
      if (!acc[recipient.user_id]) {
        acc[recipient.user_id] = {
          user_id: recipient.user_id,
          user_name: recipient.user_name,
          total_owed: 0,
          bills: []
        }
      }
      acc[recipient.user_id].total_owed += recipient.amount_to_receive
      acc[recipient.user_id].bills.push({
        bill_id: opp.bill_id,
        bill_title: opp.bill_title,
        amount: recipient.amount_to_receive,
        currency: opp.currency
      })
    })
    return acc
  }, {} as Record<string, {
    user_id: string
    user_name: string
    total_owed: number
    bills: Array<{ bill_id: string; bill_title: string; amount: number; currency: string }>
  }>)

  const peopleOwed = Object.values(groupedByPerson)
  const selectedPersonData = selectedPerson ? groupedByPerson[selectedPerson] : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedPersonData) {
      toast.error('Please select a person to settle with')
      return
    }

    try {
      // Create settlements for each bill with this person
      // IMPORTANT: When a debtor pays a creditor, the settlement is recorded as
      // the creditor giving the debtor credit (from_user: creditor, to_user: debtor)
      // This creates an incoming_settlement for the debtor, reducing their debt
      for (const bill of selectedPersonData.bills) {
        const settlementData: CreateSettlementData = {
          bill_id: bill.bill_id,
          from_user: selectedPersonData.user_id, // Creditor is giving credit
          to_user: currentUserId,                 // Debtor is receiving credit
          amount: bill.amount,
          method: selectedMethod,
          note: note || undefined
        }

        await createSettlementMutation.mutateAsync(settlementData)
      }

      toast.success(`Settlement of ${selectedPersonData.total_owed.toFixed(2)} ${room.base_currency} recorded!`)
      onSuccess?.()
    } catch (error) {
      console.error('Settlement error:', error)
      toast.error('Failed to record settlement. Please try again.')
    }
  }

  const isSubmitting = createSettlementMutation.isPending

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Outstanding Debts</h3>
              <p className="text-gray-600">
                You have debts across {opportunities.length} bill{opportunities.length !== 1 ? 's' : ''}
                {' '}with {peopleOwed.length} person{peopleOwed.length !== 1 ? 's' : ''}
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Person Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Who do you want to settle with?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {peopleOwed.map((person) => {
                const memberData = roomMembers?.find(m => m.user_id === person.user_id)
                const isSelected = selectedPerson === person.user_id

                return (
                  <motion.button
                    key={person.user_id}
                    type="button"
                    onClick={() => setSelectedPerson(person.user_id)}
                    disabled={isSubmitting}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`
                      w-full p-4 rounded-xl border-2 transition-all duration-300 text-left
                      ${isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <UserAvatar user={memberData?.profile || { full_name: 'User', avatar_url: undefined }} size="md" />
                        <div>
                          <h4 className="font-medium text-gray-900">{person.user_name}</h4>
                          <p className="text-sm text-gray-600">
                            {person.bills.length} bill{person.bills.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <CurrencyDisplay
                          amount={person.total_owed}
                          currency={room.base_currency}
                          className="text-lg font-semibold text-red-600"
                        />
                        {isSelected && (
                          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mt-1 ml-auto">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Settlement Details */}
      {selectedPersonData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">
                Settlement breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {selectedPersonData.bills.map((bill) => (
                  <div
                    key={bill.bill_id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Receipt className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="font-medium text-gray-900">{bill.bill_title}</span>
                    </div>
                    <CurrencyDisplay
                      amount={bill.amount}
                      currency={bill.currency as RoomCurrency}
                      className="font-semibold text-gray-700"
                    />
                  </div>
                ))}

                {/* Total */}
                <div className="border-t pt-3 mt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-gray-900">Total to settle:</span>
                    <CurrencyDisplay
                      amount={selectedPersonData.total_owed}
                      currency={room.base_currency}
                      className="text-xl font-bold text-red-600"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Payment Method */}
      {selectedPersonData && (
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
      )}

      {/* Note */}
      {selectedPersonData && (
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
                placeholder="e.g., Monthly settlement"
                className="mt-1"
                disabled={isSubmitting}
              />
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Submit Button */}
      {selectedPersonData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="sticky bottom-4 pt-4"
        >
          <Button
            type="submit"
            disabled={isSubmitting}
            className={`
              w-full h-14 rounded-2xl text-lg font-semibold
              bg-gradient-to-r from-emerald-500 to-green-600
              hover:from-emerald-600 hover:to-green-700
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
                <span>
                  Settle <CurrencyDisplay amount={selectedPersonData.total_owed} currency={room.base_currency} />
                </span>
              </div>
            )}
          </Button>
        </motion.div>
      )}
    </form>
  )
}