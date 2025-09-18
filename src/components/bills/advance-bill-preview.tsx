'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, AlertCircle, ArrowRight } from 'lucide-react'
import { AdvanceBillPreview as PreviewType, CreateAdvanceBillData } from '@/types'
import { paisaUtils } from '@/lib/paisa-utils'

interface AdvanceBillPreviewProps {
  preview: PreviewType
  formData: CreateAdvanceBillData
}

export function AdvanceBillPreview({ preview }: AdvanceBillPreviewProps) {
  return (
    <div className="space-y-6">
      {/* Bill Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {preview.is_balanced ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600" />
            )}
            Bill Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">Items Total</p>
              <p className="text-xl font-bold text-blue-800">
                {paisaUtils.formatPKR(preview.items_total_paisa)}
              </p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-purple-600 font-medium">Extras Total</p>
              <p className="text-xl font-bold text-purple-800">
                {paisaUtils.formatPKR(preview.extras_total_paisa)}
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 font-medium">Bill Total</p>
              <p className="text-xl font-bold text-gray-800">
                {paisaUtils.formatPKR(preview.bill_total_paisa)}
              </p>
            </div>
            <div className={`text-center p-4 rounded-lg ${
              preview.is_balanced ? 'bg-green-50' : 'bg-red-50'
            }`}>
              <p className={`text-sm font-medium ${
                preview.is_balanced ? 'text-green-600' : 'text-red-600'
              }`}>
                Paid Total
              </p>
              <p className={`text-xl font-bold ${
                preview.is_balanced ? 'text-green-800' : 'text-red-800'
              }`}>
                {paisaUtils.formatPKR(preview.paid_total_paisa)}
              </p>
            </div>
          </div>

          {preview.validation_errors.length > 0 && (
            <div className="mt-4 p-4 bg-red-50 rounded-lg">
              <h4 className="font-medium text-red-800 mb-2">Validation Errors:</h4>
              <ul className="text-sm text-red-600 space-y-1">
                {preview.validation_errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Breakdowns */}
      <Card>
        <CardHeader>
          <CardTitle>User Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {preview.user_breakdowns.map((user) => (
              <div key={user.user_id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">{user.user_name}</h4>
                  <Badge variant={user.net_paisa > 0 ? 'default' : user.net_paisa < 0 ? 'destructive' : 'secondary'}>
                    {paisaUtils.formatPKR(user.net_paisa, true)}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Items</p>
                    <p className="font-medium">{paisaUtils.formatPKR(user.items_paisa)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Extras Share</p>
                    <p className="font-medium">{paisaUtils.formatPKR(user.extras_share_paisa)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Covered</p>
                    <p className="font-medium">{paisaUtils.formatPKR(user.covered_paisa)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Suggested Transfers */}
      {preview.suggested_transfers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Suggested Minimal Transfers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {preview.suggested_transfers.map((transfer, index) => {
                const fromUser = preview.user_breakdowns.find(u => u.user_id === transfer.from_user_id)
                const toUser = preview.user_breakdowns.find(u => u.user_id === transfer.to_user_id)

                return (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="font-medium">{fromUser?.user_name || 'Unknown'}</span>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{toUser?.user_name || 'Unknown'}</span>
                    </div>
                    <Badge variant="outline" className="font-medium">
                      {paisaUtils.formatPKR(transfer.amount_paisa)}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mathematical Accuracy Status */}
      <Card>
        <CardHeader>
          <CardTitle>Mathematical Accuracy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm">Paisa-precision calculations</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm">Hamilton rounding applied</span>
            </div>
            <div className="flex items-center space-x-2">
              {preview.is_balanced ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <span className="text-sm">Exact total matching</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}