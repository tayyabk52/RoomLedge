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
        <Card className="bg-gradient-to-br from-purple-500 via-purple-600 to-blue-600 text-white shadow-2xl border-0">
          <CardContent className="p-8">
            <div className="space-y-4">
              <div className="h-5 bg-white/20 rounded-full animate-pulse" />
              <div className="h-10 bg-white/20 rounded-full animate-pulse w-3/4" />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  const isOwed = amount > 0
  const owes = amount < 0
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
      whileHover={{ y: -2 }}
      className="relative"
    >
      {/* Glow effect */}
      <div className={`absolute inset-0 bg-gradient-to-br ${getGradient()} rounded-2xl blur-xl opacity-20 -z-10`} />

      <Card className={`bg-gradient-to-br ${getGradient()} text-white shadow-2xl border-0 relative overflow-hidden`}>
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-4 w-32 h-32 border border-white/20 rounded-full" />
          <div className="absolute -top-8 -right-8 w-24 h-24 border border-white/10 rounded-full" />
          <div className="absolute bottom-4 left-4 w-16 h-16 border border-white/10 rounded-full" />
        </div>

        <CardContent className="p-8 relative z-10">
          <div className="flex items-start justify-between mb-6">
            <div className="space-y-1">
              <p className="text-white/80 text-sm font-medium tracking-wide uppercase">
                Balance Overview
              </p>
              <p className="text-white/90 text-lg font-semibold">
                {getStatusText()}
              </p>
            </div>
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 2, ease: "easeInOut" }}
              className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm"
            >
              <Icon className="h-6 w-6 text-white" />
            </motion.div>
          </div>

          <div className="space-y-2">
            <motion.div
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="text-4xl font-bold tracking-tight"
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
                className="flex items-center space-x-2"
              >
                <div className={`w-2 h-2 rounded-full ${isOwed ? 'bg-emerald-300' : 'bg-orange-300'}`} />
                <p className="text-white/70 text-sm">
                  {isOwed ? 'Money coming your way' : 'Ready to settle up'}
                </p>
              </motion.div>
            )}
          </div>

          {/* Progress indicator for owing money */}
          {owes && (
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ delay: 0.8, duration: 1 }}
              className="mt-6 h-1 bg-white/20 rounded-full overflow-hidden"
            >
              <div className="h-full bg-white/40 rounded-full" />
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}