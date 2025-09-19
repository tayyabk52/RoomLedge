'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { billService } from '@/lib/supabase-services'
import { useAuth } from './use-auth'
import { CreateBillData, CreateSettlementData } from '@/types'

export function useRoomBills(roomId?: string) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['room-bills', roomId, user?.id],
    queryFn: async () => {
      if (!roomId || !user?.id) return null
      const { data, error } = await billService.getRoomBills(roomId, user.id)
      if (error) throw error
      return data
    },
    enabled: !!roomId && !!user?.id,
  })
}

export function useUserPosition(roomId?: string) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['user-position', roomId, user?.id],
    queryFn: async () => {
      if (!roomId || !user?.id) return null
      const { data, error } = await billService.getUserPosition(roomId, user.id)
      if (error) throw error
      return data
    },
    enabled: !!roomId && !!user?.id,
  })
}

export function useUserOverallNet(roomId?: string) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['user-overall-net', roomId, user?.id],
    queryFn: async () => {
      if (!roomId || !user?.id) return null
      const { data, error } = await billService.getUserOverallNet(roomId, user.id)
      if (error) throw error
      return data
    },
    enabled: !!roomId && !!user?.id,
  })
}

export function useBillDetails(billId?: string) {
  return useQuery({
    queryKey: ['bill-details', billId],
    queryFn: async () => {
      if (!billId) return null
      const { data, error } = await billService.getBillDetails(billId)
      if (error) throw error
      return data
    },
    enabled: !!billId,
  })
}

export function useRoomStatistics(roomId?: string) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['room-statistics', roomId, user?.id],
    queryFn: async () => {
      if (!roomId || !user?.id) return null
      const { data, error } = await billService.getRoomStatistics(roomId, user.id)
      if (error) throw error
      return data
    },
    enabled: !!roomId && !!user?.id,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })
}

export function useRecentActivity(roomId?: string, limit: number = 10) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['recent-activity', roomId, user?.id, limit],
    queryFn: async () => {
      if (!roomId || !user?.id) return []
      const { data, error } = await billService.getRecentActivity(roomId, user.id, limit)
      if (error) {
        console.warn('Error fetching recent activity:', error)
        return [] // Return empty array on error instead of throwing
      }
      return data || []
    },
    enabled: !!roomId && !!user?.id,
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
  })
}

export function useCreateBill() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateBillData) => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }
      const { data: bill, error } = await billService.createBill(data, user.id)
      if (error) throw error
      return bill
    },
    onSuccess: (bill) => {
      if (bill) {
        // Invalidate and refetch related queries
        queryClient.invalidateQueries({ queryKey: ['room-bills', bill.room_id] })
        queryClient.invalidateQueries({ queryKey: ['user-position', bill.room_id, user?.id] })
        queryClient.invalidateQueries({ queryKey: ['user-overall-net', bill.room_id, user?.id] })
        queryClient.invalidateQueries({ queryKey: ['room-statistics', bill.room_id] })
        queryClient.invalidateQueries({ queryKey: ['recent-activity', bill.room_id] })
      }
    }
  })
}

export function useCreateSettlement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateSettlementData) => {
      const { data: settlement, error } = await billService.createSettlement(data)
      if (error) throw error
      return settlement
    },
    onSuccess: (settlement, variables) => {
      if (settlement) {
        // Get room ID from bill to invalidate room-specific queries
        const billId = variables.bill_id

        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: ['room-bills'] })
        queryClient.invalidateQueries({ queryKey: ['bill-details', billId] })
        queryClient.invalidateQueries({ queryKey: ['user-position'] })
        queryClient.invalidateQueries({ queryKey: ['user-overall-net'] })
        queryClient.invalidateQueries({ queryKey: ['room-statistics'] })
        queryClient.invalidateQueries({ queryKey: ['recent-activity'] })
        queryClient.invalidateQueries({ queryKey: ['settlement-opportunities'] })
      }
    }
  })
}

export function useSettlementOpportunities(roomId?: string) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['settlement-opportunities', roomId, user?.id],
    queryFn: async () => {
      if (!roomId || !user?.id) return null
      const { data, error } = await billService.getSettlementOpportunities(roomId, user.id)
      if (error) throw error
      return data
    },
    enabled: !!roomId && !!user?.id,
    staleTime: 1 * 60 * 1000, // Cache for 1 minute
  })
}