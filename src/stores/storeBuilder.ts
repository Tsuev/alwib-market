import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Product, StoreData, StoreTag } from '@/types/types'
import { applyTheme } from '@/composables/useTheme'
import { FREE_PRODUCT_LIMIT, getEffectiveThemeId, hasActiveSubscription, isThemeAllowedForPlan, resolveVisibleProductLimit } from '@/services/subscriptionEntitlements'
import { applyFreePlanFallbacks, loadStore, saveStore as dbSaveStore, updateTheme as dbUpdateTheme } from '@/services/storeService'
import { loadProducts, saveProduct as dbSaveProduct, removeProduct } from '@/services/productService'
import {
  canonicalizeTagNames,
  createStoreTag as dbCreateStoreTag,
  deleteStoreTag as dbDeleteStoreTag,
  dedupeTagNames,
  ensureStoreTags,
  loadStoreTags,
  removeTagFromProducts,
  renameTagInProducts,
  updateStoreTag as dbUpdateStoreTag,
} from '@/services/tagService'

const DEFAULT_STORE: StoreData = {
  name: '',
  domain: '',
  description: '',
  photo: null,
  banner: null,
  whatsapp: null,
  telegram: null,
  plan: 'free',
  subscriptionStatus: 'inactive',
  subscriptionExpiresAt: null,
  views: 0,
}

function sortTags(tags: StoreTag[]): StoreTag[] {
  return [...tags].sort((a, b) =>
    a.name.localeCompare(b.name, 'ru', { sensitivity: 'base' }),
  )
}

