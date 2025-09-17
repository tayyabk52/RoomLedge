'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { ProfileForm } from '@/components/profile/profile-form'
import { useAuth } from '@/hooks/use-auth'
import { ArrowLeft, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { motion } from 'framer-motion'

export const dynamic = 'force-dynamic'

export default function ProfilePage() {
  const { user, profile, loading, initialized } = useAuth()
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
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
                    Profile Settings
                  </h1>
                  <p className="text-sm text-gray-600 hidden lg:block">
                    Manage your personal information and avatar
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 lg:p-6 lg:max-w-4xl lg:mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="shadow-lg border-gray-200">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Personal Information
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Update your profile details and avatar image
                </p>
              </CardHeader>
              <CardContent>
                <ProfileForm user={profile} />
              </CardContent>
            </Card>

            {/* Account Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="mt-6"
            >
              <Card className="shadow-lg border-gray-200">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Account Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        User ID
                      </label>
                      <p className="text-sm text-gray-600 font-mono mt-1 p-2 bg-gray-50 rounded">
                        {profile.id}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Member Since
                      </label>
                      <p className="text-sm text-gray-600 mt-1 p-2 bg-gray-50 rounded">
                        {new Date(profile.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}