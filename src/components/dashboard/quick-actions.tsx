'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, DollarSign, UserPlus, Clock } from 'lucide-react'

interface QuickActionsProps {
  onAddBill: () => void
  onSettleUp: () => void
  onInviteMember: () => void
  onViewHistory: () => void
}

export function QuickActions({
  onAddBill,
  onSettleUp,
  onInviteMember,
  onViewHistory
}: QuickActionsProps) {
  const actions = [
    {
      label: 'Add Bill',
      icon: Plus,
      onClick: onAddBill,
      gradient: 'from-blue-500 to-indigo-600',
      hoverGradient: 'hover:from-blue-600 hover:to-indigo-700',
      glow: 'blue-500/20'
    },
    {
      label: 'Settle Up',
      icon: DollarSign,
      onClick: onSettleUp,
      gradient: 'from-emerald-500 to-teal-600',
      hoverGradient: 'hover:from-emerald-600 hover:to-teal-700',
      glow: 'emerald-500/20'
    },
    {
      label: 'Invite',
      icon: UserPlus,
      onClick: onInviteMember,
      gradient: 'from-orange-500 to-red-600',
      hoverGradient: 'hover:from-orange-600 hover:to-red-700',
      glow: 'orange-500/20'
    },
    {
      label: 'History',
      icon: Clock,
      onClick: onViewHistory,
      gradient: 'from-purple-500 to-pink-600',
      hoverGradient: 'hover:from-purple-600 hover:to-pink-700',
      glow: 'purple-500/20'
    }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      {/* Glassmorphism card */}
      <Card className="backdrop-blur-xl bg-white/20 border border-white/20 shadow-2xl">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {actions.map((action, index) => (
              <motion.div
                key={action.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: 0.3,
                  delay: 0.1 * index,
                  type: "spring",
                  stiffness: 200
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative"
              >
                {/* Glow effect */}
                <div className={`absolute inset-0 bg-${action.glow} rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10`} />

                <Button
                  onClick={action.onClick}
                  className={`
                    w-full h-20 flex-col space-y-2 rounded-2xl
                    bg-gradient-to-br ${action.gradient} ${action.hoverGradient}
                    text-white shadow-lg hover:shadow-2xl
                    border border-white/20
                    transition-all duration-300
                    group relative overflow-hidden
                  `}
                  size="lg"
                >
                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                    className="relative z-10"
                  >
                    <action.icon className="h-6 w-6" />
                  </motion.div>

                  <span className="text-sm font-semibold relative z-10">
                    {action.label}
                  </span>
                </Button>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}