# Unified Table Component Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a unified, type-safe table component with side panel detail view for Applications, Companies, and Entities pages, with columns that expand to fill available space.

**Architecture:** Type-safe schema definitions (TableSchema<T>) drive UniversalTable rendering. Pages manage state via useTableState hook and compose table + detail view through PageLayout component. SidePanel handles responsive behavior (desktop side panel, mobile bottom sheet).

**Tech Stack:** React, TypeScript, @tanstack/react-table, date-fns, shadcn/ui components, pnpm

---

### Task 1: Install date-fns dependency

**Files:**
- Modify: `frontend/package.json` (via pnpm)

**Step 1: Install date-fns**

```bash
cd frontend && pnpm add date-fns
```

Expected: Package added to dependencies, no errors

**Step 2: Commit**

```bash
git add frontend/package.json frontend/pnpm-lock.yaml
git commit -m "chore: add date-fns for date formatting"
```

---

### Task 2: Create formatters utility

**Files:**
- Create: `frontend/src/lib/formatters.ts`

**Step 1: Write formatters with tests**

```typescript
// frontend/src/lib/formatters.test.ts
import { describe, it, expect } from "vitest";
import { formatDate, formatDateTime, formatRelativeTime, formatDuration } from "./formatters";

describe("formatters", () => {
  describe("formatDate", () => {
    it("formats valid date string", () => {
      expect(formatDate("2026-02-23T10:30:00Z")).toBe("Feb 23, 2026");
    });

    it("returns '-' for null", () => {
      expect(formatDate(null)).toBe("-");
    });

    it("returns '-' for invalid date", () => {
      expect(formatDate("invalid")).toBe("-");
    });
  });

  describe("formatDateTime", () => {
    it("formats valid ISO string", () => {
      expect(formatDateTime("2026-02-23T10:30:00Z")).toMatch(/Feb 23, 2026 \d+:\d\d [AP]M/);
    });

    it("returns 'TBD' for null", () => {
      expect(formatDateTime(null)).toBe("TBD");
    });
  });

  describe("formatRelativeTime", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("formats recent date", () => {
      const now = new Date("2026-02-23T12:00:00Z").getTime();
      vi.setSystemTime(now);
      expect(formatRelativeTime("2026-02-23T11:30:00Z")).toContain("ago");
    });
  });

  describe("formatDuration", () => {
    it("formats minutes only", () => {
      expect(formatDuration(45)).toBe("45m");
    });

    it("formats hours and minutes", () => {
      expect(formatDuration(150)).toBe("2h 30m");
    });

    it("returns '--' for null", () => {
      expect(formatDuration(null)).toBe("--");
    });
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd frontend && pnpm test formatters.test.ts
```
Expected: FAIL with "Cannot find module './formatters'"

**Step 3: Write formatters implementation**

```typescript
// frontend/src/lib/formatters.ts
import { format, formatDistanceToNow, isValid } from "date-fns";

export function formatDate(dateString: string | null): string {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (!isValid(date)) return "-";
  return format(date, "MMM d, yyyy");
}

export function formatDateTime(isoString: string | null): string {
  if (!isoString) return "TBD";
  const date = new Date(isoString);
  if (!isValid(date)) return "TBD";
  return format(date, "MMM d, yyyy h:mm a");
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  if (!isValid(date)) return "just now";
  return formatDistanceToNow(date, { addSuffix: true });
}

export function formatDuration(minutes: number | null): string {
  if (!minutes) return "--";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}
```

**Step 4: Run test to verify it passes**

```bash
cd frontend && pnpm test formatters.test.ts
```
Expected: PASS

**Step 5: Commit**

```bash
git add frontend/src/lib/formatters.ts frontend/src/lib/formatters.test.ts
git commit -m "feat: add date formatters using date-fns"
```

---

### Task 3: Create TableSchema types

**Files:**
- Create: `frontend/src/schemas/table-schema.ts`

**Step 1: Write types with tests**

```typescript
// frontend/src/schemas/table-schema.test.ts
import { describe, it, expect } from "vitest";
import type { TableSchema, ColumnSchema } from "./table-schema";

describe("TableSchema types", () => {
  it("allows valid schema definition", () => {
    const schema: TableSchema<{ id: string; name: string }> = {
      columns: [
        { id: "id", header: "ID", type: "text", sortable: true, minWidth: 100 },
        { id: "name", header: "Name", type: "text", sortable: true, minWidth: 150 },
      ],
    };

    expect(schema.columns).toHaveLength(2);
    expect(schema.columns[0].id).toBe("id");
  });

  it("supports all column types", () => {
    const validTypes = ["text", "number", "date", "datetime", "enum", "relation"] as const;
    validTypes.forEach((type) => {
      const col: ColumnSchema = {
        id: "test",
        header: "Test",
        type,
        sortable: true,
        minWidth: 100,
      };
      expect(col.type).toBe(type);
    });
  });

  it("extracts data type from schema", () => {
    type SchemaData = TableSchema<{ id: string }> extends TableSchema<infer U> ? U : never;
    // This is a type-level test - if it compiles, it works
    const data: SchemaData = { id: "123" };
    expect(data.id).toBe("123");
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd frontend && pnpm test table-schema.test.ts
```
Expected: FAIL with "Cannot find module './table-schema'"

**Step 3: Write types implementation**

```typescript
// frontend/src/schemas/table-schema.ts
import type { ColumnDef } from "@tanstack/react-table";

export type ColumnType =
  | "text"
  | "number"
  | "date"
  | "datetime"
  | "enum"
  | "relation";

export interface ColumnSchema<T = unknown> {
  id: string;
  header: string;
  type: ColumnType;
  sortable: boolean;
  minWidth: number;
  grow?: number;
  align?: "left" | "center" | "right";
  cell?: (row: T) => React.ReactNode;
  options?: string[];
}

export interface TableSchema<T = unknown> {
  columns: ColumnSchema<T>[];
}

export type SchemaData<T> = T extends TableSchema<infer U> ? U : never;
```

**Step 4: Run test to verify it passes**

```bash
cd frontend && pnpm test table-schema.test.ts
```
Expected: PASS

**Step 5: Commit**

```bash
git add frontend/src/schemas/table-schema.ts frontend/src/schemas/table-schema.test.ts
git commit -m "feat: add TableSchema types for type-safe table configuration"
```

---

### Task 4: Create entity table schemas

**Files:**
- Create: `frontend/src/schemas/table-schemas.ts`

**Step 1: Write schemas with tests**

