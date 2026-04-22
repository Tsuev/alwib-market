import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import type { Product, StoreData } from '@/types/types'
import { SAMPLE_PRODUCTS } from '@/constants/constants'
import { applyTheme } from '@/composables/useTheme'

const DEFAULT_STORE: StoreData = { name: 'Мастерская Берёзка', domain: 'berezka', photo: null }

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export const useStoreBuilderStore = defineStore('storeBuilder', () => {
  const theme = ref(localStorage.getItem('sb_theme') || 'minimal')
  const storeData = ref<StoreData>(loadJson('sb_store', DEFAULT_STORE))
  const products = ref<Product[]>(loadJson('sb_products', SAMPLE_PRODUCTS))

  // Apply saved theme on init
  applyTheme(theme.value)

  watch(theme, (t) => localStorage.setItem('sb_theme', t))
  watch(storeData, (s) => localStorage.setItem('sb_store', JSON.stringify(s)), { deep: true })
  watch(
    products,
    (ps) => {
      // Strip base64 photos before persisting — product photos are session-only
      const lean = ps.map((p) => ({
        ...p,
        photo: p.photo?.startsWith('data:') ? null : p.photo,
      }))
      localStorage.setItem('sb_products', JSON.stringify(lean))
    },
    { deep: true },
  )

  function setTheme(t: string) {
    theme.value = t
    applyTheme(t)
  }

  function saveProduct(p: Omit<Product, 'id'> & { id?: number }) {
    if (p.id) {
      const idx = products.value.findIndex((x) => x.id === p.id)
      if (idx >= 0) products.value[idx] = p as Product
    } else {
      products.value.unshift({ ...p, id: Date.now() } as Product)
    }
  }

  function deleteProduct(id: number) {
    products.value = products.value.filter((p) => p.id !== id)
  }

  return { theme, storeData, products, setTheme, saveProduct, deleteProduct }
})
