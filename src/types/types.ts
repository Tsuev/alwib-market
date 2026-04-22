export interface Type {
  any: string
}

export interface Product {
  id: number
  name: string
  description: string
  price: number
  salePrice: number | null
  tags: string[]
  photo: string | null
}

export interface StoreData {
  name: string
  domain: string
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
