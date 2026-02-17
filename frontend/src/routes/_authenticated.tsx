import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NavBar } from "@/components/layout/nav-bar";
import { PageShell } from "@/components/layout/page-shell";

const getUser = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    const user = await getUser();
    if (!user) {
      throw redirect({ to: "/login" });
    }
    return { user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <NavBar />
      <PageShell>
        <Outlet />
      </PageShell>
    </div>
  );
}
