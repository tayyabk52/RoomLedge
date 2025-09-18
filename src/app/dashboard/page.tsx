'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { BalanceCard } from '@/components/dashboard/balance-card'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { BillList } from '@/components/dashboard/bill-list'
import { ActivityFeed } from '@/components/dashboard/activity-feed'
import { RoomStatsCard } from '@/components/dashboard/room-stats-card'
import { RoomSetup } from '@/components/room/room-setup'
import { ResponsiveNav } from '@/components/navigation/responsive-nav'
import { useAuth } from '@/hooks/use-auth'
import { useUserRoom, useRoomMembers } from '@/hooks/use-room-data'
import { useUserOverallNet, useRoomBills, useUserPosition, useRoomStatistics, useRecentActivity } from '@/hooks/use-bill-data'
import { toast } from 'sonner'

export const dynamic = 'force-dynamic'


export default function DashboardPage() {
  const { user, profile, loading, initialized, actions: { signOut } } = useAuth()
  const router = useRouter()

  // Fetch room and bill data
  const { data: room, isLoading: roomLoading } = useUserRoom()
  const { data: roomMembers } = useRoomMembers(room?.id)
  const { data: bills, isLoading: billsLoading } = useRoomBills(room?.id)
  const { data: userPositions } = useUserPosition(room?.id)
  const { data: overallNet, isLoading: netLoading } = useUserOverallNet(room?.id)
  const { data: roomStatistics, isLoading: statsLoading } = useRoomStatistics(room?.id)
  const { data: recentActivity, isLoading: activityLoading } = useRecentActivity(room?.id, 8)

  useEffect(() => {
    // Only redirect to login if auth is fully initialized and there's no user
    if (initialized && !user) {
      console.log('Dashboard: No user found, redirecting to login')
      // Use replace to prevent back navigation issues
      router.replace('/auth/login')
      return
    }
  }, [user, initialized, router])

  const handleSignOut = async () => {
    try {
      const { error } = await signOut()
      if (error) {
        toast.error(error.message)
      } else {
        toast.success('Signed out successfully')
        router.push('/')
      }
    } catch {
      toast.error('Failed to sign out')
    }
  }

  const handleAddBill = () => {
    router.push('/bills/add')
  }

  const handleAddAdvanceBill = () => {
    router.push('/bills/add-advance')
  }

  const handleSettleUp = () => {
    router.push('/bills/settle')
  }

  const handleSettleBill = (billId: string) => {
    router.push(`/bills/${billId}/settle`)
  }

  const handleInviteMember = () => {
    if (room?.invite_code) {
      navigator.clipboard.writeText(room.invite_code)
      toast.success('Room code copied to clipboard!')
    }
  }

  const handleViewHistory = () => {
    router.push('/history')
  }

  const handleBillClick = (billId: string) => {
    if (billId) {
      router.push(`/bills/${billId}`)
    } else {
      router.push('/history')
    }
  }

  const handleProfileClick = () => {
    router.push('/profile')
  }

  const handleRoomDetailsClick = () => {
    if (room?.id) {
      router.push(`/room/${room.id}`)
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

  // Show room setup if user is not in a room
  if (!roomLoading && !room) {
    return <RoomSetup />
  }

  // Show loading while room data is being fetched
  if (roomLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-first container with responsive breakpoints */}
      <div className="mx-auto bg-white min-h-screen max-w-md lg:max-w-7xl lg:bg-transparent">
        {/* Responsive Navigation */}
        <ResponsiveNav
          user={profile}
          room={room || undefined}
          roomMembersCount={roomMembers?.length || 0}
          onSignOut={handleSignOut}
          onInviteMember={handleInviteMember}
          onProfileClick={handleProfileClick}
          onRoomDetailsClick={handleRoomDetailsClick}
        />

        {/* Uber-style Clean Content Layout */}
        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-6 lg:py-8">
          {/* Main Dashboard Grid - Uber Style */}
          <div className="space-y-6 lg:space-y-8">
            
            {/* Hero Section - Balance & Quick Actions */}
            <div className="space-y-4 lg:space-y-6">
              {/* Balance Card - Full Width */}
              <BalanceCard
                amount={overallNet?.overall_net || 0}
                currency={room?.base_currency || 'PKR'}
                isLoading={netLoading}
              />

              {/* Quick Actions - Clean Row */}
              <QuickActions
                onAddBill={handleAddBill}
                onAddAdvanceBill={handleAddAdvanceBill}
                onSettleUp={handleSettleUp}
                onInviteMember={handleInviteMember}
                onViewHistory={handleViewHistory}
              />
            </div>

            {/* Content Grid - Desktop 2-column, Mobile stacked */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              
              {/* Left Column - Primary Content (2/3 width on desktop) */}
              <div className="lg:col-span-2 space-y-6 lg:space-y-8">
                {/* Bills Section */}
                <BillList
                  bills={bills || []}
                  userPositions={userPositions || []}
                  currentUserId={user?.id || ''}
                  onBillClick={handleBillClick}
                  onSettleBill={handleSettleBill}
                  isLoading={billsLoading}
                />

                {/* Activity Feed */}
                <ActivityFeed
                  activities={recentActivity || []}
                  isLoading={activityLoading}
                  onBillClick={handleBillClick}
                />
              </div>

              {/* Right Column - Secondary Content (1/3 width on desktop) */}
              <div className="lg:col-span-1">
                {/* Room Statistics */}
                <RoomStatsCard
                  statistics={roomStatistics || null}
                  isLoading={statsLoading}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}