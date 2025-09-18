'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { AddBillForm } from '@/components/bills/add-bill-form'
import { ResponsiveNav } from '@/components/navigation/responsive-nav'
import { useAuth } from '@/hooks/use-auth'
import { useUserRoom, useRoomMembers } from '@/hooks/use-room-data'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export const dynamic = 'force-dynamic'

export default function AddBillPage() {
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

      {/* Clean Desktop Layout */}
      <div className="pt-16 lg:pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            {/* Desktop: Left sidebar with room info */}
            <div className="hidden lg:block lg:col-span-4">
              <div className="sticky top-24">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Split Bill</h2>
                  <p className="text-sm text-gray-600 mb-4">
                    Add a new expense to be split among roommates in <span className="font-medium">{room.name}</span>
                  </p>
                  <div className="space-y-3 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Add bill details and amount</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Select participants</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Specify who paid</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main form content */}
            <div className="lg:col-span-8">
              <AddBillForm
                room={room}
                onSuccess={() => {
                  router.push('/dashboard')
                }}
                onBack={handleGoBack}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}