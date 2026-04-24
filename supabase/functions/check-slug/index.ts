import { createClient } from 'jsr:@supabase/supabase-js@2'

const RESERVED_SLUGS = new Set([
  'test', 'admin', 'store', 'shop', 'market', 'alwib',
  'api', 'auth', 'login', 'logout', 'signup', 'dashboard',
  'settings', 'account', 'profile', 'help', 'support',
  'www', 'mail', 'ftp', 'static', 'assets', 'cdn', 'preview',
])

// минимум 2 символа, только строчные буквы/цифры/дефис, не начинается и не заканчивается дефисом
const SLUG_RE = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]{1}$/

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  let slug: string | undefined
  try {
    const body = await req.json()
    slug = typeof body.slug === 'string' ? body.slug.toLowerCase().trim() : undefined
  } catch {
    return Response.json({ available: false, reason: 'invalid' }, { headers: corsHeaders })
  }

  if (!slug) {
    return Response.json({ available: false, reason: 'invalid' }, { headers: corsHeaders })
  }

  if (!SLUG_RE.test(slug)) {
    return Response.json({ available: false, reason: 'invalid' }, { headers: corsHeaders })
  }

  if (RESERVED_SLUGS.has(slug)) {
    return Response.json({ available: false, reason: 'reserved' }, { headers: corsHeaders })
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // Определяем текущего пользователя чтобы исключить его магазин при редактировании
  let currentUserId: string | null = null
  const authHeader = req.headers.get('Authorization')
  if (authHeader) {
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )
    const { data: { user } } = await userClient.auth.getUser()
    currentUserId = user?.id ?? null
  }

  let query = supabaseAdmin
    .from('stores')
    .select('id')
    .eq('slug', slug)

  if (currentUserId) {
    query = query.neq('user_id', currentUserId)
  }

  const { data, error } = await query.maybeSingle()

  if (error) {
    return Response.json({ available: false, reason: 'error' }, { status: 500, headers: corsHeaders })
  }

  return Response.json(
    { available: data === null, reason: data ? 'taken' : undefined },
    { headers: corsHeaders },
  )
})
