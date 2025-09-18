'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, CreditCard, Users, AlertCircle, CheckCircle } from 'lucide-react'
import { CreateAdvanceBillData, RoomMember } from '@/types'
import { toast } from 'sonner'

interface PayerConfigSectionProps {
  formData: CreateAdvanceBillData
  participants: RoomMember[]
  errors: { [key: string]: string }
  onUpdate: (updates: Partial<CreateAdvanceBillData>) => void
}

export function PayerConfigSection({
  formData,
  participants,
  errors,
  onUpdate
}: PayerConfigSectionProps) {
  const [newPayer, setNewPayer] = useState({
    user_id: '',
    amount_paid: '',
    coverage_type: 'self_first' as 'proportional' | 'self_first' | 'specific' | 'custom',
    coverage_targets: [] as string[],
    coverage_weights: {} as { [key: string]: number }
  })

  const [isAddingPayer, setIsAddingPayer] = useState(false)

  const getBillTotal = () => {
    const itemsTotal = formData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const extrasTotal = formData.extras.reduce((sum, extra) => sum + extra.amount, 0)
    return itemsTotal + extrasTotal
  }

  const getPaidTotal = () => {
    return formData.payers.reduce((sum, payer) => sum + payer.amount_paid, 0)
  }

  const getUserName = (userId: string) => {
    const participant = participants.find(p => p.user_id === userId)
    return participant?.profile?.full_name || 'Unknown User'
  }

  const addPayer = () => {
    if (!newPayer.user_id) {
      toast.error('Please select who paid')
      return
    }
    if (!newPayer.amount_paid || parseFloat(newPayer.amount_paid) <= 0) {
      toast.error('Valid amount paid is required')
      return
    }

    // Check if user is already a payer
    if (formData.payers.some(p => p.user_id === newPayer.user_id)) {
      toast.error('This person is already added as a payer')
      return
    }

    const payer = {
      user_id: newPayer.user_id,
      amount_paid: parseFloat(newPayer.amount_paid),
      coverage_type: newPayer.coverage_type,
      coverage_targets: newPayer.coverage_type === 'proportional' || newPayer.coverage_type === 'self_first' ?
        undefined :
        newPayer.coverage_targets.length > 0 ? newPayer.coverage_targets : undefined,
      coverage_weights: newPayer.coverage_type === 'custom' && Object.keys(newPayer.coverage_weights).length > 0 ?
        newPayer.coverage_weights :
        undefined
    }

    onUpdate({
      payers: [...formData.payers, payer]
    })

    // Reset form
    setNewPayer({
      user_id: '',
      amount_paid: '',
      coverage_type: 'self_first',
      coverage_targets: [],
      coverage_weights: {}
    })
    setIsAddingPayer(false)
  }

  const removePayer = (index: number) => {
    const newPayers = formData.payers.filter((_, i) => i !== index)
    onUpdate({ payers: newPayers })
  }

  const addFullBillPayer = () => {
    const billTotal = getBillTotal()
    if (billTotal === 0) {
      toast.error('Add items first to determine bill total')
      return
    }

    const remainingAmount = billTotal - getPaidTotal()
    if (remainingAmount <= 0) {
      toast.error('Bill is already fully paid')
      return
    }

    if (participants.length === 0) {
      toast.error('No participants available')
      return
    }

    setNewPayer({
      user_id: participants[0].user_id,
      amount_paid: remainingAmount.toFixed(2),
      coverage_type: 'self_first',
      coverage_targets: [],
      coverage_weights: {}
    })
    setIsAddingPayer(true)
  }

  const handleCoverageTargetChange = (userId: string, checked: boolean) => {
    if (checked) {
      setNewPayer(prev => ({
        ...prev,
        coverage_targets: [...prev.coverage_targets, userId]
      }))
    } else {
      setNewPayer(prev => ({
        ...prev,
        coverage_targets: prev.coverage_targets.filter(id => id !== userId)
      }))
    }
  }

  const handleWeightChange = (userId: string, weight: string) => {
    const weightNum = parseFloat(weight) || 0
    setNewPayer(prev => ({
      ...prev,
      coverage_weights: {
        ...prev.coverage_weights,
        [userId]: weightNum
      }
    }))
  }

  const billTotal = getBillTotal()
  const paidTotal = getPaidTotal()
  const remaining = billTotal - paidTotal
  const isBalanced = Math.abs(remaining) < 0.01

  return (
    <div className="space-y-6">
      {/* Bill Balance Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">Bill Total</p>
              <p className="text-xl font-bold text-blue-800">₨{billTotal.toFixed(2)}</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-600 font-medium">Paid Total</p>
              <p className="text-xl font-bold text-green-800">₨{paidTotal.toFixed(2)}</p>
            </div>
            <div className={`text-center p-4 rounded-lg ${
              isBalanced ? 'bg-green-50' : remaining > 0 ? 'bg-red-50' : 'bg-yellow-50'
            }`}>
              <p className={`text-sm font-medium ${
                isBalanced ? 'text-green-600' : remaining > 0 ? 'text-red-600' : 'text-yellow-600'
              }`}>
                {remaining > 0 ? 'Remaining' : remaining < 0 ? 'Overpaid' : 'Balanced'}
              </p>
              <p className={`text-xl font-bold ${
                isBalanced ? 'text-green-800' : remaining > 0 ? 'text-red-800' : 'text-yellow-800'
              }`}>
                {isBalanced ? '✓' : `₨${Math.abs(remaining).toFixed(2)}`}
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 font-medium">Payers</p>
              <p className="text-xl font-bold text-gray-800">{formData.payers.length}</p>
            </div>
          </div>

          {!isBalanced && (
            <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 ${
              remaining > 0 ? 'bg-red-50 text-red-800' : 'bg-yellow-50 text-yellow-800'
            }`}>
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">
                {remaining > 0
                  ? `₨${remaining.toFixed(2)} more needs to be added to balance the bill`
                  : `₨${Math.abs(remaining).toFixed(2)} overpaid - adjust payer amounts`
                }
              </span>
            </div>
          )}

          {isBalanced && formData.payers.length > 0 && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg flex items-center gap-2 text-green-800">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">Bill is perfectly balanced! Ready for preview.</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      {!isBalanced && remaining > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={addFullBillPayer}
                disabled={billTotal === 0}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Full Bill Payer (₨{remaining.toFixed(2)})
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsAddingPayer(true)}
                disabled={billTotal === 0}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Custom Payer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Payer Form */}
      {isAddingPayer && (
        <Card>
          <CardHeader>
            <CardTitle>Add Payer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Who Paid? *</Label>
                  <Select
                    value={newPayer.user_id}
                    onValueChange={(value) => setNewPayer(prev => ({ ...prev, user_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select person" />
                    </SelectTrigger>
                    <SelectContent>
                      {participants.filter(p => !formData.payers.some(payer => payer.user_id === p.user_id)).map((participant) => (
                        <SelectItem key={participant.user_id} value={participant.user_id}>
                          {participant.profile?.full_name || 'Unknown User'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount_paid">Amount Paid (PKR) *</Label>
                  <Input
                    id="amount_paid"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={newPayer.amount_paid}
                    onChange={(e) => setNewPayer(prev => ({ ...prev, amount_paid: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Coverage Type</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <Button
                    type="button"
                    variant={newPayer.coverage_type === 'self_first' ? "default" : "outline"}
                    size="sm"
                    onClick={() => setNewPayer(prev => ({ ...prev, coverage_type: 'self_first' }))}
                  >
                    Self First
                  </Button>
                  <Button
                    type="button"
                    variant={newPayer.coverage_type === 'proportional' ? "default" : "outline"}
                    size="sm"
                    onClick={() => setNewPayer(prev => ({ ...prev, coverage_type: 'proportional' }))}
                  >
                    Proportional
                  </Button>
                  <Button
                    type="button"
                    variant={newPayer.coverage_type === 'specific' ? "default" : "outline"}
                    size="sm"
                    onClick={() => setNewPayer(prev => ({ ...prev, coverage_type: 'specific' }))}
                  >
                    Specific People
                  </Button>
                  <Button
                    type="button"
                    variant={newPayer.coverage_type === 'custom' ? "default" : "outline"}
                    size="sm"
                    onClick={() => setNewPayer(prev => ({ ...prev, coverage_type: 'custom' }))}
                  >
                    Custom Weights
                  </Button>
                </div>
                <p className="text-xs text-gray-600">
                  {newPayer.coverage_type === 'self_first' && "Cover own debt first, then help others proportionally"}
                  {newPayer.coverage_type === 'proportional' && "Covers everyone proportionally based on their bill amounts"}
                  {newPayer.coverage_type === 'specific' && "Choose specific people this payer covers"}
                  {newPayer.coverage_type === 'custom' && "Set custom weights for each person"}
                </p>
              </div>

              {/* Specific People Selection */}
              {newPayer.coverage_type === 'specific' && (
                <div className="space-y-2">
                  <Label>Who does this payer cover?</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {participants.map((participant) => (
                      <div key={participant.user_id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`target-${participant.user_id}`}
                          checked={newPayer.coverage_targets.includes(participant.user_id)}
                          onCheckedChange={(checked) => handleCoverageTargetChange(participant.user_id, !!checked)}
                        />
                        <Label htmlFor={`target-${participant.user_id}`}>
                          {participant.profile?.full_name || 'Unknown User'}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Weights */}
              {newPayer.coverage_type === 'custom' && (
                <div className="space-y-2">
                  <Label>Custom Coverage Weights</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {participants.map((participant) => (
                      <div key={participant.user_id} className="flex items-center space-x-2">
                        <Label className="flex-1 text-sm">
                          {participant.profile?.full_name || 'Unknown User'}
                        </Label>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          placeholder="0.0"
                          className="w-20"
                          value={newPayer.coverage_weights[participant.user_id] || ''}
                          onChange={(e) => handleWeightChange(participant.user_id, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-600">
                    Higher weights mean this payer covers more of that person&apos;s expenses
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <Button onClick={addPayer} className="bg-indigo-600 hover:bg-indigo-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Payer
                </Button>
                <Button variant="outline" onClick={() => setIsAddingPayer(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payers List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Payers ({formData.payers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {formData.payers.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No payers added yet</p>
              <p className="text-sm text-gray-400">Add who paid at the counter to balance the bill</p>
            </div>
          ) : (
            <div className="space-y-3">
              {formData.payers.map((payer, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <h4 className="font-medium">{getUserName(payer.user_id)}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary">
                            ₨{payer.amount_paid.toFixed(2)}
                          </Badge>
                          {payer.coverage_type === 'self_first' ? (
                            <Badge variant="outline" className="text-xs">
                              Self first
                            </Badge>
                          ) : payer.coverage_type === 'specific' ? (
                            <Badge variant="outline" className="text-xs">
                              Covers: {payer.coverage_targets?.map(id => getUserName(id).split(' ')[0]).join(', ') || 'Specific people'}
                            </Badge>
                          ) : payer.coverage_type === 'custom' ? (
                            <Badge variant="outline" className="text-xs">
                              Custom weights
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              Proportional coverage
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removePayer(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {errors.payers && (
            <div className="mt-4 p-3 bg-red-50 rounded-lg">
              <p className="text-sm text-red-600">{errors.payers}</p>
            </div>
          )}

          {errors.balance && (
            <div className="mt-4 p-3 bg-red-50 rounded-lg">
              <p className="text-sm text-red-600">{errors.balance}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}