import { supabase } from './supabase'
import {
  Room,
  RoomMember,
  Bill,
  BillUserPosition,
  RoomOverallNet,
  CreateRoomData,
  JoinRoomData,
  CreateBillData,
  BillSettlement,
  CreateSettlementData,
  PaymentMethod,
  User,
  CreateAdvanceBillData,
  AdvanceBillPreview
} from '@/types'

export interface RoomService {
  getUserRooms: (userId: string) => Promise<{ data: Room[] | null; error: unknown }>
  getUserRoom: (userId: string) => Promise<{ data: Room | null; error: unknown }>
  createRoom: (data: CreateRoomData, userId: string) => Promise<{ data: Room | null; error: unknown }>
  joinRoom: (data: JoinRoomData, userId: string) => Promise<{ data: Room | null; error: unknown }>
  getRoomMembers: (roomId: string) => Promise<{ data: RoomMember[] | null; error: unknown }>
}

export interface BillService {
  getRoomBills: (roomId: string) => Promise<{ data: Bill[] | null; error: unknown }>
  getUserPosition: (roomId: string, userId: string) => Promise<{ data: BillUserPosition[] | null; error: unknown }>
  getUserOverallNet: (roomId: string, userId: string) => Promise<{ data: RoomOverallNet | null; error: unknown }>
  getBillDetails: (billId: string) => Promise<{ data: Bill | null; error: unknown }>
  getRoomStatistics: (roomId: string) => Promise<{ data: RoomStatistics | null; error: unknown }>
  getRecentActivity: (roomId: string, limit?: number) => Promise<{ data: ActivityItem[] | null; error: unknown }>
  createBill: (data: CreateBillData, userId: string) => Promise<{ data: Bill | null; error: unknown }>
  createSettlement: (data: CreateSettlementData) => Promise<{ data: BillSettlement | null; error: unknown }>
  getSettlementOpportunities: (roomId: string, userId: string) => Promise<{ data: SettlementOpportunity[] | null; error: unknown }>
  updateBillStatus: (billId: string) => Promise<{ data: Bill | null; error: unknown }>
  // Advanced bill methods
  createAdvancedBill: (data: CreateAdvanceBillData, userId: string) => Promise<{ data: Bill | null; error: unknown }>
  getAdvancedBillCalculations: (billId: string) => Promise<{ data: AdvanceBillPreview | null; error: unknown }>
}

export interface RoomStatistics {
  total_bills: number
  total_amount: number
  settled_bills: number
  open_bills: number
  total_members: number
  currency: string
}

export interface ActivityItem {
  id: string
  type: 'bill' | 'settlement'
  date: string
  bill?: Bill
  settlement?: BillSettlement & {
    bill: Pick<Bill, 'title' | 'currency'>
    from_profile?: { id: string; full_name: string; avatar_url?: string }
    to_profile?: { id: string; full_name: string; avatar_url?: string }
  }
}

export interface SettlementOpportunity {
  bill_id: string
  bill_title: string
  currency: string
  amount_owed: number
  recipients: {
    user_id: string
    user_name: string
    amount_to_receive: number
  }[]
}

