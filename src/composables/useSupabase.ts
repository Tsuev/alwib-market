import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase env vars are missing: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
}

type GlobalWithSupabase = typeof globalThis & {
  __supabaseClient?: SupabaseClient<Database>
}

const globalWithSupabase = globalThis as GlobalWithSupabase

const supabase =
  globalWithSupabase.__supabaseClient ??
  createClient<Database>(supabaseUrl, supabaseKey)

globalWithSupabase.__supabaseClient = supabase

export const useSupabase = () => {
  return { supabase }
}
