import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const exchangeOAuthCode = createServerFn({ method: "GET" })
  .inputValidator((input: { code: string }) => input)
  .handler(async ({ data }) => {
    const supabase = createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(data.code);
    return { error: error?.message ?? null };
  });

export const Route = createFileRoute("/auth/callback")({
  validateSearch: (search: Record<string, unknown>) => ({
    code: search.code as string | undefined,
  }),
  beforeLoad: async ({ search }) => {
    if (!search.code) {
      throw redirect({ to: "/login" });
    }
    const { error } = await exchangeOAuthCode({ data: { code: search.code } });
    if (error) {
      throw redirect({ to: "/login" });
    }
    throw redirect({ to: "/dashboard" });
  },
  component: () => null,
});
