'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { UserAvatar } from '@/components/shared/user-avatar'
import { RoomDetails } from '@/lib/supabase-services'
import { Users, Crown, Calendar, UserCheck } from 'lucide-react'
import { motion } from 'framer-motion'

interface RoomMembersProps {
  roomDetails: RoomDetails
  currentUserId: string
}

export function RoomMembers({ roomDetails, currentUserId }: RoomMembersProps) {
  const formatJoinDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Unknown'

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
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7)
      return `${weeks} week${weeks > 1 ? 's' : ''} ago`
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    }
  }

  const sortedMembers = [...roomDetails.members].sort((a, b) => {
    // Owner first
    if (a.user_id === roomDetails.created_by) return -1
    if (b.user_id === roomDetails.created_by) return 1

    // Current user second (if not owner)
    if (a.user_id === currentUserId) return -1
    if (b.user_id === currentUserId) return 1

    // Then by join date (earliest first)
    const dateA = new Date(a.joined_at || 0).getTime()
    const dateB = new Date(b.joined_at || 0).getTime()
    return dateA - dateB
  })

  return (
    <Card className="shadow-lg border-gray-200">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <div className="w-5 h-5 bg-gradient-to-r from-green-500 to-emerald-600 rounded-md flex items-center justify-center">
            <Users className="h-3 w-3 text-white" />
          </div>
          Room Members ({roomDetails.memberCount})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedMembers.map((member, index) => {
            const isOwner = member.user_id === roomDetails.created_by
            const isCurrentUser = member.user_id === currentUserId

            return (
              <motion.div
                key={member.user_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className={`
                  p-4 rounded-xl border transition-all duration-200
                  ${isCurrentUser
                    ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200'
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <UserAvatar
                      user={member.profile || { full_name: 'User', avatar_url: undefined }}
                      size="md"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">
                          {isCurrentUser ? 'You' : member.profile?.full_name || 'User'}
                        </h3>
                        {isOwner && (
                          <div title="Room Owner">
                            <Crown className="h-4 w-4 text-yellow-500" />
                          </div>
                        )}
                        {isCurrentUser && !isOwner && (
                          <div title="You">
                            <UserCheck className="h-4 w-4 text-blue-500" />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-3 w-3" />
                        <span>Joined {formatJoinDate(member.joined_at)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    {isOwner && (
                      <Badge variant="secondary" className="text-xs">
                        Owner
                      </Badge>
                    )}
                    {isCurrentUser && !isOwner && (
                      <Badge variant="outline" className="text-xs">
                        You
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Member Stats - Future Enhancement */}
                {/* <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xs text-gray-500">Bills Created</p>
                      <p className="text-sm font-semibold text-gray-900">0</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Total Paid</p>
                      <p className="text-sm font-semibold text-gray-900">$0</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Balance</p>
                      <p className="text-sm font-semibold text-gray-900">$0</p>
                    </div>
                  </div>
                </div> */}
              </motion.div>
            )
          })}
        </div>

        {/* Empty State */}
        {roomDetails.members.length === 0 && (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Members</h3>
            <p className="text-gray-600">This room doesn&apos;t have any members yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}