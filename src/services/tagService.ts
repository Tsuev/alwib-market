import { useSupabase } from '@/composables/useSupabase'
import type { Product, StoreTag } from '@/types/types'

const { supabase } = useSupabase()

interface DbStoreTag {
  id: string
  store_id: string
  name: string
  normalized_name: string
  created_at: string
}

const TAG_NAME_LIMIT = 32

function fromDb(row: DbStoreTag): StoreTag {
  return {
    id: row.id,
    storeId: row.store_id,
    name: row.name,
    createdAt: row.created_at,
  }
}

export function sanitizeTagName(name: string): string {
  return name.replace(/\s+/g, ' ').trim()
}

export function normalizeTagName(name: string): string {
  return sanitizeTagName(name).toLocaleLowerCase('ru-RU')
}

export function dedupeTagNames(names: string[]): string[] {
  const result: string[] = []
  const seen = new Set<string>()

  for (const rawName of names) {
    const name = sanitizeTagName(rawName)
    if (!name) continue

    const normalized = normalizeTagName(name)
    if (seen.has(normalized)) continue

    seen.add(normalized)
    result.push(name.slice(0, TAG_NAME_LIMIT))
  }

  return result
}

export function canonicalizeTagNames(
  names: string[],
  storeTags: StoreTag[],
): string[] {
  const tagByNormalized = new Map(
    storeTags.map((tag) => [normalizeTagName(tag.name), tag.name] as const),
  )

  return dedupeTagNames(names).map(
    (name) => tagByNormalized.get(normalizeTagName(name)) ?? name,
  )
}

export async function loadStoreTags(storeId: string): Promise<StoreTag[]> {
  const { data, error } = await supabase
    .from('store_tags')
    .select('*')
    .eq('store_id', storeId)
    .order('name', { ascending: true })

  if (error) throw new Error(error.message)
  return (data as DbStoreTag[]).map(fromDb)
}

export async function ensureStoreTags(
  names: string[],
  storeId: string,
): Promise<StoreTag[]> {
  const cleanedNames = dedupeTagNames(names)
  if (!cleanedNames.length) return []

  const normalizedNames = cleanedNames.map(normalizeTagName)

  const { data: existingRows, error: existingError } = await supabase
    .from('store_tags')
    .select('*')
    .eq('store_id', storeId)
    .in('normalized_name', normalizedNames)

  if (existingError) throw new Error(existingError.message)

  const existing = (existingRows as DbStoreTag[]).map(fromDb)
  const existingNormalized = new Set(existing.map((tag) => normalizeTagName(tag.name)))

  const missingRows = cleanedNames
    .filter((name) => !existingNormalized.has(normalizeTagName(name)))
    .map((name) => ({
      store_id: storeId,
      name,
      normalized_name: normalizeTagName(name),
    }))

  let created: StoreTag[] = []

  if (missingRows.length) {
    const { data: createdRows, error: createError } = await supabase
      .from('store_tags')
      .insert(missingRows)
      .select()

    if (createError) throw new Error(createError.message)
    created = (createdRows as DbStoreTag[]).map(fromDb)
  }

  return [...existing, ...created].sort((a, b) =>
    a.name.localeCompare(b.name, 'ru', { sensitivity: 'base' }),
  )
}

export async function createStoreTag(
  name: string,
  storeId: string,
): Promise<StoreTag> {
  const cleanedName = sanitizeTagName(name).slice(0, TAG_NAME_LIMIT)
  if (!cleanedName) throw new Error('Введите название тега')

  const ensured = await ensureStoreTags([cleanedName], storeId)
  const tag = ensured.find(
    (item) => normalizeTagName(item.name) === normalizeTagName(cleanedName),
  )

  if (!tag) throw new Error('Не удалось создать тег')
  return tag
}

export async function updateStoreTag(
  id: string,
  name: string,
): Promise<StoreTag> {
  const cleanedName = sanitizeTagName(name).slice(0, TAG_NAME_LIMIT)
  if (!cleanedName) throw new Error('Введите название тега')

  const { data, error } = await supabase
    .from('store_tags')
    .update({
      name: cleanedName,
      normalized_name: normalizeTagName(cleanedName),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return fromDb(data as DbStoreTag)
}

export async function deleteStoreTag(id: string): Promise<void> {
  const { error } = await supabase
    .from('store_tags')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
}

async function updateProductsTags(
  storeId: string,
  sourceTagName: string,
  updateTags: (product: Product) => string[],
): Promise<void> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('store_id', storeId)
    .contains('tags', [sourceTagName])

  if (error) throw new Error(error.message)

  const products = (data ?? []) as Array<{
    id: string
    name: string
    description: string | null
    tags: string[]
    image_url: string | null
    price: number
    discount: number
    sale_price: number | null
    views: number | null
  }>

  await Promise.all(
    products.map(async (product) => {
      const nextTags = updateTags({
        id: product.id,
        name: product.name,
        description: product.description || '',
        price: product.price,
        salePrice: product.sale_price,
        tags: product.tags || [],
        photo: product.image_url || null,
        views: product.views ?? 0,
      })

      const { error: updateError } = await supabase
        .from('products')
        .update({ tags: nextTags })
        .eq('id', product.id)

      if (updateError) throw new Error(updateError.message)
    }),
  )
}

export async function renameTagInProducts(
  storeId: string,
  previousName: string,
  nextName: string,
): Promise<void> {
  await updateProductsTags(storeId, previousName, (product) =>
    dedupeTagNames(
      product.tags.map((tag) => (tag === previousName ? nextName : tag)),
    ),
  )
}

export async function removeTagFromProducts(
  storeId: string,
  tagName: string,
): Promise<void> {
  await updateProductsTags(storeId, tagName, (product) =>
    product.tags.filter((tag) => tag !== tagName),
  )
}
