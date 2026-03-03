import type { LucideIcon } from "lucide-react";
import { FilterIcon, PieChartIcon, TargetIcon, TrendingUpIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

interface ChartPlaceholderConfig {
  title: string;
  subtitle: string;
  emptyMessage: string;
  icon: LucideIcon;
}

const CHART_PLACEHOLDERS: ChartPlaceholderConfig[] = [
  {
    title: "Application Funnel",
    subtitle: "Conversion through stages",
    emptyMessage: "Add applications to see your funnel",
    icon: FilterIcon,
  },
  {
    title: "Application Trends",
    subtitle: "Applications over time",
    emptyMessage: "Add applications to see trends over time",
    icon: TrendingUpIcon,
  },
  {
    title: "Distribution",
    subtitle: "Breakdown by category",
    emptyMessage: "Add applications to see distribution",
    icon: PieChartIcon,
  },
  {
    title: "Success Metrics",
    subtitle: "Key performance indicators",
    emptyMessage: "Add applications to see success metrics",
    icon: TargetIcon,
  },
];

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function ChartPlaceholderCard({ config }: { config: ChartPlaceholderConfig }) {
  const Icon = config.icon;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{config.title}</CardTitle>
        <CardDescription>{config.subtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Icon className="mb-3 size-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">{config.emptyMessage}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function ApplicationFunnelChart() {
  return <ChartPlaceholderCard config={CHART_PLACEHOLDERS[0]} />;
}

export function ApplicationTrendsChart() {
  return <ChartPlaceholderCard config={CHART_PLACEHOLDERS[1]} />;
}

export function DistributionChart() {
  return <ChartPlaceholderCard config={CHART_PLACEHOLDERS[2]} />;
}

export function SuccessMetricsChart() {
  return <ChartPlaceholderCard config={CHART_PLACEHOLDERS[3]} />;
}
