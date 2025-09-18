'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ItemizedInputSection } from './itemized-input-section'
import { ExtrasConfigSection } from './extras-config-section'
import { PayerConfigSection } from './payer-config-section'
import { AdvanceBillPreview } from './advance-bill-preview'
import { BillCalculator } from '@/lib/bill-calculator'
import { toPaisa } from '@/lib/paisa-utils'
import { useAuth } from '@/hooks/use-auth'
import {
  Room,
  RoomMember,
  CreateAdvanceBillData,
  AdvanceBillWizardState,
  AdvanceBillPreview as PreviewType
} from '@/types'
import { toast } from 'sonner'

interface AdvanceBillFormProps {
  room: Room
  roomMembers: RoomMember[]
  onSuccess?: () => void
  onBack?: () => void
}

const WIZARD_STEPS = [
  { id: 'items', title: 'Items', description: 'Add individual items' },
  { id: 'extras', title: 'Extras', description: 'Tax, service & tips' },
  { id: 'payers', title: 'Payers', description: 'Who paid at counter' },
  { id: 'preview', title: 'Preview', description: 'Review & confirm' }
] as const

export function AdvanceBillForm({ room, roomMembers, onSuccess, onBack }: AdvanceBillFormProps) {
  const { user } = useAuth()

  // Form state
  const [wizardState, setWizardState] = useState<AdvanceBillWizardState>({
    step: 'items',
    formData: {
      title: '',
      bill_date: new Date().toISOString().split('T')[0],
      room_id: room.id,
      participants: roomMembers.map(member => member.user_id),
      items: [],
      extras: [],
      payers: []
    },
    isValid: false,
    errors: {}
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Get participant profiles for easier access
  const participantProfiles = roomMembers.filter(member =>
    wizardState.formData.participants.includes(member.user_id)
  )

  const validateCurrentStep = useCallback(() => {
    const errors: { [key: string]: string } = {}
    let isValid = true

    switch (wizardState.step) {
      case 'items':
        if (!wizardState.formData.title.trim()) {
          errors.title = 'Bill title is required'
          isValid = false
        }
        if (wizardState.formData.items.length === 0) {
          errors.items = 'At least one item is required'
          isValid = false
        }
        // Validate items
        wizardState.formData.items.forEach((item, index) => {
          if (!item.item_name.trim()) {
            errors[`item_${index}_name`] = 'Item name is required'
            isValid = false
          }
          if (item.price <= 0) {
            errors[`item_${index}_price`] = 'Price must be greater than 0'
            isValid = false
          }
          if (item.quantity <= 0) {
            errors[`item_${index}_quantity`] = 'Quantity must be greater than 0'
            isValid = false
          }
        })
        break

      case 'extras':
        // Extras are optional, just validate if present
        wizardState.formData.extras.forEach((extra, index) => {
          if (!extra.name.trim()) {
            errors[`extra_${index}_name`] = 'Extra name is required'
            isValid = false
          }
          if (extra.amount < 0) {
            errors[`extra_${index}_amount`] = 'Amount cannot be negative'
            isValid = false
          }
        })
        break

      case 'payers':
        if (wizardState.formData.payers.length === 0) {
          errors.payers = 'At least one payer is required'
          isValid = false
        }
        // Validate payers
        wizardState.formData.payers.forEach((payer, index) => {
          if (payer.amount_paid <= 0) {
            errors[`payer_${index}_amount`] = 'Amount paid must be greater than 0'
            isValid = false
          }
        })

        // Check if total paid matches bill total
        try {
          const itemsTotal = wizardState.formData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
          const extrasTotal = wizardState.formData.extras.reduce((sum, extra) => sum + extra.amount, 0)
          const billTotal = itemsTotal + extrasTotal
          const paidTotal = wizardState.formData.payers.reduce((sum, payer) => sum + payer.amount_paid, 0)

          if (Math.abs(billTotal - paidTotal) > 0.01) {
            errors.balance = 'Total paid must equal bill total'
            isValid = false
          }
        } catch {
          errors.calculation = 'Invalid bill data'
          isValid = false
        }
        break

      case 'preview':
        // All validation should be done by now
        break
    }

    setWizardState(prev => ({
      ...prev,
      isValid,
      errors
    }))
  }, [wizardState.step, wizardState.formData])

  // Update wizard validity when form data changes
  useEffect(() => {
    validateCurrentStep()
  }, [wizardState.formData, wizardState.step, validateCurrentStep])

  const generatePreview = useCallback((): PreviewType | null => {
    try {
      // Convert form data to calculator input
      const calculatorInput = {
        items: wizardState.formData.items.map(item => ({
          userId: item.user_id,
          itemName: item.item_name,
          pricePaisa: toPaisa(item.price),
          quantity: item.quantity
        })),
        extras: wizardState.formData.extras.map(extra => ({
          type: extra.extra_type,
          name: extra.name,
          amountPaisa: toPaisa(extra.amount),
          splitRule: extra.split_rule
        })),
        payers: wizardState.formData.payers.map(payer => ({
          userId: payer.user_id,
          amountPaidPaisa: toPaisa(payer.amount_paid),
          coverageType: payer.coverage_type,
          coverageTargets: payer.coverage_targets,
          coverageWeights: payer.coverage_weights ? new Map(Object.entries(payer.coverage_weights)) : undefined
        })),
        participants: wizardState.formData.participants
      }

      const result = BillCalculator.calculate(calculatorInput)

      // Convert to preview format
      const userBreakdowns = Array.from(result.userBalances.entries()).map(([userId, balance]) => {
        const profile = participantProfiles.find(p => p.user_id === userId)
        const userItems = wizardState.formData.items.filter(item => item.user_id === userId)

        return {
          user_id: userId,
          user_name: profile?.profile?.full_name || 'Unknown User',
          items_paisa: userItems.reduce((sum, item) => sum + toPaisa(item.price * item.quantity), 0),
          extras_share_paisa: balance.owedPaisa - userItems.reduce((sum, item) => sum + toPaisa(item.price * item.quantity), 0),
          total_owed_paisa: balance.owedPaisa,
          covered_paisa: balance.coveredPaisa,
          net_paisa: balance.netPaisa,
          items_detail: userItems,
          extras_detail: wizardState.formData.extras.map(extra => ({
            name: extra.name,
            share_paisa: 0, // TODO: Calculate per-user extra share
            split_rule: extra.split_rule
          }))
        }
      })

      return {
        items_total_paisa: result.totalItemsPaisa,
        extras_total_paisa: result.totalExtrasPaisa,
        bill_total_paisa: result.totalBillPaisa,
        paid_total_paisa: result.totalPaidPaisa,
        user_breakdowns: userBreakdowns,
        suggested_transfers: result.suggestedTransfers.map(transfer => ({
          from_user_id: transfer.fromUserId,
          to_user_id: transfer.toUserId,
          amount_paisa: transfer.amountPaisa,
          from_profile: participantProfiles.find(p => p.user_id === transfer.fromUserId)?.profile,
          to_profile: participantProfiles.find(p => p.user_id === transfer.toUserId)?.profile
        })),
        is_balanced: result.isBalanced,
        validation_errors: result.validationErrors
      }
    } catch {
      return null
    }
  }, [wizardState.formData, participantProfiles])

  const handleNext = () => {
    if (!wizardState.isValid) return

    const currentIndex = WIZARD_STEPS.findIndex(step => step.id === wizardState.step)
    if (currentIndex < WIZARD_STEPS.length - 1) {
      const nextStep = WIZARD_STEPS[currentIndex + 1].id

      // Generate preview when moving to preview step
      if (nextStep === 'preview') {
        const preview = generatePreview()
        setWizardState(prev => ({
          ...prev,
          step: nextStep as AdvanceBillWizardState['step'],
          preview: preview || undefined
        }))
      } else {
        setWizardState(prev => ({
          ...prev,
          step: nextStep as AdvanceBillWizardState['step']
        }))
      }
    }
  }

  const handlePrevious = () => {
    const currentIndex = WIZARD_STEPS.findIndex(step => step.id === wizardState.step)
    if (currentIndex > 0) {
      const prevStep = WIZARD_STEPS[currentIndex - 1].id
      setWizardState(prev => ({
        ...prev,
        step: prevStep as AdvanceBillWizardState['step']
      }))
    }
  }

  const handleStepClick = (stepId: string) => {
    // Allow going back to previous steps, but not forward unless current step is valid
    const currentIndex = WIZARD_STEPS.findIndex(step => step.id === wizardState.step)
    const targetIndex = WIZARD_STEPS.findIndex(step => step.id === stepId)

    if (targetIndex <= currentIndex || wizardState.isValid) {
      setWizardState(prev => ({
        ...prev,
        step: stepId as AdvanceBillWizardState['step']
      }))
    }
  }

  const handleSubmit = async () => {
    if (!wizardState.isValid || !wizardState.preview || !user) return

    setIsSubmitting(true)
    try {
      // Import the bill service
      const { billService } = await import('@/lib/supabase-services')

      // Call the API to create advanced bill
      const { data: createdBill, error } = await billService.createAdvancedBill(
        wizardState.formData,
        user.id
      )

      if (error) {
        console.error('Error creating advanced bill:', error)
        toast.error('Failed to create advanced bill. Please try again.')
        return
      }

      if (createdBill) {
        toast.success('Advanced bill created successfully!')
        onSuccess?.()
      } else {
        toast.error('Failed to create advanced bill. Please try again.')
      }
    } catch (error) {
      console.error('Submit error:', error)
      toast.error('Failed to create advanced bill. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateFormData = (updates: Partial<CreateAdvanceBillData>) => {
    setWizardState(prev => ({
      ...prev,
      formData: {
        ...prev.formData,
        ...updates
      }
    }))
  }

  const currentStepIndex = WIZARD_STEPS.findIndex(step => step.id === wizardState.step)
  const isLastStep = currentStepIndex === WIZARD_STEPS.length - 1

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <Card className="bg-white border shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Create Advanced Bill</h1>
            {onBack && (
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
          </div>

          {/* Step Progress */}
          <div className="flex items-center space-x-4">
            {WIZARD_STEPS.map((step, index) => {
              const isActive = step.id === wizardState.step
              const isCompleted = index < currentStepIndex
              const isAccessible = index <= currentStepIndex || wizardState.isValid

              return (
                <div key={step.id} className="flex items-center">
                  <button
                    onClick={() => handleStepClick(step.id)}
                    disabled={!isAccessible}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                        : isCompleted
                        ? 'bg-green-100 text-green-800 border border-green-200 cursor-pointer hover:bg-green-200'
                        : isAccessible
                        ? 'bg-gray-100 text-gray-600 cursor-pointer hover:bg-gray-200'
                        : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                      isCompleted
                        ? 'bg-green-500 text-white'
                        : isActive
                        ? 'bg-indigo-500 text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}>
                      {isCompleted ? <Check className="h-3 w-3" /> : index + 1}
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium">{step.title}</div>
                      <div className="text-xs opacity-70">{step.description}</div>
                    </div>
                  </button>
                  {index < WIZARD_STEPS.length - 1 && (
                    <div className="w-8 h-px bg-gray-300 mx-2" />
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={wizardState.step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {wizardState.step === 'items' && (
            <ItemizedInputSection
              formData={wizardState.formData}
              participants={participantProfiles}
              errors={wizardState.errors}
              onUpdate={updateFormData}
            />
          )}
          {wizardState.step === 'extras' && (
            <ExtrasConfigSection
              formData={wizardState.formData}
              errors={wizardState.errors}
              onUpdate={updateFormData}
            />
          )}
          {wizardState.step === 'payers' && (
            <PayerConfigSection
              formData={wizardState.formData}
              participants={participantProfiles}
              errors={wizardState.errors}
              onUpdate={updateFormData}
            />
          )}
          {wizardState.step === 'preview' && wizardState.preview && (
            <AdvanceBillPreview
              preview={wizardState.preview}
              formData={wizardState.formData}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <Card className="bg-white border shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {Object.keys(wizardState.errors).length > 0 && (
                <div className="flex items-center space-x-2 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">Please fix errors before continuing</span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-3">
              {currentStepIndex > 0 && (
                <Button variant="outline" onClick={handlePrevious}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
              )}

              {!isLastStep ? (
                <Button
                  onClick={handleNext}
                  disabled={!wizardState.isValid}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!wizardState.isValid || isSubmitting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? 'Creating...' : 'Create Bill'}
                  <Check className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}