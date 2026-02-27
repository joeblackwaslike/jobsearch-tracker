import { Link } from "@tanstack/react-router";
import {
  BookmarkIcon,
  BuildingIcon,
  ChevronRightIcon,
  ExternalLinkIcon,
  PlusIcon,
  SendIcon,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MarkdownContent } from "@/components/ui/markdown-content";
import type { ApplicationWithCompany } from "@/lib/queries/applications";
import { useEvents } from "@/lib/queries/events";
import { AddEventDialog } from "./add-event-dialog";
import { ApplicationDocuments } from "./application-documents";
import { EventTimeline } from "./event-timeline";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatSalary(salary: Record<string, unknown> | null): string | null {
  if (!salary) return null;
  const min = salary.min ? Number(salary.min) : null;
  const max = salary.max ? Number(salary.max) : null;
  const currency = (salary.currency as string) ?? "USD";
  const period = (salary.period as string) ?? "yearly";

  if (!min && !max) return null;

  const fmt = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });

  let range = "";
  if (min && max) {
    range = `${fmt.format(min)} - ${fmt.format(max)}`;
  } else if (min) {
    range = `${fmt.format(min)}+`;
  } else if (max) {
    range = `Up to ${fmt.format(max)}`;
  }

  return `${range} / ${period}`;
}

function capitalize(str: string | null | undefined): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  bookmarked: "outline",
  applied: "default",
  interviewing: "default",
  offer: "default",
  accepted: "default",
  rejected: "destructive",
  archived: "secondary",
};

const INTEREST_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  low: "outline",
  medium: "secondary",
  high: "default",
  dream: "default",
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ApplicationDetailProps {
  application: ApplicationWithCompany;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ApplicationDetail({ application }: ApplicationDetailProps) {
  const [addEventOpen, setAddEventOpen] = useState(false);

  const { data: events = [], isLoading: eventsLoading } = useEvents(application.id);

  const salary = formatSalary(application.salary as Record<string, unknown> | null);
  const tags = Array.isArray(application.tags) ? (application.tags as string[]) : [];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link to="/applications" className="hover:text-foreground transition-colors">
          Applications
        </Link>
        <ChevronRightIcon className="size-3.5" />
        <span className="text-foreground">{application.company?.name}</span>
        <ChevronRightIcon className="size-3.5" />
        <span className="text-foreground">{application.position}</span>
      </nav>

      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">{application.company?.name}</h1>
            <p className="text-lg text-muted-foreground">{application.position}</p>
            <div className="flex items-center gap-2 pt-1">
              <Badge variant={STATUS_VARIANT[application.status] ?? "secondary"}>
                {capitalize(application.status)}
              </Badge>
              {application.interest && (
                <Badge variant={INTEREST_VARIANT[application.interest] ?? "secondary"}>
                  {capitalize(application.interest)} interest
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" asChild>
            <Link
              to="/companies"
              search={{ detail: application.company_id }}
            >
              <BuildingIcon className="size-4" />
              View Company
            </Link>
          </Button>
        </div>
      </div>

      <Separator />

      {/* Info grid */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              {application.work_type && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Work Type</dt>
                  <dd>{capitalize(application.work_type)}</dd>
                </div>
              )}
              {application.employment_type && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Employment Type</dt>
                  <dd>{capitalize(application.employment_type)}</dd>
                </div>
              )}
              {application.location && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Location</dt>
                  <dd>{application.location}</dd>
                </div>
              )}
              {salary && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Salary</dt>
                  <dd>{salary}</dd>
                </div>
              )}
              {application.interest && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Interest</dt>
                  <dd>{capitalize(application.interest)}</dd>
                </div>
              )}
              {application.source && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Source</dt>
                  <dd>{application.source}</dd>
                </div>
              )}
              {application.applied_at && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Applied</dt>
                  <dd>{formatDate(application.applied_at)}</dd>
                </div>
              )}
            </dl>

            {/* Tags */}
            {tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Job URL */}
        {application.url && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground truncate flex-1">{application.url}</span>
            <Button variant="outline" size="sm" asChild>
              <a href={application.url} target="_blank" rel="noopener noreferrer">
                <ExternalLinkIcon className="size-3.5 mr-1" />
                Open
              </a>
            </Button>
          </div>
        )}

        {/* Job description */}
        {application.job_description && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Job Description</CardTitle>
            </CardHeader>
            <CardContent>
              <MarkdownContent content={application.job_description} />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Documents */}
      <ApplicationDocuments applicationId={application.id} />

      <Separator />

      {/* Events / Timeline */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Timeline</h2>
          <Button size="sm" onClick={() => setAddEventOpen(true)}>
            <PlusIcon className="size-4" />
            Add Event
          </Button>
        </div>

        {/* Timeline milestones */}
        <div className="space-y-0">
          {/* Bookmarked milestone */}
          <div className="flex gap-4">
            <div className="relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full border bg-background">
              <BookmarkIcon className="size-4 text-muted-foreground" />
            </div>
            <div className="flex-1 pb-6">
              <p className="text-sm font-medium">Bookmarked</p>
              <p className="text-xs text-muted-foreground">{formatDate(application.created_at)}</p>
            </div>
          </div>

          {/* Applied milestone */}
          {application.applied_at && (
            <div className="flex gap-4">
              <div className="relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full border bg-background">
                <SendIcon className="size-4 text-muted-foreground" />
              </div>
              <div className="flex-1 pb-6">
                <p className="text-sm font-medium">Applied</p>
                <p className="text-xs text-muted-foreground">{formatDate(application.applied_at)}</p>
              </div>
            </div>
          )}
        </div>

        {eventsLoading ? (
          <p className="text-sm text-muted-foreground">Loading events...</p>
        ) : (
          <EventTimeline events={events} applicationId={application.id} />
        )}
      </div>

      {/* Dialogs */}
      <AddEventDialog
        open={addEventOpen}
        onOpenChange={setAddEventOpen}
        applicationId={application.id}
        companyId={application.company_id}
        mode="create"
      />
    </div>
  );
}
