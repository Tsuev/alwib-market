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

    if (body.event !== 'payment.succeeded') {
      console.log('YOOKASSA WEBHOOK IGNORED EVENT:', body.event)
      return jsonResponse({ ok: true, ignored: true, event: body.event })
    }

    const payment = body.object

    if (!payment?.paid || payment?.status !== 'succeeded') {
      console.log('YOOKASSA WEBHOOK IGNORED PAYMENT:', JSON.stringify(payment))
      return jsonResponse({ ok: true, ignored: true })
    }

    const storeId = payment.metadata?.store_id
    const plan = payment.metadata?.plan

    console.log('YOOKASSA WEBHOOK METADATA:', { storeId, plan })

    if (!storeId || plan !== 'pro') {
      return jsonResponse(
        {
          error: 'invalid_metadata',
          metadata: payment.metadata ?? null,
        },
        400,
      )
    }

    const supabase = createClient(
      getRequiredEnv('SUPABASE_URL'),
      getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
    )

    const { data, error } = await supabase
      .from('stores')
      .update({ plan: 'pro' })
      .eq('id', storeId)
      .select('id, plan')
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