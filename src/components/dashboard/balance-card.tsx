'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { RoomCurrency } from '@/types'
import { TrendingUp, TrendingDown, CheckCircle } from 'lucide-react'

interface BalanceCardProps {
  amount: number
  currency: RoomCurrency
  isLoading?: boolean
}

function CountUp({ end, duration = 1000 }: { end: number; duration?: number }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let startTime: number
    let animationFrame: number

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)

      setCount(Math.floor(progress * end))

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(animationFrame)
  }, [end, duration])

  return count
}

export function BalanceCard({ amount, currency, isLoading }: BalanceCardProps) {
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-gradient-to-br from-purple-500 via-purple-600 to-blue-600 text-white shadow-lg border-0">
          <CardContent className="p-6 lg:p-8">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-10 h-10 bg-white/20 rounded-xl animate-pulse" />
                  <div className="space-y-1">
                    <div className="h-4 bg-white/20 rounded w-24 animate-pulse" />
                    <div className="h-3 bg-white/20 rounded w-20 animate-pulse" />
                  </div>
                </div>
                <div className="h-8 bg-white/20 rounded w-32 animate-pulse" />
              </div>
              <div className="hidden sm:block">
                <div className="w-16 h-16 lg:w-20 lg:h-20 bg-white/10 rounded-2xl animate-pulse" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  const isOwed = amount > 0
  const balanced = amount === 0

  const getGradient = () => {
    if (balanced) return 'from-emerald-500 via-teal-500 to-blue-500'
    if (isOwed) return 'from-green-500 via-emerald-500 to-teal-500'
    return 'from-orange-500 via-red-500 to-pink-500'
  }

  const getIcon = () => {
    if (balanced) return CheckCircle
    if (isOwed) return TrendingUp
    return TrendingDown
  }

  const getStatusText = () => {
    if (balanced) return 'All settled up!'
    if (isOwed) return 'You are owed'
    return 'You owe'
  }

  const Icon = getIcon()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative"
    >
      <Card className={`bg-gradient-to-br ${getGradient()} text-white shadow-lg border-0 relative overflow-hidden`}>
        <CardContent className="p-6 lg:p-8">
          <div className="flex items-center justify-between">
            {/* Left Section - Amount and Status */}
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-white/90 text-sm font-medium">
                    {getStatusText()}
                  </p>
                  <p className="text-white/70 text-xs">
                    Current balance
                  </p>
                </div>
              </div>
              
              <motion.div
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="text-3xl lg:text-4xl font-bold tracking-tight text-white"
              >
                <span className="text-white/90">
                  {currency === 'PKR' ? '₨' : currency === 'USD' ? '$' : '€'}
                </span>
                <CountUp end={Math.abs(amount)} />
              </motion.div>

              {!balanced && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="flex items-center space-x-2 mt-2"
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${isOwed ? 'bg-emerald-300' : 'bg-orange-300'}`} />
                  <p className="text-white/70 text-xs">
                    {isOwed ? 'Money coming your way' : 'Ready to settle up'}
                  </p>
                </motion.div>
              )}
            </div>

            {/* Right Section - Clean Visual Element */}
            <div className="hidden sm:block">
              <div className="w-16 h-16 lg:w-20 lg:h-20 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <div className="w-8 h-8 lg:w-10 lg:h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Icon className="h-4 w-4 lg:h-5 lg:w-5 text-white" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}