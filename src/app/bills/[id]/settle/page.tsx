'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { SettleUpForm } from '@/components/bills/settle-up-form'
import { useAuth } from '@/hooks/use-auth'
import { useUserRoom } from '@/hooks/use-room-data'
import { useBillDetails } from '@/hooks/use-bill-data'

export const dynamic = 'force-dynamic'

export default function SettleBillPage() {
  const { user, loading, initialized } = useAuth()
  const { data: room, isLoading: roomLoading } = useUserRoom()
  const router = useRouter()
  const params = useParams()
  const billId = params.id as string

  const { data: bill, isLoading: billLoading } = useBillDetails(billId)

  useEffect(() => {
    if (initialized && !user) {
      router.replace('/auth/login')
    }
  }, [user, initialized, router])

  const handleGoBack = () => {
    router.back()
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

  // Show loading while room/bill is being fetched
  if (roomLoading || billLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Redirect if no room or bill
  if (!room || !bill) {
    router.replace('/dashboard')
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-first container */}
      <div className="mx-auto bg-white min-h-screen max-w-md lg:max-w-2xl lg:bg-transparent">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-100 lg:bg-transparent lg:border-none">
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

            <h1 className="text-lg font-semibold text-gray-900 lg:text-xl text-center flex-1 px-4">
              Settle Up for {bill.title}
            </h1>

            <div className="w-16" /> {/* Spacer for centering */}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 lg:p-6">
          <SettleUpForm
            bill={bill}
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