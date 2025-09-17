'use client'

import { useQuery } from '@tanstack/react-query'
import { roomDetailsService } from '@/lib/supabase-services'

export function useRoomDetails(roomId: string | undefined) {
  return useQuery({
    queryKey: ['room', 'details', roomId],
    queryFn: () => {
      if (!roomId) throw new Error('Room ID is required')
      return roomDetailsService.getRoomDetails(roomId)
    },
    enabled: !!roomId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    select: (result) => result.data,
  })
}