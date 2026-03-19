import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Browser/public client — lazy singleton
let _supabase: SupabaseClient | null = null
export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    _supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return _supabase
}

// Server-side admin client — lazy singleton for API routes
let _supabaseAdmin: SupabaseClient | null = null
export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) {
      throw new Error(
        'SUPABASE_SERVICE_ROLE_KEY is not set. ' +
        'Make sure the environment variable is configured.'
      )
    }
    _supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey
    )
  }
  return _supabaseAdmin
}

// Convenience exports for backward compat
export const supabaseAdmin = {
  get from() { return getSupabaseAdmin().from.bind(getSupabaseAdmin()) },
}