// Generate a random 6-character room code
function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export const roomService: RoomService = {
  async getUserRooms(userId: string) {
    try {
      const { data, error } = await supabase
        .from('room_members')
        .select(`
          room_id,
          joined_at,
          rooms:room_id (
            id,
            name,
            invite_code,
            base_currency,
            created_by,
            created_at
          )
        `)
        .eq('user_id', userId)

      if (error) {
        console.error('Error fetching user rooms:', error)
        return { data: null, error }
      }

      // Extract rooms from the join result - handle nested room structure
      const rooms: Room[] = data?.map((item: { rooms: Room | Room[] }) => {
        // Handle both single room and array cases
        const roomData = Array.isArray(item.rooms) ? item.rooms[0] : item.rooms
        return roomData
      }).filter(Boolean) || []
      return { data: rooms, error: null }
    } catch (err) {
      console.error('Room service error:', err)
      return { data: null, error: err }
    }
  },

  async getUserRoom(userId: string) {
    try {
      const { data: rooms, error } = await this.getUserRooms(userId)

      if (error) return { data: null, error }

      // For now, return the first room (users can only be in one room initially)
      const room = rooms && rooms.length > 0 ? rooms[0] : null
      return { data: room, error: null }
    } catch (err) {
      console.error('Get user room error:', err)
      return { data: null, error: err }
    }
  },

  async createRoom(data: CreateRoomData, userId: string) {
    try {
      const inviteCode = generateRoomCode()

      // Create the room
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .insert({
          name: data.name,
          invite_code: inviteCode,
          base_currency: data.base_currency,
          created_by: userId
        })
        .select()
        .single()

      if (roomError) {
        console.error('Error creating room:', roomError)
        return { data: null, error: roomError }
      }

      // Add creator as a member
      const { error: memberError } = await supabase
        .from('room_members')
        .insert({
          room_id: room.id,
          user_id: userId
        })

      if (memberError) {
        console.error('Error adding room member:', memberError)
        return { data: null, error: memberError }
      }

      return { data: room, error: null }
    } catch (err) {
      console.error('Create room error:', err)
      return { data: null, error: err }
    }
  },

  async joinRoom(data: JoinRoomData, userId: string) {
    try {
      // Find room by invite code
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('invite_code', data.invite_code.toUpperCase())
        .single()

      if (roomError) {
        console.error('Error finding room:', roomError)
        return { data: null, error: { message: 'Invalid invite code' } }
      }

      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from('room_members')
        .select('*')
        .eq('room_id', room.id)
        .eq('user_id', userId)
        .single()

      if (existingMember) {
        return { data: room, error: null } // Already a member
      }

      // Add user as member
      const { error: memberError } = await supabase
        .from('room_members')
        .insert({
          room_id: room.id,
          user_id: userId
        })

      if (memberError) {
        console.error('Error joining room:', memberError)
        return { data: null, error: memberError }
      }

      return { data: room, error: null }
    } catch (err) {
      console.error('Join room error:', err)
      return { data: null, error: err }
    }
  },

  async getRoomMembers(roomId: string) {
    try {
      const { data, error } = await supabase
        .from('room_members')
        .select(`
          room_id,
          user_id,
          joined_at,
          profile:profiles (
            id,
            full_name,
            avatar_url,
            created_at
          )
        `)
        .eq('room_id', roomId)

      if (error) {
        console.error('Error fetching room members:', error)
        return { data: null, error }
      }

      return { data: data as unknown as RoomMember[], error: null }
    } catch (err) {
      console.error('Get room members error:', err)
      return { data: null, error: err }
    }
  }
}

