import { createAPIFileRoute } from "@tanstack/react-start/api"
import { corsJson, corsOptions } from "@/lib/extension/cors"
import { createAnonApiClient } from "@/lib/supabase/api"

export const APIRoute = createAPIFileRoute("/api/extension/signin")({
  OPTIONS: async () => corsOptions(),

  POST: async ({ request }) => {
    let body: { email?: string; password?: string }
    try {
      body = await request.json()
    } catch {
      return corsJson({ error: "Invalid JSON" }, 400)
    }

    const { email, password } = body
    if (!email || !password) {
      return corsJson({ error: "email and password are required" }, 400)
    }

    const supabase = createAnonApiClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error || !data.session) {
      return corsJson({ error: "Invalid credentials" }, 401)
    }

    return corsJson({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    })
  },
})
