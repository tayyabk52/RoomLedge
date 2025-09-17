'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'

export const dynamic = 'force-dynamic'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const { signIn, user, profile, initialized } = useAuth()
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md lg:max-w-lg">
        <Card className="w-full">
          <CardHeader className="space-y-1 lg:space-y-2">
            <CardTitle className="text-2xl lg:text-3xl font-bold text-center">
              Welcome back
            </CardTitle>
            <CardDescription className="text-center lg:text-lg">
              Sign in to your RoomLedger account
            </CardDescription>
          </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        {...field}
                      />
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
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter your password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>
          </Form>
          <div className="text-center text-sm text-muted-foreground mt-4">
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" className="text-primary hover:underline">
              Sign up
            </Link>
          </div>
        </CardContent>
        </Card>
      </div>
    </div>
  )
}