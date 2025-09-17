export type PaymentMethod = 'cash' | 'mobile_wallet' | 'bank_transfer' | 'card'
export type BillStatus = 'open' | 'partially_settled' | 'settled'
export type RoomCurrency = 'PKR' | 'USD' | 'EUR'
export type RecurrenceFreq = 'none' | 'weekly' | 'monthly'

export interface User {
  id: string
  full_name: string
  avatar_url?: string
  created_at: string
}

export interface Room {
  id: string
  name: string
  invite_code: string
  base_currency: RoomCurrency
  created_by?: string
  created_at: string
}

export interface RoomMember {
  room_id: string
  user_id: string
  joined_at?: string
  profile?: User
}

export interface Bill {
  id: string
  room_id: string
  title: string
  total_amount: number
  currency: RoomCurrency
  bill_date: string
  status: BillStatus
  created_by?: string
  created_at: string
  participants?: BillParticipant[]
  payers?: BillPayer[]
  settlements?: BillSettlement[]
  receipts?: BillReceipt[]
}

export interface BillParticipant {
  bill_id: string
  user_id: string
  profile?: User
}

export interface BillPayer {
  bill_id: string
  user_id: string
  amount_paid: number
  profile?: User
}

export interface BillSettlement {
  id: string
  bill_id: string
  from_user: string
  to_user: string
  amount: number
  method: PaymentMethod
  note?: string
  settled_at: string
  from_profile?: User
  to_profile?: User
}

export interface BillReceipt {
  id: string
  bill_id: string
  file_url: string
  uploaded_at: string
}

export interface BillUserPosition {
  bill_id: string
  user_id: string
  share_amount: number
  amount_paid: number
  incoming_settlements: number
  outgoing_settlements: number
  net_before_settlement: number
  net_after_settlement: number
}

export interface RoomOverallNet {
  room_id: string
  user_id: string
  overall_net: number
}

export interface CreateBillData {
  title: string
  total_amount: number
  currency: RoomCurrency
  bill_date: string
  room_id: string
  participants: string[]
  payers: { user_id: string; amount_paid: number }[]
}

export interface CreateSettlementData {
  bill_id: string
  from_user: string
  to_user: string
  amount: number
  method: PaymentMethod
  note?: string
}

export interface CreateRoomData {
  name: string
  base_currency: RoomCurrency
}

export interface JoinRoomData {
  invite_code: string
}