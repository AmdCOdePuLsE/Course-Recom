import { createClient } from '@supabase/supabase-js'
import { CONFIG } from './config.js'

let supabase = null
if (CONFIG.SUPABASE_URL && CONFIG.SUPABASE_SERVICE_ROLE) {
  supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_SERVICE_ROLE, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

export function getSupabase() { return supabase }
