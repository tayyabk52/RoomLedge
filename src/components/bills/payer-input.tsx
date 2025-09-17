'use client'

import { motion } from 'framer-motion'
import { DollarSign, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UserAvatar } from '@/components/shared/user-avatar'
import { CurrencyDisplay } from '@/components/shared/currency-display'
import { RoomMember, RoomCurrency } from '@/types'

interface PayerData {
  user_id: string
  amount_paid: number
}

interface PayerInputProps {
  members: RoomMember[]
  participants: string[]
  payers: PayerData[]
  onPayersChange: (payers: PayerData[]) => void
  totalAmount: number
  currency: RoomCurrency
  currentUserId: string
}

export function PayerInput({
  members,
  participants,
  payers,
  onPayersChange,
  totalAmount,
  currency,
  currentUserId
}: PayerInputProps) {
  const participantMembers = members.filter(member =>
    participants.includes(member.user_id)
  )

  const totalPaid = payers.reduce((sum, payer) => sum + payer.amount_paid, 0)
  const remaining = totalAmount - totalPaid
  const isOverpaid = totalPaid > totalAmount

  const updatePayerAmount = (userId: string, amount: number) => {
    const existingPayers = payers.filter(p => p.user_id !== userId)
    const newPayers = amount > 0
      ? [...existingPayers, { user_id: userId, amount_paid: amount }]
      : existingPayers

    onPayersChange(newPayers)
  }

  const getPayerAmount = (userId: string) => {
    return payers.find(p => p.user_id === userId)?.amount_paid || 0
  }

  const autoFillRemaining = () => {
    if (remaining > 0 && participantMembers.length > 0) {
      // Find the first participant who hasn't paid anything yet
      const unpaidParticipant = participantMembers.find(member =>
        getPayerAmount(member.user_id) === 0
      )

      if (unpaidParticipant) {
        updatePayerAmount(unpaidParticipant.user_id, remaining)
      } else {
        // If all have paid something, add to the current user
        const currentAmount = getPayerAmount(currentUserId)
        updatePayerAmount(currentUserId, currentAmount + remaining)
      }
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      <Card className="overflow-hidden shadow-lg border-gray-200">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
                <DollarSign className="h-4 w-4 text-white" />
              </div>
              <CardTitle className="text-lg font-semibold text-gray-900">
                Who paid how much?
              </CardTitle>
            </div>

            {remaining > 0 && (
              <button
                type="button"
                onClick={autoFillRemaining}
                className="text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors px-2 py-1 rounded-md hover:bg-emerald-50"
              >
                Auto-fill remaining
              </button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Payment status summary */}
          <div className={`
            p-3 rounded-xl border-2 transition-all duration-300
            ${isOverpaid
              ? 'bg-red-50 border-red-200 text-red-700'
              : remaining === 0
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-yellow-50 border-yellow-200 text-yellow-700'
            }
          `}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isOverpaid && <AlertTriangle className="h-4 w-4" />}
                <span className="text-sm font-medium">
                  {isOverpaid
                    ? 'Overpaid'
                    : remaining === 0
                      ? 'Fully covered'
                      : 'Remaining to assign'
                  }
                </span>
              </div>

              <CurrencyDisplay
                amount={isOverpaid ? totalPaid - totalAmount : remaining}
                currency={currency}
                className="font-semibold"
              />
            </div>

            {totalAmount > 0 && (
              <div className="mt-2 text-xs opacity-75">
                <CurrencyDisplay amount={totalPaid} currency={currency} /> of{' '}
                <CurrencyDisplay amount={totalAmount} currency={currency} /> assigned
              </div>
            )}
          </div>

          {/* Payer inputs */}
          <div className="space-y-3">
            {participantMembers.map((member, index) => {
              const amount = getPayerAmount(member.user_id)
              const isCurrentUser = member.user_id === currentUserId

              return (
                <motion.div
                  key={member.user_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    duration: 0.2,
                    delay: 0.05 * index
                  }}
                  className="group"
                >
                  <div className={`
                    p-3 rounded-xl border-2 transition-all duration-300
                    ${amount > 0
                      ? 'bg-emerald-50 border-emerald-200 ring-1 ring-emerald-200'
                      : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                    }
                  `}>
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        <UserAvatar
                          user={member.profile || { full_name: 'User', avatar_url: undefined }}
                          size="sm"
                          className={`
                            ring-2 transition-all duration-300
                            ${amount > 0
                              ? 'ring-emerald-300'
                              : 'ring-gray-200 group-hover:ring-gray-300'
                            }
                          `}
                        />
                      </div>

                      {/* Name and input */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <Label
                            htmlFor={`payer-${member.user_id}`}
                            className="text-sm font-medium text-gray-700 truncate"
                          >
                            {isCurrentUser ? 'You' : member.profile?.full_name || 'User'}
                          </Label>

                          <div className="flex items-center gap-1 min-w-0 flex-1 max-w-[120px]">
                            <span className="text-sm text-gray-500 flex-shrink-0">
                              {currency}
                            </span>
                            <Input
                              id={`payer-${member.user_id}`}
                              type="number"
                              placeholder="0"
                              value={amount === 0 ? '' : amount.toString()}
                              onChange={(e) => {
                                const value = parseFloat(e.target.value) || 0
                                updatePayerAmount(member.user_id, Math.max(0, value))
                              }}
                              className={`
                                text-right border-0 bg-transparent p-1 h-8 text-sm font-medium
                                focus:ring-0 focus:outline-none
                                ${amount > 0 ? 'text-emerald-700' : 'text-gray-600'}
                              `}
                              min="0"
                              step="0.01"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Quick action buttons */}
          {participantMembers.length > 0 && totalAmount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.3 }}
              className="pt-2 border-t border-gray-100"
            >
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    // Set the current user to pay the full amount
                    const newPayers = [{ user_id: currentUserId, amount_paid: totalAmount }]
                    onPayersChange(newPayers)
                  }}
                  className="flex-1 text-xs font-medium text-gray-600 hover:text-gray-800 py-2 px-3 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  I paid it all
                </button>

                <button
                  type="button"
                  onClick={() => {
                    // Split evenly among all participants
                    const amountPerPerson = totalAmount / participantMembers.length
                    const newPayers = participantMembers.map(member => ({
                      user_id: member.user_id,
                      amount_paid: Math.round(amountPerPerson * 100) / 100
                    }))
                    onPayersChange(newPayers)
                  }}
                  className="flex-1 text-xs font-medium text-gray-600 hover:text-gray-800 py-2 px-3 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Split evenly
                </button>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}