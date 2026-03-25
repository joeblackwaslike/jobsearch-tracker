import { createFileRoute } from "@tanstack/react-router";
import { corsJson, corsOptions } from "@/lib/extension/cors";

export const Route = createFileRoute("/api/extension/google-oauth-url")({
  server: {
    handlers: {
      OPTIONS: async () => corsOptions(),

      GET: async ({ request }) => {
        const url = new URL(request.url);
        const redirectTo = url.searchParams.get("redirect_to");
        const codeChallenge = url.searchParams.get("code_challenge");

        if (!redirectTo || !codeChallenge) {
          return corsJson({ error: "Missing redirect_to or code_challenge" }, 400);
        }

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const authUrl = new URL(`${supabaseUrl}/auth/v1/authorize`);
        authUrl.searchParams.set("provider", "google");
        authUrl.searchParams.set("redirect_to", redirectTo);
        authUrl.searchParams.set("code_challenge", codeChallenge);
        authUrl.searchParams.set("code_challenge_method", "S256");

        return corsJson({ url: authUrl.toString() });
      },
    },
  },
});
