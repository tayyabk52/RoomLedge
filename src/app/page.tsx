'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { 
  Receipt, 
  Users, 
  DollarSign, 
  BarChart3, 
  ArrowRight, 
  CheckCircle,
  Shield,
  Zap,
  Globe
} from 'lucide-react'
import { motion } from 'framer-motion'

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
      title: 'Smart Bill Tracking',
      description: 'Add shared expenses and split them automatically with intelligent categorization'
    },
    {
      icon: Users,
      title: 'Fair Splitting',
      description: 'Equal or custom splits with transparent calculations that everyone can see'
    },
    {
      icon: DollarSign,
      title: 'Easy Settlements',
      description: 'Record payments and track balances with real-time updates for all members'
    },
    {
      icon: BarChart3,
      title: 'Insightful Analytics',
      description: 'View spending patterns and detailed history to better manage expenses'
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-200/30">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500 rounded-xl flex items-center justify-center">
                <Receipt className="h-4 w-4 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">RoomLedger</span>
            </div>
            
            <div className="flex items-center gap-4">
              <Button variant="ghost" asChild className="text-gray-600 hover:text-gray-900">
                <Link href="/auth/login">Sign In</Link>
              </Button>
              <Button asChild className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl px-6">
                <Link href="/auth/signup">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-12 lg:pt-32 lg:pb-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Split expenses with roommates,{' '}
                <span className="text-blue-500">effortlessly</span>
              </h1>
              <p className="text-xl lg:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
                The smart way to track shared bills, split expenses fairly, and maintain financial harmony in your shared living space.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <Button asChild size="lg" className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl px-8 py-4 text-lg">
                  <Link href="/auth/signup" className="flex items-center gap-2">
                    Start for Free
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-xl px-8 py-4 text-lg border-gray-300">
                  <Link href="/auth/login">Sign In</Link>
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Free forever</span>
                </div>
                <div className="flex items-center gap-1">
                  <Shield className="h-4 w-4 text-blue-500" />
                  <span>Secure & private</span>
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  <span>Setup in minutes</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Everything you need to manage shared expenses
            </h2>
            <p className="text-xl text-gray-600">
              Powerful features designed for modern roommates
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group bg-white rounded-3xl p-8 border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-start gap-6">
                  <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:bg-blue-50 transition-colors duration-300">
                    <feature.icon className="h-7 w-7 text-gray-600 group-hover:text-blue-600 transition-colors duration-300" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-gray-800">{feature.title}</h3>
                    <p className="text-gray-500 leading-relaxed text-[15px]">{feature.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              How RoomLedger works
            </h2>
            <p className="text-xl text-gray-600">
              Get started in three simple steps
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Create or Join Room',
                description: 'Set up a room for your living space or join an existing one with an invite code. Add your roommates and you\'re ready to go.',
                color: 'bg-gray-900'
              },
              {
                step: '02',
                title: 'Add Shared Bills',
                description: 'Upload receipts or manually add expenses like groceries, utilities, or meals. Choose how to split costs fairly among participants.',
                color: 'bg-gray-900'
              },
              {
                step: '03',
                title: 'Track & Settle',
                description: 'Monitor balances in real-time and record payments. Everyone stays updated on who owes what and when payments are made.',
                color: 'bg-gray-900'
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="text-center group"
              >
                <div className={`w-16 h-16 ${step.color} rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:scale-105 transition-transform duration-300`}>
                  <span className="text-xl font-semibold text-white">{step.step}</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4 group-hover:text-gray-800">{step.title}</h3>
                <p className="text-gray-500 leading-relaxed text-[15px] max-w-sm mx-auto">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-500 to-indigo-600">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
              Ready to simplify your shared expenses?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join thousands of roommates who have already made their financial lives easier with RoomLedger.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-gray-100 rounded-xl px-8 py-4 text-lg">
                <Link href="/auth/signup" className="flex items-center gap-2">
                  Get Started for Free
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            </div>
            
            <p className="text-blue-200 text-sm mt-4">
              No credit card required • Free forever • Setup in under 2 minutes
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between">
            <div className="flex items-center gap-2 mb-4 lg:mb-0">
              <div className="w-8 h-8 bg-blue-500 rounded-xl flex items-center justify-center">
                <Receipt className="h-4 w-4 text-white" />
              </div>
              <span className="text-xl font-bold text-white">RoomLedger</span>
            </div>
            
            <div className="flex items-center gap-6 text-gray-400 text-sm">
              <span>© 2025 RoomLedger. All rights reserved.</span>
              <Globe className="h-4 w-4" />
              <span>Made with ❤️ for roommates everywhere</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