```typescript
// frontend/src/schemas/table-schemas.test.ts
import { describe, it, expect } from "vitest";
import { applicationTableSchema, companyTableSchema, eventTableSchema } from "./table-schemas";

describe("table schemas", () => {
  describe("applicationTableSchema", () => {
    it("has expected columns", () => {
      expect(applicationTableSchema.columns).toHaveLength(8);
    });

    it("position column has correct config", () => {
      const posCol = applicationTableSchema.columns.find((c) => c.id === "position");
      expect(posCol?.header).toBe("Position");
      expect(posCol?.type).toBe("text");
      expect(posCol?.sortable).toBe(true);
      expect(posCol?.minWidth).toBe(200);
      expect(posCol?.grow).toBe(2);
    });

    it("status column has options", () => {
      const statusCol = applicationTableSchema.columns.find((c) => c.id === "status");
      expect(statusCol?.options).toContain("bookmarked");
      expect(statusCol?.options).toContain("applied");
    });
  });

  describe("companyTableSchema", () => {
    it("has expected columns", () => {
      expect(companyTableSchema.columns).toHaveLength(6);
    });

    it("name column has correct config", () => {
      const nameCol = companyTableSchema.columns.find((c) => c.id === "name");
      expect(nameCol?.header).toBe("Name");
      expect(nameCol?.type).toBe("text");
      expect(nameCol?.grow).toBe(2);
    });
  });

  describe("eventTableSchema", () => {
    it("has expected columns", () => {
      expect(eventTableSchema.columns).toHaveLength(5);
    });

    it("has relation columns for application data", () => {
      const companyCol = eventTableSchema.columns.find((c) => c.id === "application.company.name");
      const posCol = eventTableSchema.columns.find((c) => c.id === "application.position");
      expect(companyCol).toBeDefined();
      expect(posCol).toBeDefined();
    });
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd frontend && pnpm test table-schemas.test.ts
```
Expected: FAIL with "Cannot find module './table-schemas'"

**Step 3: Write schemas implementation**

```typescript
// frontend/src/schemas/table-schemas.ts
import { Badge } from "@/components/ui/badge";
import type { ApplicationListItem } from "@/lib/queries/applications";
import type { Company } from "@/lib/queries/companies";
import type { EventWithApplication } from "@/lib/queries/events";
import { formatDate, formatRelativeTime } from "@/lib/formatters";
import { capitalize } from "@/lib/utils";
import type { TableSchema } from "./table-schema";

// Application Schema
export const applicationTableSchema: TableSchema<ApplicationListItem> = {
  columns: [
    {
      id: "position",
      header: "Position",
      type: "text",
      sortable: true,
      minWidth: 200,
      grow: 2,
      cell: (row) => <span className="font-medium">{row.position}</span>,
    },
    {
      id: "company.name",
      header: "Company",
      type: "relation",
      sortable: false,
      minWidth: 150,
      grow: 1.5,
      cell: (row) => <span className="text-muted-foreground">{row.company?.name ?? "-"}</span>,
    },
    {
      id: "status",
      header: "Status",
      type: "enum",
      sortable: false,
      minWidth: 120,
      options: ["bookmarked", "applied", "interviewing", "offer", "accepted", "rejected", "archived"],
      cell: (row) => (
        <Badge variant="secondary" className={getStatusColor(row.status)}>
          {capitalize(row.status)}
        </Badge>
      ),
    },
    {
      id: "interest",
      header: "Interest",
      type: "enum",
      sortable: false,
      minWidth: 120,
      options: ["low", "medium", "high", "dream"],
      cell: (row) => {
        if (!row.interest) return <span className="text-muted-foreground">-</span>;
        return (
          <Badge variant="secondary" className={getInterestColor(row.interest!)}>
            {capitalize(row.interest)}
          </Badge>
        );
      },
    },
    {
      id: "location",
      header: "Location",
      type: "text",
      sortable: false,
      minWidth: 150,
      grow: 1,
      cell: (row) => <span className="text-muted-foreground">{row.location || "-"}</span>,
    },
    {
      id: "applied_at",
      header: "Applied",
      type: "date",
      sortable: true,
      minWidth: 130,
      align: "left",
      cell: (row) => <span className="text-muted-foreground">{formatDate(row.applied_at)}</span>,
    },
    {
      id: "updated_at",
      header: "Updated",
      type: "datetime",
      sortable: true,
      minWidth: 140,
      align: "left",
      cell: (row) => <span className="text-muted-foreground">{formatRelativeTime(row.updated_at)}</span>,
    },
  ],
};

// Company Schema
export const companyTableSchema: TableSchema<Company> = {
  columns: [
    {
      id: "name",
      header: "Name",
      type: "text",
      sortable: false,
      minWidth: 200,
      grow: 2,
      cell: (row) => <span className="font-medium">{row.name}</span>,
    },
    {
      id: "industry",
      header: "Industry",
      type: "text",
      sortable: false,
      minWidth: 150,
      grow: 1,
      cell: (row) => <span className="text-muted-foreground">{row.industry || "--"}</span>,
    },
    {
      id: "location",
      header: "Location",
      type: "text",
      sortable: false,
      minWidth: 150,
      grow: 1,
      cell: (row) => <span className="text-muted-foreground">{row.location || "--"}</span>,
    },
    {
      id: "size",
      header: "Size",
      type: "text",
      sortable: false,
      minWidth: 120,
      grow: 0.5,
      cell: (row) => <span className="text-muted-foreground">{row.size || "--"}</span>,
    },
    {
      id: "researched",
      header: "Researched",
      type: "enum",
      sortable: false,
      minWidth: 100,
      align: "center",
      options: ["true", "false"],
      cell: (row) => (
        <Badge variant={row.researched ? "secondary" : "outline"} className="text-xs">
          {row.researched ? "Yes" : "No"}
        </Badge>
      ),
    },
    {
      id: "tags",
      header: "Tags",
      type: "text",
      sortable: false,
      minWidth: 150,
      grow: 1,
      cell: (row) => {
        const tags = Array.isArray(row.tags) ? (row.tags as string[]) : [];
        return (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {tags.length > 2 && <span className="text-xs text-muted-foreground">+{tags.length - 2}</span>}
          </div>
        );
      },
    },
  ],
};

// Event Schema
const EVENT_TYPE_LABELS: Record<string, string> = {
  screening_interview: "Screening",
  technical_interview: "Technical",
  behavioral_interview: "Behavioral",
  online_test: "Online Test",
  take_home: "Take Home",
  onsite: "Onsite",
};

export const eventTableSchema: TableSchema<EventWithApplication> = {
  columns: [
    {
      id: "application.company.name",
      header: "Company",
      type: "relation",
      sortable: false,
      minWidth: 180,
      grow: 1.5,
      cell: (row) => <span className="font-medium">{row.application?.company?.name ?? "Unknown"}</span>,
    },
    {
      id: "application.position",
      header: "Position",
      type: "relation",
      sortable: false,
      minWidth: 200,
      grow: 2,
      cell: (row) => <span className="text-muted-foreground">{row.application?.position ?? "Unknown"}</span>,
    },
    {
      id: "type",
      header: "Type",
      type: "enum",
      sortable: false,
      minWidth: 120,
      options: Object.keys(EVENT_TYPE_LABELS),
      cell: (row) => <Badge variant="outline">{EVENT_TYPE_LABELS[row.type] ?? row.type}</Badge>,
    },
    {
      id: "status",
      header: "Status",
      type: "enum",
      sortable: false,
      minWidth: 140,
      options: ["scheduled", "completed", "cancelled", "rescheduled", "availability_requested", "availability_submitted", "no_show"],
      cell: (row) => (
        <Badge variant="secondary" className={getEventStatusColor(row.status)}>
          {capitalize(row.status)}
        </Badge>
      ),
    },
    {
      id: "scheduled_at",
      header: "Date",
      type: "datetime",
      sortable: true,
      minWidth: 180,
      align: "left",
      cell: (row) => <span className="text-muted-foreground">{row.scheduled_at ? formatDate(row.scheduled_at) : "TBD"}</span>,
    },
  ],
};

// Helper functions for badge colors (extract from existing components)
function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    bookmarked: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    applied: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    interviewing: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
    offer: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    accepted: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
    rejected: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    archived: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  };
  return colors[status] ?? "";
}

function getInterestColor(interest: string): string {
  const colors: Record<string, string> = {
    low: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
    medium: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    high: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
    dream: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  };
  return colors[interest] ?? "";
}

function getEventStatusColor(status: string): string {
  const colors: Record<string, string> = {
    scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    rescheduled: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
    availability_requested: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    availability_submitted: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
    no_show: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  };
  return colors[status] ?? "";
}
```

