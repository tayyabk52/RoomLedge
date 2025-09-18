'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Calculator, AlertCircle } from 'lucide-react'
import { CreateAdvanceBillData, ExtraType, ExtrasSplitRule } from '@/types'
import { toast } from 'sonner'

interface ExtrasConfigSectionProps {
  formData: CreateAdvanceBillData
  errors: { [key: string]: string }
  onUpdate: (updates: Partial<CreateAdvanceBillData>) => void
}

const EXTRA_TYPES: Array<{ value: ExtraType; label: string; description: string }> = [
  { value: 'tax', label: 'Tax', description: 'Government taxes (GST, VAT, etc.)' },
  { value: 'service', label: 'Service Charge', description: 'Restaurant service charges' },
  { value: 'tip', label: 'Tip/Gratuity', description: 'Tips for staff' },
  { value: 'delivery', label: 'Delivery Fee', description: 'Delivery or shipping costs' },
  { value: 'other', label: 'Other', description: 'Other miscellaneous charges' }
]

const SPLIT_RULES: Array<{ value: ExtrasSplitRule; label: string; description: string }> = [
  { value: 'proportional', label: 'Proportional', description: 'Split based on each person\'s item total' },
  { value: 'flat', label: 'Equal Split', description: 'Split equally among all participants' },
  { value: 'payer_only', label: 'Payer Only', description: 'Only the person who paid covers this extra' }
]

