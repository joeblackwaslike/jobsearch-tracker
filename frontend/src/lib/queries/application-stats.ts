import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ApplicationStats {
  total: number;
  active: number;
  responseRate: number;
  interviews: number;
}

export interface ApplicationStatsResult {
  allTime: ApplicationStats;
  thisWeek: ApplicationStats;
  isLoading: boolean;
}

type Application = Tables<"applications">;
type Event = Tables<"events">;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns ISO string for Monday 00:00:00 of current ISO week.
 * Handles Sunday (day 0) as subtracting 6 days to get to Monday.
 */
function getMondayOfCurrentWeek(): string {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday, 1 = Monday, etc.

  // Calculate days to subtract to get to Monday
  // Sunday (0) -> subtract 6 days
  // Monday (1) -> subtract 0 days
  // Tuesday (2) -> subtract 1 day
  // etc.
  const daysToSubtract = day === 0 ? 6 : day - 1;

  const monday = new Date(now);
  monday.setDate(now.getDate() - daysToSubtract);
  monday.setHours(0, 0, 0, 0);

  return monday.toISOString();
}

/**
 * Computes application statistics from application data.
 */
function computeStats(applications: Application[], events: Event[]): ApplicationStats {
  const total = applications.length;

  // Active: status IN ('applied', 'interviewing', 'offer')
  const active = applications.filter(
    (app) => app.status === "applied" || app.status === "interviewing" || app.status === "offer",
  ).length;

  // Response rate: (applied with status NOT 'bookmarked') / (all non-bookmarked)
  const nonBookmarked = applications.filter((app) => app.status !== "bookmarked");
  const responded = nonBookmarked.filter((app) => app.status !== "applied");
  const responseRate =
    nonBookmarked.length > 0 ? Math.round((responded.length / nonBookmarked.length) * 100) : 0;

  // Interviews: total events count
  const interviews = events.length;

  return {
    total,
    active,
    responseRate,
    interviews,
  };
}

/**
 * Fetches applications with specified filters.
 */
async function fetchApplications(
  supabase: ReturnType<typeof createClient>,
  createdAfter?: string,
): Promise<Application[]> {
  let query = supabase
    .from("applications")
    .select("id, status, created_at, applied_at")
    .is("archived_at", null);

  if (createdAfter) {
    query = query.gte("created_at", createdAfter);
  }

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  return data as Application[];
}

/**
 * Fetches events count.
 */
async function fetchEventsCount(
  supabase: ReturnType<typeof createClient>,
  createdAfter?: string,
): Promise<Event[]> {
  let query = supabase.from("events").select("id, created_at");

  if (createdAfter) {
    query = query.gte("created_at", createdAfter);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Event[];
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useApplicationStats(): ApplicationStatsResult {
  const supabase = createClient();

  const { data: applications, isLoading: isLoadingApps } = useQuery<Application[]>({
    queryKey: ["applications", "stats", "allTime"],
    queryFn: () => fetchApplications(supabase),
  });

  const { data: thisWeekApplications } = useQuery<Application[]>({
    queryKey: ["applications", "stats", "thisWeek"],
    queryFn: () => fetchApplications(supabase, getMondayOfCurrentWeek()),
  });

  const { data: events, isLoading: isLoadingEvents } = useQuery<Event[]>({
    queryKey: ["events", "stats", "allTime"],
    queryFn: () => fetchEventsCount(supabase),
  });

  const { data: thisWeekEvents } = useQuery<Event[]>({
    queryKey: ["events", "stats", "thisWeek"],
    queryFn: () => fetchEventsCount(supabase, getMondayOfCurrentWeek()),
  });

  const allTime: ApplicationStats =
    applications && events
      ? computeStats(applications, events)
      : { total: 0, active: 0, responseRate: 0, interviews: 0 };

  const thisWeek: ApplicationStats =
    thisWeekApplications && thisWeekEvents
      ? computeStats(thisWeekApplications, thisWeekEvents)
      : { total: 0, active: 0, responseRate: 0, interviews: 0 };

  return {
    allTime,
    thisWeek,
    isLoading: isLoadingApps || isLoadingEvents,
  };
}
