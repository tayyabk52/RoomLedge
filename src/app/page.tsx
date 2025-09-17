'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { Receipt, Users, DollarSign, BarChart3 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const features = [
    {
      icon: Receipt,
      title: 'Track Bills',
      description: 'Add shared expenses and split them among roommates automatically'
    },
    {
      icon: Users,
      title: 'Easy Splitting',
      description: 'Equal splits with transparent calculations for everyone'
    },
    {
      icon: DollarSign,
      title: 'Settle Up',
      description: 'Record payments and keep track of who owes what'
    },
    {
      icon: BarChart3,
      title: 'Stay Organized',
      description: 'View history and track spending patterns over time'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-2xl mb-6">
              <Receipt className="h-8 w-8" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome to RoomLedger
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              The simple way for hostel roommates to track shared expenses, split bills, and settle up with each other.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
              <Link href="/auth/signup">Get Started</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/auth/login">Sign In</Link>
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
                <CardDescription className="text-gray-600">
                  {feature.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* How It Works */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-purple-500 text-white rounded-full flex items-center justify-center mx-auto font-bold text-xl">
                1
              </div>
              <h3 className="font-semibold text-lg">Create or Join Room</h3>
              <p className="text-gray-600">
                Create a room for your hostel floor or join an existing one with an invite code
              </p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto font-bold text-xl">
                2
              </div>
              <h3 className="font-semibold text-lg">Add Bills</h3>
              <p className="text-gray-600">
                Add shared expenses like groceries, utilities, or meals and split them automatically
              </p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto font-bold text-xl">
                3
              </div>
              <h3 className="font-semibold text-lg">Settle Up</h3>
              <p className="text-gray-600">
                Record payments and keep everyone updated on balances in real-time
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <Card className="bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">Ready to get started?</h3>
            <p className="text-white/90 mb-6">
              Join thousands of students already using RoomLedger to manage their shared expenses.
            </p>
            <Button asChild size="lg" className="bg-white text-purple-600 hover:bg-gray-100">
              <Link href="/auth/signup">Create Account</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
