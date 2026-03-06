import { useAutoAnimate } from "@formkit/auto-animate/react";
import { useNewRows } from "@/lib/realtime/new-rows-context";
import { cn } from "@/lib/utils";
import { useNavigate } from "@tanstack/react-router";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, Pencil } from "lucide-react";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ApplicationListItem } from "@/lib/queries/applications";
import { ArchiveDialog } from "./archive-dialog";

// ---------------------------------------------------------------------------
// Badge color maps
// ---------------------------------------------------------------------------

const STATUS_VARIANTS: Record<string, "secondary" | "primary" | "warning" | "success" | "error"> =
  {
    bookmarked: "secondary",
    applied: "primary",
    interviewing: "warning",
    offer: "success",
    accepted: "success",
    rejected: "error",
    archived: "secondary",
  };

const INTEREST_VARIANTS: Record<string, "secondary" | "primary" | "warning"> = {
  low: "secondary",
  medium: "primary",
  high: "warning",
  dream: "primary",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatSalary(salary: unknown): string {
  if (!salary || typeof salary !== "object") return "-";
  const s = salary as Record<string, unknown>;
  const min = s.min ? Number(s.min) : null;
  const max = s.max ? Number(s.max) : null;
  const period = (s.period as string) ?? "yearly";

  if (!min && !max) return "-";

  const fmt = (n: number) => {
    if (n >= 1000) return `$${Math.round(n / 1000)}k`;
    return `$${n}`;
  };

  const suffix = period === "yearly" ? "/yr" : period === "monthly" ? "/mo" : "/hr";

  if (min && max) return `${fmt(min)} - ${fmt(max)}${suffix}`;
  if (min) return `${fmt(min)}+${suffix}`;
  return `up to ${fmt(max as number)}${suffix}`;
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 30) {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }
  if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffMins > 0) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
  return "just now";
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ApplicationTableProps {
  data: ApplicationListItem[];
  sorting: SortingState;
  onSortingChange: (sorting: SortingState) => void;
  columnVisibility: VisibilityState;
  onColumnVisibilityChange: (visibility: VisibilityState) => void;
  onEdit: (app: ApplicationListItem) => void;
}

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------

function createColumns(
  onEdit: (app: ApplicationListItem) => void,
): ColumnDef<ApplicationListItem>[] {
  return [
    {
      accessorKey: "position",
      header: "Position",
      enableSorting: true,
      cell: ({ row }) => <span className="font-medium">{row.original.position}</span>,
    },
    {
      id: "company",
      header: "Company",
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.company?.name ?? "-"}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      enableSorting: false,
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge variant={STATUS_VARIANTS[status] ?? "secondary"}>
            {capitalize(status)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "interest",
      header: "Interest",
      enableSorting: false,
      cell: ({ row }) => {
        const interest = row.original.interest;
        if (!interest) return <span className="text-muted-foreground">-</span>;
        return (
          <Badge variant={INTEREST_VARIANTS[interest] ?? "secondary"}>
            {capitalize(interest)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "locations",
      header: "Location",
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {(row.original.locations as string[] | null)?.join(", ") || "-"}
        </span>
      ),
    },
    {
      id: "salary",
      header: "Salary",
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-muted-foreground">{formatSalary(row.original.salary)}</span>
      ),
    },
    {
      accessorKey: "applied_at",
      header: "Applied",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-muted-foreground">{formatDate(row.original.applied_at)}</span>
      ),
    },
    {
      accessorKey: "updated_at",
      header: "Updated",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-muted-foreground">{formatRelativeTime(row.original.updated_at)}</span>
      ),
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            title="Edit application"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(row.original);
            }}
          >
            <Pencil className="size-4" />
          </Button>
          <ArchiveDialog applicationId={row.original.id} />
        </div>
      ),
    },
  ];
}

// ---------------------------------------------------------------------------
// Sortable header helper
// ---------------------------------------------------------------------------

function SortableHeader({
  label,
  columnId,
  sorting,
  onSort,
}: {
  label: string;
  columnId: string;
  sorting: SortingState;
  onSort: (columnId: string) => void;
}) {
  const currentSort = sorting.find((s) => s.id === columnId);

  return (
    <Button variant="ghost" size="sm" className="-ml-3 h-8 gap-1" onClick={() => onSort(columnId)}>
      {label}
      {currentSort ? (
        currentSort.desc ? (
          <ArrowDown className="size-3" />
        ) : (
          <ArrowUp className="size-3" />
        )
      ) : (
        <ArrowUpDown className="size-3 text-muted-foreground" />
      )}
    </Button>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ApplicationTable({
  data,
  sorting,
  onSortingChange,
  columnVisibility,
  onColumnVisibilityChange,
  onEdit,
}: ApplicationTableProps) {
  const navigate = useNavigate();
  const [tbodyRef] = useAutoAnimate();
  const { newIds } = useNewRows();

  const handleSort = (columnId: string) => {
    const currentSort = sorting.find((s) => s.id === columnId);
    if (!currentSort) {
      onSortingChange([{ id: columnId, desc: false }]);
    } else if (!currentSort.desc) {
      onSortingChange([{ id: columnId, desc: true }]);
    } else {
      onSortingChange([]);
    }
  };

  const columnsWithHeaders = useMemo(
    (): ColumnDef<ApplicationListItem>[] =>
      createColumns(onEdit).map((col): ColumnDef<ApplicationListItem> => {
        if (col.enableSorting) {
          const colId = "accessorKey" in col ? (col.accessorKey as string) : (col.id ?? "");
          const label = typeof col.header === "string" ? col.header : "";
          return {
            ...col,
            header: () => (
              <SortableHeader
                label={label}
                columnId={colId}
                sorting={sorting}
                onSort={handleSort}
              />
            ),
          } as ColumnDef<ApplicationListItem>;
        }
        return col;
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // biome-ignore lint/correctness/useExhaustiveDependencies: handleSort is stable
    [sorting, handleSort, onEdit],
  );

  const table = useReactTable({
    data,
    columns: columnsWithHeaders,
    state: {
      sorting,
      columnVisibility,
    },
    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
      onSortingChange(next);
    },
    onColumnVisibilityChange: (updater) => {
      const next = typeof updater === "function" ? updater(columnVisibility) : updater;
      onColumnVisibilityChange(next);
    },
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    manualPagination: true,
  });

  return (
    <div className="overflow-x-auto rounded-xl border border-border shadow-xs w-full">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="bg-muted/60">
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody ref={tbodyRef}>
          {table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={table.getVisibleLeafColumns().length}
                className="h-32 text-center"
              >
                <div className="flex flex-col items-center gap-1">
                  <p className="text-muted-foreground">No applications found</p>
                  <p className="text-xs text-muted-foreground/70">
                    Try adjusting your filters or add a new application.
                  </p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className={cn("cursor-pointer", newIds.has(row.original.id) && "animate-row-flash")}
                onClick={() =>
                  navigate({
                    to: `/applications/${row.original.id}` as string,
                  })
                }
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
