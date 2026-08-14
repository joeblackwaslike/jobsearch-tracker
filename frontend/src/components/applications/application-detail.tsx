import { Link } from "@tanstack/react-router";
import {
  BotIcon,
  BuildingIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  ClockIcon,
  ExternalLinkIcon,
  LoaderIcon,
  PlusIcon,
  XCircleIcon,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MarkdownContent } from "@/components/ui/markdown-content";
import { Separator } from "@/components/ui/separator";
import type { ApplicationWithCompany } from "@/lib/queries/applications";
import { useEvents } from "@/lib/queries/events";
import { useSettings } from "@/lib/queries/settings";
import { useGenerateResearch, useTasksForApplication } from "@/lib/queries/tasks";
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

const STATUS_VARIANT = {
  bookmarked: "secondary",
  applied: "primary",
  interviewing: "warning",
  offer: "success",
  accepted: "success",
  rejected: "error",
  archived: "secondary",
} as const;

const INTEREST_VARIANT = {
  low: "secondary",
  medium: "primary",
  high: "warning",
  dream: "primary",
} as const;

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
  const { data: settings } = useSettings();
  const { data: tasks = [] } = useTasksForApplication(application.id);
  const generateResearch = useGenerateResearch();

  const aiResearchEnabled = settings?.ai_features_enabled && settings?.ai_company_research;
  const researchTask = tasks.find((t) => t.type === "company_research");
  const isResearchRunning =
    researchTask?.status === "pending" || researchTask?.status === "running";

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
            <Link to="/companies" search={{ detail: application.company_id }}>
              <BuildingIcon className="size-4" />
              View Company
            </Link>
          </Button>

          {aiResearchEnabled && !researchTask && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => generateResearch.mutate(application.id)}
              disabled={generateResearch.isPending}
            >
              {generateResearch.isPending ? (
                <LoaderIcon className="size-4 animate-spin" />
              ) : (
                <BotIcon className="size-4" />
              )}
              {generateResearch.isPending ? "Generating..." : "Generate Research"}
            </Button>
          )}

          {researchTask && (
            <div className="flex items-center gap-2">
              {isResearchRunning && (
                <Badge variant="secondary" className="gap-1">
                  <LoaderIcon className="size-3 animate-spin" />
                  Generating research...
                </Badge>
              )}
              {researchTask.status === "awaiting_approval" && (
                <Badge variant="warning" className="gap-1">
                  <ClockIcon className="size-3" />
                  Awaiting review
                </Badge>
              )}
              {researchTask.status === "approved" && (
                <Badge variant="success" className="gap-1">
                  <CheckCircleIcon className="size-3" />
                  Research approved
                </Badge>
              )}
              {researchTask.status === "failed" && (
                <Badge variant="error" className="gap-1">
                  <XCircleIcon className="size-3" />
                  Research failed
                </Badge>
              )}
              {researchTask.document_id && (
                <Button variant="outline" size="sm" asChild>
                  <Link to="/documents" search={{ doc: researchTask.document_id }}>
                    View Document
                  </Link>
                </Button>
              )}
            </div>
          )}
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
              {(application.locations as string[] | null)?.length ? (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Location</dt>
                  <dd className="flex flex-wrap gap-1">
                    {(application.locations as string[]).map((loc) => (
                      <Badge key={loc} variant="outline" className="text-xs font-normal">
                        {loc}
                      </Badge>
                    ))}
                  </dd>
                </div>
              ) : null}
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

        {/* Notes */}
        {application.notes && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <MarkdownContent content={application.notes} />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Documents */}
      <ApplicationDocuments applicationId={application.id} />

      {/* AI Activity */}
      {tasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BotIcon className="size-4" />
              AI Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tasks.map((task) => {
                const statusConfig: Record<
                  string,
                  { label: string; variant: "secondary" | "warning" | "success" | "error" }
                > = {
                  pending: { label: "Queued", variant: "secondary" },
                  running: { label: "Running", variant: "secondary" },
                  awaiting_approval: { label: "Awaiting Review", variant: "warning" },
                  approved: { label: "Approved", variant: "success" },
                  completed: { label: "Completed", variant: "success" },
                  terminated: { label: "Terminated", variant: "secondary" },
                  failed: { label: "Failed", variant: "error" },
                  blocked: { label: "Blocked", variant: "error" },
                };
                const config = statusConfig[task.status] ?? statusConfig.pending;
                const typeLabels: Record<string, string> = {
                  company_research: "Company Research",
                  contact_research: "Contact Research",
                  email_draft: "Email Draft",
                  thank_you_draft: "Thank-You Note",
                };

                return (
                  <div key={task.id} className="flex items-center justify-between gap-4 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-medium">
                        {typeLabels[task.type] ?? task.type}
                      </span>
                      <Badge variant={config.variant}>
                        {task.status === "running" ? (
                          <LoaderIcon className="mr-1 size-3 animate-spin" />
                        ) : null}
                        {config.label}
                      </Badge>
                      {task.termination_reason && (
                        <span className="text-xs text-muted-foreground truncate">
                          {task.termination_reason}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground">
                        {formatDate(task.created_at)}
                      </span>
                      {task.document_id && (
                        <Button variant="outline" size="xs" asChild>
                          <Link to="/documents" search={{ doc: task.document_id }}>
                            View
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

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

        {eventsLoading ? (
          <p className="text-sm text-muted-foreground">Loading events...</p>
        ) : (
          <EventTimeline
            events={events}
            applicationId={application.id}
            companyId={application.company_id}
            appliedAt={application.applied_at}
            createdAt={application.created_at}
          />
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
