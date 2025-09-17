'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
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

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    initialized: false,
    profileLoading: false
  })

  // Track ongoing profile fetch to prevent race conditions
  const [profileFetchInProgress, setProfileFetchInProgress] = useState<string | null>(null)
  // Use ref to avoid dependency issues
  const profileRef = useRef<User | null>(null)

  // Update ref when profile changes
  useEffect(() => {
    profileRef.current = state.profile
  }, [state.profile])

  const fetchProfile = useCallback(async (userId: string, retryCount = 0) => {
    // Prevent concurrent profile fetches for the same user
    if (profileFetchInProgress === userId) {
      console.log('Profile fetch already in progress for user:', userId)
      return
    }

    // Don't fetch if we already have a profile for this user
    if (profileRef.current && profileRef.current.id === userId && retryCount === 0) {
      console.log('Profile already loaded for user:', userId)
      return
    }

    console.log('Fetching profile for user:', userId, 'Retry:', retryCount)
    setProfileFetchInProgress(userId)
    setState(prev => ({ ...prev, profileLoading: true }))

    try {
      const { data, error } = await authService.getProfile(userId)

      if (error) {
        console.error('Error fetching profile:', error)
        // Retry up to 2 times with shorter delays to reduce noise
        if (retryCount < 2) {
          const delay = (retryCount + 1) * 1000 // 1s, 2s
          console.log(`Retrying profile fetch in ${delay}ms...`)
          setTimeout(() => {
            setProfileFetchInProgress(null)
            fetchProfile(userId, retryCount + 1)
          }, delay)
          return
        }
        // After retries, set profile to null and stop loading
        console.log('Profile fetch failed after retries')
        setState(prev => ({
          ...prev,
          profile: null,
          profileLoading: false
        }))
        setProfileFetchInProgress(null)
        return
      }

      console.log('Profile fetched successfully:', data)
      setState(prev => ({
        ...prev,
        profile: data,
        profileLoading: false
      }))
      setProfileFetchInProgress(null)
    } catch (error) {
      console.error('Error fetching profile:', error)
      // Retry logic with same limits
      if (retryCount < 2) {
        const delay = (retryCount + 1) * 1000
        console.log(`Retrying profile fetch in ${delay}ms...`)
        setTimeout(() => {
          setProfileFetchInProgress(null)
          fetchProfile(userId, retryCount + 1)
        }, delay)
      } else {
        console.log('Profile fetch failed after retries')
        setState(prev => ({
          ...prev,
          profile: null,
          profileLoading: false
        }))
        setProfileFetchInProgress(null)
      }
    }
  }, [profileFetchInProgress])

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

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
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
          setProfileFetchInProgress(null)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
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
    if (state.user) {
      await fetchProfile(state.user.id)
    }
  }, [state.user, fetchProfile])

  return {
    user: state.user,
    profile: state.profile,
    loading: state.loading || state.profileLoading,
    initialized: state.initialized,
    signIn,
    signUp,
    signOut,
    refreshProfile,
  }
}