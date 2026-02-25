import { Badge } from "@/components/ui/badge";
import { formatDate, formatRelativeTime } from "@/lib/formatters";

// Constants
export const STATUS_COLORS = {
  applied: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  interview: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  offer: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  archived: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  bookmarked: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
} as const;

export const INTEREST_COLORS = {
  low: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  medium: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  dream: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
} as const;

export const EVENT_TYPE_LABELS: Record<string, string> = {
  "screening-interview": "Screening",
  "technical-interview": "Technical",
  "behavioral-interview": "Behavioral",
  "online-test": "Online Test",
  "take-home": "Take Home",
  onsite: "Onsite",
};

export const EVENT_STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  rescheduled: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  "availability-requested": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  "availability-submitted": "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  "no-show": "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
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
      cell: (data: { status: keyof typeof STATUS_COLORS }) => (
        <Badge variant="secondary" className={STATUS_COLORS[data.status] ?? ""}>
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
      cell: (data: { interest?: keyof typeof INTEREST_COLORS }) => {
        if (!data.interest) return <span className="text-muted-foreground">-</span>;
        return (
          <Badge variant="secondary" className={INTEREST_COLORS[data.interest] ?? ""}>
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
    {
      id: "tags",
      header: "Tags",
      type: "text" as const,
      sortable: false,
      minWidth: 150,
      grow: 1,
      cell: (data: { tags: string[] }) => {
        const tags = data.tags || [];
        if (tags.length === 0) return <span className="text-muted-foreground">-</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {tags.length > 2 && (
              <span className="text-xs text-muted-foreground">+{tags.length - 2}</span>
            )}
          </div>
        );
      },
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
      cell: (data: { status: keyof typeof EVENT_STATUS_COLORS }) => (
        <Badge variant="secondary" className={EVENT_STATUS_COLORS[data.status] ?? ""}>
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
