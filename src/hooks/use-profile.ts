'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { profileService, UpdateProfileData } from '@/lib/supabase-services'
import { toast } from 'sonner'
import { useAuth } from './use-auth'

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  const { refreshProfile } = useAuth()

  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: UpdateProfileData }) =>
      profileService.updateProfile(userId, data),
    onSuccess: async (result) => {
      if (result.data) {
        // Refresh the auth profile to get updated data
        await refreshProfile()

        // Invalidate any other queries that might depend on profile data
        queryClient.invalidateQueries({ queryKey: ['room', 'members'] })
        queryClient.invalidateQueries({ queryKey: ['bills'] })

        toast.success('Profile updated successfully!')
      }
    },
    onError: (error) => {
      console.error('Profile update error:', error)
      toast.error('Failed to update profile. Please try again.')
    }
  })
}

export function useUploadAvatar() {
  const queryClient = useQueryClient()
  const { refreshProfile } = useAuth()

  return useMutation({
    mutationFn: ({ userId, file }: { userId: string; file: File }) =>
      profileService.uploadAvatar(userId, file),
    onSuccess: async (result) => {
      if (result.data) {
        // Refresh the auth profile to get updated avatar URL
        await refreshProfile()

        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: ['room', 'members'] })
        queryClient.invalidateQueries({ queryKey: ['bills'] })

        toast.success('Avatar updated successfully!')
      }
    },
    onError: (error) => {
      console.error('Avatar upload error:', error)
      toast.error('Failed to upload avatar. Please try again.')
    }
  })
}

export function useDeleteAvatar() {
  const queryClient = useQueryClient()
  const { refreshProfile } = useAuth()

  return useMutation({
    mutationFn: (userId: string) => profileService.deleteAvatar(userId),
    onSuccess: async () => {
      // Refresh the auth profile to get updated data (avatar removed)
      await refreshProfile()

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['room', 'members'] })
      queryClient.invalidateQueries({ queryKey: ['bills'] })

      toast.success('Avatar removed successfully!')
    },
    onError: (error) => {
      console.error('Avatar delete error:', error)
      toast.error('Failed to remove avatar. Please try again.')
    }
  })
}