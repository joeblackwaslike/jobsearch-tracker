import type { CookieOptions } from "@supabase/ssr";
import { createServerClient } from "@supabase/ssr";
import { createFileRoute } from "@tanstack/react-router";
import type { Database } from "@/lib/supabase/types";

function serializeCookie(name: string, value: string, options?: CookieOptions): string {
  let str = `${name}=${encodeURIComponent(value)}`;
  if (options?.maxAge !== undefined) str += `; Max-Age=${Math.floor(options.maxAge)}`;
  if (options?.domain) str += `; Domain=${options.domain}`;
  str += `; Path=${options?.path ?? "/"}`;
  if (options?.expires) str += `; Expires=${options.expires.toUTCString()}`;
  if (options?.httpOnly) str += `; HttpOnly`;
  if (options?.secure) str += `; Secure`;
  if (options?.sameSite) {
    const ss = options.sameSite;
    const val = ss === true ? "Strict" : String(ss).charAt(0).toUpperCase() + String(ss).slice(1);
    str += `; SameSite=${val}`;
  }
  return str;
}

export const Route = createFileRoute("/auth/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");

        if (!code) {
          return Response.redirect(new URL("/login", url.origin).toString(), 302);
        }

        // Parse incoming cookies so Supabase can read the PKCE code verifier if present
        const cookieHeader = request.headers.get("cookie") ?? "";
        const parsedCookies = cookieHeader
          ? cookieHeader.split(";").map((pair) => {
              const idx = pair.indexOf("=");
              if (idx < 0) return { name: pair.trim(), value: "" };
              return {
                name: pair.slice(0, idx).trim(),
                value: decodeURIComponent(pair.slice(idx + 1).trim()),
              };
            })
          : [];

        // Capture cookies Supabase wants to set (session tokens)
        const pendingCookies: Array<{ name: string; value: string; options: CookieOptions }> = [];

        const supabase = createServerClient<Database>(
          import.meta.env.VITE_SUPABASE_URL!,
          import.meta.env.VITE_SUPABASE_ANON_KEY!,
          {
            cookies: {
              getAll() {
                return parsedCookies;
              },
              setAll(cookiesToSet) {
                pendingCookies.push(...cookiesToSet);
              },
            },
          },
        );

        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          console.error("[auth/callback] exchangeCodeForSession failed:", error.message, error);
        }

        const destination = error
          ? new URL(`/login?auth_error=${encodeURIComponent(error.message)}`, url.origin).toString()
          : new URL("/dashboard", url.origin).toString();

        const headers = new Headers({ Location: destination });
        for (const { name, value, options } of pendingCookies) {
          headers.append("Set-Cookie", serializeCookie(name, value, options));
        }

        return new Response(null, { status: 302, headers });
      },
    },
  },
  component: () => null,
});