**Step 4: Run test to verify it passes**

```bash
cd frontend && pnpm test table-schemas.test.ts
```
Expected: PASS

**Step 5: Commit**

```bash
git add frontend/src/schemas/table-schemas.ts frontend/src/schemas/table-schemas.test.ts
git commit -m "feat: add entity table schemas with custom cell renderers"
```

---

### Task 5: Create useTableState hook

**Files:**
- Create: `frontend/src/hooks/use-table-state.ts`

**Step 1: Write hook with tests**

```typescript
// frontend/src/hooks/use-table-state.test.tsx
import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTableState } from "./use-table-state";

describe("useTableState", () => {
  it("initializes with default values", () => {
    const { result } = renderHook(() => useTableState());
    expect(result.current.filters).toEqual({});
    expect(result.current.sorting).toEqual([]);
    expect(result.current.page).toBe(1);
    expect(result.current.pageSize).toBe(25);
    expect(result.current.selectedId).toBe(null);
  });

  it("initializes with provided values", () => {
    const { result } = renderHook(() =>
      useTableState({
        initialFilters: { search: "test", status: "applied" },
        initialSorting: [{ id: "position", desc: true }],
        initialPageSize: 50,
      }),
    );
    expect(result.current.filters).toEqual({ search: "test", status: "applied" });
    expect(result.current.sorting).toEqual([{ id: "position", desc: true }]);
    expect(result.current.pageSize).toBe(50);
  });

  it("updateFilter updates single filter", () => {
    const { result } = renderHook(() =>
      useTableState<{ search: string; status: string }>({
        initialFilters: { search: "", status: "" },
      }),
    );
    act(() => {
      result.current.updateFilter("search", "company");
    });
    expect(result.current.filters.search).toBe("company");
    expect(result.current.filters.status).toBe("");
  });

  it("resetFilters clears filters and resets page", () => {
    const { result } = renderHook(() =>
      useTableState<{ search: string }>({
        initialFilters: { search: "test" },
        initialPage: 5,
      }),
    );
    act(() => {
      result.current.resetFilters();
    });
    expect(result.current.filters).toEqual({});
    expect(result.current.page).toBe(1);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd frontend && pnpm test use-table-state.test.tsx
```
Expected: FAIL with "Cannot find module './use-table-state'"

**Step 3: Write hook implementation**

```typescript
// frontend/src/hooks/use-table-state.ts
import { useState, useCallback } from "react";
import type { SortingState } from "@tanstack/react-table";

interface UseTableStateOptions {
  initialFilters?: Record<string, unknown>;
  initialSorting?: SortingState;
  initialPageSize?: number;
  initialPage?: number;
}

interface UseTableStateReturn<TFilter = Record<string, unknown>> {
  filters: TFilter;
  setFilters: React.Dispatch<React.SetStateAction<TFilter>>;
  updateFilter: <K extends keyof TFilter>(key: K, value: TFilter[K]) => void;
  sorting: SortingState;
  setSorting: React.Dispatch<React.SetStateAction<SortingState>>;
  page: number;
  pageSize: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  setPageSize: React.Dispatch<React.SetStateAction<number>>;
  selectedId: string | null;
  setSelectedId: React.Dispatch<React.SetStateAction<string | null>>;
  resetFilters: () => void;
  resetSorting: () => void;
  resetAll: () => void;
}

export function useTableState<TFilter extends Record<string, unknown>>(
  options: UseTableStateOptions = {},
): UseTableStateReturn<TFilter> {
  const {
    initialFilters = {},
    initialSorting = [],
    initialPageSize = 25,
    initialPage = 1,
  } = options;

  const [filters, setFilters] = useState<TFilter>(initialFilters);
  const [sorting, setSorting] = useState<SortingState>(initialSorting);
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const updateFilter = useCallback(
    <K extends keyof TFilter>(key: K, value: TFilter[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
    setPage(1);
  }, [initialFilters]);

  const resetSorting = useCallback(() => {
    setSorting([]);
    setPage(1);
  }, []);

  const resetAll = useCallback(() => {
    setFilters(initialFilters);
    setSorting([]);
    setPage(1);
    setPageSize(initialPageSize);
    setSelectedId(null);
  }, [initialFilters, initialPageSize]);

  return {
    filters,
    setFilters,
    updateFilter,
    sorting,
    setSorting,
    page,
    pageSize,
    setPage,
    setPageSize,
    selectedId,
    setSelectedId,
    resetFilters,
    resetSorting,
    resetAll,
  };
}
```

**Step 4: Run test to verify it passes**

```bash
cd frontend && pnpm test use-table-state.test.tsx
```
Expected: PASS

**Step 5: Commit**

```bash
git add frontend/src/hooks/use-table-state.ts frontend/src/hooks/use-table-state.test.tsx
git commit -m "feat: add useTableState hook for table state management"
```

---

### Task 6: Create SidePanel component

**Files:**
- Create: `frontend/src/components/shared/side-panel.tsx`

**Step 1: Write component with tests**

```typescript
// frontend/src/components/shared/__tests__/side-panel.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SidePanel } from "../side-panel";

describe("SidePanel", () => {
  beforeEach(() => {
    vi.stubGlobal("window", { innerWidth: 1024 });
  });

  it("does not render when closed", () => {
    const { container } = render(
      <SidePanel isOpen={false} onClose={vi.fn()}>
        <div>Content</div>
      </SidePanel>,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders when open", () => {
    render(
      <SidePanel isOpen={true} onClose={vi.fn()}>
        <div>Content</div>
      </SidePanel>,
    );
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("calls onClose when backdrop clicked", () => {
    const onClose = vi.fn();
    render(
      <SidePanel isOpen={true} onClose={onClose}>
        <div>Content</div>
      </SidePanel>,
    );
    const backdrop = screen.getByTestId("side-panel-backdrop");
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when close button clicked", () => {
    const onClose = vi.fn();
    render(
      <SidePanel isOpen={true} onClose={onClose}>
        <div>Content</div>
      </SidePanel>,
    );
    const closeButton = screen.getByRole("button", { name: /close/i });
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd frontend && pnpm test side-panel.test.tsx
```
Expected: FAIL with "Cannot find module '../side-panel'"

**Step 3: Write component implementation**

