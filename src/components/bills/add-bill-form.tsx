'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { CalendarDays, Save, Loader2, ArrowLeft } from 'lucide-react'
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
  onBack?: () => void
}

export function AddBillForm({ room, onSuccess, onBack }: AddBillFormProps) {
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
    <div className="max-w-lg mx-auto px-4 py-1 lg:max-w-none lg:px-0 lg:py-0">
      {/* Back Button - Mobile Only */}
      {onBack && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-3 lg:hidden"
        >
          <Button
            onClick={onBack}
            variant="ghost"
            className="flex items-center gap-2 px-3 py-2 h-9 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Back</span>
          </Button>
        </motion.div>
      )}

      {/* Desktop Header */}
      <div className="hidden lg:block mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Add New Bill</h1>
            <p className="text-gray-600 text-sm mt-1">Split expenses with your roommates</p>
          </div>
          {onBack && (
            <Button
              onClick={onBack}
              variant="ghost"
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm font-medium">Back</span>
            </Button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 lg:space-y-5">

        {/* Form Fields - Desktop Card Layout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200"
        >
          <div className="space-y-6">
            {/* Title and Amount Row - Desktop */}
            <div className="lg:grid lg:grid-cols-2 lg:gap-6 space-y-4 lg:space-y-0">
              <div>
                <Label htmlFor="title" className="text-sm font-medium text-gray-700 mb-2 block">
                  Description
                </Label>
                <Input
                  id="title"
                  type="text"
                  placeholder="e.g., Dinner, Groceries, Utilities"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`h-11 text-sm border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500 ${
                    errors.title ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                  }`}
                  disabled={isSubmitting}
                />
                {errors.title && (
                  <p className="mt-1 text-xs text-red-600">{errors.title}</p>
                )}
              </div>

              {/* Amount */}
              <div>
                <Label htmlFor="amount" className="text-sm font-medium text-gray-700 mb-2 block">
                  Amount
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm font-medium text-gray-600">
                    {room.base_currency === 'PKR' ? '₨' : room.base_currency === 'USD' ? '$' : '€'}
                  </span>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className={`h-11 pl-8 text-sm border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500 ${
                      errors.amount ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'text-gray-900'
                    }`}
                    min="0"
                    step="0.01"
                    disabled={isSubmitting}
                  />
                </div>
                {errors.amount && (
                  <p className="mt-1 text-xs text-red-600">{errors.amount}</p>
                )}
              </div>
            </div>

            {/* Date Input */}
            <div className="lg:max-w-xs">
              <Label htmlFor="date" className="text-sm font-medium text-gray-700 mb-2 block">
                Date
              </Label>
              <div className="relative">
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={`h-11 pl-10 text-sm border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500 ${
                    errors.date ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                  }`}
                  disabled={isSubmitting}
                />
                <CalendarDays className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
              {errors.date && (
                <p className="mt-1 text-xs text-red-600">{errors.date}</p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Participants Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200"
        >
          <ParticipantSelector
            members={roomMembers || []}
            selectedParticipants={participants}
            onSelectionChange={setParticipants}
            currentUserId={user?.id || ''}
          />
          {errors.participants && (
            <p className="text-xs text-red-600 mt-2">{errors.participants}</p>
          )}
        </motion.div>

        {/* Payer Inputs */}
        {participants.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200"
          >
            <PayerInput
              members={roomMembers || []}
              participants={participants}
              payers={payers}
              onPayersChange={setPayers}
              totalAmount={parseFloat(amount) || 0}
              currency={room.base_currency}
              currentUserId={user?.id || ''}
            />
            {errors.payers && (
              <p className="text-xs text-red-600 mt-2">{errors.payers}</p>
            )}
          </motion.div>
        )}

        {/* Submit Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="pt-2 lg:pt-4"
        >
          <Button
            type="submit"
            disabled={isSubmitting}
            className={`
              w-full h-12 lg:h-14 rounded-xl lg:rounded-2xl text-sm lg:text-base font-medium lg:font-semibold
              bg-blue-500 hover:bg-blue-600 text-white 
              border-0 shadow-sm hover:shadow-md lg:shadow-lg lg:hover:shadow-xl
              transition-all duration-200 disabled:opacity-50
              ${isSubmitting ? 'cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2 lg:gap-3">
                <Loader2 className="h-4 w-4 lg:h-5 lg:w-5 animate-spin" />
                <span>Creating...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 lg:gap-3">
                <Save className="h-4 w-4 lg:h-5 lg:w-5" />
                <span>Create Bill</span>
              </div>
            )}
          </Button>
        </motion.div>
      </form>
    </div>
  )
}