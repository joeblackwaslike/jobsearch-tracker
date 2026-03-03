import {
  BarChartIcon,
  BriefcaseIcon,
  BuildingIcon,
  CalendarIcon,
  GiftIcon,
  type LucideIcon,
  TrendingUpIcon,
  UsersIcon,
  XCircleIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { type DashboardStats, useDashboardStats } from "@/lib/queries/dashboard";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StatCardConfig {
  title: string;
  key: keyof DashboardStats;
  icon: LucideIcon;
  format?: "number" | "percentage";
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const STAT_CARDS: StatCardConfig[] = [
  { title: "Total Applications", key: "total_applications", icon: BriefcaseIcon },
  { title: "Upcoming Interviews", key: "interviews_upcoming", icon: CalendarIcon },
  { title: "Active Applications", key: "active_applications", icon: TrendingUpIcon },
  { title: "Response Rate", key: "response_rate", icon: BarChartIcon, format: "percentage" },
  { title: "Offers", key: "offers", icon: GiftIcon },
  { title: "Rejections", key: "rejections", icon: XCircleIcon },
  { title: "Contacts", key: "contacts", icon: UsersIcon },
  { title: "Companies", key: "companies", icon: BuildingIcon },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function formatValue(value: number, format: "number" | "percentage" = "number") {
  if (format === "percentage") {
    return `${Math.round(value)}%`;
  }
  return value.toLocaleString();
}

export function StatsCards() {
  const { data: stats, isLoading } = useDashboardStats();

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {STAT_CARDS.map((card) => {
        const Icon = card.icon;
        const value = stats?.[card.key] ?? 0;

        return (
          <Card key={card.key}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{card.title}</p>
                  {isLoading ? (
                    <div className="h-8 w-16 animate-pulse rounded bg-muted" />
                  ) : (
                    <p className="text-2xl font-bold">{formatValue(value, card.format)}</p>
                  )}
                </div>
                <Icon className="size-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
