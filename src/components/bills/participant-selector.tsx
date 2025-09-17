'use client'

import { motion } from 'framer-motion'
import { Check, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UserAvatar } from '@/components/shared/user-avatar'
import { RoomMember } from '@/types'

interface ParticipantSelectorProps {
  members: RoomMember[]
  selectedParticipants: string[]
  onSelectionChange: (participantIds: string[]) => void
  currentUserId: string
}

export function ParticipantSelector({
  members,
  selectedParticipants,
  onSelectionChange,
  currentUserId
}: ParticipantSelectorProps) {
  const toggleParticipant = (userId: string) => {
    if (selectedParticipants.includes(userId)) {
      onSelectionChange(selectedParticipants.filter(id => id !== userId))
    } else {
      onSelectionChange([...selectedParticipants, userId])
    }
  }

  const selectAll = () => {
    const allUserIds = members.map(member => member.user_id)
    onSelectionChange(allUserIds)
  }

  const clearAll = () => {
    onSelectionChange([])
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <Card className="overflow-hidden shadow-lg border-gray-200">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600">
                <Users className="h-4 w-4 text-white" />
              </div>
              <CardTitle className="text-lg font-semibold text-gray-900">
                Who&apos;s participating?
              </CardTitle>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={selectAll}
                className="text-xs font-medium text-purple-600 hover:text-purple-700 transition-colors"
              >
                All
              </button>
              <span className="text-xs text-gray-300">•</span>
              <button
                type="button"
                onClick={clearAll}
                className="text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
              >
                None
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-3">
            {members.map((member, index) => {
              const isSelected = selectedParticipants.includes(member.user_id)
              const isCurrentUser = member.user_id === currentUserId

              return (
                <motion.button
                  key={member.user_id}
                  type="button"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    duration: 0.2,
                    delay: 0.05 * index,
                    type: "spring",
                    stiffness: 200
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleParticipant(member.user_id)}
                  className={`
                    relative flex flex-col items-center gap-2 p-3 rounded-2xl
                    transition-all duration-300 group min-w-[80px]
                    ${isSelected
                      ? 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg ring-2 ring-purple-300'
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200'
                    }
                  `}
                >
                  {/* Glow effect for selected participants */}
                  {isSelected && (
                    <div className="absolute inset-0 bg-purple-500/20 rounded-2xl blur-xl opacity-70 -z-10" />
                  )}

                  {/* Selection indicator */}
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow-lg"
                    >
                      <Check className="h-3 w-3 text-white" />
                    </motion.div>
                  )}

                  {/* Avatar */}
                  <div className={`
                    relative transition-transform duration-300
                    ${isSelected ? 'scale-110' : 'group-hover:scale-105'}
                  `}>
                    <UserAvatar
                      user={member.profile || { full_name: 'User', avatar_url: undefined }}
                      size="md"
                      className={`
                        ring-2 transition-all duration-300
                        ${isSelected
                          ? 'ring-white/50'
                          : 'ring-gray-200 group-hover:ring-purple-300'
                        }
                      `}
                    />
                  </div>

                  {/* Name */}
                  <span className={`
                    text-xs font-medium text-center leading-tight
                    ${isSelected ? 'text-white' : 'text-gray-700'}
                  `}>
                    {isCurrentUser ? 'You' : member.profile?.full_name?.split(' ')[0] || 'User'}
                  </span>
                </motion.button>
              )
            })}
          </div>

          {/* Selection summary */}
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{
              opacity: selectedParticipants.length > 0 ? 1 : 0,
              height: selectedParticipants.length > 0 ? 'auto' : 0
            }}
            transition={{ duration: 0.2 }}
            className="mt-4 pt-3 border-t border-gray-100"
          >
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                {selectedParticipants.length} participant{selectedParticipants.length !== 1 ? 's' : ''} selected
              </span>

              {selectedParticipants.length > 0 && (
                <span className="text-purple-600 font-medium">
                  Split {selectedParticipants.length} ways
                </span>
              )}
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
}