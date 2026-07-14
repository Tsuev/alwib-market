import { useSupabase } from '@/composables/useSupabase'

const { supabase } = useSupabase()

type AnalyticsTarget =
  | { entity: 'store'; id: string }
  | { entity: 'product'; id: string }

async function incrementViews(target: AnalyticsTarget): Promise<void> {
  const { error } = await supabase.functions.invoke('increment-views', {
    body: target,
  })

  if (error) {
    throw new Error(error.message)
  }
}

export async function trackStoreView(storeId: string): Promise<void> {
  try {
    await incrementViews({ entity: 'store', id: storeId })
  } catch (error) {
    console.error('Failed to track store view', error)
  }
}

export async function trackProductView(productId: string): Promise<void> {
  try {
    await incrementViews({ entity: 'product', id: productId })
  } catch (error) {
    console.error('Failed to track product view', error)
  }
}
