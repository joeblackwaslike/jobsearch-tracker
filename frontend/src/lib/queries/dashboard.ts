import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { EventWithApplication } from "./events";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DashboardStats = {
  total_applications: number;
  interviews_upcoming: number;
  active_applications: number;
  offers: number;
  rejections: number;
  contacts: number;
  companies: number;
  response_rate: number;
};

// ---------------------------------------------------------------------------
// Hooks — queries
// ---------------------------------------------------------------------------

export function useDashboardStats() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_dashboard_stats");
      if (error) throw error;
      return (
        (data as unknown as DashboardStats) ?? {
          total_applications: 0,
          interviews_upcoming: 0,
          active_applications: 0,
          offers: 0,
          rejections: 0,
          contacts: 0,
          companies: 0,
          response_rate: 0,
        }
      );
    },
  });
}

export function useRecentActivity() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["dashboard", "recent-activity"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*, application:applications(id, position, company:companies(id, name))")
        .order("created_at", { ascending: false })
        .limit(15);
      if (error) throw error;
      return data as unknown as EventWithApplication[];
    },
  });
}
