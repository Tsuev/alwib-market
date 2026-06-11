import { useSupabase } from '@/composables/useSupabase'

const { supabase } = useSupabase()

const SUBSCRIPTION_CHECKOUT_KEY = 'alwib:subscription-checkout'

interface PendingCheckout {
  paymentId: string
  startedAt: number
}

interface CreateCheckoutResult {
  confirmationUrl: string
  paymentId: string
}

function getStorage(): Storage | null {
  if (typeof window === 'undefined') return null
  return window.sessionStorage
}

function parsePendingCheckout(raw: string | null): PendingCheckout | null {
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as Partial<PendingCheckout>
    if (typeof parsed.paymentId !== 'string' || typeof parsed.startedAt !== 'number') {
      return null
    }
    return {
      paymentId: parsed.paymentId,
      startedAt: parsed.startedAt,
    }
  } catch {
    return null
  }
}

export async function createProCheckout(): Promise<CreateCheckoutResult> {
  const { data, error } = await supabase.functions.invoke('create-yookassa-payment', {
    body: {
      plan: 'pro',
      interval: 'month',
    },
  })

  if (error) {
    throw new Error(error.message || 'Не удалось создать платеж')
  }

  if (
    !data ||
    typeof data.confirmationUrl !== 'string' ||
    typeof data.paymentId !== 'string'
  ) {
    throw new Error('Функция оплаты вернула некорректный ответ')
  }

  return {
    confirmationUrl: data.confirmationUrl,
    paymentId: data.paymentId,
  }
}

export function rememberPendingCheckout(paymentId: string): void {
  const storage = getStorage()
  storage?.setItem(
    SUBSCRIPTION_CHECKOUT_KEY,
    JSON.stringify({
      paymentId,
      startedAt: Date.now(),
    }),
  )
}

export function getPendingCheckout(): PendingCheckout | null {
  return parsePendingCheckout(getStorage()?.getItem(SUBSCRIPTION_CHECKOUT_KEY) ?? null)
}

export function clearPendingCheckout(): void {
  getStorage()?.removeItem(SUBSCRIPTION_CHECKOUT_KEY)
}