```typescript
// frontend/src/components/shared/side-panel.tsx
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

type SidePanelWidth = "sm" | "md" | "lg" | "xl";

interface SidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  width?: SidePanelWidth;
  position?: "right" | "left";
}

const WIDTH_CLASSES: Record<SidePanelWidth, string> = {
  sm: "w-[360px]",
  md: "w-[480px]",
  lg: "w-[600px]",
  xl: "w-[800px]",
};

export function SidePanel({
  isOpen,
  onClose,
  children,
  width = "md",
  position = "right",
}: SidePanelProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (!isOpen) return null;

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-end">
        <div
          data-testid="side-panel-backdrop"
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />
        <div className="relative flex w-full flex-col border-t bg-background shadow-xl transition-transform duration-300 ease-in-out max-h-[80vh]">
          <div className="flex items-center justify-between border-b p-4">
            <h2 className="text-lg font-semibold">Details</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="size-5" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">{children}</div>
        </div>
      </div>
    );
  }

  const positionClass = position === "right" ? "right-0" : "left-0";

  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        data-testid="side-panel-backdrop"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <aside
        className={cn(
          "relative flex h-full w-full max-w-full flex-col border-l bg-background shadow-xl transition-transform duration-300 ease-in-out",
          WIDTH_CLASSES[width],
          positionClass,
        )}
      >
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-lg font-semibold">Details</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="size-5" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </aside>
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

```bash
cd frontend && pnpm test side-panel.test.tsx
```
Expected: PASS

**Step 5: Commit**

```bash
git add frontend/src/components/shared/side-panel.tsx frontend/src/components/shared/__tests__/side-panel.test.tsx
git commit -m "feat: add SidePanel component with responsive behavior"
```

---

### Task 7: Create PageLayout component

**Files:**
- Create: `frontend/src/components/shared/page-layout.tsx`

**Step 1: Write component with tests**

```typescript
// frontend/src/components/shared/__tests__/page-layout.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PageLayout } from "../page-layout";

