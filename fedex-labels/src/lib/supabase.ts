import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      orders: {
        Row: {
          id: string
          user_id: string
          weight_kg: number
          price_usd: number
          status: 'pending_payment' | 'paid' | 'label_ready' | 'cancelled'
          stripe_session_id: string | null
          label_url: string | null
          recipient_name: string
          recipient_address: string
          recipient_city: string
          recipient_country: string
          recipient_zip: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['orders']['Insert']>
      }
    }
  }
}
