import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatRelativeTime } from "@/lib/formatters";
import type { ColumnType, TableSchema } from "@/schemas/table-schema";
import { cn } from "@/lib/utils";

interface UniversalTableProps<T extends object> {
  data: T[];
  schema: TableSchema<T>;
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;
  onRowClick?: (row: T) => void;
  selectedId?: string | null;
  className?: string;
}

export function UniversalTable<T extends object>({
  data,
  schema,
  sorting = [],
  onSortingChange,
  onRowClick,
  selectedId,
  className = "",
}: UniversalTableProps<T>) {
  const columns = useMemo<ColumnDef<T>[]>(() => {
    return schema.columns.map((col) => ({
      id: col.id,
      header: col.header,
      enableSorting: col.sortable,
      size: col.minWidth,
      cell: col.cell
        ? ({ row }) => col.cell!(row.original as T)
        : ({ row }) => {
            const value = getValue(row.original, col.id);
            return <DefaultCell value={value} type={col.type} />;
          },
    }));
  }, [schema]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: onSortingChange ?? (() => {}),
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
  });

  const columnStyles = useMemo(() => {
    const totalGrow = schema.columns.reduce((sum, col) => sum + (col.grow ?? 1), 0);
    return schema.columns.map((col) => {
      const grow = col.grow ?? 1;
      const percent = (grow / totalGrow) * 100;
      return {
        minWidth: `${col.minWidth}px`,
        width: `${percent}%`,
        textAlign: (col.align ?? "left") as React.CSSProperties["textAlign"],
      };
    });
  }, [schema]);

  const handleSort = (columnId: string) => {
    if (!onSortingChange) return;
    const currentSort = sorting.find((s) => s.id === columnId);
    if (!currentSort) {
      onSortingChange([{ id: columnId, desc: false }]);
    } else if (!currentSort.desc) {
      onSortingChange([{ id: columnId, desc: true }]);
    } else {
      onSortingChange([]);
    }
  };

  const currentSort = sorting[0];
  const sortColumnId = currentSort?.id;
  const sortDirection = currentSort?.desc ? "desc" : "asc";

  return (
    <div className={cn("overflow-x-auto rounded-md border w-full", className)}>
      <Table>
        <TableHeader>
          <TableRow>
            {schema.columns.map((col, idx) => (
              <TableHead
                key={col.id}
                style={{
                  minWidth: columnStyles[idx].minWidth,
                  width: columnStyles[idx].width,
                  textAlign: columnStyles[idx].textAlign,
                }}
              >
                {col.sortable ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3 h-8 gap-1"
                    onClick={() => handleSort(col.id)}
                  >
                    {col.header}
                    {sortColumnId === col.id ? (
                      sortDirection === "desc" ? (
                        <ArrowDown className="size-3" />
                      ) : (
                        <ArrowUp className="size-3" />
                      )
                    ) : (
                      <ArrowUpDown className="size-3 text-muted-foreground" />
                    )}
                  </Button>
                ) : (
                  <span>{col.header}</span>
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={schema.columns.length} className="h-32 text-center">
                <div className="flex flex-col items-center gap-1">
                  <p className="text-muted-foreground">No records found</p>
                  <p className="text-xs text-muted-foreground/70">
                    Try adjusting your filters or add a new item.
                  </p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => {
              const rowData = row.original;
              const isSelected = selectedId !== undefined && selectedId === getRowId(rowData);
              return (
                <TableRow
                  key={row.id}
                  className={cn(
                    "cursor-pointer hover:bg-muted/50",
                    isSelected && "bg-muted",
                  )}
                  onClick={() => onRowClick?.(rowData)}
                >
                  {row.getVisibleCells().map((cell, cellIdx) => (
                    <TableCell
                      key={cell.id}
                      style={{ textAlign: columnStyles[cellIdx]?.textAlign }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function DefaultCell({ value, type }: { value: unknown; type: ColumnType }) {
  if (value === null || value === undefined || value === "") {
    return <span className="text-muted-foreground">-</span>;
  }

  switch (type) {
    case "date":
      return <span className="text-muted-foreground">{formatDate(String(value))}</span>;
    case "datetime":
      return <span className="text-muted-foreground">{formatRelativeTime(String(value))}</span>;
    case "number":
    case "text":
    default:
      return <span className="text-muted-foreground">{String(value)}</span>;
  }
}

function getValue(obj: unknown, path: string): unknown {
  if (!obj || typeof obj !== "object") return null;
  const parts = path.split(".");
  let current = obj as Record<string, unknown>;
  for (const part of parts) {
    if (!current || typeof current !== "object") return null;
    current = current[part] as Record<string, unknown>;
  }
  return current;
}

function getRowId(row: unknown): string | null {
  if (!row || typeof row !== "object") return null;
  const obj = row as Record<string, unknown>;
  return typeof obj.id === "string" ? obj.id : null;
}
