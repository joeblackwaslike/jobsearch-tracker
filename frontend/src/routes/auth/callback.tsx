import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("code");
    if (!code) {
      navigate({ to: "/login" });
      return;
    }
    const supabase = createClient();
    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        console.error("[auth/callback] exchangeCodeForSession failed:", error.message);
        navigate({ to: "/login" });
      } else {
        navigate({ to: "/dashboard" });
      }
    });
  }, [navigate]);

  return null;
}
