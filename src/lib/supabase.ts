import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          full_name: string
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          avatar_url?: string | null
          created_at?: string
        }
      }
      rooms: {
        Row: {
          id: string
          name: string
          invite_code: string
          base_currency: 'PKR' | 'USD' | 'EUR'
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          invite_code: string
          base_currency?: 'PKR' | 'USD' | 'EUR'
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          invite_code?: string
          base_currency?: 'PKR' | 'USD' | 'EUR'
          created_by?: string | null
          created_at?: string
        }
      }
      room_members: {
        Row: {
          room_id: string
          user_id: string
          joined_at: string | null
        }
        Insert: {
          room_id: string
          user_id: string
          joined_at?: string | null
        }
        Update: {
          room_id?: string
          user_id?: string
          joined_at?: string | null
        }
      }
      bills: {
        Row: {
          id: string
          room_id: string
          title: string
          total_amount: number
          currency: 'PKR' | 'USD' | 'EUR'
          bill_date: string
          status: 'open' | 'partially_settled' | 'settled'
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          title: string
          total_amount: number
          currency?: 'PKR' | 'USD' | 'EUR'
          bill_date?: string
          status?: 'open' | 'partially_settled' | 'settled'
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          title?: string
          total_amount?: number
          currency?: 'PKR' | 'USD' | 'EUR'
          bill_date?: string
          status?: 'open' | 'partially_settled' | 'settled'
          created_by?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      payment_method: 'cash' | 'mobile_wallet' | 'bank_transfer' | 'card'
      bill_status: 'open' | 'partially_settled' | 'settled'
      room_currency: 'PKR' | 'USD' | 'EUR'
      recurrence_freq: 'none' | 'weekly' | 'monthly'
    }
  }
}