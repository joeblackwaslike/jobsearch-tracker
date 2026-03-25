import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { corsJson, corsOptions } from "@/lib/extension/cors";

const ExchangeRequest = z.object({
  code: z.string(),
  code_verifier: z.string(),
});

export const Route = createFileRoute("/api/extension/google-exchange")({
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

        const result = ExchangeRequest.safeParse(body);
        if (!result.success) {
          return corsJson({ error: result.error.issues[0]?.message ?? "Invalid request" }, 400);
        }

        const { code, code_verifier } = result.data;

        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/auth/v1/token?grant_type=pkce`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            },
            body: JSON.stringify({ auth_code: code, code_verifier }),
          },
        );

        const data = await res.json();
        if (!res.ok) {
          return corsJson({ error: data.error_description ?? data.error ?? "Exchange failed" }, 401);
        }

        return corsJson({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        });
      },
    },
  },
});
