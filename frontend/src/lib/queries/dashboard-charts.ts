import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AppRow = {
  status: string;
  source: string | null;
  created_at: string;
  applied_at: string | null;
};

export type FunnelStage = { label: string; count: number };
export type TrendPoint = { month: string; count: number };
export type DistributionItem = { name: string; value: number };

export type ChartData = {
  funnel: FunnelStage[];
  trends: TrendPoint[];
  statusDistribution: DistributionItem[];
  sourceDistribution: DistributionItem[];
  successMetrics: {
    responseRate: number;
    interviewRate: number;
    offerRate: number;
    acceptanceRate: number;
    totalApplied: number;
  };
};

// ---------------------------------------------------------------------------
// Data computation
// ---------------------------------------------------------------------------

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function computeChartData(rows: AppRow[]): ChartData {
  // Funnel — cumulative: how many made it to each stage
  const applied = rows.filter(
    (r) =>
      r.applied_at != null ||
      ["applied", "interviewing", "offer", "accepted", "rejected"].includes(r.status),
  ).length;
  const interviewing = rows.filter((r) =>
    ["interviewing", "offer", "accepted"].includes(r.status),
  ).length;
  const offer = rows.filter((r) => ["offer", "accepted"].includes(r.status)).length;
  const accepted = rows.filter((r) => r.status === "accepted").length;

  const funnel: FunnelStage[] = [
    { label: "Applied", count: applied },
    { label: "Interviewing", count: interviewing },
    { label: "Offer", count: offer },
    { label: "Accepted", count: accepted },
  ];

  // Trends — last 12 months by created_at
  const now = new Date();
  const buckets = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    return {
      year: d.getFullYear(),
      month: d.getMonth(),
      label: d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      count: 0,
    };
  });

  for (const row of rows) {
    const d = new Date(row.created_at);
    const bucket = buckets.find((b) => b.year === d.getFullYear() && b.month === d.getMonth());
    if (bucket) bucket.count++;
  }

  const trends: TrendPoint[] = buckets.map((b) => ({
    month: b.label,
    count: b.count,
  }));

  // Status distribution
  const statusCounts: Record<string, number> = {};
  for (const row of rows) {
    statusCounts[row.status] = (statusCounts[row.status] ?? 0) + 1;
  }
  const statusDistribution: DistributionItem[] = Object.entries(statusCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name: capitalize(name), value }));

  // Source distribution
  const sourceCounts: Record<string, number> = {};
  for (const row of rows) {
    const src = row.source ? capitalize(row.source) : "Unknown";
    sourceCounts[src] = (sourceCounts[src] ?? 0) + 1;
  }
  const sourceDistribution: DistributionItem[] = Object.entries(sourceCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));

  // Success metrics
  const responded = rows.filter((r) =>
    ["interviewing", "offer", "accepted", "rejected"].includes(r.status),
  ).length;

  const responseRate = applied > 0 ? (responded / applied) * 100 : 0;
  const interviewRate = applied > 0 ? (interviewing / applied) * 100 : 0;
  const offerRate = applied > 0 ? (offer / applied) * 100 : 0;
  const acceptanceRate = offer + accepted > 0 ? (accepted / (offer + accepted)) * 100 : 0;

  return {
    funnel,
    trends,
    statusDistribution,
    sourceDistribution,
    successMetrics: {
      responseRate,
      interviewRate,
      offerRate,
      acceptanceRate,
      totalApplied: applied,
    },
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useDashboardCharts() {
  const supabase = createClient();
  return useQuery({
    queryKey: ["dashboard", "charts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("status, source, created_at, applied_at");
      if (error) throw error;
      return computeChartData((data as AppRow[]) ?? []);
    },
  });
}
