import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load env from default .env and also try .env.local for vercel dev
dotenv.config()
dotenv.config({ path: '.env.local' })

const url = process.env.SUPABASE_URL
const anonKey = process.env.SUPABASE_ANON_KEY
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url) {
  console.warn('[supabase] SUPABASE_URL manquant dans .env')
}
if (!anonKey && !serviceRoleKey) {
  console.warn('[supabase] Aucune clé fournie (SERVICE_ROLE ou ANON).')
}

// Two clients:
// - supabasePublic: use ANON key (required for auth.* methods)
// - supabaseAdmin: use SERVICE_ROLE key (for privileged DB operations)
export const supabasePublic = anonKey
  ? createClient(url, anonKey, { auth: { persistSession: false } })
  : null

export const supabaseAdmin = serviceRoleKey
  ? createClient(url, serviceRoleKey, { auth: { persistSession: false } })
  : null

// Backward export for existing imports (defaults to admin if present, else public)
export const supabase = supabaseAdmin || supabasePublic
