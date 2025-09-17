'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { UserAvatar } from '@/components/shared/user-avatar'
import { EmptyState } from '@/components/shared/empty-state'
import { Bill, BillSettlement } from '@/types'
import { Receipt, ArrowRightLeft, Activity, Clock, CheckCircle } from 'lucide-react'

interface ActivityItem {
  id: string
  type: 'bill' | 'settlement'
  date: string
  bill?: Bill
  settlement?: BillSettlement & { bill: Pick<Bill, 'title' | 'currency'> }
}

interface ActivityFeedProps {
  activities: ActivityItem[]
  isLoading?: boolean
  onBillClick?: (billId: string) => void
}

function CurrencyDisplay({ amount, currency, className = "" }: {
  amount: number
  currency: string
  className?: string
}) {
  const symbol = currency === 'PKR' ? '₨' : currency === 'USD' ? '$' : '€'
  return (
    <span className={className}>
      {symbol}{amount.toLocaleString()}
    </span>
  )
}

export function ActivityFeed({ activities, isLoading, onBillClick }: ActivityFeedProps) {
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="bg-white border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <div className="w-5 h-5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-md flex items-center justify-center">
                <Activity className="h-3 w-3 text-white" />
              </div>
              <span>Recent Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start gap-3 animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  if (activities.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="bg-white border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <div className="w-5 h-5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-md flex items-center justify-center">
                <Activity className="h-3 w-3 text-white" />
              </div>
              <span>Recent Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={<Activity className="h-12 w-12" />}
              title="No activity yet"
              description="Activity will appear here as you add bills and make payments"
            />
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return 'Today'
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays < 7) {
      return `${diffDays} days ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-white border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <div className="w-5 h-5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-md flex items-center justify-center">
              <Activity className="h-3 w-3 text-white" />
            </div>
            <span>Recent Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">

          {activities.map((activity, index) => {
            const handleActivityClick = () => {
              if (onBillClick) {
                if (activity.type === 'bill' && activity.bill) {
                  onBillClick(activity.bill.id)
                } else if (activity.type === 'settlement' && activity.settlement) {
                  // Extract bill ID from settlement to navigate to the bill that was settled
                  const billId = activity.settlement.bill_id
                  if (billId) {
                    onBillClick(billId)
                  }
                }
              }
            }

            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className={`flex items-start gap-3 p-3 md:p-4 rounded-lg border bg-gray-50/50 hover:bg-gray-50 transition-colors duration-200 ${
                  onBillClick ? 'cursor-pointer' : ''
                }`}
                onClick={handleActivityClick}
              >
                {/* Icon */}
                <div className="shrink-0 mt-0.5">
                  {activity.type === 'bill' ? (
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Receipt className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-2">
                  {activity.type === 'bill' && activity.bill ? (
                    <>
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm md:text-base truncate">
                            New bill: {activity.bill.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-sm md:text-base font-semibold text-blue-600">
                              <CurrencyDisplay
                                amount={activity.bill.total_amount}
                                currency={activity.bill.currency}
                              />
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {activity.bill.status.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs md:text-sm text-gray-500 shrink-0 ml-3">
                          <Clock className="h-3 w-3" />
                          <span className="hidden sm:inline">{formatDate(activity.date)}</span>
                          <span className="sm:hidden">
                            {formatDate(activity.date).split(' ')[0] === 'Today' ? 'Today' :
                             formatDate(activity.date).split(' ')[0] === 'Yesterday' ? 'Yesterday' :
                             formatDate(activity.date).includes('ago') ? formatDate(activity.date).replace(' days ago', 'd') :
                             new Date(activity.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    </>
                  ) : activity.type === 'settlement' && activity.settlement ? (
                    <>
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <UserAvatar
                              user={activity.settlement.from_profile!}
                              size="sm"
                            />
                            <ArrowRightLeft className="h-3 w-3 text-gray-400" />
                            <UserAvatar
                              user={activity.settlement.to_profile!}
                              size="sm"
                            />
                          </div>
                          <p className="font-medium text-gray-900 text-sm md:text-base">
                            <span className="hidden sm:inline">
                              {activity.settlement.from_profile!.full_name} paid{' '}
                              {activity.settlement.to_profile!.full_name}
                            </span>
                            <span className="sm:hidden">
                              Payment made
                            </span>
                          </p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-sm md:text-base font-semibold text-green-600">
                              <CurrencyDisplay
                                amount={activity.settlement.amount}
                                currency={activity.settlement.bill.currency}
                              />
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {activity.settlement.method.replace('_', ' ')}
                            </Badge>
                          </div>
                          <p className="text-xs md:text-sm text-gray-500 mt-1 truncate">
                            For: {activity.settlement.bill.title}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-xs md:text-sm text-gray-500 shrink-0 ml-3">
                          <Clock className="h-3 w-3" />
                          <span className="hidden sm:inline">{formatDate(activity.date)}</span>
                          <span className="sm:hidden">
                            {formatDate(activity.date).split(' ')[0] === 'Today' ? 'Today' :
                             formatDate(activity.date).split(' ')[0] === 'Yesterday' ? 'Yesterday' :
                             formatDate(activity.date).includes('ago') ? formatDate(activity.date).replace(' days ago', 'd') :
                             new Date(activity.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    </>
                  ) : null}
                </div>
              </motion.div>
            )
          })}
        </CardContent>
      </Card>
    </motion.div>
  )
}