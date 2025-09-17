'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { CalendarDays, FileText, Save, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ParticipantSelector } from './participant-selector'
import { PayerInput } from './payer-input'
import { useRoomMembers } from '@/hooks/use-room-data'
import { useCreateBill } from '@/hooks/use-bill-data'
import { useAuth } from '@/hooks/use-auth'
import { Room, CreateBillData } from '@/types'
import { toast } from 'sonner'

interface PayerData {
  user_id: string
  amount_paid: number
}

interface AddBillFormProps {
  room: Room
  onSuccess?: () => void
}

export function AddBillForm({ room, onSuccess }: AddBillFormProps) {
  const { user } = useAuth()
  const { data: roomMembers = [] } = useRoomMembers(room.id)
  const createBillMutation = useCreateBill()

  // Form state
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [participants, setParticipants] = useState<string[]>([])
  const [payers, setPayers] = useState<PayerData[]>([])

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Validate title
    if (!title.trim()) {
      newErrors.title = 'Bill title is required'
    }

    // Validate amount
    const numAmount = parseFloat(amount)
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      newErrors.amount = 'Please enter a valid amount greater than 0'
    }

    // Validate date
    if (!date) {
      newErrors.date = 'Bill date is required'
    }

    // Validate participants
    if (participants.length === 0) {
      newErrors.participants = 'Please select at least one participant'
    }

    // Validate payers
    const totalPaid = payers.reduce((sum, payer) => sum + payer.amount_paid, 0)
    const hasValidPayers = payers.some(payer => payer.amount_paid > 0)

    if (!hasValidPayers) {
      newErrors.payers = 'Please specify who paid and how much'
    } else if (Math.abs(totalPaid - numAmount) > 0.01) {
      newErrors.payers = `Total paid (${totalPaid.toFixed(2)}) must equal bill amount (${numAmount.toFixed(2)})`
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error('Please fix the errors above')
      return
    }

    if (!user?.id) {
      toast.error('You must be logged in to create a bill')
      return
    }

    const billData: CreateBillData = {
      title: title.trim(),
      total_amount: parseFloat(amount),
      currency: room.base_currency,
      bill_date: date,
      room_id: room.id,
      participants,
      payers
    }

    try {
      await createBillMutation.mutateAsync(billData)
      toast.success('Bill created successfully!')
      onSuccess?.()
    } catch (error) {
      console.error('Error creating bill:', error)
      toast.error('Failed to create bill. Please try again.')
    }
  }

  const isSubmitting = createBillMutation.isPending

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Form Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="overflow-hidden shadow-lg border-gray-200">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
                <FileText className="h-4 w-4 text-white" />
              </div>
              <CardTitle className="text-lg font-semibold text-gray-900">
                Bill Details
              </CardTitle>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Title Input */}
            <div>
              <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                What was this bill for?
              </Label>
              <Input
                id="title"
                type="text"
                placeholder="e.g., Dinner at Restaurant"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`mt-1 ${errors.title ? 'border-red-300' : ''}`}
                disabled={isSubmitting}
              />
              {errors.title && (
                <p className="mt-1 text-xs text-red-600">{errors.title}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Date Input */}
              <div>
                <Label htmlFor="date" className="text-sm font-medium text-gray-700">
                  Date
                </Label>
                <div className="relative mt-1">
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className={`pl-9 ${errors.date ? 'border-red-300' : ''}`}
                    disabled={isSubmitting}
                  />
                  <CalendarDays className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
                {errors.date && (
                  <p className="mt-1 text-xs text-red-600">{errors.date}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Amount Input Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
      >
        <Card className="overflow-hidden shadow-lg border-gray-200 bg-gradient-to-br from-emerald-50 to-teal-50">
          <CardContent className="p-6">
            <div className="text-center">
              <Label htmlFor="amount" className="text-sm font-medium text-gray-700 block mb-2">
                Total Amount
              </Label>

              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl font-bold text-gray-600">
                  {room.base_currency}
                </span>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={`
                    text-center text-3xl font-bold border-0 bg-transparent
                    focus:ring-0 focus:outline-none p-2 max-w-[200px]
                    ${errors.amount ? 'text-red-600' : 'text-gray-900'}
                  `}
                  min="0"
                  step="0.01"
                  disabled={isSubmitting}
                />
              </div>

              {errors.amount && (
                <p className="mt-2 text-sm text-red-600">{errors.amount}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Participants Selector */}
      <ParticipantSelector
        members={roomMembers || []}
        selectedParticipants={participants}
        onSelectionChange={setParticipants}
        currentUserId={user?.id || ''}
      />
      {errors.participants && (
        <p className="text-sm text-red-600 mt-1 ml-4">{errors.participants}</p>
      )}

      {/* Payer Inputs */}
      {participants.length > 0 && (
        <PayerInput
          members={roomMembers || []}
          participants={participants}
          payers={payers}
          onPayersChange={setPayers}
          totalAmount={parseFloat(amount) || 0}
          currency={room.base_currency}
          currentUserId={user?.id || ''}
        />
      )}
      {errors.payers && (
        <p className="text-sm text-red-600 mt-1 ml-4">{errors.payers}</p>
      )}

      {/* Submit Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
        className="sticky bottom-4 pt-4"
      >
        <Button
          type="submit"
          disabled={isSubmitting}
          className={`
            w-full h-14 rounded-2xl text-lg font-semibold
            bg-gradient-to-r from-blue-500 to-indigo-600
            hover:from-blue-600 hover:to-indigo-700
            text-white shadow-lg hover:shadow-2xl
            transition-all duration-300 group
            ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}
          `}
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Creating Bill...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Save className="h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
              <span>Create Bill</span>
            </div>
          )}
        </Button>
      </motion.div>
    </form>
  )
}