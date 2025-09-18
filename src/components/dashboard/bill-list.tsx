'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { UserAvatar } from '@/components/shared/user-avatar'
import { EmptyState } from '@/components/shared/empty-state'
import { Bill, BillUserPosition } from '@/types'
import { Receipt, Users, Calendar, ArrowUpRight, TrendingUp, TrendingDown, CheckCircle, DollarSign, ChevronDown } from 'lucide-react'

interface BillListProps {
  bills: Bill[]
  userPositions: BillUserPosition[]
  currentUserId: string
  onBillClick: (billId: string) => void
  onSettleBill?: () => void
  isLoading?: boolean
}

function CurrencyDisplay({ amount, currency, showSign = false, className = "" }: {
  amount: number
  currency: string
  showSign?: boolean
  className?: string
}) {
  const symbol = currency === 'PKR' ? '₨' : currency === 'USD' ? '$' : '€'
  const sign = showSign && amount !== 0 ? (amount > 0 ? '+' : '') : ''

  return (
    <span className={className}>
      {sign}{symbol}{Math.abs(amount).toLocaleString()}
    </span>
  )
}

export function BillList({
  bills,
  userPositions,
  currentUserId,
  onBillClick,
  onSettleBill,
  isLoading
}: BillListProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const INITIAL_DISPLAY_COUNT = 2
  const displayedBills = isExpanded ? bills : bills.slice(0, INITIAL_DISPLAY_COUNT)
  const hasMoreBills = bills.length > INITIAL_DISPLAY_COUNT

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded)
  }
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
                <Receipt className="h-3 w-3 text-white" />
              </div>
              <span>Recent Bills</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-3 rounded-lg border bg-gray-50/50 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  if (bills.length === 0) {
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
                <Receipt className="h-3 w-3 text-white" />
              </div>
              <span>Recent Bills</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={<Receipt className="h-12 w-12" />}
              title="No bills yet"
              description="Start by adding your first shared expense"
              action={{
                label: 'Add Bill',
                onClick: () => onBillClick('')
              }}
            />
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  const getStatusIcon = (status: Bill['status']) => {
    switch (status) {
      case 'open':
        return TrendingDown
      case 'partially_settled':
        return TrendingUp
      case 'settled':
        return CheckCircle
      default:
        return Receipt
    }
  }

  const getUserPosition = (billId: string) => {
    return userPositions.find(p => p.bill_id === billId && p.user_id === currentUserId)
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
              <Receipt className="h-3 w-3 text-white" />
            </div>
            <span>Recent Bills</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Bills Container with Professional Scrolling */}
          <div className={`transition-all duration-300 ease-in-out ${
            isExpanded 
              ? 'max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400' 
              : 'max-h-none'
          }`}>
            <div className="space-y-3">
              {displayedBills.map((bill, index) => {
              const userPosition = getUserPosition(bill.id)
              const participantCount = bill.participants?.length || 0
              const StatusIcon = getStatusIcon(bill.status)

              return (
                <motion.div
                  key={bill.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className="group"
                >
                  <Card
                    className="cursor-pointer p-3 rounded-lg border bg-gray-50/50 hover:bg-gray-50 transition-colors duration-200 hover:shadow-sm"
                    onClick={() => onBillClick(bill.id)}
                  >

                  <CardContent className="p-0">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 mb-1 truncate">{bill.title}</h3>
                        <div className="flex items-center text-xs text-gray-500">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(bill.bill_date).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-3">
                        <Badge
                          variant={bill.status === 'settled' ? 'default' : 'secondary'}
                          className="text-xs flex items-center gap-1"
                        >
                          <StatusIcon className="h-3 w-3" />
                          {bill.status.replace('_', ' ')}
                        </Badge>
                        <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-blue-600">
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
                            className={`font-semibold text-xs ${
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

                        {/* Settlement button for bills where user owes money */}
                        {onSettleBill && userPosition && userPosition.net_after_settlement < 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              onSettleBill()
                            }}
                            className="h-8 px-3 text-xs font-medium rounded-full border-orange-200 bg-orange-50 text-orange-600 hover:bg-orange-100 hover:border-orange-300 transition-all duration-200"
                          >
                            <DollarSign className="h-3 w-3 mr-1.5" />
                            Settle
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
            </div>
          </div>

          {/* Premium Show More/Less Controls */}
          {hasMoreBills && (
            <div className="mt-6 pt-4 border-t border-gray-100">
              <Button
                variant="ghost"
                size="sm"
                className={`w-full h-11 rounded-xl font-medium transition-all duration-200 ${
                  isExpanded 
                    ? 'bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-800 border border-gray-200' 
                    : 'bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 border border-blue-200'
                }`}
                onClick={handleToggleExpand}
              >
                <ChevronDown className={`h-4 w-4 mr-2 transition-transform duration-200 ${
                  isExpanded ? 'rotate-180' : ''
                }`} />
                {isExpanded 
                  ? 'Show less' 
                  : `Show ${bills.length - INITIAL_DISPLAY_COUNT} more bill${bills.length - INITIAL_DISPLAY_COUNT === 1 ? '' : 's'}`
                }
              </Button>
            </div>
          )}

          {/* Premium Action Button */}
          <div className="mt-4">
            <Button
              variant="ghost"
              size="sm"
              className="w-full h-11 rounded-xl font-medium bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 text-gray-700 hover:text-gray-900 border border-gray-200 transition-all duration-200"
              onClick={() => onBillClick('')}
            >
              <Receipt className="h-4 w-4 mr-2" />
              View all bills
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}