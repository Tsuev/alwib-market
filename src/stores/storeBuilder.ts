import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Product, StoreData } from '@/types/types'
import { applyTheme } from '@/composables/useTheme'
import { loadStore, saveStore as dbSaveStore, updateTheme as dbUpdateTheme } from '@/services/storeService'
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

      const { theme: storeTheme, ...rest } = store
      storeData.value = rest
      theme.value = storeTheme
      applyTheme(storeTheme)
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

  const isPro = computed(() => storeData.value.plan === 'pro')
  const hasUnpublishedChanges = computed(() => buildSnapshot() !== lastPublishedSnapshot.value)

  return {
    theme,
    storeData,
    products,
    loading,
    saving,
    isPro,
    hasUnpublishedChanges,
    loadData,
    publishStore,
    setTheme,
    saveProduct,
    deleteProduct,
  }
})
