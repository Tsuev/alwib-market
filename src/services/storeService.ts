import { useSupabase } from '@/composables/useSupabase'
import type { Plan, StoreData } from '@/types/types'

const { supabase } = useSupabase()

interface DbStore {
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
  created_at: string
}

function fromDb(row: DbStore): StoreData & { id: number; theme: string } {
  return {
    id: row.id,
    name: row.name || '',
    domain: row.slug || '',
    description: row.description || '',
    photo: row.logo_url || null,
    theme: row.theme || 'minimal',
    whatsapp: row.whatsapp || null,
    telegram: row.telegram || null,
    plan: (row.plan as Plan) || 'free',
  }
}

export async function loadStore(
  userId: string,
): Promise<(StoreData & { id: number; theme: string }) | null> {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data ? fromDb(data as DbStore) : null
}

export async function loadStoreBySlug(
  slug: string,
): Promise<(StoreData & { id: number; theme: string }) | null> {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data ? fromDb(data as DbStore) : null
}

export async function updateTheme(storeId: number, theme: string): Promise<void> {
  const { error } = await supabase
    .from('stores')
    .update({ theme })
    .eq('id', storeId)

  if (error) throw new Error(error.message)
}

export async function saveStore(
  data: StoreData,
  userId: string,
  theme: string,
): Promise<StoreData & { id: number; theme: string }> {
  const row = {
    user_id: userId,
    name: data.name,
    slug: data.domain || null,
    description: data.description || null,
    logo_url: data.photo || null,
    theme,
    whatsapp: data.whatsapp || null,
    telegram: data.telegram || null,
  }

  if (data.id) {
    const { data: saved, error } = await supabase
      .from('stores')
      .update(row)
      .eq('id', data.id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return fromDb(saved as DbStore)
  } else {
    const { data: saved, error } = await supabase
      .from('stores')
      .insert(row)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return fromDb(saved as DbStore)
  }
}
