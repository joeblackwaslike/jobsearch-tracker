import { BriefcaseIcon, CalendarIcon, PercentIcon, TrendingUpIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useApplicationStats } from "@/lib/queries/application-stats";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  format?: "number" | "percentage";
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function formatValue(value: number | string, format: "number" | "percentage" = "number"): string {
  if (value === "--") return value;

  if (format === "percentage") {
    return `${value}%`;
  }

  if (typeof value === "number") {
    return value.toLocaleString();
  }

  return String(value);
}

function StatCard({ title, value, icon: Icon, format }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{formatValue(value, format)}</p>
          </div>
          <Icon className="size-5 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}

interface StatsRowProps {
  title: string;
  stats: {
    total: number;
    active: number;
    responseRate: number;
    interviews: number;
  };
  isLoading?: boolean;
}

function StatsRow({ title, stats, isLoading }: StatsRowProps) {
  const valueOrDash = (value: number): number | string => (isLoading ? "--" : value);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard title="Total" value={valueOrDash(stats.total)} icon={BriefcaseIcon} />
        <StatCard title="Active" value={valueOrDash(stats.active)} icon={TrendingUpIcon} />
        <StatCard
          title="Response rate"
          value={valueOrDash(stats.responseRate)}
          icon={PercentIcon}
          format="percentage"
        />
        <StatCard title="Interviews" value={valueOrDash(stats.interviews)} icon={CalendarIcon} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function ApplicationStats() {
  const { allTime, thisWeek, isLoading } = useApplicationStats();

  return (
    <div className="space-y-6">
      <StatsRow title="All time" stats={allTime} isLoading={isLoading} />
      <StatsRow title="This week" stats={thisWeek} isLoading={isLoading} />
    </div>
  );
}
