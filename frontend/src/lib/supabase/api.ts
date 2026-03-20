// Server-side only — do not import from client components or route loaders.
// Use src/lib/supabase/client.ts for browser-side Supabase access.
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

export function createAnonApiClient() {
  return createClient<Database>(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY,
  );
}

export function createServiceApiClient() {
  const serviceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }
  return createClient<Database>(import.meta.env.VITE_SUPABASE_URL, serviceRoleKey);
}
