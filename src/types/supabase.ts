export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string
          store_id: string
          name: string
          description: string | null
          tags: string[]
          image_url: string | null
          price: number
          discount: number
          sale_price: number | null
          views: number
          created_at: string
        }
        Insert: {
          id?: string
          store_id: string
          name: string
          description?: string | null
          tags?: string[]
          image_url?: string | null
          price: number
          discount?: number
          sale_price?: number | null
          views?: number
          created_at?: string
        }
        Update: {
          id?: string
          store_id?: string
          name?: string
          description?: string | null
          tags?: string[]
          image_url?: string | null
          price?: number
          discount?: number
          sale_price?: number | null
          views?: number
          created_at?: string
        }
        Relationships: []
      }
      stores: {
        Row: {
          id: string
          user_id: string
          name: string | null
          slug: string | null
          description: string | null
          logo_url: string | null
          banner_url: string | null
          theme: string | null
          whatsapp: string | null
          telegram: string | null
          plan: string | null
          subscription_status: string | null
          subscription_expires_at: string | null
          subscription_started_at: string | null
          views: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name?: string | null
          slug?: string | null
          description?: string | null
          logo_url?: string | null
          banner_url?: string | null
          theme?: string | null
          whatsapp?: string | null
          telegram?: string | null
          plan?: string | null
          subscription_status?: string | null
          subscription_expires_at?: string | null
          subscription_started_at?: string | null
          views?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string | null
          slug?: string | null
          description?: string | null
          logo_url?: string | null
          banner_url?: string | null
          theme?: string | null
          whatsapp?: string | null
          telegram?: string | null
          plan?: string | null
          subscription_status?: string | null
          subscription_expires_at?: string | null
          subscription_started_at?: string | null
          views?: number
          created_at?: string
        }
        Relationships: []
      }
      store_subscriptions_private: {
        Row: {
          store_id: string
          payment_method_id: string | null
          last_payment_id: string | null
          last_payment_status: string | null
          last_payment_at: string | null
          failed_attempts: number
          last_failure_at: string | null
          cancellation_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          store_id: string
          payment_method_id?: string | null
          last_payment_id?: string | null
          last_payment_status?: string | null
          last_payment_at?: string | null
          failed_attempts?: number
          last_failure_at?: string | null
          cancellation_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          store_id?: string
          payment_method_id?: string | null
          last_payment_id?: string | null
          last_payment_status?: string | null
          last_payment_at?: string | null
          failed_attempts?: number
          last_failure_at?: string | null
          cancellation_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscription_payments: {
        Row: {
          id: number
          store_id: string
          yookassa_payment_id: string
          payment_type: string
          status: string
          amount: number
          currency: string
          paid: boolean
          plan: string | null
          billing_interval: string | null
          period_start: string | null
          period_end: string | null
          paid_at: string | null
          processed_at: string | null
          payment_method_id: string | null
          failure_reason: string | null
          metadata: Json | null
          payload: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          store_id: string
          yookassa_payment_id: string
          payment_type: string
          status: string
          amount: number
          currency?: string
          paid?: boolean
          plan?: string | null
          billing_interval?: string | null
          period_start?: string | null
          period_end?: string | null
          paid_at?: string | null
          processed_at?: string | null
          payment_method_id?: string | null
          failure_reason?: string | null
          metadata?: Json | null
          payload?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          store_id?: string
          yookassa_payment_id?: string
          payment_type?: string
          status?: string
          amount?: number
          currency?: string
          paid?: boolean
          plan?: string | null
          billing_interval?: string | null
          period_start?: string | null
          period_end?: string | null
          paid_at?: string | null
          processed_at?: string | null
          payment_method_id?: string | null
          failure_reason?: string | null
          metadata?: Json | null
          payload?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