export const billService: BillService = {
  async getRoomBills(roomId: string) {
    try {
      const { data, error } = await supabase
        .from('bills')
        .select(`
          *,
          participants:bill_participants (
            user_id,
            profile:profiles (
              id,
              full_name,
              avatar_url
            )
          ),
          payers:bill_payers (
            user_id,
            amount_paid,
            profile:profiles (
              id,
              full_name,
              avatar_url
            )
          ),
          settlements:bill_settlements (
            id,
            from_user,
            to_user,
            amount,
            method,
            note,
            settled_at,
            from_profile:profiles!bill_settlements_from_user_fkey (
              id,
              full_name,
              avatar_url
            ),
            to_profile:profiles!bill_settlements_to_user_fkey (
              id,
              full_name,
              avatar_url
            )
          )
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching room bills:', error)
        return { data: null, error }
      }

      return { data: data as unknown as Bill[], error: null }
    } catch (err) {
      console.error('Get room bills error:', err)
      return { data: null, error: err }
    }
  },

  async getUserPosition(roomId: string, userId: string) {
    try {
      // First get all bill IDs for the room
      const { data: billIds, error: billError } = await supabase
        .from('bills')
        .select('id')
        .eq('room_id', roomId)

      if (billError) {
        console.error('Error fetching bill IDs:', billError)
        return { data: null, error: billError }
      }

      const billIdArray = billIds?.map(bill => bill.id) || []

      const { data, error } = await supabase
        .from('v_unified_bill_user_position')
        .select('*')
        .eq('user_id', userId)
        .in('bill_id', billIdArray)

      if (error) {
        console.error('Error fetching user position:', error)
        return { data: null, error }
      }

      return { data: data as unknown as BillUserPosition[], error: null }
    } catch (err) {
      console.error('Get user position error:', err)
      return { data: null, error: err }
    }
  },

  async getUserOverallNet(roomId: string, userId: string) {
    try {
      const { data, error } = await supabase
        .from('v_room_overall_net')
        .select('*')
        .eq('room_id', roomId)
        .eq('user_id', userId)
        .maybeSingle()

      if (error) {
        console.error('Error fetching user overall net:', error)
        return { data: null, error }
      }

      // Return default net value if no data (user has no bills yet)
      if (!data) {
        return {
          data: {
            room_id: roomId,
            user_id: userId,
            overall_net: 0
          } as unknown as RoomOverallNet,
          error: null
        }
      }

      return { data: data as unknown as RoomOverallNet, error: null }
    } catch (err) {
      console.error('Get user overall net error:', err)
      return { data: null, error: err }
    }
  },

  async getBillDetails(billId: string) {
    try {
      const { data, error } = await supabase
        .from('bills')
        .select(`
          *,
          participants:bill_participants (
            user_id,
            profile:profiles (
              id,
              full_name,
              avatar_url
            )
          ),
          payers:bill_payers (
            user_id,
            amount_paid,
            profile:profiles (
              id,
              full_name,
              avatar_url
            )
          ),
          settlements:bill_settlements (
            id,
            from_user,
            to_user,
            amount,
            method,
            note,
            settled_at,
            from_profile:profiles!bill_settlements_from_user_fkey (
              id,
              full_name,
              avatar_url
            ),
            to_profile:profiles!bill_settlements_to_user_fkey (
              id,
              full_name,
              avatar_url
            )
          ),
          receipts:bill_receipts (
            id,
            file_url,
            uploaded_at
          )
        `)
        .eq('id', billId)
        .single()

      if (error) {
        console.error('Error fetching bill details:', error)
        return { data: null, error }
      }

      return { data: data as unknown as Bill, error: null }
    } catch (err) {
      console.error('Get bill details error:', err)
      return { data: null, error: err }
    }
  },

  async getRoomStatistics(roomId: string) {
    try {
      // Get bills count and totals
      const { data: billsData, error: billsError } = await supabase
        .from('bills')
        .select('id, total_amount, status, currency')
        .eq('room_id', roomId)

      if (billsError) {
        console.error('Error fetching bills for statistics:', billsError)
        return { data: null, error: billsError }
      }

      // Get room members count
      const { count: membersCount, error: membersError } = await supabase
        .from('room_members')
        .select('*', { count: 'exact', head: true })
        .eq('room_id', roomId)

      if (membersError) {
        console.error('Error fetching members count:', membersError)
        return { data: null, error: membersError }
      }

      // Get room currency
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('base_currency')
        .eq('id', roomId)
        .single()

      if (roomError) {
        console.error('Error fetching room currency:', roomError)
        return { data: null, error: roomError }
      }

      // Calculate statistics with edge case handling
      const bills = billsData || []
      const totalBills = bills.length
      const totalAmount = bills.reduce((sum, bill) => sum + Number(bill.total_amount), 0)
      const settledBills = bills.filter(bill => bill.status === 'settled').length
      const openBills = bills.filter(bill => bill.status === 'open').length

      const statistics: RoomStatistics = {
        total_bills: totalBills,
        total_amount: totalAmount,
        settled_bills: settledBills,
        open_bills: openBills,
        total_members: membersCount || 0,
        currency: roomData?.base_currency || 'PKR'
      }

      return { data: statistics, error: null }
    } catch (err) {
      console.error('Get room statistics error:', err)
      return { data: null, error: err }
    }
  },

  async getRecentActivity(roomId: string, limit: number = 10) {
    try {
      const activities: ActivityItem[] = []

      // Get recent bills
      const { data: billsData, error: billsError } = await supabase
        .from('bills')
        .select(`
          id,
          title,
          total_amount,
          currency,
          bill_date,
          status,
          created_by,
          created_at
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: false })
        .limit(Math.ceil(limit / 2))

      if (billsError) {
        console.error('Error fetching bills for activity:', billsError)
      } else if (billsData) {
        billsData.forEach(bill => {
          activities.push({
            id: `bill-${bill.id}`,
            type: 'bill',
            date: bill.created_at,
            bill: bill as unknown as Bill
          })
        })
      }

      // Get recent settlements - using a different approach to filter by room
      const { data: roomBillIds } = await supabase
        .from('bills')
        .select('id')
        .eq('room_id', roomId)

      let settlementsData = null
      let settlementsError = null

      if (roomBillIds && roomBillIds.length > 0) {
        const billIds = roomBillIds.map(bill => bill.id)

        const { data, error } = await supabase
          .from('bill_settlements')
          .select(`
            id,
            amount,
            method,
            settled_at,
            bill_id,
            from_profile:profiles!bill_settlements_from_user_fkey (
              id,
              full_name,
              avatar_url
            ),
            to_profile:profiles!bill_settlements_to_user_fkey (
              id,
              full_name,
              avatar_url
            ),
            bill:bills (
              title,
              currency
            )
          `)
          .in('bill_id', billIds)
          .order('settled_at', { ascending: false })
          .limit(Math.ceil(limit / 2))

        settlementsData = data
        settlementsError = error
      }

      if (settlementsError) {
        console.error('Error fetching settlements for activity:', settlementsError)
      } else if (settlementsData) {
        settlementsData.forEach(settlement => {
          activities.push({
            id: `settlement-${settlement.id}`,
            type: 'settlement',
            date: settlement.settled_at,
            settlement: {
              ...settlement,
              from_user: settlement.from_profile?.[0]?.id || '',
              to_user: settlement.to_profile?.[0]?.id || '',
              method: settlement.method as PaymentMethod,
              note: undefined
            } as unknown as BillSettlement & {
              bill: Pick<Bill, 'title' | 'currency'>
              from_profile?: { id: string; full_name: string; avatar_url?: string }
              to_profile?: { id: string; full_name: string; avatar_url?: string }
            }
          })
        })
      }

      // Sort by date and limit
      activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      const limitedActivities = activities.slice(0, limit)

      return { data: limitedActivities, error: null }
    } catch (err) {
      console.error('Get recent activity error:', err)
      return { data: [], error: err }
    }
  },

  async createBill(data: CreateBillData, userId: string) {
    try {
      // Start a transaction-like operation by creating the bill first
      const { data: bill, error: billError } = await supabase
        .from('bills')
        .insert({
          room_id: data.room_id,
          title: data.title,
          total_amount: data.total_amount,
          currency: data.currency,
          bill_date: data.bill_date,
          created_by: userId,
          status: 'open'
        })
        .select()
        .single()

      if (billError) {
        console.error('Error creating bill:', billError)
        return { data: null, error: billError }
      }

      // Add participants
      const participantInserts = data.participants.map(participantId => ({
        bill_id: bill.id,
        user_id: participantId
      }))

      const { error: participantsError } = await supabase
        .from('bill_participants')
        .insert(participantInserts)

      if (participantsError) {
        console.error('Error adding participants:', participantsError)
        // Clean up: delete the bill if participants failed
        await supabase.from('bills').delete().eq('id', bill.id)
        return { data: null, error: participantsError }
      }

      // Add payers (only those with amount > 0)
      const payerInserts = data.payers
        .filter(payer => payer.amount_paid > 0)
        .map(payer => ({
          bill_id: bill.id,
          user_id: payer.user_id,
          amount_paid: payer.amount_paid
        }))

      if (payerInserts.length > 0) {
        const { error: payersError } = await supabase
          .from('bill_payers')
          .insert(payerInserts)

        if (payersError) {
          console.error('Error adding payers:', payersError)
          // Clean up: delete the bill and participants if payers failed
          await supabase.from('bill_participants').delete().eq('bill_id', bill.id)
          await supabase.from('bills').delete().eq('id', bill.id)
          return { data: null, error: payersError }
        }
      }

      // Fetch the complete bill with relations
      const { data: completeBill, error: fetchError } = await this.getBillDetails(bill.id)

      if (fetchError) {
        console.error('Error fetching complete bill:', fetchError)
        return { data: bill as unknown as Bill, error: null } // Return basic bill if fetch fails
      }

      return { data: completeBill, error: null }
    } catch (err) {
      console.error('Create bill error:', err)
      return { data: null, error: err }
    }
  },

  async createSettlement(data: CreateSettlementData) {
    try {
      // Create the settlement record
      const { data: settlement, error: settlementError } = await supabase
        .from('bill_settlements')
        .insert({
          bill_id: data.bill_id,
          from_user: data.from_user,
          to_user: data.to_user,
          amount: data.amount,
          method: data.method,
          note: data.note
        })
        .select()
        .single()

      if (settlementError) {
        console.error('Error creating settlement:', settlementError)
        return { data: null, error: settlementError }
      }

      // Update bill status based on settlement completion
      await this.updateBillStatus(data.bill_id)

      // Fetch the complete settlement with relationships
      const { data: completeSettlement, error: fetchError } = await supabase
        .from('bill_settlements')
        .select(`
          *,
          from_profile:profiles!bill_settlements_from_user_fkey (
            id,
            full_name,
            avatar_url
          ),
          to_profile:profiles!bill_settlements_to_user_fkey (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('id', settlement.id)
        .single()

      if (fetchError) {
        console.error('Error fetching complete settlement:', fetchError)
        return { data: settlement as unknown as BillSettlement, error: null }
      }

      return { data: completeSettlement as unknown as BillSettlement, error: null }
    } catch (err) {
      console.error('Create settlement error:', err)
      return { data: null, error: err }
    }
  },

  async getSettlementOpportunities(roomId: string, userId: string) {
    try {
      // Get user's position on all bills where they owe money
      const { data: userPositions, error: positionsError } = await this.getUserPosition(roomId, userId)

      if (positionsError) {
        console.error('Error fetching user positions:', positionsError)
        return { data: null, error: positionsError }
      }

      if (!userPositions) {
        return { data: [], error: null }
      }

      // Filter bills where user owes money (negative net_after_settlement)
      const billsOwed = userPositions.filter(position => position.net_after_settlement < 0)

      // Get all user positions for the room to find creditors
      const { data: allUserPositions, error: allPositionsError } = await supabase
        .from('v_unified_bill_user_position')
        .select('*')
        .in('bill_id', billsOwed.map(b => b.bill_id))

      if (allPositionsError) {
        console.error('Error fetching all user positions:', allPositionsError)
        return { data: null, error: allPositionsError }
      }

      const opportunities: SettlementOpportunity[] = []

      for (const position of billsOwed) {
        // Get bill details for title and currency
        const { data: bill, error: billError } = await this.getBillDetails(position.bill_id)

        if (billError || !bill) {
          console.error('Error fetching bill details:', billError)
          continue
        }

        // Find creditors for this bill (people with positive net_after_settlement)
        const creditors = allUserPositions
          ?.filter(p =>
            p.bill_id === position.bill_id &&
            p.user_id !== userId &&
            p.net_after_settlement > 0
          )
          .sort((a, b) => b.net_after_settlement - a.net_after_settlement) || []

        const recipients = []
        let remainingDebt = Math.abs(position.net_after_settlement)

        for (const creditor of creditors) {
          if (remainingDebt <= 0) break

          const amountToReceive = Math.min(creditor.net_after_settlement, remainingDebt)

          if (amountToReceive > 0) {
            // Get creditor's profile info
            const creditorProfile = bill.participants?.find(p => p.user_id === creditor.user_id)?.profile ||
                                  bill.payers?.find(p => p.user_id === creditor.user_id)?.profile

            recipients.push({
              user_id: creditor.user_id,
              user_name: creditorProfile?.full_name || 'User',
              amount_to_receive: amountToReceive
            })
            remainingDebt -= amountToReceive
          }
        }

        if (recipients.length > 0) {
          opportunities.push({
            bill_id: position.bill_id,
            bill_title: bill.title,
            currency: bill.currency,
            amount_owed: Math.abs(position.net_after_settlement),
            recipients
          })
        }
      }

      return { data: opportunities, error: null }
    } catch (err) {
      console.error('Get settlement opportunities error:', err)
      return { data: null, error: err }
    }
  },

  async updateBillStatus(billId: string) {
    try {
      // Get all user positions for this bill using the database view
      const { data: userPositions, error: positionsError } = await supabase
        .from('v_bill_user_position')
        .select('*')
        .eq('bill_id', billId)

      if (positionsError) {
        console.error('Error fetching user positions for bill status update:', positionsError)
        return { data: null, error: positionsError }
      }

      // Get current bill details
      const { data: billDetails, error: billError } = await this.getBillDetails(billId)

      if (billError || !billDetails) {
        console.error('Error fetching bill for status update:', billError)
        return { data: null, error: billError }
      }

      // Check if bill is fully settled using the database view
      // Anyone with negative net_after_settlement still owes money
      const hasOutstandingDebts = userPositions?.some(position => position.net_after_settlement < -0.01) || false
      const hasSettlements = billDetails.settlements && billDetails.settlements.length > 0

      // Determine new status
      let newStatus: 'open' | 'partially_settled' | 'settled'
      if (!hasOutstandingDebts) {
        newStatus = 'settled'
      } else if (hasSettlements) {
        newStatus = 'partially_settled'
      } else {
        newStatus = 'open'
      }

      // Update bill status if it changed
      if (newStatus !== billDetails.status) {
        const { data: updatedBill, error: updateError } = await supabase
          .from('bills')
          .update({ status: newStatus })
          .eq('id', billId)
          .select()
          .single()

        if (updateError) {
          console.error('Error updating bill status:', updateError)
          return { data: null, error: updateError }
        }

        return { data: updatedBill as unknown as Bill, error: null }
      }

      return { data: billDetails, error: null }
    } catch (err) {
      console.error('Update bill status error:', err)
      return { data: null, error: err }
    }
  },

  async createAdvancedBill(data: CreateAdvanceBillData, userId: string) {
    try {
      // Import BillCalculator and utils
      const { BillCalculator } = await import('@/lib/bill-calculator')
      const { toPaisa } = await import('@/lib/paisa-utils')

      // Calculate total bill amount from items and extras
      const itemsTotal = data.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      const extrasTotal = data.extras.reduce((sum, extra) => sum + extra.amount, 0)
      const totalAmount = itemsTotal + extrasTotal

      // Use BillCalculator to compute accurate balances
      const calculatorInput = {
        items: data.items.map(item => ({
          userId: item.user_id,
          itemName: item.item_name,
          pricePaisa: toPaisa(item.price),
          quantity: item.quantity
        })),
        extras: data.extras.map(extra => ({
          type: extra.extra_type,
          name: extra.name,
          amountPaisa: toPaisa(extra.amount),
          splitRule: extra.split_rule
        })),
        payers: data.payers.map(payer => ({
          userId: payer.user_id,
          amountPaidPaisa: toPaisa(payer.amount_paid),
          coverageType: payer.coverage_type,
          coverageTargets: payer.coverage_targets,
          coverageWeights: payer.coverage_weights ? new Map(Object.entries(payer.coverage_weights)) : undefined
        })),
        participants: data.participants
      }

      const calculationResult = BillCalculator.calculate(calculatorInput)

      // Create the main bill record
      const { data: bill, error: billError } = await supabase
        .from('bills')
        .insert({
          room_id: data.room_id,
          title: data.title,
          total_amount: totalAmount,
          currency: 'PKR', // Always PKR for now
          bill_date: data.bill_date,
          created_by: userId,
          status: 'open',
          is_advanced: true
        })
        .select()
        .single()

      if (billError) {
        console.error('Error creating advanced bill:', billError)
        return { data: null, error: billError }
      }

      // Insert bill participants
      const participantInserts = data.participants.map(participantId => ({
        bill_id: bill.id,
        user_id: participantId
      }))

      const { error: participantsError } = await supabase
        .from('bill_participants')
        .insert(participantInserts)

      if (participantsError) {
        console.error('Error adding participants:', participantsError)
        await supabase.from('bills').delete().eq('id', bill.id)
        return { data: null, error: participantsError }
      }

      // Insert bill payers
      const payerInserts = data.payers.map(payer => ({
        bill_id: bill.id,
        user_id: payer.user_id,
        amount_paid: payer.amount_paid
      }))

      const { error: payersError } = await supabase
        .from('bill_payers')
        .insert(payerInserts)

      if (payersError) {
        console.error('Error adding payers:', payersError)
        await supabase.from('bill_participants').delete().eq('bill_id', bill.id)
        await supabase.from('bills').delete().eq('id', bill.id)
        return { data: null, error: payersError }
      }

      // Insert bill items
      const itemInserts = data.items.map(item => ({
        bill_id: bill.id,
        user_id: item.user_id,
        item_name: item.item_name,
        price_paisa: toPaisa(item.price),
        quantity: item.quantity
      }))

      const { error: itemsError } = await supabase
        .from('bill_items')
        .insert(itemInserts)

      if (itemsError) {
        console.error('Error adding bill items:', itemsError)
        // Clean up previous inserts
        await supabase.from('bill_payers').delete().eq('bill_id', bill.id)
        await supabase.from('bill_participants').delete().eq('bill_id', bill.id)
        await supabase.from('bills').delete().eq('id', bill.id)
        return { data: null, error: itemsError }
      }

      // Insert bill extras if any
      if (data.extras.length > 0) {
        const extrasInserts = data.extras.map(extra => ({
          bill_id: bill.id,
          extra_type: extra.extra_type,
          name: extra.name,
          amount_paisa: toPaisa(extra.amount),
          split_rule: extra.split_rule
        }))

        const { error: extrasError } = await supabase
          .from('bill_extras')
          .insert(extrasInserts)

        if (extrasError) {
          console.error('Error adding bill extras:', extrasError)
          // Clean up previous inserts
          await supabase.from('bill_items').delete().eq('bill_id', bill.id)
          await supabase.from('bill_payers').delete().eq('bill_id', bill.id)
          await supabase.from('bill_participants').delete().eq('bill_id', bill.id)
          await supabase.from('bills').delete().eq('bill_id', bill.id)
          return { data: null, error: extrasError }
        }
      }

      // Insert calculated balances
      const calculationInserts = data.participants.map(userId => {
        const userBalance = calculationResult.userBalances.get(userId)
        return {
          bill_id: bill.id,
          user_id: userId,
          owed_paisa: userBalance?.owedPaisa || 0,
          covered_paisa: userBalance?.coveredPaisa || 0,
          net_paisa: userBalance?.netPaisa || 0,
          remaining_paisa: userBalance?.remainingPaisa || userBalance?.netPaisa || 0
        }
      })

      const { error: calculationsError } = await supabase
        .from('bill_calculations')
        .insert(calculationInserts)

      if (calculationsError) {
        console.error('Error adding bill calculations:', calculationsError)
        // Clean up previous inserts
        await supabase.from('bill_extras').delete().eq('bill_id', bill.id)
        await supabase.from('bill_items').delete().eq('bill_id', bill.id)
        await supabase.from('bill_payers').delete().eq('bill_id', bill.id)
        await supabase.from('bill_participants').delete().eq('bill_id', bill.id)
        await supabase.from('bills').delete().eq('id', bill.id)
        return { data: null, error: calculationsError }
      }

      // Insert suggested transfers
      if (calculationResult.suggestedTransfers.length > 0) {
        const transferInserts = calculationResult.suggestedTransfers.map(transfer => ({
          bill_id: bill.id,
          from_user_id: transfer.fromUserId,
          to_user_id: transfer.toUserId,
          amount_paisa: transfer.amountPaisa
        }))

        const { error: transfersError } = await supabase
          .from('bill_suggested_transfers')
          .insert(transferInserts)

        if (transfersError) {
          console.error('Error adding suggested transfers:', transfersError)
          // Note: Not cleaning up here as transfers are optional
        }
      }

      // Fetch the complete bill with relations
      const { data: completeBill, error: fetchError } = await this.getBillDetails(bill.id)

      if (fetchError) {
        console.error('Error fetching complete advanced bill:', fetchError)
        return { data: bill as unknown as Bill, error: null }
      }

      return { data: completeBill, error: null }
    } catch (err) {
      console.error('Create advanced bill error:', err)
      return { data: null, error: err }
    }
  },

  async getAdvancedBillCalculations(billId: string) {
    try {
      // Get bill details first
      const { data: billDetails, error: billError } = await supabase
        .from('bills')
        .select('*')
        .eq('id', billId)
        .eq('is_advanced', true)
        .single()

      if (billError || !billDetails) {
        console.error('Error fetching advanced bill:', billError)
        return { data: null, error: billError || 'Bill not found' }
      }

      // Get user calculations
      const { data: calculations, error: calculationsError } = await supabase
        .from('v_bill_balance_summary')
        .select('*')
        .eq('bill_id', billId)

      if (calculationsError) {
        console.error('Error fetching bill calculations:', calculationsError)
        return { data: null, error: calculationsError }
      }

      // Get suggested transfers
      const { data: transfers, error: transfersError } = await supabase
        .from('bill_suggested_transfers')
        .select(`
          *,
          from_profile:profiles!bill_suggested_transfers_from_user_id_fkey(
            id,
            full_name,
            avatar_url
          ),
          to_profile:profiles!bill_suggested_transfers_to_user_id_fkey(
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('bill_id', billId)

      if (transfersError) {
        console.error('Error fetching suggested transfers:', transfersError)
        return { data: null, error: transfersError }
      }

      // Get bill items for detailed breakdown
      const { data: items, error: itemsError } = await supabase
        .from('v_user_bill_items')
        .select('*')
        .eq('bill_id', billId)

      if (itemsError) {
        console.error('Error fetching bill items:', itemsError)
        // Continue without items as they're for detail only
      }

      // Transform data to AdvanceBillPreview format
      const preview: AdvanceBillPreview = {
        items_total_paisa: calculations?.reduce((sum, calc) => {
          const userItems = items?.filter(item => item.user_id === calc.user_id) || []
          return sum + userItems.reduce((itemSum, item) => itemSum + item.total_paisa, 0)
        }, 0) || 0,
        extras_total_paisa: (billDetails.total_amount * 100) - (calculations?.reduce((sum, calc) => {
          const userItems = items?.filter(item => item.user_id === calc.user_id) || []
          return sum + userItems.reduce((itemSum, item) => itemSum + item.total_paisa, 0)
        }, 0) || 0),
        bill_total_paisa: Math.round(billDetails.total_amount * 100),
        paid_total_paisa: calculations?.reduce((sum, calc) => sum + calc.covered_paisa, 0) || 0,
        user_breakdowns: calculations?.map(calc => ({
          user_id: calc.user_id,
          user_name: calc.full_name,
          items_paisa: items?.filter(item => item.user_id === calc.user_id)
            .reduce((sum, item) => sum + item.total_paisa, 0) || 0,
          extras_share_paisa: calc.owed_paisa - (items?.filter(item => item.user_id === calc.user_id)
            .reduce((sum, item) => sum + item.total_paisa, 0) || 0),
          total_owed_paisa: calc.owed_paisa,
          covered_paisa: calc.covered_paisa,
          net_paisa: calc.net_paisa,
          items_detail: items?.filter(item => item.user_id === calc.user_id).map(item => ({
            item_name: item.item_name,
            price: item.total_amount / item.quantity,
            quantity: item.quantity,
            user_id: item.user_id
          })) || [],
          extras_detail: [] // TODO: Add extras detail if needed
        })) || [],
        suggested_transfers: transfers?.map(transfer => ({
          from_user_id: transfer.from_user_id,
          to_user_id: transfer.to_user_id,
          amount_paisa: transfer.amount_paisa,
          from_profile: transfer.from_profile?.[0] || undefined,
          to_profile: transfer.to_profile?.[0] || undefined
        })) || [],
        is_balanced: calculations?.every(calc => Math.abs(calc.remaining_paisa) <= 100) || false,
        validation_errors: []
      }

      return { data: preview, error: null }
    } catch (err) {
      console.error('Get advanced bill calculations error:', err)
      return { data: null, error: err }
    }
  }
}

// Profile update data types
export interface UpdateProfileData {
  full_name?: string
  avatar_url?: string
}

// Profile Service Interface
export interface ProfileService {
  updateProfile: (userId: string, data: UpdateProfileData) => Promise<{ data: User | null; error: unknown }>
  uploadAvatar: (userId: string, file: File) => Promise<{ data: string | null; error: unknown }>
  deleteAvatar: (userId: string) => Promise<{ error: unknown }>
}

// Room Details Service Interface
export interface RoomDetailsService {
  getRoomDetails: (roomId: string) => Promise<{ data: RoomDetails | null; error: unknown }>
}

export interface RoomDetails extends Room {
  members: (RoomMember & { profile: User })[]
  memberCount: number
  createdByProfile?: User
}

// Profile Service Implementation
export const profileService: ProfileService = {
  async updateProfile(userId: string, data: UpdateProfileData) {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        console.error('Error updating profile:', error)
        return { data: null, error }
      }

      return { data: profile as User, error: null }
    } catch (err) {
      console.error('Update profile error:', err)
      return { data: null, error: err }
    }
  },

  async uploadAvatar(userId: string, file: File) {
    try {
      // Get current profile to check for existing avatar
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', userId)
        .single()

      // Create a unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}-${Date.now()}.${fileExt}`
      const filePath = fileName

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Error uploading avatar:', uploadError)
        return { data: null, error: uploadError }
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      if (!urlData?.publicUrl) {
        return { data: null, error: 'Failed to get avatar URL' }
      }


      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: urlData.publicUrl })
        .eq('id', userId)

      if (updateError) {
        console.error('Error updating profile with avatar URL:', updateError)
        return { data: null, error: updateError }
      }


      // Delete old avatar if it exists
      if (currentProfile?.avatar_url) {
        const oldFileName = currentProfile.avatar_url.split('/').pop()
        console.log('Old avatar URL:', currentProfile.avatar_url)
        console.log('Extracted old filename:', oldFileName)
        console.log('New filename:', fileName)

        if (oldFileName && oldFileName !== fileName) {
          console.log('Deleting old avatar:', oldFileName)
          const { error: deleteError } = await supabase.storage
            .from('avatars')
            .remove([oldFileName])

          if (deleteError) {
            console.error('Error deleting old avatar:', deleteError)
          } else {
            console.log('Old avatar deleted successfully')
          }
        } else {
          console.log('Skipping deletion - same filename or no old filename')
        }
      }

      return { data: urlData.publicUrl, error: null }
    } catch (err) {
      console.error('Upload avatar error:', err)
      return { data: null, error: err }
    }
  },

  async deleteAvatar(userId: string) {
    try {
      // Get current profile to find existing avatar
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', userId)
        .single()

      if (profileError) {
        return { error: profileError }
      }

      // Remove avatar URL from profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', userId)

      if (updateError) {
        console.error('Error removing avatar URL from profile:', updateError)
        return { error: updateError }
      }

      // If there was an avatar file, try to delete it from storage
      if (profile.avatar_url) {
        const fileName = profile.avatar_url.split('/').pop()
        console.log('Delete avatar - Full URL:', profile.avatar_url)
        console.log('Delete avatar - Extracted filename:', fileName)

        if (fileName) {
          console.log('Attempting to delete avatar file:', fileName)
          const { error: deleteError } = await supabase.storage
            .from('avatars')
            .remove([fileName])

          if (deleteError) {
            console.error('Error deleting avatar file:', deleteError)
          } else {
            console.log('Avatar file deleted successfully from storage')
          }
        } else {
          console.log('No filename extracted from URL')
        }
      } else {
        console.log('No avatar URL found in profile')
      }

      return { error: null }
    } catch (err) {
      console.error('Delete avatar error:', err)
      return { error: err }
    }
  }
}

// Room Details Service Implementation
export const roomDetailsService: RoomDetailsService = {
  async getRoomDetails(roomId: string) {
    try {
      // Get room details
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .select(`
          *,
          created_by_profile:profiles!rooms_created_by_fkey(*)
        `)
        .eq('id', roomId)
        .single()

      if (roomError) {
        console.error('Error fetching room:', roomError)
        return { data: null, error: roomError }
      }

      // Get room members with profiles
      const { data: members, error: membersError } = await supabase
        .from('room_members')
        .select(`
          *,
          profile:profiles(*)
        `)
        .eq('room_id', roomId)
        .order('joined_at', { ascending: true })

      if (membersError) {
        console.error('Error fetching room members:', membersError)
        return { data: null, error: membersError }
      }

      const roomDetails: RoomDetails = {
        ...room,
        members: members as (RoomMember & { profile: User })[],
        memberCount: members.length,
        createdByProfile: room.created_by_profile?.[0] as User
      }

      return { data: roomDetails, error: null }
    } catch (err) {
      console.error('Get room details error:', err)
      return { data: null, error: err }
    }
  }
}