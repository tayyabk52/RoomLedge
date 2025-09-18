export type PaymentMethod = 'cash' | 'mobile_wallet' | 'bank_transfer' | 'card'
export type BillStatus = 'open' | 'partially_settled' | 'settled'
export type RoomCurrency = 'PKR' | 'USD' | 'EUR'
export type RecurrenceFreq = 'none' | 'weekly' | 'monthly'

// Advanced Bill Types
export type ExtrasSplitRule = 'proportional' | 'flat' | 'payer_only'
export type ExtraType = 'tax' | 'service' | 'tip' | 'delivery' | 'other'

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
  is_advanced?: boolean
  participants?: BillParticipant[]
  payers?: BillPayer[]
  settlements?: BillSettlement[]
  receipts?: BillReceipt[]
  // Advanced bill data
  items?: AdvanceBillItem[]
  extras?: AdvanceBillExtra[]
  coverage?: AdvanceBillCoverage[]
  calculations?: AdvanceBillCalculation[]
  suggested_transfers?: AdvanceBillSuggestedTransfer[]
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

// ===== ADVANCED BILL INTERFACES =====

export interface AdvanceBillItem {
  id?: string
  bill_id?: string
  user_id: string
  item_name: string
  price_paisa: number  // Price in paisa (PKR * 100)
  quantity: number
  created_at?: string
  profile?: User
}

export interface AdvanceBillExtra {
  id?: string
  bill_id?: string
  extra_type: ExtraType
  name: string
  amount_paisa: number  // Amount in paisa (PKR * 100)
  split_rule: ExtrasSplitRule
  created_at?: string
}

export interface AdvanceBillCoverage {
  id?: string
  bill_id?: string
  payer_user_id: string
  covered_user_id: string
  amount_paisa: number  // Amount in paisa (PKR * 100)
  created_at?: string
  payer_profile?: User
  covered_profile?: User
}

export interface AdvanceBillCalculation {
  bill_id: string
  user_id: string
  owed_paisa: number     // What they should pay
  covered_paisa: number  // What was paid for them at counter
  net_paisa: number      // covered - owed (+ means they're owed money)
  remaining_paisa: number // net + settlements received - settlements paid
  last_updated: string
  profile?: User
}

export interface AdvanceBillSuggestedTransfer {
  id?: string
  bill_id?: string
  from_user_id: string
  to_user_id: string
  amount_paisa: number  // Amount in paisa (PKR * 100)
  created_at?: string
  from_profile?: User
  to_profile?: User
}

// Form data interfaces for creating advanced bills
export interface CreateAdvanceBillData {
  title: string
  bill_date: string
  room_id: string
  participants: string[]
  items: AdvanceBillItemInput[]
  extras: AdvanceBillExtraInput[]
  payers: AdvanceBillPayerInput[]
}

export interface AdvanceBillItemInput {
  user_id: string
  item_name: string
  price: number  // Price in PKR (will be converted to paisa)
  quantity: number
}

export interface AdvanceBillExtraInput {
  extra_type: ExtraType
  name: string
  amount: number  // Amount in PKR (will be converted to paisa)
  split_rule: ExtrasSplitRule
}

export type CoverageType = 'proportional' | 'self_first' | 'specific' | 'custom'

export interface AdvanceBillPayerInput {
  user_id: string
  amount_paid: number  // Amount in PKR (will be converted to paisa)
  coverage_type?: CoverageType  // How to distribute this payment
  coverage_targets?: string[]  // If specified, this payer only covers these users
  coverage_weights?: { [userId: string]: number }  // Custom weights for coverage
}

// UI/Calculation interfaces
export interface AdvanceBillPreview {
  items_total_paisa: number
  extras_total_paisa: number
  bill_total_paisa: number
  paid_total_paisa: number
  user_breakdowns: AdvanceBillUserBreakdown[]
  suggested_transfers: AdvanceBillSuggestedTransfer[]
  is_balanced: boolean
  validation_errors: string[]
}

export interface AdvanceBillUserBreakdown {
  user_id: string
  user_name: string
  items_paisa: number
  extras_share_paisa: number
  total_owed_paisa: number
  covered_paisa: number
  net_paisa: number
  items_detail: AdvanceBillItemInput[]
  extras_detail: Array<{
    name: string
    share_paisa: number
    split_rule: ExtrasSplitRule
  }>
}

// Wizard step interfaces
export interface AdvanceBillWizardState {
  step: 'items' | 'extras' | 'payers' | 'preview'
  formData: CreateAdvanceBillData
  preview?: AdvanceBillPreview
  isValid: boolean
  errors: { [key: string]: string }
}

// Settlement extension for advanced bills
export interface AdvanceBillSettlement extends BillSettlement {
  clamped_amount?: number  // If amount was clamped to prevent over-settlement
  original_amount?: number // Original requested amount before clamping
}

// Export utility type for paisa calculations
export type Paisa = number  // Always represents integer paisa (PKR * 100)