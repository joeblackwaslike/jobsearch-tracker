import { createFileRoute } from "@tanstack/react-router";
import { corsJson, corsOptions } from "@/lib/extension/cors";
import { RefreshRequest } from "@/lib/openapi/schemas";
import { createAnonApiClient } from "@/lib/supabase/api";

export const Route = createFileRoute("/api/extension/refresh")({
  server: {
    handlers: {
      OPTIONS: async () => corsOptions(),

      POST: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return corsJson({ error: "Invalid JSON" }, 400);
        }

        const result = RefreshRequest.safeParse(body);
        if (!result.success) {
          return corsJson({ error: result.error.issues[0]?.message ?? "Invalid request" }, 400);
        }
        const { refresh_token } = result.data;

        const supabase = createAnonApiClient();
        const { data, error } = await supabase.auth.refreshSession({ refresh_token });

        if (error || !data.session) {
          return corsJson({ error: "Invalid or expired refresh token" }, 401);
        }

        return corsJson({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
      },
    },
  },
});
