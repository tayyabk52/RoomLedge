'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { UserAvatar } from '@/components/shared/user-avatar'
import { RoomDetails } from '@/lib/supabase-services'
import { Copy, Calendar, Users, Crown, Coins } from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

interface RoomInfoProps {
  roomDetails: RoomDetails
  currentUserId: string
}

export function RoomInfo({ roomDetails, currentUserId }: RoomInfoProps) {
  const isOwner = roomDetails.created_by === currentUserId

  const handleCopyInviteCode = () => {
    navigator.clipboard.writeText(roomDetails.invite_code)
    toast.success('Invite code copied to clipboard!')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <Card className="shadow-lg border-gray-200">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <div className="w-5 h-5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-md flex items-center justify-center">
            <Users className="h-3 w-3 text-white" />
          </div>
          Room Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Room Basic Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Room Name</label>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                {roomDetails.name}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Base Currency</label>
              <div className="flex items-center gap-2 mt-1">
                <Coins className="h-4 w-4 text-gray-600" />
                <Badge variant="secondary" className="text-sm">
                  {roomDetails.base_currency}
                </Badge>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Total Members</label>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                {roomDetails.memberCount} member{roomDetails.memberCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Created On</label>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4 text-gray-600" />
                <p className="text-sm text-gray-900">
                  {formatDate(roomDetails.created_at)}
                </p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Room Owner</label>
              <div className="flex items-center gap-2 mt-1">
                {roomDetails.createdByProfile ? (
                  <>
                    <UserAvatar user={roomDetails.createdByProfile} size="sm" />
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium text-gray-900">
                        {isOwner ? 'You' : roomDetails.createdByProfile.full_name}
                      </span>
                      <Crown className="h-3 w-3 text-yellow-500" />
                    </div>
                  </>
                ) : (
                  <span className="text-sm text-gray-500">Unknown</span>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Invite Code</label>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-sm font-mono">
                  {roomDetails.invite_code}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyInviteCode}
                  className="h-6 w-6 p-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Invite Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200"
        >
          <h3 className="text-sm font-semibold text-blue-900 mb-2">
            Invite New Members
          </h3>
          <p className="text-xs text-blue-700 mb-3">
            Share the invite code with friends to add them to this room
          </p>
          <Button
            onClick={handleCopyInviteCode}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            size="sm"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy Invite Code
          </Button>
        </motion.div>
      </CardContent>
    </Card>
  )
}