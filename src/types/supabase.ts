export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string
          store_id: number
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
          store_id: number
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
          store_id?: number
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
          id: number
          user_id: string
          name: string | null
          slug: string | null
          description: string | null
          logo_url: string | null
          theme: string | null
          whatsapp: string | null
          telegram: string | null
          plan: string | null
          views: number
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          name?: string | null
          slug?: string | null
          description?: string | null
          logo_url?: string | null
          theme?: string | null
          whatsapp?: string | null
          telegram?: string | null
          plan?: string | null
          views?: number
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          name?: string | null
          slug?: string | null
          description?: string | null
          logo_url?: string | null
          theme?: string | null
          whatsapp?: string | null
          telegram?: string | null
          plan?: string | null
          views?: number
          created_at?: string
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
