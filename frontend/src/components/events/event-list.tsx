import { useNavigate } from "@tanstack/react-router";
import { CalendarIcon, ClockIcon, ExternalLinkIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { AddEventDialog } from "@/components/applications/add-event-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { type EventWithApplication, useDeleteEvent } from "@/lib/queries/events";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TYPE_LABELS: Record<string, string> = {
  screening_interview: "Screening",
  technical_interview: "Technical",
  behavioral_interview: "Behavioral",
  online_test: "Online Test",
  take_home: "Take Home",
  onsite: "Onsite",
};

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  rescheduled: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  availability_requested: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  availability_submitted: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  no_show: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

const STATUS_LABELS: Record<string, string> = {
  scheduled: "Scheduled",
  completed: "Completed",
  cancelled: "Cancelled",
  rescheduled: "Rescheduled",
  availability_requested: "Avail. Requested",
  availability_submitted: "Avail. Submitted",
  no_show: "No Show",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDateTime(isoString: string | null): string {
  if (!isoString) return "TBD";
  const dt = new Date(isoString);
  return dt.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface InterviewListProps {
  interviews: EventWithApplication[];
  search: string;
  hideArchived?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function InterviewList({ interviews, search, hideArchived = true }: InterviewListProps) {
  const navigate = useNavigate();
  const deleteEvent = useDeleteEvent();

  const [editingEvent, setEditingEvent] = useState<EventWithApplication | null>(null);

  // Client-side search + archived filtering
  const filtered = interviews.filter((interview) => {
    if (hideArchived && interview.application?.status === "archived") return false;
    if (!search) return true;
    const term = search.toLowerCase();
    const companyName = interview.application?.company?.name?.toLowerCase() ?? "";
    const position = interview.application?.position?.toLowerCase() ?? "";
    const title = interview.title?.toLowerCase() ?? "";
    return companyName.includes(term) || position.includes(term) || title.includes(term);
  });

  if (filtered.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        {search ? "No interviews match your search." : "No interviews found."}
      </p>
    );
  }

  return (
    <>
      {hideArchived && (
        <p className="text-xs text-muted-foreground">Showing active interviews only.</p>
      )}
      <div className="space-y-3">
        {filtered.map((interview) => (
          <Card
            key={interview.id}
            className="w-full cursor-pointer py-4 transition-colors hover:bg-muted/50"
            onClick={() =>
              navigate({
                to: "/applications/$applicationId",
                params: { applicationId: interview.application_id },
              })
            }
          >
            <CardContent className="flex items-center justify-between gap-4">
              {/* Left side: info */}
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-semibold">
                    {interview.application?.company?.name ?? "Unknown Company"}
                  </span>
                  <span className="text-muted-foreground truncate text-sm">
                    {interview.application?.position ?? "Unknown Position"}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{TYPE_LABELS[interview.type] ?? interview.type}</Badge>
                  <Badge variant="secondary" className={STATUS_COLORS[interview.status] ?? ""}>
                    {STATUS_LABELS[interview.status] ?? interview.status}
                  </Badge>
                  <span className="text-muted-foreground flex items-center gap-1 text-xs">
                    <CalendarIcon className="size-3" />
                    {formatDateTime(interview.scheduled_at)}
                  </span>
                  {interview.duration_minutes && (
                    <span className="text-muted-foreground flex items-center gap-1 text-xs">
                      <ClockIcon className="size-3" />
                      {interview.duration_minutes} min
                    </span>
                  )}
                </div>
              </div>

              {/* Right side: actions */}
              {/* biome-ignore lint/a11y/noStaticElementInteractions: container is just catching events to prevent routing */}
              <div
                role="presentation"
                className="flex shrink-0 items-center gap-1"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              >
                {interview.url && (
                  <Button variant="ghost" size="icon" className="size-8" asChild>
                    <a
                      href={interview.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open meeting link"
                    >
                      <ExternalLinkIcon className="size-4" />
                    </a>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => setEditingEvent(interview)}
                  title="Edit interview"
                >
                  <PencilIcon className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-destructive hover:text-destructive"
                  onClick={() =>
                    deleteEvent.mutate({
                      id: interview.id,
                      applicationId: interview.application_id,
                    })
                  }
                  title="Delete interview"
                >
                  <Trash2Icon className="size-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit dialog */}
      {editingEvent && (
        <AddEventDialog
          open={!!editingEvent}
          onOpenChange={(open) => {
            if (!open) setEditingEvent(null);
          }}
          applicationId={editingEvent.application_id}
          mode="edit"
          event={editingEvent}
          onSuccess={() => setEditingEvent(null)}
        />
      )}
    </>
  );
}
