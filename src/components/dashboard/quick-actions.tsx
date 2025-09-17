'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
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
      color: 'blue',
      bgColor: 'bg-blue-500',
      hoverBg: 'hover:bg-blue-600',
      textColor: 'text-white'
    },
    {
      label: 'Settle Up',
      icon: DollarSign,
      onClick: onSettleUp,
      color: 'emerald',
      bgColor: 'bg-emerald-500',
      hoverBg: 'hover:bg-emerald-600',
      textColor: 'text-white'
    },
    {
      label: 'Invite',
      icon: UserPlus,
      onClick: onInviteMember,
      color: 'orange',
      bgColor: 'bg-orange-500',
      hoverBg: 'hover:bg-orange-600',
      textColor: 'text-white'
    },
    {
      label: 'History',
      icon: Clock,
      onClick: onViewHistory,
      color: 'purple',
      bgColor: 'bg-purple-500',
      hoverBg: 'hover:bg-purple-600',
      textColor: 'text-white'
    }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="w-full"
    >
      {/* Uber-style Clean Action Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {actions.map((action, index) => (
          <motion.div
            key={action.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.3,
              delay: 0.1 * index,
              ease: "easeOut"
            }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={action.onClick}
              className={`
                w-full h-16 lg:h-20 flex-col space-y-1.5 rounded-2xl
                ${action.bgColor} ${action.hoverBg} ${action.textColor}
                border-0 shadow-sm hover:shadow-md
                transition-all duration-200 ease-out
                font-medium
              `}
              size="lg"
            >
              <action.icon className="h-5 w-5 lg:h-6 lg:w-6" />
              <span className="text-xs lg:text-sm">
                {action.label}
              </span>
            </Button>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}