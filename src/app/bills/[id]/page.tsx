'use client'

import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Receipt, Calendar, Users, CreditCard,
  CheckCircle, Clock, AlertTriangle,
  DollarSign, FileText
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { CurrencyDisplay } from '@/components/shared/currency-display'
import { UserAvatar } from '@/components/shared/user-avatar'
import { ResponsiveNav } from '@/components/navigation/responsive-nav'
import { useAuth } from '@/hooks/use-auth'
import { useUserRoom } from '@/hooks/use-room-data'
import { useBillDetails, useUserPosition } from '@/hooks/use-bill-data'
import { BillStatus, type AdvanceBillCalculation } from '@/types'
import { toast } from 'sonner'

export const dynamic = 'force-dynamic'

export default function BillDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const billId = params.id as string

  const { user, profile, loading } = useAuth()
  const { data: room } = useUserRoom()
  const { data: bill, isLoading: billLoading, error } = useBillDetails(billId)
  const { data: userPositions } = useUserPosition(room?.id)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user || !profile) {
    router.push('/auth/login')
    return null
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">Bill Not Found</h2>
          <p className="text-gray-600 mb-4">The bill you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.</p>
          <Button onClick={() => router.push('/history')}>
            Back to History
          </Button>
        </Card>
      </div>
    )
  }

  if (billLoading || !bill) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const handleSignOut = async () => {
    toast.info('Sign out functionality not implemented yet')
  }

  const handleInviteMember = () => {
    if (room?.invite_code) {
      navigator.clipboard.writeText(room.invite_code)
      toast.success('Room code copied to clipboard!')
    }
  }

  const handleSettleBill = () => {
    router.push(`/bills/${billId}/settle`)
  }

  const getStatusColor = (status: BillStatus) => {
    switch (status) {
      case 'open':
        return 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
      case 'partially_settled':
        return 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
      case 'settled':
        return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
      default:
        return 'bg-gradient-to-r from-gray-500 to-slate-500 text-white'
    }
  }

  const getStatusIcon = (status: BillStatus) => {
    switch (status) {
      case 'open':
        return AlertTriangle
      case 'partially_settled':
        return Clock
      case 'settled':
        return CheckCircle
      default:
        return Receipt
    }
  }

  const getUserPosition = () => {
    return userPositions?.find(p => p.bill_id === billId && p.user_id === user.id)
  }

  const userPosition = getUserPosition()
  const userCalculation = bill.is_advanced
    ? bill.calculations?.find(calc => calc.user_id === user.id)
    : undefined
  const userShareAmount = userCalculation
    ? userCalculation.owed_paisa / 100
    : userPosition?.share_amount ?? 0
  const userPaidAmount = userCalculation
    ? userCalculation.covered_paisa / 100
    : userPosition?.amount_paid ?? 0
  const participants = bill.participants || []
  const payers = bill.payers || []
  const settlements = bill.settlements || []
  const calculations: AdvanceBillCalculation[] = bill.is_advanced
    ? bill.calculations ?? []
    : []
  const calculationMap = new Map<string, AdvanceBillCalculation>()
  calculations.forEach((calc) => {
    calculationMap.set(calc.user_id, calc)
  })
  const settlementIncomingMap = new Map<string, number>()
  const settlementOutgoingMap = new Map<string, number>()
  settlements.forEach((settlement) => {
    settlementIncomingMap.set(
      settlement.to_user,
      (settlementIncomingMap.get(settlement.to_user) ?? 0) + settlement.amount
    )
    settlementOutgoingMap.set(
      settlement.from_user,
      (settlementOutgoingMap.get(settlement.from_user) ?? 0) + settlement.amount
    )
  })
  const totalAdvancedOwedPaisa = calculations.reduce(
    (sum, calc) => sum + (Number.isFinite(calc.owed_paisa) ? calc.owed_paisa : 0),
    0
  )
  const totalAdvancedRemainingPaisa = calculations.reduce(
    (sum, calc) => sum + Math.max(calc.remaining_paisa, 0),
    0
  )
  const hasAdvancedCalculations = bill.is_advanced && calculations.length > 0
  const totalSettledAmount = hasAdvancedCalculations
    ? Math.max(0, totalAdvancedOwedPaisa - totalAdvancedRemainingPaisa) / 100
    : settlements.reduce((sum, s) => sum + s.amount, 0)
  const outstandingAmount = hasAdvancedCalculations
    ? Math.max(0, totalAdvancedRemainingPaisa) / 100
    : undefined
  const StatusIcon = getStatusIcon(bill.status)

  // Calculate equal share per participant (fallback for non-advanced bills)
  const sharePerParticipant = participants.length > 0 ? bill.total_amount / participants.length : 0

  const participantSummary = participants.map(participant => {
    const position = userPositions?.find(p => p.bill_id === billId && p.user_id === participant.user_id)
    const calculation = calculationMap.get(participant.user_id)

    const shareAmount = calculation
      ? calculation.owed_paisa / 100
      : position?.share_amount ?? sharePerParticipant

    const amountPaid = calculation
      ? calculation.covered_paisa / 100
      : position?.amount_paid ?? (payers.find(p => p.user_id === participant.user_id)?.amount_paid || 0)

    const incomingSettlements = position?.incoming_settlements
      ?? settlementIncomingMap.get(participant.user_id)
      ?? 0

    const outgoingSettlements = position?.outgoing_settlements
      ?? settlementOutgoingMap.get(participant.user_id)
      ?? 0

    const netBeforeSettlement = calculation
      ? calculation.net_paisa / 100
      : position?.net_before_settlement ?? (amountPaid - shareAmount)

    const netAfterSettlement = calculation
      ? calculation.remaining_paisa / 100
      : position?.net_after_settlement
        ?? (netBeforeSettlement + incomingSettlements - outgoingSettlements)

    return {
      ...participant,
      shareAmount,
      amountPaid,
      netBeforeSettlement,
      incomingSettlements,
      outgoingSettlements,
      netAfterSettlement
    }
  })

  const isOverdue = bill.status !== 'settled' &&
    new Date().getTime() - new Date(bill.bill_date).getTime() > 3 * 24 * 60 * 60 * 1000

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto bg-white min-h-screen max-w-md lg:max-w-7xl lg:bg-transparent">
        {/* Navigation */}
        <ResponsiveNav
          user={profile}
          room={room || undefined}
          roomMembersCount={0}
          onSignOut={handleSignOut}
          onInviteMember={handleInviteMember}
        />

        <div className="p-4 lg:p-6 lg:max-w-7xl lg:mx-auto">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-4"
          >
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </motion.div>

          {/* Bill Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-6"
          >
            <Card className="bg-gradient-to-br from-blue-500 to-purple-600 text-white border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <Receipt className="h-6 w-6" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold mb-1">{bill.title}</h1>
                      <div className="flex items-center gap-2 text-blue-100">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(bill.bill_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={`mb-2 ${getStatusColor(bill.status)}`}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {bill.status.replace('_', ' ')}
                    </Badge>
                    {isOverdue && (
                      <Badge variant="destructive" className="block">
                        Overdue
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Total Amount</p>
                    <CurrencyDisplay
                      amount={bill.total_amount}
                      currency={bill.currency}
                      className="text-3xl font-bold"
                    />
                  </div>
                  <div className="text-right">
                    <p className="text-blue-100 text-sm">Participants</p>
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      <span className="text-xl font-semibold">{participants.length}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Your Position */}
              {userPosition && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-md flex items-center justify-center">
                          <DollarSign className="h-3 w-3 text-white" />
                        </div>
                        Your Position
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">Your Share</p>
                          <CurrencyDisplay
                            amount={userShareAmount}
                            currency={bill.currency}
                            className="font-semibold text-blue-600"
                          />
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">You Paid</p>
                          <CurrencyDisplay
                            amount={userPaidAmount}
                            currency={bill.currency}
                            className="font-semibold text-green-600"
                          />
                        </div>
                      </div>

                      <Separator />

                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-2">Net Balance</p>
                        <CurrencyDisplay
                          amount={userPosition.net_after_settlement}
                          currency={bill.currency}
                          showSign
                          className={`text-2xl font-bold ${
                            userPosition.net_after_settlement > 0
                              ? 'text-green-600'
                              : userPosition.net_after_settlement < 0
                              ? 'text-red-600'
                              : 'text-gray-600'
                          }`}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {userPosition.net_after_settlement > 0
                            ? 'You are owed'
                            : userPosition.net_after_settlement < 0
                            ? 'You owe'
                            : 'All settled'}
                        </p>
                      </div>

                      {userPosition.net_after_settlement < 0 && (
                        <Button
                          onClick={handleSettleBill}
                          className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                        >
                          <DollarSign className="h-4 w-4 mr-2" />
                          Settle Up
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Participants Split */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-md flex items-center justify-center">
                        <Users className="h-3 w-3 text-white" />
                      </div>
                      Split Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {participantSummary.map((participant) => (
                      <div key={participant.user_id} className="space-y-2">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <UserAvatar user={participant.profile!} size="sm" />
                            <div>
                              <p className="font-medium text-gray-900">
                                {participant.profile?.full_name}
                              </p>
                              <p className="text-xs text-gray-500">
                                Share: <CurrencyDisplay amount={participant.shareAmount} currency={bill.currency} />
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">
                              Paid: <CurrencyDisplay amount={participant.amountPaid} currency={bill.currency} />
                            </p>
                            <CurrencyDisplay
                              amount={participant.netAfterSettlement}
                              currency={bill.currency}
                              showSign
                              className={`font-semibold text-sm ${
                                participant.netAfterSettlement > 0
                                  ? 'text-green-600'
                                  : participant.netAfterSettlement < 0
                                  ? 'text-red-600'
                                  : 'text-gray-600'
                              }`}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Settlement History */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
              >
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-md flex items-center justify-center">
                        <CreditCard className="h-3 w-3 text-white" />
                      </div>
                      Settlement History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {settlements.length === 0 ? (
                      <div className="text-center py-6">
                        <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">No settlements yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {settlements
                          .sort((a, b) => new Date(b.settled_at).getTime() - new Date(a.settled_at).getTime())
                          .map((settlement) => (
                          <div key={settlement.id} className="border-l-4 border-l-green-500 pl-4 py-2">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2">
                                <UserAvatar
                                  user={settlement.from_profile!}
                                  size="xs"
                                />
                                <div className="text-sm">
                                  <p className="font-medium">
                                    {settlement.from_profile?.full_name} → {settlement.to_profile?.full_name}
                                  </p>
                                  <p className="text-gray-500">
                                    {new Date(settlement.settled_at).toLocaleDateString()} • {settlement.method.replace('_', ' ')}
                                  </p>
                                  {settlement.note && (
                                    <p className="text-xs text-gray-400 mt-1">{settlement.note}</p>
                                  )}
                                </div>
                              </div>
                              <CurrencyDisplay
                                amount={settlement.amount}
                                currency={bill.currency}
                                className="font-semibold text-green-600"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Bill Summary */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.4 }}
              >
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-gradient-to-r from-gray-500 to-slate-500 rounded-md flex items-center justify-center">
                        <Receipt className="h-3 w-3 text-white" />
                      </div>
                      Bill Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Created by</p>
                        <p className="font-medium">
                          {participants.find(p => p.user_id === bill.created_by)?.profile?.full_name || 'Unknown'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Created on</p>
                        <p className="font-medium">
                          {new Date(bill.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Total paid</p>
                        <p className="font-medium">
                          <CurrencyDisplay
                            amount={payers.reduce((sum, p) => sum + p.amount_paid, 0)}
                            currency={bill.currency}
                          />
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Total settled</p>
                        <p className="font-medium">
                          <CurrencyDisplay
                            amount={totalSettledAmount}
                            currency={bill.currency}
                          />
                        </p>
                      </div>
                      {hasAdvancedCalculations && (
                        <div>
                          <p className="text-gray-600">Outstanding</p>
                          <p className="font-medium">
                            <CurrencyDisplay
                              amount={outstandingAmount ?? 0}
                              currency={bill.currency}
                            />
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}