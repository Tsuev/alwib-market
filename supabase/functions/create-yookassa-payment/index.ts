import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type BillingInterval = 'month'

interface CreatePaymentBody {
  plan?: 'pro'
  interval?: BillingInterval
}

interface YooKassaCreatePaymentResponse {
  id: string
  status: string
  paid: boolean
  test: boolean
  payment_method?: {
    id?: string
    saved?: boolean
  }
  confirmation?: {
    type?: string
    confirmation_url?: string
  }
}

function jsonResponse(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: corsHeaders })
}

function getRequiredEnv(name: string): string {
  const value = Deno.env.get(name)?.trim()

  if (!value) {
    throw new Error(`missing_env:${name}`)
  }

  return value
}

function resolveYooKassaCredentials(): { shopId: string; secretKey: string; mode: 'test' | 'prod' } {
  const explicitMode = Deno.env.get('YOOKASSA_ENV')?.trim().toLowerCase()

  if (explicitMode === 'test') {
    return {
      shopId: getRequiredEnv('YOOKASSA_TEST_SHOP_ID'),
      secretKey: getRequiredEnv('YOOKASSA_TEST_SECRET_KEY'),
      mode: 'test',
    }
  }

  if (explicitMode === 'prod') {
    return {
      shopId: getRequiredEnv('YOOKASSA_PROD_SHOP_ID'),
      secretKey: getRequiredEnv('YOOKASSA_PROD_SECRET_KEY'),
      mode: 'prod',
    }
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')?.trim() ?? ''
  const isLocal = supabaseUrl.includes('127.0.0.1') || supabaseUrl.includes('localhost')

  if (isLocal) {
    return {
      shopId: getRequiredEnv('YOOKASSA_TEST_SHOP_ID'),
      secretKey: getRequiredEnv('YOOKASSA_TEST_SECRET_KEY'),
      mode: 'test',
    }
  }

  return {
    shopId: getRequiredEnv('YOOKASSA_PROD_SHOP_ID'),
    secretKey: getRequiredEnv('YOOKASSA_PROD_SECRET_KEY'),
    mode: 'prod',
  }
}

function buildReturnUrl(): string {
  const rawUrl = getRequiredEnv('YOOKASSA_RETURN_URL')

  try {
    const url = new URL(rawUrl)
    url.searchParams.set('subscription', 'success')
    return url.toString()
  } catch {
    return rawUrl
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, 405)
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return jsonResponse({ error: 'missing_authorization' }, 401)
    }

    const supabaseUrl = getRequiredEnv('SUPABASE_URL')
    const anonKey = getRequiredEnv('SUPABASE_ANON_KEY')
    const serviceRoleKey = getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY')

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser()

    if (authError || !user) {
      return jsonResponse({ error: 'unauthorized' }, 401)
    }

    let body: CreatePaymentBody = {}
    try {
      body = await req.json()
    } catch {
      body = {}
    }

    const plan = body.plan ?? 'pro'
    const interval = body.interval ?? 'month'

    if (plan !== 'pro' || interval !== 'month') {
      return jsonResponse({ error: 'unsupported_subscription' }, 400)
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)
    const { data: store, error: storeError } = await supabaseAdmin
      .from('stores')
      .select('id, plan, subscription_status, subscription_expires_at')
      .eq('user_id', user.id)
      .maybeSingle()

    if (storeError) {
      return jsonResponse({ error: 'store_lookup_failed', details: storeError.message }, 500)
    }

    if (!store) {
      return jsonResponse({ error: 'store_not_found' }, 404)
    }

    const hasActiveSubscription =
      store.plan === 'pro' &&
      store.subscription_status !== 'inactive' &&
      store.subscription_status !== 'past_due' &&
      (!store.subscription_expires_at ||
        new Date(store.subscription_expires_at).getTime() > Date.now())

    if (hasActiveSubscription) {
      return jsonResponse({ error: 'already_pro' }, 409)
    }

    const { shopId, secretKey, mode } = resolveYooKassaCredentials()
    const returnUrl = buildReturnUrl()
    const amountValue = Deno.env.get('YOOKASSA_PRO_PRICE')?.trim() || '690.00'
    const idempotenceKey = crypto.randomUUID()
    const basicAuth = btoa(`${shopId}:${secretKey}`)

    const payload = {
      amount: {
        value: amountValue,
        currency: 'RUB',
      },
      capture: true,
      confirmation: {
        type: 'redirect',
        return_url: returnUrl,
      },
      description: `Подписка Pro для магазина #${store.id}`,
      save_payment_method: true,
      metadata: {
        user_id: user.id,
        store_id: String(store.id),
        plan,
        interval,
        payment_type: 'initial',
      },
    }

    const yookassaResponse = await fetch('https://api.yookassa.ru/v3/payments', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/json',
        'Idempotence-Key': idempotenceKey,
      },
      body: JSON.stringify(payload),
    })

    const responseText = await yookassaResponse.text()
    let responseJson: YooKassaCreatePaymentResponse | { description?: string } | null = null

    try {
      responseJson = responseText ? JSON.parse(responseText) : null
    } catch {
      responseJson = null
    }

    if (!yookassaResponse.ok) {
      return jsonResponse(
        {
          error: 'yookassa_create_payment_failed',
          details:
            responseJson && 'description' in responseJson && responseJson.description
              ? responseJson.description
              : responseText,
        },
        502,
      )
    }

    const payment = responseJson as YooKassaCreatePaymentResponse | null
    const confirmationUrl = payment?.confirmation?.confirmation_url

    if (!payment?.id || !confirmationUrl) {
      return jsonResponse({ error: 'invalid_yookassa_response' }, 502)
    }

    return jsonResponse({
      paymentId: payment.id,
      status: payment.status,
      confirmationUrl,
      mode,
      amount: amountValue,
      savePaymentMethod: true,
      paid: payment.paid,
      test: payment.test,
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
