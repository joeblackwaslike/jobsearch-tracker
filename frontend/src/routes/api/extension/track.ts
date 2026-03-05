import { createFileRoute } from "@tanstack/react-router";
import { corsJson, corsOptions } from "@/lib/extension/cors";
import {
  checkRecentDuplicate,
  createApplication,
  findOrCreateCompany,
} from "@/lib/extension/track-service";
import { TrackRequest } from "@/lib/openapi/schemas";
import { createServiceApiClient } from "@/lib/supabase/api";

export const Route = createFileRoute("/api/extension/track")({
  server: {
    handlers: {
      OPTIONS: async () => corsOptions(),

      POST: async ({ request }) => {
        const authHeader = request.headers.get("Authorization");
        const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
        if (!token) {
          return corsJson({ error: "Unauthorized" }, 401);
        }

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return corsJson({ error: "Invalid JSON" }, 400);
        }

        const result = TrackRequest.safeParse(body);
        if (!result.success) {
          return corsJson({ error: result.error.issues[0]?.message ?? "Invalid request" }, 400);
        }
        const { company_name, position, url } = result.data;

        const client = createServiceApiClient();
        const {
          data: { user },
          error: authError,
        } = await client.auth.getUser(token);

        if (authError || !user) {
          return corsJson({ error: "Unauthorized" }, 401);
        }

        try {
          const companyId = await findOrCreateCompany(client, user.id, company_name);

          const existingId = await checkRecentDuplicate(client, user.id, companyId, position);
          if (existingId) {
            return corsJson(
              { error: "Application already tracked", application_id: existingId },
              409,
            );
          }

          const applicationId = await createApplication(client, user.id, companyId, position, url);
          return corsJson({ application_id: applicationId, company_id: companyId });
        } catch (err) {
          console.error("Track error:", err);
          return corsJson({ error: "Internal server error" }, 500);
        }
      },
    },
  },
});
