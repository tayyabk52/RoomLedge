'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { roomService } from '@/lib/supabase-services'
import { useAuth } from './use-auth'
import { CreateRoomData, JoinRoomData } from '@/types'
import { toast } from 'sonner'

export function useUserRoom() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['user-room', user?.id],
    queryFn: async () => {
      if (!user?.id) return null
      const { data, error } = await roomService.getUserRoom(user.id)
      if (error) throw error
      return data
    },
    enabled: !!user?.id,
  })
}

export function useRoomMembers(roomId?: string) {
  return useQuery({
    queryKey: ['room-members', roomId],
    queryFn: async () => {
      if (!roomId) return null
      const { data, error } = await roomService.getRoomMembers(roomId)
      if (error) throw error
      return data
    },
    enabled: !!roomId,
  })
}

export function useCreateRoom() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (data: CreateRoomData) => {
      if (!user?.id) throw new Error('User not authenticated')
      const result = await roomService.createRoom(data, user.id)
      if (result.error) throw result.error
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-room'] })
      toast.success('Room created successfully!')
    },
    onError: (error: unknown) => {
      console.error('Create room error:', error)
      toast.error((error as Error).message || 'Failed to create room')
    },
  })
}

export function useJoinRoom() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (data: JoinRoomData) => {
      if (!user?.id) throw new Error('User not authenticated')
      const result = await roomService.joinRoom(data, user.id)
      if (result.error) throw result.error
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-room'] })
      toast.success('Joined room successfully!')
    },
    onError: (error: unknown) => {
      console.error('Join room error:', error)
      toast.error((error as Error).message || 'Failed to join room')
    },
  })
}