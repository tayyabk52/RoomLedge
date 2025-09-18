'use client'

import { createContext, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { authService } from '@/lib/auth'
import { User } from '@/types'

interface AuthState {
  user: SupabaseUser | null
  profile: User | null
  loading: boolean
  initialized: boolean
  profileLoading: boolean
}

type AuthSubscription = ReturnType<typeof supabase.auth.onAuthStateChange>['data']['subscription']

interface AuthActions {
  signIn: (email: string, password: string) => ReturnType<typeof authService.signIn>
  signUp: (email: string, password: string, fullName: string) => ReturnType<typeof authService.signUp>
  signOut: () => ReturnType<typeof authService.signOut>
  refreshProfile: () => Promise<void>
}

export interface AuthContextValue {
  user: SupabaseUser | null
  profile: User | null
  loading: boolean
  initialized: boolean
  subscription: AuthSubscription | null
  actions: AuthActions
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    initialized: false,
    profileLoading: false
  })
  const [subscription, setSubscription] = useState<AuthSubscription | null>(null)

  const profileRef = useRef<User | null>(null)
  const profileFetchInProgressRef = useRef<string | null>(null)

  useEffect(() => {
    profileRef.current = state.profile
  }, [state.profile])

  const fetchProfile = useCallback(async (userId: string, retryCount = 0) => {
    if (profileFetchInProgressRef.current === userId) {
      console.log('Profile fetch already in progress for user:', userId)
      return
    }

    if (profileRef.current && profileRef.current.id === userId && retryCount === 0) {
      console.log('Profile already loaded for user:', userId)
      return
    }

    console.log('Fetching profile for user:', userId, 'Retry:', retryCount)
    profileFetchInProgressRef.current = userId
    setState(prev => ({ ...prev, profileLoading: true }))

    try {
      const { data, error } = await authService.getProfile(userId)

      if (error) {
        console.error('Error fetching profile:', error)
        if (retryCount < 2) {
          const delay = (retryCount + 1) * 1000
          console.log(`Retrying profile fetch in ${delay}ms...`)
          setTimeout(() => {
            profileFetchInProgressRef.current = null
            fetchProfile(userId, retryCount + 1)
          }, delay)
          return
        }
        console.log('Profile fetch failed after retries')
        setState(prev => ({
          ...prev,
          profile: null,
          profileLoading: false
        }))
        profileFetchInProgressRef.current = null
        return
      }

      console.log('Profile fetched successfully:', data)
      setState(prev => ({
        ...prev,
        profile: data,
        profileLoading: false
      }))
      profileFetchInProgressRef.current = null
    } catch (error) {
      console.error('Error fetching profile:', error)
      if (retryCount < 2) {
        const delay = (retryCount + 1) * 1000
        console.log(`Retrying profile fetch in ${delay}ms...`)
        setTimeout(() => {
          profileFetchInProgressRef.current = null
          fetchProfile(userId, retryCount + 1)
        }, delay)
      } else {
        console.log('Profile fetch failed after retries')
        setState(prev => ({
          ...prev,
          profile: null,
          profileLoading: false
        }))
        profileFetchInProgressRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Session error:', error)
        }

        if (mounted) {
          setState(prev => ({
            ...prev,
            user: session?.user ?? null,
            loading: false,
            initialized: true
          }))

          if (session?.user) {
            await fetchProfile(session.user.id)
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        if (mounted) {
          setState(prev => ({
            ...prev,
            loading: false,
            initialized: true
          }))
        }
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      console.log('Auth state changed:', event, session?.user?.email)

      setState(prev => ({
        ...prev,
        user: session?.user ?? null,
        loading: false
      }))

      if (session?.user) {
        await fetchProfile(session.user.id)
      } else {
        setState(prev => ({
          ...prev,
          profile: null,
          profileLoading: false
        }))
        profileFetchInProgressRef.current = null
      }
    })

    setSubscription(subscription)

    return () => {
      mounted = false
      subscription.unsubscribe()
      setSubscription(null)
    }
  }, [fetchProfile])

  const signIn = useCallback(async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true }))

    try {
      const result = await authService.signIn({ email, password })
      return result
    } finally {
      setState(prev => ({ ...prev, loading: false }))
    }
  }, [])

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    setState(prev => ({ ...prev, loading: true }))

    try {
      const result = await authService.signUp({ email, password, fullName })
      return result
    } finally {
      setState(prev => ({ ...prev, loading: false }))
    }
  }, [])

  const signOut = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true }))

    try {
      const result = await authService.signOut()
      return result
    } finally {
      setState(prev => ({ ...prev, loading: false }))
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    const userId = state.user?.id
    if (userId) {
      await fetchProfile(userId)
    }
  }, [state.user?.id, fetchProfile])

  const actions = useMemo<AuthActions>(() => ({
    signIn,
    signUp,
    signOut,
    refreshProfile,
  }), [signIn, signUp, signOut, refreshProfile])

  const value = useMemo<AuthContextValue>(() => ({
    user: state.user,
    profile: state.profile,
    loading: state.loading || state.profileLoading,
    initialized: state.initialized,
    subscription,
    actions,
  }), [state.user, state.profile, state.loading, state.profileLoading, state.initialized, subscription, actions])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