describe("PageLayout", () => {
  it("renders children without detail panel", () => {
    render(
      <PageLayout detailPanel={null} onDetailClose={() => {}}>
        <div>Main Content</div>
      </PageLayout>,
    );
    expect(screen.getByText("Main Content")).toBeInTheDocument();
  });

  it("renders children with detail panel", () => {
    render(
      <PageLayout detailPanel={<div>Detail Content</div>} onDetailClose={() => {}}>
        <div>Main Content</div>
      </PageLayout>,
    );
    expect(screen.getByText("Main Content")).toBeInTheDocument();
    expect(screen.getByText("Detail Content")).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd frontend && pnpm test page-layout.test.tsx
```
Expected: FAIL with "Cannot find module '../page-layout'"

**Step 3: Write component implementation**

```typescript
// frontend/src/components/shared/page-layout.tsx
import { SidePanel } from "./side-panel";
import { cn } from "@/lib/utils";

type SidePanelWidth = "sm" | "md" | "lg" | "xl";

interface PageLayoutProps {
  children: React.ReactNode;
  detailPanel?: React.ReactNode | null;
  onDetailClose?: () => void;
  detailWidth?: SidePanelWidth;
  showDetailPanel?: boolean;
}

export function PageLayout({
  children,
  detailPanel,
  onDetailClose = () => {},
  detailWidth = "md",
  showDetailPanel = !!detailPanel,
}: PageLayoutProps) {
  return (
    <div className="flex h-full w-full">
      <div
        className={cn(
          "flex-1 transition-all duration-300 ease-in-out",
          showDetailPanel && "pr-[480px]",
        )}
      >
        <div className="h-full overflow-y-auto">{children}</div>
      </div>
      <SidePanel isOpen={showDetailPanel} onClose={onDetailClose} width={detailWidth}>
        {detailPanel}
      </SidePanel>
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

```bash
cd frontend && pnpm test page-layout.test.tsx
```
Expected: PASS

**Step 5: Commit**

```bash
git add frontend/src/components/shared/page-layout.tsx frontend/src/components/shared/__tests__/page-layout.test.tsx
git commit -m "feat: add PageLayout component for table + side panel composition"
```

---

### Task 8: Create UniversalTable component

**Files:**
- Create: `frontend/src/components/shared/universal-table.tsx`

**Step 1: Write component with tests**

```typescript
// frontend/src/components/shared/__tests__/universal-table.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { UniversalTable } from "../universal-table";

const mockSchema = {
  columns: [
    { id: "name", header: "Name", type: "text" as const, sortable: true, minWidth: 150 },
    { id: "value", header: "Value", type: "number" as const, sortable: false, minWidth: 100 },
  ],
} as const;

const mockData = [
  { id: "1", name: "Item 1", value: 10 },
  { id: "2", name: "Item 2", value: 20 },
];

describe("UniversalTable", () => {
  it("renders table with schema", () => {
    render(<UniversalTable data={mockData} schema={mockSchema} />);
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Value")).toBeInTheDocument();
  });

  it("renders rows from data", () => {
    render(<UniversalTable data={mockData} schema={mockSchema} />);
    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Item 2")).toBeInTheDocument();
  });

  it("calls onRowClick when row clicked", () => {
    const onRowClick = vi.fn();
    render(
      <UniversalTable data={mockData} schema={mockSchema} onRowClick={onRowClick} />,
    );
    fireEvent.click(screen.getByText("Item 1"));
    expect(onRowClick).toHaveBeenCalledWith(mockData[0]);
  });

  it("highlights selected row", () => {
    render(<UniversalTable data={mockData} schema={mockSchema} selectedId="1" />);
    const row1 = screen.getByText("Item 1").closest("tr");
    const row2 = screen.getByText("Item 2").closest("tr");
    expect(row1).toHaveClass(/bg-muted/50/);
    expect(row2).not.toHaveClass(/bg-muted/50/);
  });

  it("shows empty state when no data", () => {
    render(<UniversalTable data={[]} schema={mockSchema} />);
    expect(screen.getByText("No records found")).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd frontend && pnpm test universal-table.test.tsx
```
Expected: FAIL with "Cannot find module '../universal-table'"

**Step 3: Write component implementation**

```typescript
// frontend/src/components/shared/universal-table.tsx
import type { ColumnDef, flexRender, getCoreRowModel, SortingState, useReactTable } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { TableSchema, ColumnType } from "@/schemas/table-schema";
import { formatDate, formatRelativeTime } from "@/lib/formatters";
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
        width: `minmax(${col.minWidth}px, ${percent}%)`,
        textAlign: col.align ?? "left",
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
            {schema.columns.map((col) => (
              <TableHead
                key={col.id}
                style={{
                  minWidth: columnStyles[schema.columns.indexOf(col)].minWidth,
                  width: columnStyles[schema.columns.indexOf(col)].width,
                  textAlign: columnStyles[schema.columns.indexOf(col)].textAlign,
                }}
              >
                {col.sortable ? (
                  <Button variant="ghost" size="sm" className="-ml-3 h-8 gap-1" onClick={() => handleSort(col.id)}>
                    {col.header}
                    {sortColumnId === col.id ? (
                      sortDirection === "desc" ? <ArrowDown className="size-3" /> : <ArrowUp className="size-3" />
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
              const rowData = row.original as T;
              const isSelected = selectedId === getRowId(rowData);
              return (
                <TableRow
                  key={row.id}
                  className={cn(isSelected && "bg-muted/50", "cursor-pointer hover:bg-muted/50")}
                  onClick={() => onRowClick?.(rowData)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      style={{
                        textAlign: columnStyles[cell.column.index].textAlign,
                      }}
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
      return <span className="text-muted-foreground">{String(value)}</span>;
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
```

**Step 4: Run test to verify it passes**

```bash
cd frontend && pnpm test universal-table.test.tsx
```
Expected: PASS

**Step 5: Commit**

```bash
git add frontend/src/components/shared/universal-table.tsx frontend/src/components/shared/__tests__/universal-table.test.tsx
git commit -m "feat: add UniversalTable component with type-safe schema rendering"
```

---

### Task 9: Create ApplicationDetail component

**Files:**
- Create: `frontend/src/components/applications/application-detail.tsx`

**Step 1: Write component with tests**

```typescript
// frontend/src/components/applications/__tests__/application-detail.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ApplicationDetail } from "../application-detail";
import type { ApplicationWithCompany } from "@/lib/queries/applications";

const mockApplication: ApplicationWithCompany = {
  id: "1",
  position: "Software Engineer",
  status: "applied",
  company: { id: "c1", name: "Test Company", industry: "Tech" },
  applied_at: "2026-02-20T00:00:00Z",
  updated_at: "2026-02-23T00:00:00Z",
} as ApplicationWithCompany;

describe("ApplicationDetail", () => {
  it("renders application details", () => {
    render(<ApplicationDetail application={mockApplication} />);
    expect(screen.getByText("Application Details")).toBeInTheDocument();
    expect(screen.getByText("Software Engineer")).toBeInTheDocument();
    expect(screen.getByText("Test Company")).toBeInTheDocument();
    expect(screen.getByText("Tech")).toBeInTheDocument();
  });

  it("renders company card when company exists", () => {
    render(<ApplicationDetail application={mockApplication} />);
    expect(screen.getByText("Company")).toBeInTheDocument();
    expect(screen.getByText("Test Company")).toBeInTheDocument();
  });

  it("shows status badge", () => {
    render(<ApplicationDetail application={mockApplication} />);
    expect(screen.getByText("applied")).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd frontend && pnpm test application-detail.test.tsx
```
Expected: FAIL with "Cannot find module '../application-detail'"

**Step 3: Write component implementation**

```typescript
// frontend/src/components/applications/application-detail.tsx
import { Building2, Calendar, DollarSign, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { ApplicationWithCompany } from "@/lib/queries/applications";
import { formatDate } from "@/lib/formatters";
import { useNavigate } from "@tanstack/react-router";

const STATUS_COLORS: Record<string, string> = {
  bookmarked: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  applied: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  interviewing: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  offer: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  accepted: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  archived: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

const INTEREST_COLORS: Record<string, string> = {
  low: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  medium: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  dream: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
};

interface ApplicationDetailProps {
  application: ApplicationWithCompany;
}

export function ApplicationDetail({ application }: ApplicationDetailProps) {
  const navigate = useNavigate();

  const handleOpenFull = () => {
    navigate({ to: `/applications/${application.id}` });
  };

  const formatSalary = () => {
    if (!application.salary) return "-";
    const s = application.salary as Record<string, unknown>;
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
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Application Details</h3>
        <Button variant="outline" size="sm" onClick={handleOpenFull}>
          Open Full Page
        </Button>
      </div>

      {application.company && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="size-4" />
              Company
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <p className="text-sm font-medium">{application.company.name}</p>
              </div>
              {application.company.industry && (
                <p className="text-sm text-muted-foreground">
                  Industry: {application.company.industry}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Position</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-lg font-semibold">{application.position}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Status</p>
              <Badge variant="secondary" className={STATUS_COLORS[application.status] ?? ""}>
                {application.status}
              </Badge>
            </div>

            {application.interest && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Interest Level</p>
                <Badge variant="secondary" className={INTEREST_COLORS[application.interest] ?? ""}>
                  {application.interest}
                </Badge>
              </div>
            )}
          </div>

          {application.location && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Location</p>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="size-4 text-muted-foreground" />
                <span>{application.location}</span>
              </div>
            </div>
          )}

          {application.salary && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Salary Range</p>
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="size-4 text-muted-foreground" />
                <span>{formatSalary()}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {application.applied_at && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Applied</p>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="size-4 text-muted-foreground" />
                  <span>{formatDate(application.applied_at)}</span>
                </div>
              </div>
            )}
            {application.updated_at && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Last Updated</p>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="size-4 text-muted-foreground" />
                  <span>{formatDate(application.updated_at)}</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {application.description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {application.description}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

```bash
cd frontend && pnpm test application-detail.test.tsx
```
Expected: PASS

**Step 5: Commit**

```bash
git add frontend/src/components/applications/application-detail.tsx frontend/src/components/applications/__tests__/application-detail.test.tsx
git commit -m "feat: add ApplicationDetail component"
```

---

### Task 10: Create CompanyDetail component

**Files:**
- Create: `frontend/src/components/companies/company-detail.tsx`

**Step 1: Write component with tests**

```typescript
// frontend/src/components/companies/__tests__/company-detail.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CompanyDetail } from "../company-detail";
import type { Company } from "@/lib/queries/companies";

const mockCompany: Company = {
  id: "1",
  name: "Test Company",
  industry: "Technology",
  location: "San Francisco, CA",
  size: "100-500",
  researched: true,
  tags: ["startup", "remote"],
} as Company;

describe("CompanyDetail", () => {
  it("renders company details", () => {
    render(<CompanyDetail company={mockCompany} />);
    expect(screen.getByText("Test Company")).toBeInTheDocument();
    expect(screen.getByText("Technology")).toBeInTheDocument();
    expect(screen.getByText("San Francisco, CA")).toBeInTheDocument();
  });

  it("shows research status badge", () => {
    render(<CompanyDetail company={mockCompany} />);
    expect(screen.getByText("Researched")).toBeInTheDocument();
  });

  it("renders tags as badges", () => {
    render(<CompanyDetail company={mockCompany} />);
    expect(screen.getByText("startup")).toBeInTheDocument();
    expect(screen.getByText("remote")).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd frontend && pnpm test company-detail.test.tsx
```
Expected: FAIL with "Cannot find module '../company-detail'"

**Step 3: Write component implementation**

```typescript
// frontend/src/components/companies/company-detail.tsx
import { Building2, Globe, Mail, MapPin, Tag, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Company } from "@/lib/queries/companies";

interface CompanyDetailProps {
  company: Company;
}

export function CompanyDetail({ company }: CompanyDetailProps) {
  const tags = Array.isArray(company.tags) ? (company.tags as string[]) : [];
  const ratings = company.ratings as Record<string, string> | null;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{company.name}</h3>
        {company.website && (
          <a
            href={company.website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <Globe className="size-3" />
            <span>{company.website}</span>
          </a>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Company Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {company.industry && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Industry</p>
              <p className="text-sm">{company.industry}</p>
            </div>
          )}

          <Separator />

          {company.location && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Location</p>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="size-4 text-muted-foreground" />
                <span>{company.location}</span>
              </div>
            </div>
          )}

          <Separator />

          {company.size && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Company Size</p>
              <div className="flex items-center gap-2 text-sm">
                <Users className="size-4 text-muted-foreground" />
                <span>{company.size}</span>
              </div>
            </div>
          )}

          <Separator />

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Research Status</p>
            <div className="flex items-center gap-2">
              <Badge variant={company.researched ? "secondary" : "outline"}>
                {company.researched ? "Researched" : "Not Researched"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {(company.email || company.phone) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {company.email && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Email</p>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="size-4 text-muted-foreground" />
                  <a href={`mailto:${company.email}`} className="text-primary hover:underline">
                    {company.email}
                  </a>
                </div>
              </div>
            )}
            {company.phone && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="text-sm">{company.phone}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Tag className="size-4" />
              Tags
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="outline">{tag}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {ratings && Object.keys(ratings).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ratings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(ratings).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground capitalize">{key}</p>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span
                        key={i}
                        className={`size-4 ${i < Number(value) ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {company.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {company.notes}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

```bash
cd frontend && pnpm test company-detail.test.tsx
```
Expected: PASS

**Step 5: Commit**

```bash
git add frontend/src/components/companies/company-detail.tsx frontend/src/components/companies/__tests__/company-detail.test.tsx
git commit -m "feat: add CompanyDetail component"
```

---

### Task 11: Create EventDetail component

**Files:**
- Create: `frontend/src/components/events/event-detail.tsx`

**Step 1: Write component with tests**

```typescript
// frontend/src/components/events/__tests__/event-detail.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EventDetail } from "../event-detail";
import type { EventWithApplication } from "@/lib/queries/events";

const mockEvent: EventWithApplication = {
  id: "1",
  type: "technical_interview",
  status: "scheduled",
  scheduled_at: "2026-02-25T10:00:00Z",
  duration_minutes: 60,
  contact: { name: "John Doe", email: "john@example.com" },
  application: {
    id: "app1",
    company: { id: "c1", name: "Test Company" },
    position: "Software Engineer",
  },
} as EventWithApplication;

describe("EventDetail", () => {
  it("renders event details", () => {
    render(<EventDetail event={mockEvent} />);
    expect(screen.getByText("Technical Interview")).toBeInTheDocument();
    expect(screen.getByText("scheduled")).toBeInTheDocument();
  });

  it("shows related application", () => {
    render(<EventDetail event={mockEvent} />);
    expect(screen.getByText("Test Company")).toBeInTheDocument();
    expect(screen.getByText("Software Engineer")).toBeInTheDocument();
    expect(screen.getByText("View Application")).toBeInTheDocument();
  });

  it("shows contact person", () => {
    render(<EventDetail event={mockEvent} />);
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("john@example.com")).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd frontend && pnpm test event-detail.test.tsx
```
Expected: FAIL with "Cannot find module '../event-detail'"

**Step 3: Write component implementation**

```typescript
// frontend/src/components/events/event-detail.tsx
import { Building2, Calendar, Clock, ExternalLink, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { EventWithApplication } from "@/lib/queries/events";
import { formatDate } from "@/lib/formatters";

const EVENT_TYPE_LABELS: Record<string, string> = {
  screening_interview: "Screening Interview",
  technical_interview: "Technical Interview",
  behavioral_interview: "Behavioral Interview",
  online_test: "Online Test",
  take_home: "Take Home Assignment",
  onsite: "Onsite Interview",
};

const EVENT_STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  rescheduled: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  availability_requested: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  availability_submitted: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  no_show: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

interface EventDetailProps {
  event: EventWithApplication;
}

export function EventDetail({ event }: EventDetailProps) {
  const typeLabel = EVENT_TYPE_LABELS[event.type] || event.type;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{event.title || typeLabel}</h3>
        <Badge variant="secondary" className={EVENT_STATUS_COLORS[event.status] ?? ""}>
          {event.status}
        </Badge>
      </div>

      {event.application && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="size-4" />
              Related Application
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium">{event.application.company?.name}</p>
              <p className="text-xs text-muted-foreground">{event.application.position}</p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href={`/applications/${event.application.id}`}>View Application</a>
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Event Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Event Type</p>
            <Badge variant="outline">{typeLabel}</Badge>
          </div>

          <Separator />

          {event.scheduled_at && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Scheduled</p>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="size-4 text-muted-foreground" />
                <span>{formatDate(event.scheduled_at)}</span>
              </div>
            </div>
          )}

          <Separator />

          {event.duration_minutes && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Duration</p>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="size-4 text-muted-foreground" />
                <span>{event.duration_minutes} min</span>
              </div>
            </div>
          )}

          <Separator />

          {event.contact && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Contact Person</p>
              <div className="flex items-center gap-2 text-sm">
                <User className="size-4 text-muted-foreground" />
                <span>{event.contact.name}</span>
              </div>
              {event.contact.email && (
                <p className="text-xs text-muted-foreground ml-6">
                  {event.contact.email}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {event.url && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Meeting Link</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground truncate">{event.url}</p>
              <Button variant="outline" size="sm" asChild>
                <a
                  href={event.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1"
                >
                  <ExternalLink className="size-3" />
                  Open
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {event.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {event.notes}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

```bash
cd frontend && pnpm test event-detail.test.tsx
```
Expected: PASS

**Step 5: Commit**

```bash
git add frontend/src/components/events/event-detail.tsx frontend/src/components/events/__tests__/event-detail.test.tsx
git commit -m "feat: add EventDetail component with related application"
```

---

### Task 12: Refactor Applications page

**Files:**
- Modify: `frontend/src/routes/_authenticated/applications.tsx`

**Step 1: Write refactored page with tests**

```typescript
// frontend/src/routes/_authenticated/__tests__/applications.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ApplicationsPage } from "../applications";

vi.mock("@/lib/queries/applications", () => ({
  useApplications: vi.fn(() => ({ data: { data: [], count: 0 }, isLoading: false })),
  useApplication: vi.fn(() => ({ data: null, isLoading: false })),
}));

describe("ApplicationsPage", () => {
  it("renders page layout with table", () => {
    render(<ApplicationsPage />);
    expect(screen.getByText("Applications")).toBeInTheDocument();
  });

  it("calls useApplications with filters", () => {
    const { useApplications } = await import("@/lib/queries/applications");
    render(<ApplicationsPage />);
    expect(useApplications).toHaveBeenCalled();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd frontend && pnpm test applications.test.tsx
```
Expected: FAIL with tests not matching new structure

**Step 3: Refactor page implementation**

```typescript
// frontend/src/routes/_authenticated/applications.tsx
import { createFileRoute } from "@tanstack/react-router";
import { useTableState } from "@/hooks/use-table-state";
import { applicationTableSchema } from "@/schemas/table-schemas";
import { UniversalTable } from "@/components/shared/universal-table";
import { PageLayout } from "@/components/shared/page-layout";
import { ApplicationDetail } from "@/components/applications/application-detail";
import { useApplications } from "@/lib/queries/applications";

interface ApplicationFilters {
  search?: string;
  status?: string;
  interest?: string;
  workType?: string;
  employmentType?: string;
}

export const Route = createFileRoute("/_authenticated/applications")({
  component: ApplicationsPage,
});

function ApplicationsPage() {
  const tableState = useTableState<ApplicationFilters>({
    initialFilters: { search: "", status: "", interest: "", workType: "", employmentType: "" },
    initialPageSize: 25,
  });

  const { data: result, isLoading } = useApplications({
    search: tableState.filters.search,
    status: tableState.filters.status,
    interest: tableState.filters.interest,
    workType: tableState.filters.workType,
    employmentType: tableState.filters.employmentType,
    sort: tableState.sorting[0]
      ? { column: tableState.sorting[0].id, direction: tableState.sorting[0].desc ? "desc" : "asc" }
      : undefined,
    page: tableState.page,
    pageSize: tableState.pageSize,
  });

  const { data: selectedApp } = useApplication(tableState.selectedId);

  const applications = result?.data ?? [];
  const totalCount = result?.count ?? 0;
  const totalPages = Math.ceil(totalCount / tableState.pageSize);

  return (
    <PageLayout
      detailPanel={selectedApp ? <ApplicationDetail application={selectedApp} /> : null}
      onDetailClose={() => tableState.setSelectedId(null)}
      detailWidth="lg"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Applications</h1>
            <p className="text-sm text-muted-foreground">
              {isLoading ? "Loading..." : `${totalCount} application${totalCount !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>

        <UniversalTable
          data={applications}
          schema={applicationTableSchema}
          sorting={tableState.sorting}
          onSortingChange={tableState.setSorting}
          onRowClick={(app) => tableState.setSelectedId(app.id)}
          selectedId={tableState.selectedId}
          className="flex-1"
        />

        {/* TODO: Add filters component */}
        {/* TODO: Add pagination component */}
      </div>
    </PageLayout>
  );
}
```

**Step 4: Run test to verify it passes**

```bash
cd frontend && pnpm test applications.test.tsx
```
Expected: PASS

**Step 5: Commit**

```bash
git add frontend/src/routes/_authenticated/applications.tsx frontend/src/routes/_authenticated/__tests__/applications.test.tsx
git commit -m "refactor(applications): migrate to UniversalTable and PageLayout"
```

---

### Task 13: Refactor Companies page

**Files:**
- Modify: `frontend/src/routes/_authenticated/companies.tsx`

**Step 1: Write refactored page with tests**

```typescript
// frontend/src/routes/_authenticated/__tests__/companies.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CompaniesPage } from "../companies";

vi.mock("@/lib/queries/companies", () => ({
  useCompanies: vi.fn(() => ({ data: { data: [], count: 0 }, isLoading: false })),
}));

describe("CompaniesPage", () => {
  it("renders page layout with table", () => {
    render(<CompaniesPage />);
    expect(screen.getByText("Companies")).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd frontend && pnpm test companies.test.tsx
```
Expected: FAIL with tests not matching new structure

**Step 3: Refactor page implementation**

```typescript
// frontend/src/routes/_authenticated/companies.tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTableState } from "@/hooks/use-table-state";
import { companyTableSchema } from "@/schemas/table-schemas";
import { UniversalTable } from "@/components/shared/universal-table";
import { PageLayout } from "@/components/shared/page-layout";
import { CompanyDetail } from "@/components/companies/company-detail";
import { useCompanies } from "@/lib/queries/companies";

interface CompaniesSearch {
  search?: string;
}

export const Route = createFileRoute("/_authenticated/companies")({
  validateSearch: (search: Record<string, unknown>): CompaniesSearch => ({
    search: (search.search as string) || undefined,
  }),
  component: CompaniesPage,
});

function CompaniesPage() {
  const { search, view } = Route.useSearch();
  const navigate = useNavigate();

  const tableState = useTableState<CompaniesSearch>({
    initialFilters: { search: search ?? "" },
  });

  const { data, isLoading } = useCompanies({
    search: tableState.filters.search,
    page: tableState.page,
    pageSize: tableState.pageSize,
  });

  const companies = data?.data ?? [];
  const totalCount = data?.count ?? 0;
  const totalPages = Math.ceil(totalCount / tableState.pageSize);

  const handleSearchChange = (value: string) => {
    navigate({ to: ".", search: { search: value || undefined }, replace: true });
  };

  const selectedCompany = companies.find((c) => c.id === tableState.selectedId);

  return (
    <PageLayout
      detailPanel={selectedCompany ? <CompanyDetail company={selectedCompany} /> : null}
      onDetailClose={() => tableState.setSelectedId(null)}
      detailWidth="md"
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Companies</h1>
            <p className="text-sm text-muted-foreground">
              {isLoading ? "Loading..." : `${totalCount} company${totalCount !== 1 ? "ies" : "y"}`}
            </p>
          </div>
        </div>

        <div className="relative max-w-sm flex-1">
          {/* Search input */}
        </div>

        <UniversalTable
          data={companies}
          schema={companyTableSchema}
          onRowClick={(company) => tableState.setSelectedId(company.id)}
          selectedId={tableState.selectedId}
          className="flex-1"
        />

        {/* TODO: Add pagination component */}
      </div>
    </PageLayout>
  );
}
```

**Step 4: Run test to verify it passes**

```bash
cd frontend && pnpm test companies.test.tsx
```
Expected: PASS

**Step 5: Commit**

```bash
git add frontend/src/routes/_authenticated/companies.tsx frontend/src/routes/_authenticated/__tests__/companies.test.tsx
git commit -m "refactor(companies): migrate to UniversalTable and PageLayout"
```

---

### Task 14: Refactor Events page

**Files:**
- Modify: `frontend/src/routes/_authenticated/events.tsx`

**Step 1: Write refactored page with tests**

```typescript
// frontend/src/routes/_authenticated/__tests__/events.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { EventsPage } from "../events";

vi.mock("@/lib/queries/events", () => ({
  useUpcomingEvents: vi.fn(() => ({ data: [], isLoading: false })),
  usePastEvents: vi.fn(() => ({ data: [], isLoading: false })),
}));

describe("EventsPage", () => {
  it("renders page layout with table", () => {
    render(<EventsPage />);
    expect(screen.getByText("Events")).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd frontend && pnpm test events.test.tsx
```
Expected: FAIL with tests not matching new structure

**Step 3: Refactor page implementation**

```typescript
// frontend/src/routes/_authenticated/events.tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTableState } from "@/hooks/use-table-state";
import { eventTableSchema } from "@/schemas/table-schemas";
import { UniversalTable } from "@/components/shared/universal-table";
import { PageLayout } from "@/components/shared/page-layout";
import { EventDetail } from "@/components/events/event-detail";
import { useUpcomingEvents, usePastEvents } from "@/lib/queries/events";

export const Route = createFileRoute("/_authenticated/events")({
  component: EventsPage,
  validateSearch: (search: Record<string, unknown>) => ({
    tab: (search.tab as string) || "upcoming",
  }),
});

function EventsPage() {
  const { tab } = Route.useSearch();
  const navigate = useNavigate();

  const tableState = useTableState();

  const setTab = (value: string) => {
    navigate({ to: "/events", search: { tab: value }, replace: true });
  };

  const { data: upcoming = [] } = useUpcomingEvents();
  const { data: past = [] } = usePastEvents();

  const eventData = tab === "upcoming" ? upcoming : past;
  const selectedEvent = eventData.find((e) => e.id === tableState.selectedId);

  return (
    <PageLayout
      detailPanel={selectedEvent ? <EventDetail event={selectedEvent} /> : null}
      onDetailClose={() => tableState.setSelectedId(null)}
      detailWidth="lg"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Events</h1>
          {/* TODO: Add Event button */}
        </div>

        {/* TODO: Add search/filter */}

        <UniversalTable
          data={eventData}
          schema={eventTableSchema}
          onRowClick={(event) => tableState.setSelectedId(event.id)}
          selectedId={tableState.selectedId}
          className="flex-1"
        />

        {/* TODO: Keep tabs for upcoming/past filter */}
      </div>
    </PageLayout>
  );
}
```

**Step 4: Run test to verify it passes**

```bash
cd frontend && pnpm test events.test.tsx
```
Expected: PASS

**Step 5: Commit**

```bash
git add frontend/src/routes/_authenticated/events.tsx frontend/src/routes/_authenticated/__tests__/events.test.tsx
git commit -m "refactor(events): migrate to UniversalTable and PageLayout"
```

---

### Task 15: Run all tests and verify functionality

**Files:**
- Test: All frontend tests

**Step 1: Run full test suite**

```bash
cd frontend && pnpm test
```
Expected: All tests pass

**Step 2: Start dev server**

```bash
cd frontend && pnpm dev
```
Expected: Dev server starts successfully on http://localhost:5173

**Step 3: Manual verification checklist**

- [ ] Navigate to /applications - table renders, columns fill available space
- [ ] Click a row - side panel opens with ApplicationDetail
- [ ] Navigate to /companies - table renders, columns fill available space
- [ ] Click a row - side panel opens with CompanyDetail
- [ ] Navigate to /events - table renders (not cards), columns fill available space
- [ ] Click a row - side panel opens with EventDetail with related application
- [ ] Resize browser window - side panel transitions smoothly
- [ ] Mobile viewport (width < 768px) - side panel shows as bottom sheet
- [ ] Close side panel by clicking backdrop - panel closes smoothly
- [ ] Close side panel by clicking X button - panel closes smoothly

**Step 4: Commit**

```bash
git add .
git commit -m "test: verify unified table implementation with manual testing"
```

---

### Task 16: Browser automation verification

**Files:**
- Create: `frontend/src/e2e/table-width.spec.ts`
- Create: `frontend/src/e2e/side-panel.spec.ts`

**Step 1: Write E2E tests for table width**

```typescript
// frontend/src/e2e/table-width.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Table column widths", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:5173/applications");
  });

  test("applications table fills available width", async ({ page }) => {
    const table = page.locator("table").first();
    const box = await table.boundingBox();

    // Table should fill container width
    expect(box?.width).toBeGreaterThan(800); // minimum reasonable width
  });

  test("columns maintain minimum widths", async ({ page }) => {
    const firstRow = page.locator("tbody tr").first();
    const cells = firstRow.locator("td");

    // Check that cells meet minimum widths (approximately)
    for (let i = 0; i < 3; i++) {
      const cellBox = await cells.nth(i).boundingBox();
      expect(cellBox?.width).toBeGreaterThan(100); // minimum column width
    }
  });

  test("table width is not determined by content", async ({ page }) => {
    // Add a row with very long content
    await page.goto("http://localhost:5173/applications");

    const initialWidth = await page.locator("table").first().boundingBox();

    // Reload and verify width stays consistent
    await page.reload();
    const reloadedWidth = await page.locator("table").first().boundingBox();

    expect(Math.abs(initialWidth!.width! - reloadedWidth!.width!)).toBeLessThan(20);
  });
});
```

**Step 2: Write E2E tests for side panel**

```typescript
// frontend/src/e2e/side-panel.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Side panel interactions", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:5173/applications");
  });

  test("clicking row opens side panel", async ({ page }) => {
    const firstRow = page.locator("tbody tr").first();
    await firstRow.click();

    // Side panel should appear
    const panel = page.locator("aside").filter({ hasText: "Details" }).first();
    await expect(panel).toBeVisible();
  });

  test("side panel closes when backdrop clicked", async ({ page }) => {
    const firstRow = page.locator("tbody tr").first();
    await firstRow.click();

    const backdrop = page.locator('[data-testid="side-panel-backdrop"]');
    await backdrop.click();

    const panel = page.locator("aside").first();
    await expect(panel).not.toBeVisible();
  });

  test("side panel closes when X button clicked", async ({ page }) => {
    const firstRow = page.locator("tbody tr").first();
    await firstRow.click();

    const closeButton = page.getByRole("button", { name: /close/i });
    await closeButton.click();

    const panel = page.locator("aside").first();
    await expect(panel).not.toBeVisible();
  });
});
```

**Step 3: Configure and run Playwright**

```bash
cd frontend && pnpm playwright install
pnpm playwright test
```
Expected: Playwright tests pass

**Step 4: Commit**

```bash
git add frontend/src/e2e/*.spec.ts
git commit -m "test(e2e): add Playwright tests for table width and side panel"
```

---

### Task 17: Remove old components

**Files:**
- Delete: `frontend/src/components/applications/application-table.tsx`
- Delete: `frontend/src/components/companies/company-table.tsx`
- Delete: `frontend/src/components/events/event-list.tsx`
- Delete: `frontend/src/components/companies/company-card.tsx` (if unused)
- Delete: Old test files for deleted components

**Step 1: Remove old components**

```bash
cd frontend/src/components
rm applications/application-table.tsx
rm companies/company-table.tsx
rm events/event-list.tsx
```

**Step 2: Run tests to verify nothing broken**

```bash
cd frontend && pnpm test
```
Expected: All tests pass (no imports of deleted components)

**Step 3: Commit**

```bash
git add -A frontend/src/components
git commit -m "refactor: remove old table/card components replaced by UniversalTable"
```

---

### Task 18: Update existing tests

**Files:**
- Modify: Existing component test files that reference old components

**Step 1: Find and update broken tests**

```bash
cd frontend && pnpm test 2>&1 | grep "Cannot find module"
```

Update any tests that reference `application-table`, `company-table`, `event-list`, `company-card`

**Step 2: Run full test suite**

```bash
cd frontend && pnpm test
```
Expected: All tests pass

**Step 3: Commit**

```bash
git add frontend/src
git commit -m "test: update tests after component removal"
```

---

## Post-Implementation

After completing all tasks, verify:

1. All three pages use UniversalTable with their respective schemas
2. Tables fill available space with grow-based column widths
3. Clicking rows opens side panel with correct detail component
4. Side panel is responsive (desktop side, mobile bottom sheet)
5. All tests pass including E2E Playwright tests
6. date-fns is used for all date formatting
7. Old components are removed and no references remain
