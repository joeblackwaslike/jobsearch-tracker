import { PieChartIcon, TargetIcon, TrendingUpIcon } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardCharts } from "@/lib/queries/dashboard-charts";

// ---------------------------------------------------------------------------
// Application Trends Chart
// ---------------------------------------------------------------------------

export function ApplicationTrendsChart() {
  const { data, isLoading } = useDashboardCharts();

  const trends = data?.trends ?? [];
  const hasData = trends.some((t) => t.count > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Application Trends</CardTitle>
        <CardDescription>Applications over time</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-48 animate-pulse rounded-md bg-muted" />
        ) : !hasData ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <TrendingUpIcon className="mb-3 size-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Add applications to see trends over time</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={192}>
            <AreaChart data={trends} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
              <defs>
                <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  borderRadius: "6px",
                  border: "1px solid var(--color-border)",
                  background: "var(--color-card)",
                  color: "var(--color-foreground)",
                }}
              />
              <Area
                type="monotone"
                dataKey="count"
                name="Applications"
                stroke="#7C3AED"
                fill="url(#trendGrad)"
                strokeWidth={2}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Distribution Chart
// ---------------------------------------------------------------------------

const STATUS_COLORS: Record<string, string> = {
  Applied: "#7C3AED",
  Interviewing: "#D97706",
  Offer: "#059669",
  Accepted: "#065F46",
  Rejected: "#DC2626",
  Withdrawn: "#6B7280",
};

function getStatusColor(name: string): string {
  return STATUS_COLORS[name] ?? "#94A3B8";
}

export function DistributionChart() {
  const { data, isLoading } = useDashboardCharts();

  const distribution = (data?.statusDistribution ?? []).map((item) => ({
    ...item,
    fill: getStatusColor(item.name),
  }));
  const hasData = distribution.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Status Distribution</CardTitle>
        <CardDescription>Breakdown by application status</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-48 animate-pulse rounded-md bg-muted" />
        ) : !hasData ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <PieChartIcon className="mb-3 size-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Add applications to see distribution</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={192}>
            <BarChart
              data={distribution}
              layout="vertical"
              margin={{ top: 4, right: 32, bottom: 0, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
              <XAxis
                type="number"
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                tickLine={false}
                axisLine={false}
                width={80}
              />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  borderRadius: "6px",
                  border: "1px solid var(--color-border)",
                  background: "var(--color-card)",
                  color: "var(--color-foreground)",
                }}
              />
              <Bar dataKey="value" name="Count" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Success Metrics Chart
// ---------------------------------------------------------------------------

interface MetricItem {
  label: string;
  value: number;
  suffix: string;
  color: string;
}

export function SuccessMetricsChart() {
  const { data, isLoading } = useDashboardCharts();

  const m = data?.successMetrics;
  const hasData = m && m.totalApplied > 0;

  const metrics: MetricItem[] = m
    ? [
        { label: "Response Rate", value: m.responseRate, suffix: "%", color: "#7C3AED" },
        { label: "Interview Rate", value: m.interviewRate, suffix: "%", color: "#D97706" },
        { label: "Offer Rate", value: m.offerRate, suffix: "%", color: "#059669" },
        { label: "Acceptance Rate", value: m.acceptanceRate, suffix: "%", color: "#065F46" },
      ]
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Success Metrics</CardTitle>
        <CardDescription>Key performance indicators</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-48 animate-pulse rounded-md bg-muted" />
        ) : !hasData ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <TargetIcon className="mb-3 size-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Add applications to see success metrics</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {metrics.map((metric) => (
              <div key={metric.label} className="space-y-1">
                <p className="text-xs text-muted-foreground">{metric.label}</p>
                <p className="text-2xl font-bold" style={{ color: metric.color }}>
                  {Math.round(metric.value)}
                  {metric.suffix}
                </p>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, metric.value)}%`,
                      backgroundColor: metric.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
