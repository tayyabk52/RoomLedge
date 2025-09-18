'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Trash2, Plus, ShoppingCart } from 'lucide-react'
import { CreateAdvanceBillData, RoomMember } from '@/types'
import { toast } from 'sonner'

interface ItemizedInputSectionProps {
  formData: CreateAdvanceBillData
  participants: RoomMember[]
  errors: { [key: string]: string }
  onUpdate: (updates: Partial<CreateAdvanceBillData>) => void
}

export function ItemizedInputSection({
  formData,
  participants,
  errors,
  onUpdate
}: ItemizedInputSectionProps) {
  const [newItem, setNewItem] = useState({
    item_name: '',
    price: '',
    quantity: '1',
    user_id: ''
  })

  const addItem = () => {
    if (!newItem.item_name.trim()) {
      toast.error('Item name is required')
      return
    }
    if (!newItem.price || parseFloat(newItem.price) <= 0) {
      toast.error('Valid price is required')
      return
    }
    if (!newItem.quantity || parseInt(newItem.quantity) <= 0) {
      toast.error('Valid quantity is required')
      return
    }
    if (!newItem.user_id) {
      toast.error('Please select who ordered this item')
      return
    }

    const item = {
      item_name: newItem.item_name.trim(),
      price: parseFloat(newItem.price),
      quantity: parseInt(newItem.quantity),
      user_id: newItem.user_id
    }

    onUpdate({
      items: [...formData.items, item]
    })

    // Reset form
    setNewItem({
      item_name: '',
      price: '',
      quantity: '1',
      user_id: ''
    })
  }

  const removeItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index)
    onUpdate({ items: newItems })
  }

  const getUserName = (userId: string) => {
    const participant = participants.find(p => p.user_id === userId)
    return participant?.profile?.full_name || 'Unknown User'
  }

  const calculateItemsTotal = () => {
    return formData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  }

  return (
    <div className="space-y-6">
      {/* Bill Title */}
      <Card>
        <CardHeader>
          <CardTitle>Bill Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Bill Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Dinner at McDonald's"
                value={formData.title}
                onChange={(e) => onUpdate({ title: e.target.value })}
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && (
                <p className="text-sm text-red-600">{errors.title}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="bill_date">Bill Date</Label>
              <Input
                id="bill_date"
                type="date"
                value={formData.bill_date}
                onChange={(e) => onUpdate({ bill_date: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add New Item */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Add Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label htmlFor="item_name">Item Name *</Label>
              <Input
                id="item_name"
                placeholder="e.g., Big Mac"
                value={newItem.item_name}
                onChange={(e) => setNewItem(prev => ({ ...prev, item_name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price (PKR) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={newItem.price}
                onChange={(e) => setNewItem(prev => ({ ...prev, price: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                placeholder="1"
                value={newItem.quantity}
                onChange={(e) => setNewItem(prev => ({ ...prev, quantity: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Who Ordered? *</Label>
              <Select
                value={newItem.user_id}
                onValueChange={(value) => setNewItem(prev => ({ ...prev, user_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select person" />
                </SelectTrigger>
                <SelectContent>
                  {participants.map((participant) => (
                    <SelectItem key={participant.user_id} value={participant.user_id}>
                      {participant.profile?.full_name || 'Unknown User'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button
                onClick={addItem}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Items List ({formData.items.length})</span>
            <span className="text-lg font-bold text-indigo-600">
              Total: ₨{calculateItemsTotal().toFixed(2)}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {formData.items.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No items added yet</p>
              <p className="text-sm text-gray-400">Add items above to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {formData.items.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <h4 className="font-medium">{item.item_name}</h4>
                        <p className="text-sm text-gray-600">
                          Ordered by: {getUserName(item.user_id)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Quantity</p>
                        <p className="font-medium">{item.quantity}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Unit Price</p>
                        <p className="font-medium">₨{item.price.toFixed(2)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Total</p>
                        <p className="font-bold text-indigo-600">
                          ₨{(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {errors.items && (
            <div className="mt-4 p-3 bg-red-50 rounded-lg">
              <p className="text-sm text-red-600">{errors.items}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Items Summary by User */}
      {formData.items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Items Summary by Person</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {participants.map((participant) => {
                const userItems = formData.items.filter(item => item.user_id === participant.user_id)
                const userTotal = userItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)

                if (userItems.length === 0) return null

                return (
                  <div key={participant.user_id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{participant.profile?.full_name || 'Unknown User'}</h4>
                      <span className="font-bold text-indigo-600">₨{userTotal.toFixed(2)}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {userItems.map((item, index) => (
                        <div key={index} className="flex justify-between">
                          <span>{item.quantity}× {item.item_name}</span>
                          <span>₨{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}