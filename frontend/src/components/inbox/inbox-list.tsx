import { Link } from "@tanstack/react-router";
import {
  BotIcon,
  CheckCircleIcon,
  ClockIcon,
  FileTextIcon,
  InboxIcon,
  LoaderIcon,
  SearchIcon,
  XCircleIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { TaskWithApplication } from "@/lib/queries/tasks";

const TASK_TYPE_LABELS: Record<string, string> = {
  company_research: "Company Research",
  contact_research: "Contact Research",
  email_draft: "Email Draft",
  thank_you_draft: "Thank-You Note",
};

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "secondary" | "warning" | "success" | "error"; icon: typeof ClockIcon }
> = {
  pending: { label: "Queued", variant: "secondary", icon: ClockIcon },
  running: { label: "Running", variant: "secondary", icon: LoaderIcon },
  needs_input: { label: "Needs Input", variant: "warning", icon: ClockIcon },
  blocked: { label: "Blocked", variant: "error", icon: XCircleIcon },
  awaiting_approval: { label: "Awaiting Review", variant: "warning", icon: ClockIcon },
  approved: { label: "Approved", variant: "success", icon: CheckCircleIcon },
  terminated: { label: "Terminated", variant: "secondary", icon: XCircleIcon },
  completed: { label: "Completed", variant: "success", icon: CheckCircleIcon },
  failed: { label: "Failed", variant: "error", icon: XCircleIcon },
};

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60_000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;

  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 30) return `${diffDays}d ago`;

  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface InboxListProps {
  tasks: TaskWithApplication[];
  isLoading: boolean;
}

export function InboxList({ tasks, isLoading }: InboxListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoaderIcon className="size-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading tasks...</span>
      </div>
    );
  }

  const needsAttention = tasks.filter(
    (t) => t.status === "awaiting_approval" || t.status === "needs_input",
  );
  const inProgress = tasks.filter(
    (t) => t.status === "pending" || t.status === "running" || t.status === "blocked",
  );
  const completed = tasks.filter(
    (t) =>
      t.status === "completed" ||
      t.status === "terminated" ||
      t.status === "approved" ||
      t.status === "failed",
  );

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
        <InboxIcon className="mb-4 size-12 text-muted-foreground" />
        <h3 className="mb-1 text-lg font-semibold">No pending tasks</h3>
        <p className="text-sm text-muted-foreground">
          AI tasks will appear here when they need your attention.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {needsAttention.length > 0 && (
        <TaskSection title="Needs Your Attention" tasks={needsAttention} highlight />
      )}
      {inProgress.length > 0 && <TaskSection title="In Progress" tasks={inProgress} />}
      {completed.length > 0 && <TaskSection title="Recently Completed" tasks={completed} />}
    </div>
  );
}

function TaskSection({
  title,
  tasks,
  highlight,
}: {
  title: string;
  tasks: TaskWithApplication[];
  highlight?: boolean;
}) {
  return (
    <div className="space-y-3">
      <h2
        className={`text-sm font-semibold uppercase tracking-wide ${highlight ? "text-warning" : "text-muted-foreground"}`}
      >
        {title} ({tasks.length})
      </h2>
      <div className="space-y-2">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}

function TaskCard({ task }: { task: TaskWithApplication }) {
  const config = STATUS_CONFIG[task.status] ?? STATUS_CONFIG.pending;
  const StatusIcon = config.icon;
  const companyName = task.application?.company?.name ?? "Unknown Company";
  const position = task.application?.position ?? "Unknown Position";
  const typeLabel = TASK_TYPE_LABELS[task.type] ?? task.type;

  return (
    <Card className="transition-colors hover:bg-accent/50">
      <CardContent className="flex items-center gap-4 py-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
          {task.type === "company_research" ? (
            <SearchIcon className="size-5 text-muted-foreground" />
          ) : task.type === "email_draft" || task.type === "thank_you_draft" ? (
            <FileTextIcon className="size-5 text-muted-foreground" />
          ) : (
            <BotIcon className="size-5 text-muted-foreground" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate">{typeLabel}</span>
            <Badge variant={config.variant} className="gap-1 shrink-0">
              {task.status === "running" ? (
                <LoaderIcon className="size-3 animate-spin" />
              ) : (
                <StatusIcon className="size-3" />
              )}
              {config.label}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground truncate">
            <span className="font-medium text-foreground">{companyName}</span>
            {" — "}
            {position}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {formatRelativeTime(task.updated_at)}
          </span>
          {task.status === "awaiting_approval" && task.document_id && (
            <Button variant="default" size="sm" asChild>
              <Link to="/documents" search={{ doc: task.document_id }}>
                Review
              </Link>
            </Button>
          )}
          {(task.status === "approved" || task.status === "completed") && task.document_id && (
            <Button variant="outline" size="sm" asChild>
              <Link to="/documents" search={{ doc: task.document_id }}>
                View
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
