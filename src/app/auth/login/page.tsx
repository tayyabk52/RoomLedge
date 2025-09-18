'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { motion } from 'framer-motion'

import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { GoogleSigninButton } from '@/components/auth/google-signin-button'
import { useAuth } from '@/hooks/use-auth'
import { Mail, Lock, ArrowRight, Users } from 'lucide-react'
import { toast } from 'sonner'

export const dynamic = 'force-dynamic'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const { actions: { signIn }, user, profile, initialized } = useAuth()
  const router = useRouter()

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  // Redirect to dashboard when user is authenticated and profile is loaded
  useEffect(() => {
    console.log('Login useEffect - initialized:', initialized, 'user:', !!user, 'profile:', !!profile)
    if (initialized && user && profile) {
      console.log('Login: All conditions met, redirecting to dashboard...')
      setIsLoading(false) // Clear loading state
      // Use replace to avoid back navigation issues and add small delay
      setTimeout(() => {
        router.replace('/dashboard')
      }, 100)
    }
  }, [initialized, user, profile, router])

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)

    try {
      console.log('Starting sign in process...')
      const { error } = await signIn(data.email, data.password)

      if (error) {
        console.error('Sign in error:', error)
        toast.error(error.message)
        setIsLoading(false)
      } else {
        console.log('Sign in successful, waiting for profile...')
        toast.success('Successfully logged in!')
        // Keep loading true to prevent race conditions
        // The useEffect will handle the redirect when everything is ready
      }
    } catch (err) {
      console.error('Sign in exception:', err)
      toast.error('An unexpected error occurred')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="min-h-screen flex">
        {/* Left Side - Branding (Hidden on mobile) */}
        <div className="hidden lg:flex lg:w-1/2 bg-blue-500 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600"></div>
          <div className="relative z-10 flex flex-col justify-center px-12 text-white">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold">RoomLedger</h1>
              </div>
              
              <h2 className="text-4xl font-bold mb-4 leading-tight">
                Split expenses with roommates, effortlessly
              </h2>
              <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                Track shared bills, settle payments, and maintain financial harmony in your shared living space.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span className="text-blue-100">Real-time expense tracking</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span className="text-blue-100">Smart bill splitting</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span className="text-blue-100">Easy settlement tracking</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white rounded-3xl shadow-xl p-8"
            >
              {/* Header */}
              <div className="text-center mb-8">
                <div className="lg:hidden flex items-center justify-center gap-2 mb-6">
                  <div className="w-8 h-8 bg-blue-500 rounded-xl flex items-center justify-center">
                    <Users className="h-4 w-4 text-white" />
                  </div>
                  <h1 className="text-xl font-bold text-gray-900">RoomLedger</h1>
                </div>
                
                <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                  Welcome back
                </h2>
                <p className="text-gray-600">
                  Sign in to your account to continue
                </p>
              </div>

              {/* Google Sign In */}
              <div className="space-y-4">
                <GoogleSigninButton
                  variant="signin"
                  disabled={isLoading}
                />

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-white px-4 text-gray-500">Or continue with email</span>
                  </div>
                </div>
              </div>

              {/* Form */}
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Email Address</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <Input
                              type="email"
                              placeholder="Enter your email"
                              className="h-12 pl-11 text-sm border-gray-300 rounded-xl focus:border-blue-500 focus:ring-blue-500"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <Input
                              type="password"
                              placeholder="Enter your password"
                              className="h-12 pl-11 text-sm border-gray-300 rounded-xl focus:border-blue-500 focus:ring-blue-500"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <LoadingSpinner size="sm" />
                        <span>Signing in...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>Sign In</span>
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    )}
                  </Button>
                </form>
              </Form>

              {/* Footer */}
              <div className="text-center mt-8 pt-6 border-t border-gray-100">
                <p className="text-sm text-gray-600">
                  Don&apos;t have an account?{' '}
                  <Link 
                    href="/auth/signup" 
                    className="text-blue-500 hover:text-blue-600 font-medium transition-colors"
                  >
                    Sign up for free
                  </Link>
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}