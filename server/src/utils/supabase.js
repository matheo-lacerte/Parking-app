import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const url = process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

if (!url) {
  console.warn('[supabase] SUPABASE_URL manquant dans .env')
}
if (!serviceRoleKey) {
  console.warn('[supabase] Aucune clé fournie (SERVICE_ROLE ou ANON).')
}
if (serviceRoleKey && serviceRoleKey.startsWith('eyJhbGciOi')) {
  // Basic length sanity check
  if (serviceRoleKey.length < 100) {
    console.warn('[supabase] Clé semble trop courte, vérifier copier/coller.')
  }
}

export const supabase = createClient(url, serviceRoleKey, {
  auth: {
    persistSession: false
  }
})
