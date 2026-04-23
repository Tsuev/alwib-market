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
}

export interface StoreData {
  id?: number // bigint from Supabase, undefined for unsaved stores
  name: string
  domain: string // maps to slug in DB
  description: string
  photo: string | null
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
