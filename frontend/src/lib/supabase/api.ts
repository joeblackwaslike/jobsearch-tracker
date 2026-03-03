// Server-side only — do not import from client components or route loaders.
// Use src/lib/supabase/client.ts for browser-side Supabase access.
import { createClient } from "@supabase/supabase-js"
import type { Database } from "./types"

export function createAnonApiClient() {
  return createClient<Database>(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY,
  )
}

export function createServiceApiClient() {
  return createClient<Database>(
    import.meta.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}
