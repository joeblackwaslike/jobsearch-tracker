import { createAPIFileRoute } from "@tanstack/react-start/api"
import { corsJson, corsOptions } from "@/lib/extension/cors"
import { createServiceApiClient } from "@/lib/supabase/api"
import {
  findOrCreateCompany,
  checkRecentDuplicate,
  createApplication,
} from "@/lib/extension/track-service"

export const APIRoute = createAPIFileRoute("/api/extension/track")({
  OPTIONS: async () => corsOptions(),

  POST: async ({ request }) => {
    // Validate Authorization header
    const authHeader = request.headers.get("Authorization")
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null
    if (!token) {
      return corsJson({ error: "Unauthorized" }, 401)
    }

    // Parse body
    let body: { company_name?: string; position?: string; url?: string }
    try {
      body = await request.json()
    } catch {
      return corsJson({ error: "Invalid JSON" }, 400)
    }

    const { company_name, position, url } = body
    if (!company_name || !position || !url) {
      return corsJson({ error: "company_name, position, and url are required" }, 400)
    }

    // Validate JWT
    const client = createServiceApiClient()
    const {
      data: { user },
      error: authError,
    } = await client.auth.getUser(token)

    if (authError || !user) {
      return corsJson({ error: "Unauthorized" }, 401)
    }

    try {
      const companyId = await findOrCreateCompany(client, user.id, company_name)

      const existingId = await checkRecentDuplicate(client, user.id, companyId, position)
      if (existingId) {
        return corsJson(
          { error: "Application already tracked", application_id: existingId },
          409,
        )
      }

      const applicationId = await createApplication(client, user.id, companyId, position, url)
      return corsJson({ application_id: applicationId, company_id: companyId })
    } catch (err) {
      console.error("Track error:", err)
      return corsJson({ error: "Internal server error" }, 500)
    }
  },
})
