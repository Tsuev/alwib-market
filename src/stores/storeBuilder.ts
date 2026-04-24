import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Product, StoreData } from '@/types/types'
import { applyTheme } from '@/composables/useTheme'
import { loadStore, saveStore as dbSaveStore, updateTheme as dbUpdateTheme } from '@/services/storeService'
import { loadProducts, saveProduct as dbSaveProduct, removeProduct } from '@/services/productService'

const DEFAULT_STORE: StoreData = { name: '', domain: '', description: '', photo: null, whatsapp: null, telegram: null }

export const useStoreBuilderStore = defineStore('storeBuilder', () => {
  const theme = ref('minimal')
  const storeData = ref<StoreData>({ ...DEFAULT_STORE })
  const products = ref<Product[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const userId = ref<string | null>(null)

  async function loadData(uid: string): Promise<void> {
    userId.value = uid
    loading.value = true
    try {
      const store = await loadStore(uid)
      if (store) {
        const { theme: storeTheme, ...rest } = store
        storeData.value = rest
        theme.value = storeTheme
        applyTheme(storeTheme)
        products.value = await loadProducts(store.id)
      }
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
    } finally {
      saving.value = false
    }
  }

  async function setTheme(t: string): Promise<void> {
    theme.value = t
    applyTheme(t)
    if (storeData.value.id) {
      await dbUpdateTheme(storeData.value.id, t)
    }
  }

  async function saveProduct(p: Omit<Product, 'id'> & { id?: string }): Promise<void> {
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
  }

  async function deleteProduct(id: string): Promise<void> {
    await removeProduct(id)
    products.value = products.value.filter((p) => p.id !== id)
  }

  return {
    theme,
    storeData,
    products,
    loading,
    saving,
    loadData,
    publishStore,
    setTheme,
    saveProduct,
    deleteProduct,
  }
})
