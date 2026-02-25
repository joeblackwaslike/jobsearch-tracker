import { createFileRoute } from "@tanstack/react-router";
import {
  ApplicationFunnelChart,
  ApplicationTrendsChart,
  DistributionChart,
  SuccessMetricsChart,
} from "@/components/dashboard/chart-placeholders";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { StatsCards } from "@/components/dashboard/stats-cards";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <div className="space-y-6 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your job search progress</p>
      </div>

      {/* Stats cards row */}
      <StatsCards />

      {/* Charts grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <ApplicationFunnelChart />
          <ApplicationTrendsChart />
        </div>
        <div className="space-y-6">
          <DistributionChart />
          <SuccessMetricsChart />
        </div>
      </div>

      {/* Quick Actions + Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        <QuickActions />
        <RecentActivity />
      </div>
    </div>
  );
}
