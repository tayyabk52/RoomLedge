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
  const { user, profile, loading, initialized, signOut } = useAuth()
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
        />

        {/* Content - Responsive Layout */}
        <div className="p-4 lg:p-6 lg:max-w-7xl lg:mx-auto">
          {/* Responsive Grid Layout */}
          <div className="md:grid md:grid-cols-1 lg:grid-cols-12 lg:gap-8">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-8 space-y-6">
              {/* Balance Card */}
              <BalanceCard
                amount={overallNet?.overall_net || 0}
                currency={room?.base_currency || 'PKR'}
                isLoading={netLoading}
              />

              {/* Quick Actions */}
              <QuickActions
                onAddBill={handleAddBill}
                onSettleUp={handleSettleUp}
                onInviteMember={handleInviteMember}
                onViewHistory={handleViewHistory}
              />

              {/* Room Statistics - Mobile & Tablet */}
              <div className="lg:hidden">
                <RoomStatsCard
                  statistics={roomStatistics || null}
                  isLoading={statsLoading}
                />
              </div>

              {/* Bills Section - Mobile & Tablet */}
              <div className="lg:hidden">
                <BillList
                  bills={bills || []}
                  userPositions={userPositions || []}
                  currentUserId={user?.id || ''}
                  onBillClick={handleBillClick}
                  onSettleBill={handleSettleBill}
                  isLoading={billsLoading}
                />
              </div>

              {/* Activity Feed - Mobile & Tablet */}
              <div className="lg:hidden">
                <ActivityFeed
                  activities={recentActivity || []}
                  isLoading={activityLoading}
                  onBillClick={handleBillClick}
                />
              </div>
            </div>

            {/* Right Column - Desktop Sidebar */}
            <div className="hidden lg:block lg:col-span-4 space-y-6">
              {/* Room Statistics - Desktop Sidebar */}
              <RoomStatsCard
                statistics={roomStatistics || null}
                isLoading={statsLoading}
              />

              {/* Bills Section - Desktop Sidebar */}
              <BillList
                bills={bills || []}
                userPositions={userPositions || []}
                currentUserId={user?.id || ''}
                onBillClick={handleBillClick}
                onSettleBill={handleSettleBill}
                isLoading={billsLoading}
              />

              {/* Activity Feed - Desktop Sidebar */}
              <ActivityFeed
                activities={recentActivity || []}
                isLoading={activityLoading}
                onBillClick={handleBillClick}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}