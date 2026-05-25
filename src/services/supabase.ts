import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Supabase] VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não configurados!')
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    global: {
      // Timeout de 12 segundos — evita loading infinito
      fetch: (url, options) => {
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), 12000)
        return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer))
      }
    }
  }
)
