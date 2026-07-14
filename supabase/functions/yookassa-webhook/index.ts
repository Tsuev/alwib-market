import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function jsonResponse(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: corsHeaders })
}

function getRequiredEnv(name: string): string {
  const value = Deno.env.get(name)?.trim()
  if (!value) throw new Error(`missing_env:${name}`)
  return value
}

function addMonths(dateIso: string, months: number): string {
  const date = new Date(dateIso)
  date.setUTCMonth(date.getUTCMonth() + months)
  return date.toISOString()
}

async function deactivateStore(
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

  const { data: currentPrivate, error: currentPrivateError } = await supabase
    .from('store_subscriptions_private')
    .select('failed_attempts')
    .eq('store_id', storeId)
    .maybeSingle()

  if (currentPrivateError) throw new Error(currentPrivateError.message)

  const { error: privateError } = await supabase
    .from('store_subscriptions_private')
    .upsert({
      store_id: storeId,
      failed_attempts: (currentPrivate?.failed_attempts ?? 0) + 1,
      last_failure_at: new Date().toISOString(),
      last_payment_status: 'canceled',
      cancellation_reason: reason,
    })

  if (privateError) throw new Error(privateError.message)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  console.log('YOOKASSA WEBHOOK START:', req.method)

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, 405)
  }

  try {
    const body = await req.json()

    console.log('YOOKASSA WEBHOOK BODY:', JSON.stringify(body))

    const payment = body.object
    const storeId = payment.metadata?.store_id
    const plan = payment.metadata?.plan
    const paymentType = payment.metadata?.payment_type ?? 'initial'

    console.log('YOOKASSA WEBHOOK METADATA:', { storeId, plan, paymentType, event: body.event })

    if (!storeId || plan !== 'pro') {
      return jsonResponse(
        {
          error: 'invalid_metadata',
          metadata: payment.metadata ?? null,
        },
        400,
      )
    }

    const supabase = createClient<any>(
      getRequiredEnv('SUPABASE_URL'),
      getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
    )

    if (body.event === 'payment.canceled' || payment?.status === 'canceled') {
      const reason = payment?.cancellation_details?.reason ?? payment?.status ?? 'canceled'

      const { error: paymentError } = await supabase
        .from('subscription_payments')
        .upsert(
          {
            store_id: storeId,
            yookassa_payment_id: payment.id,
            payment_type: paymentType,
            status: payment.status ?? 'canceled',
            amount: Number(payment.amount?.value ?? 0),
            currency: payment.amount?.currency ?? 'RUB',
            paid: false,
            plan,
            billing_interval: payment.metadata?.interval ?? 'month',
            failure_reason: reason,
            processed_at: new Date().toISOString(),
            metadata: payment.metadata ?? null,
            payload: payment,
          },
          { onConflict: 'yookassa_payment_id' },
        )

      if (paymentError) {
        return jsonResponse({ error: 'payment_log_failed', details: paymentError.message }, 500)
      }

      await deactivateStore(supabase, storeId, reason)
      return jsonResponse({ ok: true, storeId, status: 'inactive' })
    }

    if (body.event !== 'payment.succeeded' || !payment?.paid || payment?.status !== 'succeeded') {
      console.log('YOOKASSA WEBHOOK IGNORED EVENT:', body.event)
      return jsonResponse({ ok: true, ignored: true, event: body.event })
    }

    const { data: currentStore, error: currentStoreError } = await supabase
      .from('stores')
      .select('id, plan, subscription_expires_at')
      .eq('id', storeId)
      .maybeSingle()

    if (currentStoreError) {
      return jsonResponse({ error: 'store_lookup_failed', details: currentStoreError.message }, 500)
    }

    if (!currentStore) {
      return jsonResponse({ error: 'store_not_found', storeId }, 404)
    }

    const nowIso = new Date().toISOString()
    const currentExpiry = currentStore.subscription_expires_at
    const periodStart =
      currentExpiry && new Date(currentExpiry).getTime() > Date.now() ? currentExpiry : nowIso
    const periodEnd = addMonths(periodStart, 1)
    const paymentMethodId =
      payment.payment_method?.saved && payment.payment_method?.id ? payment.payment_method.id : null

    const { error: paymentLogError } = await supabase
      .from('subscription_payments')
      .upsert(
        {
          store_id: storeId,
          yookassa_payment_id: payment.id,
          payment_type: paymentType,
          status: payment.status,
          amount: Number(payment.amount?.value ?? 0),
          currency: payment.amount?.currency ?? 'RUB',
          paid: Boolean(payment.paid),
          plan,
          billing_interval: payment.metadata?.interval ?? 'month',
          period_start: periodStart,
          period_end: periodEnd,
          paid_at: payment.created_at ?? nowIso,
          processed_at: nowIso,
          payment_method_id: paymentMethodId,
          metadata: payment.metadata ?? null,
          payload: payment,
        },
        { onConflict: 'yookassa_payment_id' },
      )

    if (paymentLogError) {
      return jsonResponse({ error: 'payment_log_failed', details: paymentLogError.message }, 500)
    }

    const { data, error } = await supabase
      .from('stores')
      .update({
        plan: 'pro',
        subscription_status: 'active',
        subscription_started_at: nowIso,
        subscription_expires_at: periodEnd,
      })
      .eq('id', storeId)
      .select('id, plan, subscription_status, subscription_expires_at')
      .maybeSingle()

    console.log('YOOKASSA UPDATE RESULT:', {
      storeId,
      data,
      error: error?.message ?? null,
    })

    if (error) {
      return jsonResponse(
        {
          error: 'update_failed',
          details: error.message,
        },
        500,
      )
    }

    if (!data) {
      return jsonResponse(
        {
          error: 'store_not_found',
          storeId,
        },
        404,
      )
    }

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

    if (privateError) {
      return jsonResponse({ error: 'private_subscription_update_failed', details: privateError.message }, 500)
    }

    return jsonResponse({
      ok: true,
      store: data,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error'

    console.log('YOOKASSA WEBHOOK ERROR:', message)

    return jsonResponse(
      {
        error: message.startsWith('missing_env:') ? 'missing_env' : 'internal_error',
        details: message,
      },
      500,
    )
  }
})
