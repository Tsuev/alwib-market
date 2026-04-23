import { useSupabase } from '@/composables/useSupabase'
import type { Product } from '@/types/types'

const { supabase } = useSupabase()

interface DbProduct {
  id: string
  store_id: number
  name: string
  description: string | null
  tags: string[]
  image_url: string | null
  price: number
  discount: number
  created_at: string
}

function fromDb(row: DbProduct): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    price: row.price,
    salePrice: row.discount > 0 ? Math.round(row.price * (1 - row.discount / 100)) : null,
    tags: row.tags || [],
    photo: row.image_url || null,
  }
}

function toDb(
  p: Omit<Product, 'id'>,
  storeId: number,
): Omit<DbProduct, 'id' | 'created_at'> {
  const discount =
    p.salePrice && p.salePrice > 0 && p.salePrice < p.price
      ? Math.round((1 - p.salePrice / p.price) * 100)
      : 0
  return {
    store_id: storeId,
    name: p.name,
    description: p.description || null,
    tags: p.tags,
    image_url: p.photo || null,
    price: p.price,
    discount,
  }
}

export async function loadProducts(storeId: number): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data as DbProduct[]).map(fromDb)
}

export async function saveProduct(
  product: Omit<Product, 'id'> & { id?: string },
  storeId: number,
): Promise<Product> {
  const row = toDb(product, storeId)

  if (product.id) {
    const { data, error } = await supabase
      .from('products')
      .update(row)
      .eq('id', product.id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return fromDb(data as DbProduct)
  } else {
    const { data, error } = await supabase
      .from('products')
      .insert(row)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return fromDb(data as DbProduct)
  }
}

export async function removeProduct(id: string): Promise<void> {
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
