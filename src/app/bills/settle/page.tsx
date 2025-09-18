'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { SettleAllForm } from '@/components/bills/settle-all-form'
import { ResponsiveNav } from '@/components/navigation/responsive-nav'
import { useAuth } from '@/hooks/use-auth'
import { useUserRoom, useRoomMembers } from '@/hooks/use-room-data'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export const dynamic = 'force-dynamic'

export default function SettleAllPage() {
  const { user, profile, loading, initialized } = useAuth()
  const { data: room, isLoading: roomLoading } = useUserRoom()
  const { data: roomMembers = [] } = useRoomMembers(room?.id)
  const router = useRouter()

  useEffect(() => {
    if (initialized && !user) {
      router.replace('/auth/login')
    }
  }, [user, initialized, router])

  const handleGoBack = () => {
    router.back()
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/auth/login')
    } catch (error) {
      console.error('Error signing out:', error)
      toast.error('Failed to sign out')
    }
  }

  const handleInviteMember = () => {
    if (room?.invite_code) {
      navigator.clipboard.writeText(room.invite_code)
      toast.success('Invite code copied to clipboard!')
    }
  }

  // Show loading while auth is being checked
  if (!initialized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Redirect if not authenticated
  if (!user) {
    return null
  }

  // Show loading while room is being fetched
  if (roomLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Redirect if no room
  if (!room) {
    router.replace('/dashboard')
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Consistent Navigation */}
      {user && room && profile && (
        <ResponsiveNav
          user={profile}
          room={room}
          roomMembersCount={roomMembers?.length || 0}
          onSignOut={handleSignOut}
          onInviteMember={handleInviteMember}
          onProfileClick={() => router.push('/profile')}
          onRoomDetailsClick={() => router.push(`/room/${room.id}`)}
        />
      )}

      {/* Mobile-first container */}
      <div className="mx-auto bg-white min-h-screen max-w-md lg:max-w-2xl lg:bg-transparent pt-16 lg:pt-20">
        {/* Header */}
        <div className="sticky top-16 lg:top-20 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-100 lg:bg-transparent lg:border-none">
          <div className="flex items-center justify-between p-4 lg:p-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGoBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>

            <h1 className="text-lg font-semibold text-gray-900 lg:text-xl">
              Settle All Dues
            </h1>

            <div className="w-16" /> {/* Spacer for centering */}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 lg:p-6">
          <SettleAllForm
            room={room}
            currentUserId={user.id}
            onSuccess={() => {
              router.push('/dashboard')
            }}
          />
        </div>
      </div>
    </div>
  )
}