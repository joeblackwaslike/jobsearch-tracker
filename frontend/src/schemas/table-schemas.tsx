import { Badge } from "@/components/ui/badge";
import { formatDate, formatRelativeTime } from "@/lib/formatters";

// Constants
export const STATUS_VARIANTS = {
  applied: "primary",
  interview: "warning",
  interviewing: "warning",
  offer: "success",
  accepted: "success",
  rejected: "error",
  archived: "secondary",
  bookmarked: "secondary",
} as const;

export const INTEREST_VARIANTS = {
  low: "secondary",
  medium: "primary",
  high: "warning",
  dream: "primary",
} as const;

export const EVENT_TYPE_LABELS: Record<string, string> = {
  "screening-interview": "Screening",
  "technical-interview": "Technical",
  "behavioral-interview": "Behavioral",
  "online-test": "Online Test",
  "take-home": "Take Home",
  onsite: "Onsite",
};

export const EVENT_STATUS_VARIANTS: Record<
  string,
  "primary" | "success" | "error" | "warning" | "secondary"
> = {
  scheduled: "primary",
  completed: "success",
  cancelled: "error",
  rescheduled: "warning",
  "availability-requested": "secondary",
  "availability-submitted": "primary",
  "no-show": "secondary",
};

// Helper function
export function capitalize(str: string): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Application table schema
export const applicationTableSchema = {
  columns: [
    {
      id: "position",
      header: "Position",
      type: "text" as const,
      sortable: true,
      minWidth: 200,
      grow: 2,
      cell: (data: { position: string }) => <span className="font-medium">{data.position}</span>,
    },
    {
      id: "company.name",
      header: "Company",
      type: "relation" as const,
      sortable: false,
      minWidth: 150,
      grow: 1.5,
      cell: (data: { company?: { name: string } }) => (
        <span className="text-muted-foreground">{data.company?.name ?? "-"}</span>
      ),
    },
    {
      id: "status",
      header: "Status",
      type: "enum" as const,
      sortable: false,
      minWidth: 100,
      options: [
        "bookmarked",
        "applied",
        "interviewing",
        "offer",
        "accepted",
        "rejected",
        "archived",
      ],
      cell: (data: { status: string }) => (
        <Badge
          variant={STATUS_VARIANTS[data.status as keyof typeof STATUS_VARIANTS] ?? "secondary"}
        >
          {capitalize(data.status)}
        </Badge>
      ),
    },
    {
      id: "interest",
      header: "Interest",
      type: "enum" as const,
      sortable: false,
      minWidth: 100,
      options: ["low", "medium", "high", "dream"],
      cell: (data: { interest?: string }) => {
        if (!data.interest) return <span className="text-muted-foreground">-</span>;
        return (
          <Badge
            variant={
              INTEREST_VARIANTS[data.interest as keyof typeof INTEREST_VARIANTS] ?? "secondary"
            }
          >
            {capitalize(data.interest)}
          </Badge>
        );
      },
    },
    {
      id: "location",
      header: "Location",
      type: "text" as const,
      sortable: false,
      minWidth: 150,
      grow: 1,
      cell: (data: { location: string }) => (
        <span className="text-muted-foreground">{data.location || "-"}</span>
      ),
    },
    {
      id: "applied_at",
      header: "Applied Date",
      type: "date" as const,
      sortable: true,
      minWidth: 130,
      cell: (data: { applied_at: string | null }) => (
        <span className="text-muted-foreground">{formatDate(data.applied_at)}</span>
      ),
    },
    {
      id: "updated_at",
      header: "Updated Date",
      type: "datetime" as const,
      sortable: true,
      minWidth: 140,
      cell: (data: { updated_at: string | null }) => (
        <span className="text-muted-foreground">{formatRelativeTime(data.updated_at || "")}</span>
      ),
    },
    {
      id: "source",
      header: "Source",
      type: "text" as const,
      sortable: false,
      minWidth: 120,
      cell: (data: { source: string }) => (
        <span className="text-muted-foreground">{data.source || "-"}</span>
      ),
    },
  ],
} as const;

// Company table schema
export const companyTableSchema = {
  columns: [
    {
      id: "name",
      header: "Name",
      type: "text" as const,
      sortable: false,
      minWidth: 200,
      grow: 2,
      cell: (data: { name: string }) => <span className="font-medium">{data.name}</span>,
    },
    {
      id: "industry",
      header: "Industry",
      type: "text" as const,
      sortable: false,
      minWidth: 150,
      grow: 1,
      cell: (data: { industry: string }) => (
        <span className="text-muted-foreground">{data.industry || "--"}</span>
      ),
    },
    {
      id: "location",
      header: "Location",
      type: "text" as const,
      sortable: false,
      minWidth: 150,
      grow: 1,
      cell: (data: { location: string }) => (
        <span className="text-muted-foreground">{data.location || "--"}</span>
      ),
    },
    {
      id: "size",
      header: "Size",
      type: "text" as const,
      sortable: false,
      minWidth: 120,
      grow: 0.5,
      cell: (data: { size: string }) => (
        <span className="text-muted-foreground">{data.size || "--"}</span>
      ),
    },
    {
      id: "researched",
      header: "Researched",
      type: "enum" as const,
      sortable: false,
      minWidth: 100,
      align: "center",
      cell: (data: { researched: boolean }) => (
        <Badge variant={data.researched ? "secondary" : "outline"} className="text-xs">
          {data.researched ? "Yes" : "No"}
        </Badge>
      ),
    },
  ],
} as const;

// Event table schema
export const eventTableSchema = {
  columns: [
    {
      id: "application.company.name",
      header: "Company",
      type: "relation" as const,
      sortable: false,
      minWidth: 180,
      grow: 1.5,
      cell: (data: { application?: { company?: { name: string } } }) => (
        <span className="font-medium">{data.application?.company?.name ?? "Unknown"}</span>
      ),
    },
    {
      id: "application.position",
      header: "Position",
      type: "relation" as const,
      sortable: false,
      minWidth: 200,
      grow: 2,
      cell: (data: { application?: { position: string } }) => (
        <span className="text-muted-foreground">{data.application?.position ?? "Unknown"}</span>
      ),
    },
    {
      id: "type",
      header: "Type",
      type: "enum" as const,
      sortable: false,
      minWidth: 120,
      cell: (data: { type: keyof typeof EVENT_TYPE_LABELS }) => EVENT_TYPE_LABELS[data.type],
    },
    {
      id: "status",
      header: "Status",
      type: "enum" as const,
      sortable: false,
      minWidth: 140,
      cell: (data: { status: string }) => (
        <Badge variant={EVENT_STATUS_VARIANTS[data.status] ?? "secondary"}>
          {capitalize(data.status)}
        </Badge>
      ),
    },
    {
      id: "scheduled_at",
      header: "Date",
      type: "datetime" as const,
      sortable: true,
      minWidth: 180,
      cell: (data: { scheduled_at: string | null }) => (
        <span className="text-muted-foreground">
          {data.scheduled_at ? formatDate(data.scheduled_at) : "TBD"}
        </span>
      ),
    },
  ],
} as const;
