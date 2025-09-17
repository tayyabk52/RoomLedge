'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Receipt, Users, TrendingUp, CheckCircle, Calendar } from 'lucide-react'

interface RoomStatistics {
  total_bills: number
  total_amount: number
  settled_bills: number
  open_bills: number
  total_members: number
  currency: string
}

interface RoomStatsCardProps {
  statistics: RoomStatistics | null
  isLoading?: boolean
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

export function RoomStatsCard({ statistics, isLoading }: RoomStatsCardProps) {
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
              <div className="w-5 h-5 bg-gradient-to-r from-green-500 to-blue-500 rounded-md flex items-center justify-center">
                <TrendingUp className="h-3 w-3 text-white" />
              </div>
              <span>Room Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex justify-between items-center animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-4 bg-gray-200 rounded w-1/4" />
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  // Handle edge case where no statistics are available
  if (!statistics) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="bg-white border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <div className="w-5 h-5 bg-gradient-to-r from-green-500 to-blue-500 rounded-md flex items-center justify-center">
                <TrendingUp className="h-3 w-3 text-white" />
              </div>
              <span>Room Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 text-center py-4">
              Room statistics will appear here once you start adding bills
            </p>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  const completionRate = statistics.total_bills > 0
    ? Math.round((statistics.settled_bills / statistics.total_bills) * 100)
    : 0

  const stats = [
    {
      label: 'Total Bills',
      value: statistics.total_bills,
      icon: Receipt,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      label: 'Total Amount',
      value: <CurrencyDisplay amount={statistics.total_amount} currency={statistics.currency} />,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      label: 'Members',
      value: statistics.total_members,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      label: 'Settled',
      value: `${statistics.settled_bills}/${statistics.total_bills}`,
      icon: CheckCircle,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100'
    }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-white border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <div className="w-5 h-5 bg-gradient-to-r from-green-500 to-blue-500 rounded-md flex items-center justify-center">
                <TrendingUp className="h-3 w-3 text-white" />
              </div>
              <span>Room Overview</span>
            </CardTitle>
            {statistics.total_bills > 0 && (
              <Badge
                variant={completionRate === 100 ? "default" : "secondary"}
                className="text-xs"
              >
                {completionRate}% Complete
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-50/50 hover:bg-gray-50 transition-colors"
                >
                  <div className={`w-8 h-8 ${stat.bgColor} rounded-full flex items-center justify-center shrink-0`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
                    <p className="font-semibold text-sm text-gray-900 truncate">
                      {stat.value}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Progress indicator for completion rate */}
          {statistics.total_bills > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-4 space-y-2"
            >
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">Settlement Progress</span>
                <span className="font-medium text-gray-700">{completionRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${completionRate}%` }}
                  transition={{ delay: 0.6, duration: 1 }}
                  className={`h-2 rounded-full ${
                    completionRate === 100
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                      : completionRate > 50
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                      : 'bg-gradient-to-r from-red-500 to-pink-500'
                  }`}
                />
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}