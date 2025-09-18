'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { ProfileForm } from '@/components/profile/profile-form'
import { ResponsiveNav } from '@/components/navigation/responsive-nav'
import { useAuth } from '@/hooks/use-auth'
import { useUserRoom, useRoomMembers } from '@/hooks/use-room-data'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, User, Calendar, Hash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

export const dynamic = 'force-dynamic'

export default function ProfilePage() {
  const { user, profile, loading, initialized } = useAuth()
  const { data: room } = useUserRoom()
  const { data: roomMembers = [] } = useRoomMembers(room?.id)
  const router = useRouter()

  useEffect(() => {
    if (initialized && !user) {
      router.replace('/auth/login')
      return
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

      {/* Content with proper top spacing for fixed nav */}
      <div className="pt-16 lg:pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            {/* Desktop: Left sidebar */}
            <div className="hidden lg:block lg:col-span-4">
              <div className="sticky top-24">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-500 rounded-2xl flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Profile Settings</h2>
                      <p className="text-sm text-gray-600">Manage your account</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Update personal information</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Change profile picture</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>View account details</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main content */}
            <div className="lg:col-span-8">
              {/* Mobile header */}
              <div className="lg:hidden mb-4">
                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleGoBack}
                    variant="ghost"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span className="text-sm font-medium">Back</span>
                  </Button>
                </div>
              </div>

              {/* Desktop header */}
              <div className="hidden lg:block mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Profile Settings</h1>
                    <p className="text-gray-600 text-sm mt-1">Manage your personal information and preferences</p>
                  </div>
                  <Button
                    onClick={handleGoBack}
                    variant="ghost"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span className="text-sm font-medium">Back</span>
                  </Button>
                </div>
              </div>

              <div className="space-y-6">
                {/* Profile Form Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200"
                >
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Personal Information</h2>
                    <p className="text-sm text-gray-600">Update your profile details and avatar image</p>
                  </div>
                  <ProfileForm user={profile} />
                </motion.div>

                {/* Account Information Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200"
                >
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Account Information</h2>
                    <p className="text-sm text-gray-600">View your account details and activity</p>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <Hash className="h-4 w-4 text-gray-500" />
                        <label className="text-sm font-medium text-gray-700">User ID</label>
                      </div>
                      <p className="text-sm text-gray-600 font-mono break-all">
                        {profile.id}
                      </p>
                    </div>
                    
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <label className="text-sm font-medium text-gray-700">Member Since</label>
                      </div>
                      <p className="text-sm text-gray-600">
                        {new Date(profile.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}