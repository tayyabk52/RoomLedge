import { supabase } from './supabase'
import { User } from '@/types'

export interface AuthError {
  message: string
  status?: number
}

export interface SignInCredentials {
  email: string
  password: string
}

export interface SignUpCredentials {
  email: string
  password: string
  fullName: string
}

export interface AuthResponse<T = unknown> {
  data: T | null
  error: AuthError | null
}

export const authService = {
  async signIn({ email, password }: SignInCredentials): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { data: null, error: { message: error.message } }
      }

      return { data, error: null }
    } catch (err) {
      return {
        data: null,
        error: {
          message: err instanceof Error ? err.message : 'An unexpected error occurred'
        }
      }
    }
  },

  async signUp({ email, password, fullName }: SignUpCredentials): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (error) {
        return { data: null, error: { message: error.message } }
      }

      return { data, error: null }
    } catch (err) {
      return {
        data: null,
        error: {
          message: err instanceof Error ? err.message : 'An unexpected error occurred'
        }
      }
    }
  },

  async signOut(): Promise<AuthResponse> {
    try {
      const { error } = await supabase.auth.signOut()

      if (error) {
        return { data: null, error: { message: error.message } }
      }

      return { data: true, error: null }
    } catch (err) {
      return {
        data: null,
        error: {
          message: err instanceof Error ? err.message : 'An unexpected error occurred'
        }
      }
    }
  },

  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()

      if (error) {
        return { data: null, error: { message: error.message } }
      }

      return { data: user, error: null }
    } catch (err) {
      return {
        data: null,
        error: {
          message: err instanceof Error ? err.message : 'An unexpected error occurred'
        }
      }
    }
  },

  async getProfile(userId: string): Promise<AuthResponse<User>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        console.error('Profile fetch error:', error)
        return { data: null, error: { message: error.message } }
      }

      // If no profile exists, this might be a newly created user
      if (!data) {
        console.log('No profile found for user:', userId)
        // Try to get user metadata from auth
        const { data: { user } } = await supabase.auth.getUser()
        if (user && user.id === userId) {
          // Create profile from user metadata with conflict handling
          const profileData = {
            id: userId,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            avatar_url: user.user_metadata?.avatar_url || null
          }

          // Use upsert to handle race conditions
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .upsert(profileData, {
              onConflict: 'id',
              ignoreDuplicates: false
            })
            .select()
            .single()

          if (insertError) {
            console.error('Error creating profile:', insertError)
            // If it's a conflict error, try to fetch the existing profile
            if (insertError.code === '23505' || insertError.message.includes('duplicate')) {
              console.log('Profile already exists, fetching existing profile')
              const { data: existingProfile, error: fetchError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single()

              if (fetchError) {
                return { data: null, error: { message: 'Failed to fetch existing profile' } }
              }

              return { data: existingProfile, error: null }
            }
            return { data: null, error: { message: 'Failed to create profile' } }
          }

          return { data: newProfile, error: null }
        }

        return { data: null, error: { message: 'Profile not found' } }
      }

      return { data, error: null }
    } catch (err) {
      console.error('Profile service error:', err)
      return {
        data: null,
        error: {
          message: err instanceof Error ? err.message : 'Failed to fetch profile'
        }
      }
    }
  },

  async updateProfile(userId: string, updates: Partial<User>): Promise<AuthResponse<User>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        return { data: null, error: { message: error.message } }
      }

      return { data, error: null }
    } catch (err) {
      return {
        data: null,
        error: {
          message: err instanceof Error ? err.message : 'Failed to update profile'
        }
      }
    }
  }
}