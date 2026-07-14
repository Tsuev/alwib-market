export interface Type {
  any: string
}

export interface Product {
  id: string // uuid from Supabase
  name: string
  description: string
  price: number
  salePrice: number | null
  tags: string[]
  photo: string | null
  views: number
}

export type Plan = 'free' | 'pro'
export type SubscriptionStatus = 'inactive' | 'active' | 'past_due'

export interface StoreData {
  id?: string // uuid from Supabase, undefined for unsaved stores
  name: string
  domain: string // maps to slug in DB
  description: string
  photo: string | null
  banner: string | null
  whatsapp: string | null
  telegram: string | null
  plan: Plan
  subscriptionStatus: SubscriptionStatus
  subscriptionExpiresAt: string | null
  views: number
}

export interface Theme {
  id: string
  name: string
  '--bg': string
  '--surface': string
  '--surface-alt': string
  '--border-color': string
  '--radius': string
  '--accent': string
  '--accent-rgb': string
  '--text': string
  '--text-sub': string
  '--card-shadow': string
  '--card-shadow-hover': string
  '--btn-radius': string
  '--store-cols': string
}
