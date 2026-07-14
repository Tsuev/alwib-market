import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DueStoreRow {
  id: string
  subscription_expires_at: string | null
}

interface PrivateSubscriptionRow {
  store_id: string
  payment_method_id: string | null
  failed_attempts: number | null
}

interface YooKassaCreatePaymentResponse {
  id: string
  status: string
  paid: boolean
  created_at?: string
  payment_method?: {
    id?: string
    saved?: boolean
  }
  cancellation_details?: {
    reason?: string
    party?: string
  }
}

function jsonResponse(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: corsHeaders })
}

function getRequiredEnv(name: string): string {
  const value = Deno.env.get(name)?.trim()
  if (!value) throw new Error(`missing_env:${name}`)
  return value
}

function resolveYooKassaCredentials(): { shopId: string; secretKey: string } {
  const explicitMode = Deno.env.get('YOOKASSA_ENV')?.trim().toLowerCase()

  if (explicitMode === 'test') {
    return {
      shopId: getRequiredEnv('YOOKASSA_TEST_SHOP_ID'),
      secretKey: getRequiredEnv('YOOKASSA_TEST_SECRET_KEY'),
    }
  }

  if (explicitMode === 'prod') {
    return {
      shopId: getRequiredEnv('YOOKASSA_PROD_SHOP_ID'),
      secretKey: getRequiredEnv('YOOKASSA_PROD_SECRET_KEY'),
    }
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')?.trim() ?? ''
  const isLocal = supabaseUrl.includes('127.0.0.1') || supabaseUrl.includes('localhost')

  return isLocal
    ? {
        shopId: getRequiredEnv('YOOKASSA_TEST_SHOP_ID'),
        secretKey: getRequiredEnv('YOOKASSA_TEST_SECRET_KEY'),
      }
    : {
        shopId: getRequiredEnv('YOOKASSA_PROD_SHOP_ID'),
        secretKey: getRequiredEnv('YOOKASSA_PROD_SECRET_KEY'),
      }
}

function addMonths(dateIso: string, months: number): string {
  const date = new Date(dateIso)
  date.setUTCMonth(date.getUTCMonth() + months)
  return date.toISOString()
}

async function markStoreInactive(
  supabase: any,
  storeId: string,
  reason: string | null,
): Promise<void> {
  const { error: storeError } = await supabase
    .from('stores')
    .update({
      plan: 'free',
      theme: 'minimal',
      subscription_status: 'inactive',
    })
    .eq('id', storeId)

  if (storeError) throw new Error(storeError.message)

  const { data: current, error: currentError } = await supabase
    .from('store_subscriptions_private')
    .select('failed_attempts')
    .eq('store_id', storeId)
    .maybeSingle()

  if (currentError) throw new Error(currentError.message)

  const { error: privateError } = await supabase
    .from('store_subscriptions_private')
    .upsert({
      store_id: storeId,
      failed_attempts: (current?.failed_attempts ?? 0) + 1,
      last_failure_at: new Date().toISOString(),
      last_payment_status: 'canceled',
      cancellation_reason: reason,
    })

  if (privateError) throw new Error(privateError.message)
}

async function activateStoreFromPayment(
  supabase: any,
  storeId: string,
  payment: YooKassaCreatePaymentResponse,
): Promise<void> {
  const nowIso = new Date().toISOString()

  const { data: store, error: storeError } = await supabase
    .from('stores')
    .select('subscription_expires_at')
    .eq('id', storeId)
    .single()

  if (storeError) throw new Error(storeError.message)

  const currentExpiry = store.subscription_expires_at
  const baseDate =
    currentExpiry && new Date(currentExpiry).getTime() > Date.now() ? currentExpiry : nowIso
  const nextExpiry = addMonths(baseDate, 1)

  const { error: updateStoreError } = await supabase
    .from('stores')
    .update({
      plan: 'pro',
      subscription_status: 'active',
      subscription_started_at: nowIso,
      subscription_expires_at: nextExpiry,
    })
    .eq('id', storeId)

  if (updateStoreError) throw new Error(updateStoreError.message)

  const paymentMethodId =
    payment.payment_method?.saved && payment.payment_method?.id ? payment.payment_method.id : null

  const { error: privateError } = await supabase
    .from('store_subscriptions_private')
    .upsert({
      store_id: storeId,
      payment_method_id: paymentMethodId,
      last_payment_id: payment.id,
      last_payment_status: payment.status,
      last_payment_at: payment.created_at ?? nowIso,
      failed_attempts: 0,
      last_failure_at: null,
      cancellation_reason: null,
    })

  if (privateError) throw new Error(privateError.message)

  const { error: paymentError } = await supabase
    .from('subscription_payments')
    .upsert(
      {
        store_id: storeId,
        yookassa_payment_id: payment.id,
        payment_type: 'renewal',
        status: payment.status,
        amount: Number(Deno.env.get('YOOKASSA_PRO_PRICE')?.trim() || '690.00'),
        currency: 'RUB',
        paid: payment.paid,
        plan: 'pro',
        billing_interval: 'month',
        period_start: baseDate,
        period_end: nextExpiry,
        paid_at: payment.created_at ?? nowIso,
        processed_at: nowIso,
        payment_method_id: paymentMethodId,
        payload: payment,
      },
      { onConflict: 'yookassa_payment_id' },
    )

  if (paymentError) throw new Error(paymentError.message)
}

async function createRenewalPayment(
  shopId: string,
  secretKey: string,
  paymentMethodId: string,
  storeId: string,
): Promise<YooKassaCreatePaymentResponse> {
  const amountValue = Deno.env.get('YOOKASSA_PRO_PRICE')?.trim() || '690.00'
  const idempotenceKey = crypto.randomUUID()
  const basicAuth = btoa(`${shopId}:${secretKey}`)

  const response = await fetch('https://api.yookassa.ru/v3/payments', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth}`,
      'Content-Type': 'application/json',
      'Idempotence-Key': idempotenceKey,
    },
    body: JSON.stringify({
      amount: {
        value: amountValue,
        currency: 'RUB',
      },
      capture: true,
      payment_method_id: paymentMethodId,
      description: `Продление подписки Pro для магазина #${storeId}`,
      metadata: {
        store_id: String(storeId),
        plan: 'pro',
        interval: 'month',
        payment_type: 'renewal',
      },
    }),
  })

  const responseText = await response.text()
  let payment: YooKassaCreatePaymentResponse | null = null

  try {
    payment = responseText ? (JSON.parse(responseText) as YooKassaCreatePaymentResponse) : null
  } catch {
    payment = null
  }

  if (!response.ok || !payment?.id) {
    throw new Error(
      payment?.cancellation_details?.reason ||
        responseText ||
        'yookassa_renewal_request_failed',
    )
  }

  return payment
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, 405)
  }

  try {
    const serviceRoleKey = getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY')
    const authHeader = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '').trim()
    const apikey = req.headers.get('apikey')?.trim()

    if (authHeader !== serviceRoleKey && apikey !== serviceRoleKey) {
      return jsonResponse({ error: 'unauthorized' }, 401)
    }

    const supabase = createClient<any>(getRequiredEnv('SUPABASE_URL'), serviceRoleKey)
    const { shopId, secretKey } = resolveYooKassaCredentials()
    const nowIso = new Date().toISOString()

    const { data: dueStores, error: dueStoresError } = await supabase
      .from('stores')
      .select('id, subscription_expires_at')
      .eq('plan', 'pro')
      .eq('subscription_status', 'active')
      .not('subscription_expires_at', 'is', null)
      .lte('subscription_expires_at', nowIso)

    if (dueStoresError) {
      return jsonResponse({ error: 'due_stores_lookup_failed', details: dueStoresError.message }, 500)
    }

    const storeIds = (dueStores as DueStoreRow[] | null)?.map((store) => store.id) ?? []

    if (storeIds.length === 0) {
      return jsonResponse({ ok: true, processed: 0, renewed: 0, deactivated: 0 })
    }

    const { data: privateRows, error: privateRowsError } = await supabase
      .from('store_subscriptions_private')
      .select('store_id, payment_method_id, failed_attempts')
      .in('store_id', storeIds)

    if (privateRowsError) {
      return jsonResponse(
        { error: 'subscription_private_lookup_failed', details: privateRowsError.message },
        500,
      )
    }

    const privateRowsByStoreId = new Map<string, PrivateSubscriptionRow>()
    for (const row of (privateRows as PrivateSubscriptionRow[] | null) ?? []) {
      privateRowsByStoreId.set(row.store_id, row)
    }

    let renewed = 0
    let deactivated = 0
    const failures: Array<{ storeId: string; reason: string }> = []

    for (const store of (dueStores as DueStoreRow[] | null) ?? []) {
      const privateRow = privateRowsByStoreId.get(store.id)

      if (!privateRow?.payment_method_id) {
        await markStoreInactive(supabase, store.id, 'missing_saved_payment_method')
        deactivated += 1
        continue
      }

      try {
        const payment = await createRenewalPayment(
          shopId,
          secretKey,
          privateRow.payment_method_id,
          store.id,
        )

        if (payment.status === 'succeeded' && payment.paid) {
          await activateStoreFromPayment(supabase, store.id, payment)
          renewed += 1
          continue
        }

        const reason = payment.cancellation_details?.reason ?? payment.status
        await markStoreInactive(supabase, store.id, reason)
        deactivated += 1
      } catch (error) {
        const reason = error instanceof Error ? error.message : 'unknown_renewal_error'
        await markStoreInactive(supabase, store.id, reason)
        failures.push({ storeId: store.id, reason })
        deactivated += 1
      }
    }

    return jsonResponse({
      ok: true,
      processed: storeIds.length,
      renewed,
      deactivated,
      failures,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error'

    return jsonResponse(
      {
        error: message.startsWith('missing_env:') ? 'missing_env' : 'internal_error',
        details: message,
      },
      500,
    )
  }
})
