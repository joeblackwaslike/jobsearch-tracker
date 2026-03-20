import { useAutoAnimate } from "@formkit/auto-animate/react";
import {
  AlertTriangle,
  BookmarkIcon,
  Building,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Code,
  DollarSign,
  ExternalLink,
  Gift,
  Home,
  Monitor,
  Pencil,
  Phone,
  RefreshCw,
  SendIcon,
  Trash2,
  User2,
  Users,
  Users2,
  XCircle,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { type Event, useDeleteEvent } from "@/lib/queries/events";
import { AddEventDialog } from "./add-event-dialog";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EVENT_TYPE_CONFIG: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  "screening-interview": { label: "Screening Interview", icon: Phone },
  "technical-interview": { label: "Technical Interview", icon: Code },
  "behavioral-interview": { label: "Behavioral Interview", icon: Users },
  "online-test": { label: "Online Test", icon: Monitor },
  "take-home": { label: "Take Home", icon: Home },
  onsite: { label: "Onsite", icon: Building },
  offer: { label: "Offer", icon: Gift },
  "received-offer": { label: "Received Offer", icon: DollarSign },
  "accepted-offer": { label: "Accepted Offer", icon: CheckCircle },
  "rejected-offer": { label: "Rejected Offer", icon: XCircle },
  "offer-withdrawn": { label: "Offer Withdrawn", icon: AlertTriangle },
  "follow-up": { label: "Follow Up", icon: RefreshCw },
  "hiring-manager": { label: "Hiring Manager", icon: User2 },
  "peer-interview": { label: "Peer Interview", icon: Users2 },
};

const STATUS_VARIANT: Record<
  string,
  "primary" | "success" | "error" | "warning" | "secondary" | "outline"
> = {
  "availability-requested": "secondary",
  "availability-submitted": "primary",
  scheduled: "primary",
  completed: "success",
  cancelled: "error",
  rescheduled: "warning",
  "no-show": "secondary",
};

function formatStatusLabel(status: string): string {
  return status
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "TBD";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
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

interface EventTimelineProps {
  events: Event[];
  applicationId: string;
  companyId?: string;
  appliedAt?: string | null;
  createdAt?: string | null;
}

// ---------------------------------------------------------------------------
// Milestone node (Applied / Bookmarked)
// ---------------------------------------------------------------------------

function MilestoneNode({
  icon,
  label,
  date,
  hasNext,
}: {
  icon: React.ReactNode;
  label: string;
  date: string;
  hasNext: boolean;
}) {
  return (
    <div className="relative flex gap-4">
      {hasNext && <div className="absolute left-[17px] top-10 bottom-0 w-px bg-border" />}
      <div className="relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full border bg-background">
        {icon}
      </div>
      <div className="flex-1 pb-6">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{date}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Delete confirm dialog
// ---------------------------------------------------------------------------

function DeleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete Event</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this event? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isPending}>
            {isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Single event node
// ---------------------------------------------------------------------------

function EventNode({
  event,
  applicationId,
  companyId,
  isLast,
}: {
  event: Event;
  applicationId: string;
  companyId?: string;
  isLast: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const deleteEvent = useDeleteEvent();

  const config = EVENT_TYPE_CONFIG[event.type] ?? {
    label: event.type,
    icon: Code,
  };
  const Icon = config.icon;

  const handleDelete = async () => {
    await deleteEvent.mutateAsync({
      id: event.id,
      applicationId,
    });
    setDeleteOpen(false);
  };

  const hasDetails = event.description || event.url || event.duration_minutes;

  return (
    <div className="group relative flex gap-4">
      {/* Timeline line */}
      {!isLast && <div className="absolute left-[17px] top-10 bottom-0 w-px bg-border" />}

      {/* Icon node */}
      <div className="relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full border bg-background">
        <Icon className="size-4 text-muted-foreground" />
      </div>

      {/* Content */}
      <div className="flex-1 pb-6">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="flex items-center gap-1 text-sm font-medium hover:underline"
                onClick={() => hasDetails && setExpanded(!expanded)}
              >
                {hasDetails &&
                  (expanded ? (
                    <ChevronDown className="size-3.5" />
                  ) : (
                    <ChevronRight className="size-3.5" />
                  ))}
                {config.label}
              </button>
              <Badge variant={STATUS_VARIANT[event.status] ?? "secondary"}>
                {formatStatusLabel(event.status)}
              </Badge>
            </div>
            {event.title && <p className="text-sm text-muted-foreground">{event.title}</p>}
            <p className="text-xs text-muted-foreground">{formatDate(event.scheduled_at)}</p>
          </div>

          {/* Edit / Delete buttons — visible on hover */}
          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              variant="ghost"
              size="icon-xs"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setEditOpen(true)}
              title="Edit event"
            >
              <Pencil className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => setDeleteOpen(true)}
              title="Delete event"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>

        {/* Expanded details */}
        {expanded && hasDetails && (
          <div className="mt-2 space-y-1 rounded-md border bg-muted/50 p-3 text-sm">
            {event.duration_minutes && (
              <p className="text-muted-foreground">Duration: {event.duration_minutes} minutes</p>
            )}
            {event.url && (
              <p>
                <a
                  href={event.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  Meeting link
                  <ExternalLink className="size-3" />
                </a>
              </p>
            )}
            {event.description && (
              <p className="text-muted-foreground whitespace-pre-wrap">{event.description}</p>
            )}
          </div>
        )}
      </div>

      {/* Edit dialog */}
      <AddEventDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        applicationId={applicationId}
        companyId={companyId}
        mode="edit"
        event={event}
      />

      {/* Delete confirm */}
      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
        isPending={deleteEvent.isPending}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EventTimeline({
  events,
  applicationId,
  companyId,
  appliedAt,
  createdAt,
}: EventTimelineProps) {
  const hasMilestone = Boolean(appliedAt || createdAt);
  const [timelineRef] = useAutoAnimate();

  if (!hasMilestone && events.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        No events yet. Add an event to start tracking your timeline.
      </p>
    );
  }

  return (
    <div ref={timelineRef} className="space-y-0">
      {appliedAt ? (
        <MilestoneNode
          icon={<SendIcon className="size-4 text-muted-foreground" />}
          label="Applied"
          date={formatDate(appliedAt)}
          hasNext={events.length > 0}
        />
      ) : createdAt ? (
        <MilestoneNode
          icon={<BookmarkIcon className="size-4 text-muted-foreground" />}
          label="Bookmarked"
          date={formatDate(createdAt)}
          hasNext={events.length > 0}
        />
      ) : null}
      {events.map((event, index) => (
        <EventNode
          key={event.id}
          event={event}
          applicationId={applicationId}
          companyId={companyId}
          isLast={index === events.length - 1}
        />
      ))}
    </div>
  );
}
