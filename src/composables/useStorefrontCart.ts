import { computed, ref, watch, type ComputedRef, type Ref } from 'vue'
import type { CartLine, Product, StoredCartItem } from '@/types/types'

const CART_STORAGE_PREFIX = 'alwib-storefront-cart'
const MAX_CART_QUANTITY = 99

type ProductSource = Ref<Product[]> | ComputedRef<Product[]>
type ScopeSource = Ref<string> | ComputedRef<string>

function clampQuantity(quantity: number): number {
  if (!Number.isFinite(quantity)) return 0
  return Math.max(0, Math.min(MAX_CART_QUANTITY, Math.trunc(quantity)))
}

function readStoredCart(storageKey: string): Record<string, number> {
  if (typeof window === 'undefined') return {}

  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) return {}

    const parsed = JSON.parse(raw) as StoredCartItem[]
    if (!Array.isArray(parsed)) return {}

    return parsed.reduce<Record<string, number>>((acc, item) => {
      if (!item || typeof item.productId !== 'string') return acc

      const quantity = clampQuantity(item.quantity)
      if (quantity > 0) {
        acc[item.productId] = quantity
      }

      return acc
    }, {})
  } catch {
    return {}
  }
}

function writeStoredCart(storageKey: string, items: Record<string, number>) {
  if (typeof window === 'undefined') return

  const serialized = Object.entries(items)
    .map(([productId, quantity]) => ({
      productId,
      quantity: clampQuantity(quantity),
    }))
    .filter((item) => item.quantity > 0)

  if (serialized.length === 0) {
    window.localStorage.removeItem(storageKey)
    return
  }

  window.localStorage.setItem(storageKey, JSON.stringify(serialized))
}

export function buildCartMessage(items: CartLine[]): string {
  const lines = items
    .filter((item) => item.quantity > 0)
    .map((item) => `${item.product.name} - ${item.quantity} шт`)

  if (lines.length === 0) {
    return 'Интересуюсь'
  }

  return `Интересуюсь\n\n${lines.join('\n')}`
}

export function createWhatsappLink(phone: string | null | undefined, message: string): string | null {
  const normalizedPhone = (phone ?? '').replace(/\D/g, '')
  if (!normalizedPhone) return null
  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`
}

export function createTelegramProfileLink(username: string | null | undefined): string | null {
  const normalizedUsername = (username ?? '').trim().replace(/^@/, '')
  if (!normalizedUsername) return null
  return `https://t.me/${normalizedUsername}`
}

export function useStorefrontCart(options: {
  products: ProductSource
  scope: ScopeSource
}) {
  const cartState = ref<Record<string, number>>({})
  const storageKey = computed(() => `${CART_STORAGE_PREFIX}:${options.scope.value}`)

  watch(
    storageKey,
    (nextKey) => {
      cartState.value = readStoredCart(nextKey)
    },
    { immediate: true },
  )

  watch(
    cartState,
    (nextState) => {
      writeStoredCart(storageKey.value, nextState)
    },
    { deep: true },
  )

  const items = computed<CartLine[]>(() =>
    options.products.value.flatMap((product) => {
      const quantity = clampQuantity(cartState.value[product.id] ?? 0)
      return quantity > 0 ? [{ product, quantity }] : []
    }),
  )

  const totalCount = computed(() =>
    items.value.reduce((sum, item) => sum + item.quantity, 0),
  )

  const totalAmount = computed(() =>
    items.value.reduce((sum, item) => {
      const price = item.product.salePrice ?? item.product.price
      return sum + price * item.quantity
    }, 0),
  )

  const message = computed(() => buildCartMessage(items.value))

  function getQuantity(productId: string): number {
    return clampQuantity(cartState.value[productId] ?? 0)
  }

  function setQuantity(productId: string, quantity: number) {
    const nextQuantity = clampQuantity(quantity)
    const nextState = { ...cartState.value }

    if (nextQuantity === 0) {
      delete nextState[productId]
    } else {
      nextState[productId] = nextQuantity
    }

    cartState.value = nextState
  }

  function increment(productId: string) {
    setQuantity(productId, getQuantity(productId) + 1)
  }

  function decrement(productId: string) {
    setQuantity(productId, getQuantity(productId) - 1)
  }

  function remove(productId: string) {
    setQuantity(productId, 0)
  }

  function clear() {
    cartState.value = {}
  }

  return {
    items,
    totalCount,
    totalAmount,
    message,
    getQuantity,
    setQuantity,
    increment,
    decrement,
    remove,
    clear,
  }
}
