'use client'

import { useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { RoomInfo } from '@/components/room/room-info'
import { RoomMembers } from '@/components/room/room-members'
import { useAuth } from '@/hooks/use-auth'
import { useRoomDetails } from '@/hooks/use-room-details'
import { ArrowLeft, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'

export const dynamic = 'force-dynamic'

interface RoomDetailsPageProps {
  params: Promise<{ id: string }>
}

export default function RoomDetailsPage({ params }: RoomDetailsPageProps) {
  const { user, profile, loading, initialized } = useAuth()
  const router = useRouter()

  // Unwrap params
  const resolvedParams = use(params)
  const roomId = resolvedParams.id

  const { data: roomDetails, isLoading: roomLoading } = useRoomDetails(roomId)

  useEffect(() => {
    if (initialized && !user) {
      router.replace('/auth/login')
      return
    }
  }, [user, initialized, router])

  const handleGoBack = () => {
    router.back()
  }

  // Show loading while authentication is being checked
  if (!initialized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!user) {
    return null
  }

  // Show loading while profile is being fetched
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Show loading while room details are being fetched
  if (roomLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Show error if room not found
  if (!roomDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Room Not Found</h1>
          <p className="text-gray-600 mb-4">The room you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.</p>
          <Button onClick={handleGoBack}>Go Back</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-first container */}
      <div className="mx-auto bg-white min-h-screen max-w-md lg:max-w-4xl lg:bg-transparent">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-white border-b shadow-sm lg:bg-gray-50 lg:border-0 lg:shadow-none">
          <div className="p-4 lg:p-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGoBack}
                className="lg:hidden"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <Users className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
                    {roomDetails.name}
                  </h1>
                  <p className="text-sm text-gray-600 hidden lg:block">
                    Room details and member information
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 lg:p-6 lg:max-w-4xl lg:mx-auto">
          <div className="space-y-6">
            {/* Room Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <RoomInfo roomDetails={roomDetails} currentUserId={user.id} />
            </motion.div>

            {/* Room Members */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <RoomMembers roomDetails={roomDetails} currentUserId={user.id} />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

