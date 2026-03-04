import { createAPIFileRoute } from "@tanstack/react-start/api"
import { corsJson, corsOptions } from "@/lib/extension/cors"
import { createAnonApiClient } from "@/lib/supabase/api"

export const APIRoute = createAPIFileRoute("/api/extension/refresh")({
  OPTIONS: async () => corsOptions(),

  POST: async ({ request }) => {
    let body: { refresh_token?: string }
    try {
      body = await request.json()
    } catch {
      return corsJson({ error: "Invalid JSON" }, 400)
    }

    const { refresh_token } = body
    if (!refresh_token) {
      return corsJson({ error: "refresh_token is required" }, 400)
    }

    const supabase = createAnonApiClient()
    const { data, error } = await supabase.auth.refreshSession({ refresh_token })

    if (error || !data.session) {
      return corsJson({ error: "Invalid or expired refresh token" }, 401)
    }

    return corsJson({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    })
  },
})
