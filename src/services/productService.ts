import { useSupabase } from '@/composables/useSupabase'
import type { Product } from '@/types/types'

const { supabase } = useSupabase()

interface DbProduct {
  id: string
  store_id: string
  name: string
  description: string | null
  tags: string[]
  image_url: string | null
  price: number
  discount: number
  sale_price: number | null
  views: number | null
  created_at: string
}

type DbProductWrite = Omit<DbProduct, 'id' | 'created_at' | 'views'>

function fromDb(row: DbProduct): Product {
  const salePrice =
    row.sale_price && row.sale_price > 0 && row.sale_price < row.price
      ? row.sale_price
      : row.discount > 0
        ? Math.round(row.price * (1 - row.discount / 100))
        : null

  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    price: row.price,
    salePrice,
    tags: row.tags || [],
    photo: row.image_url || null,
    views: row.views ?? 0,
  }
}

function toDb(
  p: Omit<Product, 'id' | 'views'>,
  storeId: string,
): DbProductWrite {
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
    sale_price: discount > 0 ? p.salePrice : null,
  }
}

export async function loadProducts(storeId: string, options?: { limit?: number }): Promise<Product[]> {
  let query = supabase
    .from('products')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) throw new Error(error.message)
  return (data as DbProduct[]).map(fromDb)
}

export async function saveProduct(
  product: Omit<Product, 'id' | 'views'> & { id?: string },
  storeId: string,
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
