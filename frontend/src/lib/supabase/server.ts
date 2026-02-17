import { createServerClient } from "@supabase/ssr";
import {
  getCookies,
  setCookie,
} from "@tanstack/react-start/server";
import type { Database } from "./types";

export function createServerSupabaseClient() {
  return createServerClient<Database>(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return Object.entries(getCookies()).map(([name, value]) => ({
            name,
            value: value ?? "",
          }));
        },
        setAll(cookies) {
          cookies.forEach(({ name, value, options }) => {
            setCookie(name, value, options);
          });
        },
      },
    }
  );
}
