import { useSupabase } from '@/composables/useSupabase'
import type { Plan, StoreData } from '@/types/types'
import { getFallbackFreeThemeId } from '@/services/subscriptionEntitlements'

const { supabase } = useSupabase()

const STORE_SELECT = [
  'id',
  'user_id',
  'name',
  'slug',
  'description',
  'logo_url',
  'banner_url',
  'theme',
  'whatsapp',
  'telegram',
  'plan',
  'subscription_status',
  'subscription_expires_at',
  'views',
  'created_at',
].join(', ')

interface DbStore {
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
  views: number | null
  created_at: string
}

function fromDb(row: DbStore): StoreData & { id: string; theme: string } {
  return {
    id: row.id,
    name: row.name || '',
    domain: row.slug || '',
    description: row.description || '',
    photo: row.logo_url || null,
    banner: row.banner_url || null,
    theme: row.theme || 'minimal',
    whatsapp: row.whatsapp || null,
    telegram: row.telegram || null,
    plan: (row.plan as Plan) || 'free',
    subscriptionStatus: (row.subscription_status as StoreData['subscriptionStatus']) || 'inactive',
    subscriptionExpiresAt: row.subscription_expires_at || null,
    views: row.views ?? 0,
  }
}

export async function loadStore(
  userId: string,
): Promise<(StoreData & { id: string; theme: string }) | null> {
  const { data, error } = await supabase
    .from('stores')
    .select(STORE_SELECT)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data ? fromDb(data as unknown as DbStore) : null
}

export async function loadStoreBySlug(
  slug: string,
): Promise<(StoreData & { id: string; theme: string }) | null> {
  const { data, error } = await supabase
    .from('stores')
    .select(STORE_SELECT)
    .eq('slug', slug)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data ? fromDb(data as unknown as DbStore) : null
}

export async function updateTheme(storeId: string, theme: string): Promise<void> {
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
): Promise<StoreData & { id: string; theme: string }> {
  const row = {
    user_id: userId,
    name: data.name,
    slug: data.domain || null,
    description: data.description || null,
    logo_url: data.photo || null,
    banner_url: data.banner || null,
    theme,
    whatsapp: data.whatsapp || null,
    telegram: data.telegram || null,
  }

  if (data.id) {
    const { data: saved, error } = await supabase
      .from('stores')
      .update(row)
      .eq('id', data.id)
      .select(STORE_SELECT)
      .single()
    if (error) throw new Error(error.message)
    return fromDb(saved as unknown as DbStore)
  } else {
    const { data: saved, error } = await supabase
      .from('stores')
      .insert(row)
      .select(STORE_SELECT)
      .single()
    if (error) throw new Error(error.message)
    return fromDb(saved as unknown as DbStore)
  }
}

export async function applyFreePlanFallbacks(
  storeId: string,
): Promise<StoreData & { id: string; theme: string }> {
  const { data, error } = await supabase
    .from('stores')
    .update({
      plan: 'free',
      theme: getFallbackFreeThemeId(),
      subscription_status: 'inactive',
    })
    .eq('id', storeId)
    .select(STORE_SELECT)
    .single()

  if (error) throw new Error(error.message)
  return fromDb(data as unknown as DbStore)
}
