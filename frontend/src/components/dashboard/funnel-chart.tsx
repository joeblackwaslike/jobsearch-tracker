import { FilterIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardCharts } from "@/lib/queries/dashboard-charts";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// Colors per stage: Applied → Interviewing → Offer → Accepted
const FUNNEL_COLORS = ["#7C3AED", "#D97706", "#059669", "#065F46"];

// SVG layout
const SVG_W = 390;
const LABEL_END = 95; // right edge of label column
const BAR_START = 100; // left edge of funnel area
const MAX_BAR_W = 200; // widest possible bar (Applied = 100%)
const BAR_CX = BAR_START + MAX_BAR_W / 2; // horizontal center
const COUNT_X = BAR_START + MAX_BAR_W + 10; // left edge of count column
const MIN_BAR_W = 28; // narrowest bar (prevents zero-width slice)
const STAGE_H = 48; // height of each trapezoid
const TOP_PAD = 8;
const SVG_H = TOP_PAD + 4 * STAGE_H + 10;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ApplicationFunnelChart() {
  const { data, isLoading } = useDashboardCharts();

  const stages = data?.funnel ?? [];
  const maxCount = stages[0]?.count ?? 0;
  const hasData = maxCount > 0;

  // Width of each stage bar, proportional to count
  const widths = stages.map((s) =>
    maxCount > 0 ? Math.max(MIN_BAR_W, (s.count / maxCount) * MAX_BAR_W) : MIN_BAR_W,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Application Funnel</CardTitle>
        <CardDescription>Conversion through stages</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-48 animate-pulse rounded-md bg-muted" />
        ) : !hasData ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FilterIcon className="mb-3 size-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Add applications to see your funnel</p>
          </div>
        ) : (
          <svg
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            className="w-full"
            role="img"
            aria-label="Application funnel chart"
          >
            {stages.map((stage, i) => {
              // Each stage top connects to the next stage's width (continuous funnel)
              const topW = widths[i];
              const bottomW =
                i < stages.length - 1 ? widths[i + 1] : Math.max(MIN_BAR_W, widths[i] * 0.7);

              const y = TOP_PAD + i * STAGE_H;
              const yBottom = y + STAGE_H - 1; // 1px gap between stages

              const pts = [
                `${BAR_CX - topW / 2},${y}`,
                `${BAR_CX + topW / 2},${y}`,
                `${BAR_CX + bottomW / 2},${yBottom}`,
                `${BAR_CX - bottomW / 2},${yBottom}`,
              ].join(" ");

              const pct =
                i > 0 && stages[0].count > 0
                  ? Math.round((stage.count / stages[0].count) * 100)
                  : null;

              return (
                <g key={stage.label}>
                  <polygon points={pts} fill={FUNNEL_COLORS[i]} />
                  {/* Stage label — left column */}
                  <text
                    x={LABEL_END}
                    y={y + STAGE_H / 2}
                    textAnchor="end"
                    dominantBaseline="middle"
                    fontSize="12"
                    style={{ fill: "var(--color-foreground)" }}
                  >
                    {stage.label}
                  </text>
                  {/* Count + conversion — right column */}
                  <text
                    x={COUNT_X}
                    y={y + STAGE_H / 2}
                    dominantBaseline="middle"
                    fontSize="12"
                    style={{ fill: "var(--color-muted-foreground)" }}
                  >
                    {stage.count}
                    {pct !== null ? ` · ${pct}%` : ""}
                  </text>
                </g>
              );
            })}
          </svg>
        )}
      </CardContent>
    </Card>
  );
}
