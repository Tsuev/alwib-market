import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type RequestBody =
  | { entity: 'store'; id: number }
  | { entity: 'product'; id: string }

function isValidBody(body: unknown): body is RequestBody {
  if (!body || typeof body !== 'object') return false

  const entity = Reflect.get(body, 'entity')
  const id = Reflect.get(body, 'id')

  if (entity === 'store') {
    return typeof id === 'number' && Number.isInteger(id) && id > 0
  }

  if (entity === 'product') {
    return typeof id === 'string' && id.trim().length > 0
  }

  return false
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  let body: RequestBody
  try {
    const json = await req.json()
    if (!isValidBody(json)) {
      return Response.json({ error: 'invalid_payload' }, { status: 400, headers: corsHeaders })
    }
    body = json
  } catch {
    return Response.json({ error: 'invalid_payload' }, { status: 400, headers: corsHeaders })
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const rpcName =
    body.entity === 'store' ? 'increment_store_views' : 'increment_product_views'
  const params =
    body.entity === 'store'
      ? { p_store_id: body.id }
      : { p_product_id: body.id }

  const { data, error } = await supabaseAdmin.rpc(rpcName, params)

  if (error) {
    return Response.json(
      { error: 'increment_failed', details: error.message },
      { status: 500, headers: corsHeaders },
    )
  }

  if (data === null) {
    return Response.json({ error: 'not_found' }, { status: 404, headers: corsHeaders })
  }

  return Response.json({ ok: true, views: data }, { headers: corsHeaders })
})
