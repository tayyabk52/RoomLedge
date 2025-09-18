'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Calendar, Filter, Receipt, Users, CheckCircle, Clock, AlertTriangle, ArrowUpRight, Search, ArrowLeft } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { EmptyState } from '@/components/shared/empty-state'
import { CurrencyDisplay } from '@/components/shared/currency-display'
import { UserAvatar } from '@/components/shared/user-avatar'
import { ResponsiveNav } from '@/components/navigation/responsive-nav'
import { useAuth } from '@/hooks/use-auth'
import { useUserRoom } from '@/hooks/use-room-data'
import { useRoomBills, useUserPosition } from '@/hooks/use-bill-data'
import { Bill, BillStatus } from '@/types'
import { toast } from 'sonner'

export const dynamic = 'force-dynamic'

type BillFilter = 'all' | 'open' | 'partially_settled' | 'settled'
type SortOption = 'newest' | 'oldest' | 'amount_high' | 'amount_low'

export default function HistoryPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const { data: room } = useUserRoom()
  const { data: bills, isLoading: billsLoading } = useRoomBills(room?.id)
  const { data: userPositions } = useUserPosition(room?.id)

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<BillFilter>('all')
  const [sortBy, setSortBy] = useState<SortOption>('newest')

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user || !profile || !room) {
    router.push('/auth/login')
    return null
  }

  const handleSignOut = async () => {
    toast.info('Sign out functionality not implemented yet')
  }

  const handleGoBack = () => {
    router.back()
  }

  const handleInviteMember = () => {
    if (room?.invite_code) {
      navigator.clipboard.writeText(room.invite_code)
      toast.success('Room code copied to clipboard!')
    }
  }

  const handleBillClick = (billId: string) => {
    router.push(`/bills/${billId}`)
  }

  // Filter and sort bills
  const filteredBills = bills?.filter(bill => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      if (!bill.title.toLowerCase().includes(query)) {
        return false
      }
    }

    // Status filter
    if (statusFilter !== 'all' && bill.status !== statusFilter) {
      return false
    }

    return true
  }) || []

  const sortedBills = [...filteredBills].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      case 'amount_high':
        return b.total_amount - a.total_amount
      case 'amount_low':
        return a.total_amount - b.total_amount
      default:
        return 0
    }
  })

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

  const getUserPosition = (billId: string) => {
    return userPositions?.find(p => p.bill_id === billId && p.user_id === user.id)
  }

  // Group bills by month for timeline view
  const billsByMonth = sortedBills.reduce((acc, bill) => {
    const date = new Date(bill.bill_date)
    const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })

    if (!acc[monthKey]) {
      acc[monthKey] = []
    }
    acc[monthKey].push(bill)
    return acc
  }, {} as Record<string, Bill[]>)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto bg-white min-h-screen max-w-md lg:max-w-7xl lg:bg-transparent">
        {/* Navigation */}
        <ResponsiveNav
          user={profile}
          room={room}
          roomMembersCount={0}
          onSignOut={handleSignOut}
          onInviteMember={handleInviteMember}
        />

        <div className="p-4 lg:p-6 lg:max-w-7xl lg:mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-6"
          >
            <Card className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleGoBack}
                    className="flex items-center gap-2 text-white/80 hover:text-white hover:bg-white/10 -ml-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Back</span>
                  </Button>
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <h1 className="text-2xl font-bold">Bill History</h1>
                </div>
                <p className="text-purple-100">
                  Track all your shared expenses and settlements
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Filters and Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="mb-6"
          >
            <Card className="shadow-lg">
              <CardContent className="p-4">
                <div className="space-y-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search bills..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Filters */}
                  <div className="flex gap-3 flex-wrap">
                    <Select value={statusFilter} onValueChange={(value: BillFilter) => setStatusFilter(value)}>
                      <SelectTrigger className="w-[140px]">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Bills</SelectItem>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="partially_settled">Partial</SelectItem>
                        <SelectItem value="settled">Settled</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Newest First</SelectItem>
                        <SelectItem value="oldest">Oldest First</SelectItem>
                        <SelectItem value="amount_high">Highest Amount</SelectItem>
                        <SelectItem value="amount_low">Lowest Amount</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Results count */}
                  <div className="text-sm text-gray-600">
                    {sortedBills.length} bill{sortedBills.length !== 1 ? 's' : ''} found
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Bills Timeline */}
          {billsLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : sortedBills.length === 0 ? (
            <EmptyState
              icon={<Receipt className="h-12 w-12" />}
              title="No bills found"
              description={searchQuery || statusFilter !== 'all'
                ? "Try adjusting your search or filters"
                : "Start by adding your first shared expense"
              }
              action={!searchQuery && statusFilter === 'all' ? {
                label: 'Add Bill',
                onClick: () => router.push('/bills/add')
              } : undefined}
            />
          ) : (
            <div className="space-y-6">
              {Object.entries(billsByMonth).map(([month, monthBills], monthIndex) => (
                <motion.div
                  key={month}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 + monthIndex * 0.1 }}
                >
                  {/* Month Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-white" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">{month}</h2>
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-sm text-gray-500">{monthBills.length} bill{monthBills.length !== 1 ? 's' : ''}</span>
                  </div>

                  {/* Bills for this month */}
                  <div className="space-y-3">
                    {monthBills.map((bill, billIndex) => {
                      const userPosition = getUserPosition(bill.id)
                      const participantCount = bill.participants?.length || 0
                      const StatusIcon = getStatusIcon(bill.status)
                      const isOverdue = bill.status !== 'settled' &&
                        new Date().getTime() - new Date(bill.bill_date).getTime() > 3 * 24 * 60 * 60 * 1000

                      return (
                        <motion.div
                          key={bill.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.2, delay: billIndex * 0.05 }}
                          className="group"
                        >
                          <Card
                            className="cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500"
                            onClick={() => handleBillClick(bill.id)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-semibold text-gray-900 truncate">{bill.title}</h3>
                                    {isOverdue && (
                                      <Badge variant="destructive" className="text-xs">
                                        Overdue
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center text-sm text-gray-500">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    {new Date(bill.bill_date).toLocaleDateString()}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 ml-3">
                                  <Badge className={`text-xs flex items-center gap-1 ${getStatusColor(bill.status)}`}>
                                    <StatusIcon className="h-3 w-3" />
                                    {bill.status.replace('_', ' ')}
                                  </Badge>
                                  <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                                </div>
                              </div>

                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg font-bold text-blue-600">
                                    <CurrencyDisplay
                                      amount={bill.total_amount}
                                      currency={bill.currency}
                                    />
                                  </span>
                                  <div className="flex items-center text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                    <Users className="h-3 w-3 mr-1" />
                                    {participantCount}
                                  </div>
                                </div>
                                {userPosition && userPosition.net_after_settlement !== 0 && (
                                  <div className="text-right">
                                    <p className="text-xs text-gray-500 mb-1">Your balance</p>
                                    <CurrencyDisplay
                                      amount={userPosition.net_after_settlement}
                                      currency={bill.currency}
                                      showSign
                                      className={`font-semibold text-sm ${
                                        userPosition.net_after_settlement > 0
                                          ? 'text-green-600'
                                          : 'text-red-600'
                                      }`}
                                    />
                                  </div>
                                )}
                              </div>

                              {bill.participants && (
                                <div className="flex items-center justify-between">
                                  <div className="flex -space-x-1">
                                    {bill.participants.slice(0, 4).map((participant) => (
                                      <UserAvatar
                                        key={participant.user_id}
                                        user={participant.profile!}
                                        size="sm"
                                        className="border-2 border-white"
                                      />
                                    ))}
                                    {participantCount > 4 && (
                                      <div className="h-6 w-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600">
                                        +{participantCount - 4}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </motion.div>
                      )
                    })}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}