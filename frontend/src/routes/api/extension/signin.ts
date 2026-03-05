import { createFileRoute } from "@tanstack/react-router";
import { corsJson, corsOptions } from "@/lib/extension/cors";
import { SigninRequest } from "@/lib/openapi/schemas";
import { createAnonApiClient } from "@/lib/supabase/api";

export const Route = createFileRoute("/api/extension/signin")({
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

        const result = SigninRequest.safeParse(body);
        if (!result.success) {
          return corsJson({ error: result.error.issues[0]?.message ?? "Invalid request" }, 400);
        }
        const { email, password } = result.data;

        const supabase = createAnonApiClient();
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error || !data.session) {
          return corsJson({ error: "Invalid credentials" }, 401);
        }

        return corsJson({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
      },
    },
  },
});