export function ExtrasConfigSection({
  formData,
  errors,
  onUpdate
}: ExtrasConfigSectionProps) {
  const [newExtra, setNewExtra] = useState({
    extra_type: 'tax' as ExtraType,
    name: '',
    amount: '',
    split_rule: 'proportional' as ExtrasSplitRule
  })

  const [isPercentage, setIsPercentage] = useState(false)

  const calculateItemsTotal = () => {
    return formData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  }

  const addExtra = () => {
    if (!newExtra.name.trim()) {
      toast.error('Extra name is required')
      return
    }
    if (!newExtra.amount || parseFloat(newExtra.amount) < 0) {
      toast.error('Valid amount is required')
      return
    }

    let finalAmount = parseFloat(newExtra.amount)

    // If percentage, calculate amount based on items total
    if (isPercentage) {
      const itemsTotal = calculateItemsTotal()
      if (itemsTotal === 0) {
        toast.error('Add items first to calculate percentage-based extras')
        return
      }
      finalAmount = (itemsTotal * finalAmount) / 100
    }

    const extra = {
      extra_type: newExtra.extra_type,
      name: newExtra.name.trim(),
      amount: finalAmount,
      split_rule: newExtra.split_rule
    }

    onUpdate({
      extras: [...formData.extras, extra]
    })

    // Reset form
    setNewExtra({
      extra_type: 'tax' as ExtraType,
      name: '',
      amount: '',
      split_rule: 'proportional' as ExtrasSplitRule
    })
    setIsPercentage(false)
  }

  const removeExtra = (index: number) => {
    const newExtras = formData.extras.filter((_, i) => i !== index)
    onUpdate({ extras: newExtras })
  }

  const getExtrasTotal = () => {
    return formData.extras.reduce((sum, extra) => sum + extra.amount, 0)
  }

  const getTypeIcon = (type: ExtraType) => {
    switch (type) {
      case 'tax': return '🏛️'
      case 'service': return '👨‍💼'
      case 'tip': return '💰'
      case 'delivery': return '🚚'
      default: return '📋'
    }
  }

  const getSplitRuleColor = (rule: ExtrasSplitRule) => {
    switch (rule) {
      case 'proportional': return 'bg-blue-100 text-blue-800'
      case 'flat': return 'bg-green-100 text-green-800'
      case 'payer_only': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const addQuickExtra = (type: ExtraType, percentage: number) => {
    const itemsTotal = calculateItemsTotal()
    if (itemsTotal === 0) {
      toast.error('Add items first to calculate percentage-based extras')
      return
    }

    const amount = (itemsTotal * percentage) / 100
    const typeInfo = EXTRA_TYPES.find(t => t.value === type)

    const extra = {
      extra_type: type,
      name: `${typeInfo?.label} (${percentage}%)`,
      amount,
      split_rule: 'proportional' as ExtrasSplitRule
    }

    onUpdate({
      extras: [...formData.extras, extra]
    })
  }

  return (
    <div className="space-y-6">
      {/* Quick Add Common Extras */}
      {formData.items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Quick Add Common Extras
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button
                variant="outline"
                onClick={() => addQuickExtra('tax', 10)}
                className="flex flex-col items-center p-4 h-auto"
              >
                <span className="text-lg mb-1">🏛️</span>
                <span className="text-sm font-medium">Tax 10%</span>
                <span className="text-xs text-gray-600">₨{((calculateItemsTotal() * 10) / 100).toFixed(2)}</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => addQuickExtra('service', 15)}
                className="flex flex-col items-center p-4 h-auto"
              >
                <span className="text-lg mb-1">👨‍💼</span>
                <span className="text-sm font-medium">Service 15%</span>
                <span className="text-xs text-gray-600">₨{((calculateItemsTotal() * 15) / 100).toFixed(2)}</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => addQuickExtra('tip', 10)}
                className="flex flex-col items-center p-4 h-auto"
              >
                <span className="text-lg mb-1">💰</span>
                <span className="text-sm font-medium">Tip 10%</span>
                <span className="text-xs text-gray-600">₨{((calculateItemsTotal() * 10) / 100).toFixed(2)}</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => addQuickExtra('delivery', 5)}
                className="flex flex-col items-center p-4 h-auto"
              >
                <span className="text-lg mb-1">🚚</span>
                <span className="text-sm font-medium">Delivery 5%</span>
                <span className="text-xs text-gray-600">₨{((calculateItemsTotal() * 5) / 100).toFixed(2)}</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Custom Extra Form */}
      <Card>
        <CardHeader>
          <CardTitle>Add Custom Extra</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Extra Type</Label>
                <Select
                  value={newExtra.extra_type}
                  onValueChange={(value: ExtraType) => setNewExtra(prev => ({ ...prev, extra_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXTRA_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <span>{getTypeIcon(type.value)}</span>
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-xs text-gray-600">{type.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Split Rule</Label>
                <Select
                  value={newExtra.split_rule}
                  onValueChange={(value: ExtrasSplitRule) => setNewExtra(prev => ({ ...prev, split_rule: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SPLIT_RULES.map((rule) => (
                      <SelectItem key={rule.value} value={rule.value}>
                        <div>
                          <div className="font-medium">{rule.label}</div>
                          <div className="text-xs text-gray-600">{rule.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="extra_name">Extra Name *</Label>
              <Input
                id="extra_name"
                placeholder="e.g., Government Tax, Service Charge"
                value={newExtra.name}
                onChange={(e) => setNewExtra(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="extra_amount">
                  Amount {isPercentage ? '(%)' : '(PKR)'} *
                </Label>
                <Input
                  id="extra_amount"
                  type="number"
                  step={isPercentage ? "0.1" : "0.01"}
                  min="0"
                  placeholder={isPercentage ? "10.5" : "0.00"}
                  value={newExtra.amount}
                  onChange={(e) => setNewExtra(prev => ({ ...prev, amount: e.target.value }))}
                />
                {isPercentage && newExtra.amount && (
                  <p className="text-xs text-gray-600">
                    = ₨{((calculateItemsTotal() * parseFloat(newExtra.amount)) / 100).toFixed(2)} based on items total
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Amount Type</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={!isPercentage ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsPercentage(false)}
                  >
                    Fixed Amount
                  </Button>
                  <Button
                    type="button"
                    variant={isPercentage ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsPercentage(true)}
                    disabled={calculateItemsTotal() === 0}
                  >
                    Percentage
                  </Button>
                </div>
                {calculateItemsTotal() === 0 && (
                  <p className="text-xs text-amber-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Add items first for percentage calculation
                  </p>
                )}
              </div>
            </div>

            <Button
              onClick={addExtra}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Extra
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Extras List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Extras ({formData.extras.length})</span>
            <span className="text-lg font-bold text-indigo-600">
              Total: ₨{getExtrasTotal().toFixed(2)}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {formData.extras.length === 0 ? (
            <div className="text-center py-8">
              <Calculator className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No extras added</p>
              <p className="text-sm text-gray-400">Extras like tax, service charges are optional</p>
            </div>
          ) : (
            <div className="space-y-3">
              {formData.extras.map((extra, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{getTypeIcon(extra.extra_type)}</span>
                      <div className="flex-1">
                        <h4 className="font-medium">{extra.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant="secondary"
                            className={getSplitRuleColor(extra.split_rule)}
                          >
                            {SPLIT_RULES.find(r => r.value === extra.split_rule)?.label}
                          </Badge>
                          <span className="text-sm text-gray-600 capitalize">
                            {extra.extra_type}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-indigo-600">₨{extra.amount.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeExtra(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-4"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {errors.extras && (
            <div className="mt-4 p-3 bg-red-50 rounded-lg">
              <p className="text-sm text-red-600">{errors.extras}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bill Total Summary */}
      {(formData.items.length > 0 || formData.extras.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Bill Total Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-gray-600">
                <span>Items Subtotal:</span>
                <span>₨{calculateItemsTotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Extras Total:</span>
                <span>₨{getExtrasTotal().toFixed(2)}</span>
              </div>
              <div className="h-px bg-gray-200"></div>
              <div className="flex justify-between text-lg font-bold text-gray-900">
                <span>Bill Total:</span>
                <span>₨{(calculateItemsTotal() + getExtrasTotal()).toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}