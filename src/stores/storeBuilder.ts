import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Product, StoreData } from '@/types/types'
import { applyTheme } from '@/composables/useTheme'
import { FREE_PRODUCT_LIMIT, getEffectiveThemeId, hasActiveSubscription, isThemeAllowedForPlan, resolveVisibleProductLimit } from '@/services/subscriptionEntitlements'
import { applyFreePlanFallbacks, loadStore, saveStore as dbSaveStore, updateTheme as dbUpdateTheme } from '@/services/storeService'
import { loadProducts, saveProduct as dbSaveProduct, removeProduct } from '@/services/productService'

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

export const useStoreBuilderStore = defineStore('storeBuilder', () => {
  const theme = ref('minimal')
  const storeData = ref<StoreData>({ ...DEFAULT_STORE })
  const products = ref<Product[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const userId = ref<string | null>(null)
  const lastPublishedSnapshot = ref('')

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

    const saved = await dbSaveProduct(p, storeData.value.id!)

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

  const hasActiveProSubscription = computed(() => hasActiveSubscription(storeData.value))
  const isPro = computed(() => hasActiveProSubscription.value)
  const productLimit = computed(() => resolveVisibleProductLimit(hasActiveProSubscription.value))
  const lockedProductsCount = computed(() => Math.max(0, products.value.length - productLimit.value))
  const hasUnpublishedChanges = computed(() => buildSnapshot() !== lastPublishedSnapshot.value)

  return {
    theme,
    storeData,
    products,
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
    deleteProduct,
  }
})
