import { useNavigate } from "@tanstack/react-router";
import {
  ActivityIcon,
  CalendarIcon,
  CodeIcon,
  FileTextIcon,
  MonitorIcon,
  PhoneIcon,
  SendIcon,
  UsersIcon,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRecentActivity } from "@/lib/queries/dashboard";
import type { EventWithApplication } from "@/lib/queries/events";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function relativeTime(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;
  if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? "" : "s"} ago`;
  if (diffDay < 30) return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`;
  const diffMonth = Math.floor(diffDay / 30);
  return `${diffMonth} month${diffMonth === 1 ? "" : "s"} ago`;
}

const EVENT_TYPE_ICONS: Record<string, typeof ActivityIcon> = {
  applied: SendIcon,
  "screening-interview": PhoneIcon,
  "technical-interview": CodeIcon,
  "behavioral-interview": UsersIcon,
  "online-test": MonitorIcon,
  "take-home": FileTextIcon,
  onsite: CalendarIcon,
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  applied: "Applied",
  "screening-interview": "Screening interview",
  "technical-interview": "Technical interview",
  "behavioral-interview": "Behavioral interview",
  "online-test": "Online test",
  "take-home": "Take home",
  onsite: "Onsite interview",
};

function describeEvent(event: EventWithApplication): string {
  const label = EVENT_TYPE_LABELS[event.type] ?? event.type;
  const position = event.application?.position ?? "Unknown";
  const company = event.application?.company?.name ?? "Unknown";
  const status = event.status ? ` (${event.status.replace(/_/g, " ")})` : "";
  return `${label}${status} for ${position} at ${company}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RecentActivity() {
  const navigate = useNavigate();
  const { data: events, isLoading } = useRecentActivity();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Your latest updates</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: skeletal loading state
              <div key={i} className="flex items-center gap-3">
                <div className="size-8 animate-pulse rounded-full bg-muted" />
                <div className="flex-1 space-y-1">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-1/4 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : !events?.length ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <ActivityIcon className="mb-3 size-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No activity yet. Start by adding your first application!
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[320px]">
            <div className="space-y-1">
              {events.map((event) => {
                const Icon = EVENT_TYPE_ICONS[event.type] ?? ActivityIcon;
                return (
                  <button
                    key={event.id}
                    type="button"
                    className="flex w-full items-start gap-3 rounded-md p-2 text-left hover:bg-muted/50 transition-colors"
                    onClick={() => {
                      if (event.application?.id) {
                        navigate({
                          to: "/applications/$applicationId",
                          params: { applicationId: event.application.id },
                        });
                      }
                    }}
                  >
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
                      <Icon className="size-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-tight truncate">{describeEvent(event)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {relativeTime(event.created_at)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