export const useStoreBuilderStore = defineStore('storeBuilder', () => {
  const theme = ref('minimal')
  const storeData = ref<StoreData>({ ...DEFAULT_STORE })
  const products = ref<Product[]>([])
  const storeTags = ref<StoreTag[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const userId = ref<string | null>(null)
  const lastPublishedSnapshot = ref('')

  function buildDuplicateName(name: string): string {
    const trimmed = name.trim()
    return trimmed ? `${trimmed} (копия)` : 'Копия товара'
  }

  function buildSnapshot(): string {
    return JSON.stringify({
      theme: theme.value,
      store: {
        name: storeData.value.name,
        domain: storeData.value.domain,
        description: storeData.value.description,
        photo: storeData.value.photo,
        banner: storeData.value.banner,
        whatsapp: storeData.value.whatsapp,
        telegram: storeData.value.telegram,
      },
      products: products.value.map((product) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        salePrice: product.salePrice,
        photo: product.photo,
        tags: [...product.tags],
      })),
    })
  }

  function syncPublishedSnapshot(): void {
    lastPublishedSnapshot.value = buildSnapshot()
  }

  async function loadData(uid: string): Promise<void> {
    userId.value = uid
    loading.value = true
    try {
      let store = await loadStore(uid)

      // First login after email confirmation: create an empty store automatically.
      if (!store) {
        store = await dbSaveStore({ ...DEFAULT_STORE }, uid, theme.value)
      }

      let normalizedStore = store
      const subscriptionActive = hasActiveSubscription(store)
      const themeAllowed = isThemeAllowedForPlan(store.theme, subscriptionActive)

      if (!subscriptionActive && (store.plan !== 'free' || !themeAllowed)) {
        normalizedStore = await applyFreePlanFallbacks(store.id)
      }

      const { theme: storeTheme, ...rest } = normalizedStore
      storeData.value = rest
      theme.value = getEffectiveThemeId(storeTheme, hasActiveSubscription(rest))
      applyTheme(theme.value)
      products.value = await loadProducts(store.id)
      storeTags.value = sortTags(await loadStoreTags(store.id))
      syncPublishedSnapshot()
    } finally {
      loading.value = false
    }
  }

  async function publishStore(): Promise<void> {
    if (!userId.value) throw new Error('Не авторизован')
    saving.value = true
    try {
      const saved = await dbSaveStore(storeData.value, userId.value, theme.value)
      const { theme: savedTheme, ...rest } = saved
      storeData.value = rest
      theme.value = savedTheme
      syncPublishedSnapshot()
    } finally {
      saving.value = false
    }
  }

  async function setTheme(t: string): Promise<void> {
    theme.value = t
    applyTheme(t)
    if (storeData.value.id) {
      await dbUpdateTheme(storeData.value.id, t)
      syncPublishedSnapshot()
    }
  }

  async function saveProduct(p: Omit<Product, 'id' | 'views'> & { id?: string }): Promise<void> {
    if (!userId.value) throw new Error('Не авторизован')

    const isEditing = Boolean(p.id)

    if (!isEditing && !hasActiveProSubscription.value && products.value.length >= FREE_PRODUCT_LIMIT) {
      throw new Error('На тарифе Free доступно до 10 товаров. Подключите Pro, чтобы добавить больше.')
    }

    // Auto-create store on first product save if not published yet
    if (!storeData.value.id) {
      await publishStore()
    }

    const ensuredTags = await ensureStoreTags(p.tags, storeData.value.id!)
    const canonicalTags = canonicalizeTagNames(p.tags, ensuredTags)
    const mergedTags = new Map(storeTags.value.map((tag) => [tag.id, tag] as const))
    for (const tag of ensuredTags) mergedTags.set(tag.id, tag)
    storeTags.value = sortTags([...mergedTags.values()])

    const saved = await dbSaveProduct(
      { ...p, tags: canonicalTags },
      storeData.value.id!,
    )

    if (p.id) {
      const idx = products.value.findIndex((x) => x.id === p.id)
      if (idx >= 0) products.value[idx] = saved
    } else {
      products.value.unshift(saved)
    }

    syncPublishedSnapshot()
  }

  async function deleteProduct(id: string): Promise<void> {
    await removeProduct(id)
    products.value = products.value.filter((p) => p.id !== id)
    syncPublishedSnapshot()
  }

  async function duplicateProduct(product: Product): Promise<void> {
    await saveProduct({
      name: buildDuplicateName(product.name),
      description: product.description,
      price: product.price,
      salePrice: product.salePrice,
      tags: [...product.tags],
      photo: product.photo,
    })
  }

  async function createTag(name: string): Promise<StoreTag> {
    if (!storeData.value.id) {
      await publishStore()
    }

    const tag = await dbCreateStoreTag(name, storeData.value.id!)
    const exists = storeTags.value.some((item) => item.id === tag.id)

    if (!exists) {
      storeTags.value = sortTags([...storeTags.value, tag])
    }

    return tag
  }

  async function updateTag(tagId: string, name: string): Promise<void> {
    if (!storeData.value.id) throw new Error('Магазин не найден')

    const current = storeTags.value.find((tag) => tag.id === tagId)
    if (!current) throw new Error('Тег не найден')

    const updatedTag = await dbUpdateStoreTag(tagId, name)

    if (current.name !== updatedTag.name) {
      await renameTagInProducts(storeData.value.id, current.name, updatedTag.name)
      products.value = products.value.map((product) => ({
        ...product,
        tags: dedupeTagNames(
          product.tags.map((tag) => (tag === current.name ? updatedTag.name : tag)),
        ),
      }))
    }

    storeTags.value = storeTags.value
      .map((tag) => (tag.id === tagId ? updatedTag : tag))
    storeTags.value = sortTags(storeTags.value)
    syncPublishedSnapshot()
  }

  async function deleteTag(tagId: string): Promise<void> {
    if (!storeData.value.id) throw new Error('Магазин не найден')

    const current = storeTags.value.find((tag) => tag.id === tagId)
    if (!current) return

    await dbDeleteStoreTag(tagId)
    await removeTagFromProducts(storeData.value.id, current.name)

    storeTags.value = storeTags.value.filter((tag) => tag.id !== tagId)
    products.value = products.value.map((product) => ({
      ...product,
      tags: product.tags.filter((tag) => tag !== current.name),
    }))
    syncPublishedSnapshot()
  }

  const hasActiveProSubscription = computed(() => hasActiveSubscription(storeData.value))
  const isPro = computed(() => hasActiveProSubscription.value)
  const productLimit = computed(() => resolveVisibleProductLimit(hasActiveProSubscription.value))
  const lockedProductsCount = computed(() => Math.max(0, products.value.length - productLimit.value))
  const hasUnpublishedChanges = computed(() => buildSnapshot() !== lastPublishedSnapshot.value)

  return {
    theme,
    storeData,
    products,
    storeTags,
    loading,
    saving,
    isPro,
    productLimit,
    lockedProductsCount,
    hasUnpublishedChanges,
    loadData,
    publishStore,
    setTheme,
    saveProduct,
    duplicateProduct,
    deleteProduct,
    createTag,
    updateTag,
    deleteTag,
  }
})
