# Frontend Iteration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix shared side panel bugs, rebuild company detail with reusable layout, add application bookmark feature, fix events form accessibility, and fix documents sidebar.

**Architecture:** Shared fixes first (SidePanel, PageLayout, UniversalTable) propagate to all entity pages. Company detail rebuilt using a new reusable `DetailLayout` component. Application and event form improvements are isolated to their respective components.

**Tech Stack:** React 19, TanStack Router, shadcn/ui (Radix), Tailwind CSS, TanStack Query, react-hook-form, Zod, Vitest + Testing Library

---

## Schema notes (Company type)

The `Company` table has: `id, name, description, culture, industry, size, location, founded, tech_stack, benefits, pros, cons, ratings (Json), links (Json), tags (Json), researched, archived_at`.

- `pros`, `cons`, `benefits`, `tech_stack` are **plain strings** — parse by splitting on `\n` for list items
- `links` is `Json` — treat as `Array<{ type: string; name: string; url: string }>`
- `ratings` is `Json` — treat as `{ overall?: number; work_life_balance?: number; compensation?: number; career_growth?: number; management?: number; culture?: number }`
- No `website` or `salary_range` columns — website comes from `links` where `type === "website"`. Drop `salary_range` from Overview tab.

**Completeness tracked fields (12):** `name, industry, location, size, founded, description, culture, tech_stack, benefits, pros, cons, researched`

---

## Task 1: Fix SidePanel — position, scroll, headerActions

**Files:**
- Modify: `frontend/src/components/shared/side-panel.tsx`
- Modify: `frontend/src/components/shared/__tests__/side-panel.test.tsx`

**Context:** The desktop layout wraps both backdrop and aside in `fixed inset-0 flex`. The aside has `relative right-0` but `right-0` has no effect on a `relative` flex child, so it renders on the left. Fix by making the aside use `fixed inset-y-0` positioning directly. Also: add `headerActions` prop, remove the "Details" h2 label.

**Step 1: Write failing tests**

In `__tests__/side-panel.test.tsx`, add after the existing tests:

```tsx
it("renders headerActions to the left of the close button", () => {
  render(
    <SidePanel
      isOpen={true}
      onClose={vi.fn()}
      headerActions={<button type="button">Edit</button>}
    >
      <div>Content</div>
    </SidePanel>,
  );
  expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
});

it("does not render a 'Details' heading", () => {
  render(
    <SidePanel isOpen={true} onClose={vi.fn()}>
      <div>Content</div>
    </SidePanel>,
  );
  expect(screen.queryByText("Details")).not.toBeInTheDocument();
});
```

**Step 2: Run tests to verify they fail**

```bash
cd frontend && npx pnpm vitest run src/components/shared/__tests__/side-panel.test.tsx
```

Expected: 2 new tests fail.

**Step 3: Rewrite `side-panel.tsx`**

Replace the entire file with:

```tsx
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SidePanelWidth = "sm" | "md" | "lg" | "xl";

interface SidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  width?: SidePanelWidth;
  position?: "right" | "left";
  headerActions?: React.ReactNode;
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
  headerActions,
}: SidePanelProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.addEventListener !== "function") {
      return;
    }
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (!isOpen) return null;

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-end">
        <button
          type="button"
          data-testid="side-panel-backdrop"
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          aria-label="Dismiss panel"
          onClick={onClose}
        />
        <div className="relative flex w-full flex-col border-t bg-background shadow-xl max-h-[80vh]">
          <div className="flex shrink-0 items-center justify-end gap-1 border-b p-2">
            {headerActions}
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
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
    <>
      <button
        type="button"
        data-testid="side-panel-backdrop"
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        aria-label="Dismiss panel"
        onClick={onClose}
      />
      <aside
        className={cn(
          "fixed inset-y-0 z-50 flex flex-col border-l bg-background shadow-xl",
          WIDTH_CLASSES[width],
          positionClass,
        )}
      >
        <div className="flex shrink-0 items-center justify-end gap-1 border-b p-2">
          {headerActions}
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="size-5" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </aside>
    </>
  );
}
```

**Step 4: Run all SidePanel tests**

```bash
cd frontend && npx pnpm vitest run src/components/shared/__tests__/side-panel.test.tsx
```

Expected: all pass.

**Step 5: Commit**

```bash
git add frontend/src/components/shared/side-panel.tsx frontend/src/components/shared/__tests__/side-panel.test.tsx
git commit -m "fix(side-panel): open on right, scroll content, add headerActions prop"
```

---

## Task 2: Fix PageLayout — remove horizontal scroll

**Files:**
- Modify: `frontend/src/components/shared/page-layout.tsx`
- Modify: `frontend/src/components/shared/__tests__/page-layout.test.tsx`

**Context:** `pr-[480px]` on the main content causes the page to be wider than the viewport. Since `SidePanel` is now `fixed`, it overlays content — no padding needed. Add `detailHeaderActions` prop to thread through to `SidePanel`.

**Step 1: Write failing test**

In `__tests__/page-layout.test.tsx`, add:

```tsx
it("accepts detailHeaderActions and passes to panel", () => {
  render(
    <PageLayout
      detailPanel={<div>Panel content</div>}
      detailHeaderActions={<button type="button">Edit</button>}
      showDetailPanel={true}
    >
      <div>Main</div>
    </PageLayout>,
  );
  expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
});
```

**Step 2: Run to verify fail**

```bash
cd frontend && npx pnpm vitest run src/components/shared/__tests__/page-layout.test.tsx
```

**Step 3: Rewrite `page-layout.tsx`**

```tsx
import { SidePanel } from "./side-panel";

type SidePanelWidth = "sm" | "md" | "lg" | "xl";

interface PageLayoutProps {
  children: React.ReactNode;
  detailPanel?: React.ReactNode | null;
  onDetailClose?: () => void;
  detailWidth?: SidePanelWidth;
  showDetailPanel?: boolean;
  detailHeaderActions?: React.ReactNode;
}

export function PageLayout({
  children,
  detailPanel,
  onDetailClose = () => {},
  detailWidth = "md",
  showDetailPanel = !!detailPanel,
  detailHeaderActions,
}: PageLayoutProps) {
  return (
    <div className="relative flex h-full w-full overflow-hidden">
      <div className="flex-1 min-w-0 overflow-y-auto">{children}</div>
      <SidePanel
        isOpen={showDetailPanel}
        onClose={onDetailClose}
        width={detailWidth}
        headerActions={detailHeaderActions}
      >
        {detailPanel}
      </SidePanel>
    </div>
  );
}
```

**Step 4: Run all PageLayout tests**

```bash
cd frontend && npx pnpm vitest run src/components/shared/__tests__/page-layout.test.tsx
```

**Step 5: Commit**

```bash
git add frontend/src/components/shared/page-layout.tsx frontend/src/components/shared/__tests__/page-layout.test.tsx
git commit -m "fix(page-layout): remove horizontal scroll, add detailHeaderActions prop"
```

---

## Task 3: Add `rowActions` to UniversalTable

**Files:**
- Modify: `frontend/src/components/shared/universal-table.tsx`
- Modify: `frontend/src/components/shared/__tests__/universal-table.test.tsx`

**Context:** Pages need to render archive/action buttons per row without triggering the row click (which opens the detail panel). Add an optional `rowActions` render prop that appends a non-sortable actions column, with click propagation stopped.

**Step 1: Write failing test**

In `__tests__/universal-table.test.tsx`, find the existing test setup and add:

```tsx
it("renders rowActions in each row and stops propagation", async () => {
  const onRowClick = vi.fn();
  const schema: TableSchema<{ id: string; name: string }> = {
    columns: [{ id: "name", header: "Name", type: "text", sortable: false, minWidth: 100 }],
  };
  const data = [{ id: "1", name: "Test" }];
  render(
    <UniversalTable
      data={data}
      schema={schema}
      onRowClick={onRowClick}
      rowActions={(row) => <button type="button">Archive {row.name}</button>}
    />,
  );
  expect(screen.getByRole("button", { name: "Archive Test" })).toBeInTheDocument();
  // clicking the action button should NOT trigger row click
  fireEvent.click(screen.getByRole("button", { name: "Archive Test" }));
  expect(onRowClick).not.toHaveBeenCalled();
});
```

**Step 2: Run to verify fail**

```bash
cd frontend && npx pnpm vitest run src/components/shared/__tests__/universal-table.test.tsx
```

**Step 3: Add `rowActions` to `universal-table.tsx`**

Add to the `UniversalTableProps` interface:
```tsx
rowActions?: (row: T) => React.ReactNode;
```

In the `columns` useMemo, append an actions column when `rowActions` is provided:
```tsx
const columns = useMemo<ColumnDef<T>[]>(() => {
  const cols: ColumnDef<T>[] = schema.columns.map((col) => ({
    // ...existing mapping unchanged...
  }));

  if (rowActions) {
    cols.push({
      id: "__actions__",
      header: "",
      enableSorting: false,
      size: 72,
      cell: ({ row }) => (
        <div
          className="flex items-center justify-end gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          {rowActions(row.original as T)}
        </div>
      ),
    });
  }

  return cols;
}, [schema, rowActions]);
```

Also add `rowActions` to the destructured props in the function signature.

Add `__actions__` to the header rendering — since it has no `col.sortable`, it will render as a plain `<span>` (which is already the else branch). The column style calculation also needs to handle the injected column: exclude `__actions__` from the `columnStyles` array since it's added after the schema. Handle this by checking index: the `columnStyles` array has only schema columns, so when rendering headers and cells, the actions column index won't have a matching style entry.

Simplest approach — add the actions column AFTER computing `columnStyles` (which is based on schema.columns only), and in the cell render, use `columnStyles[cellIdx]?.textAlign` (already has `?.` guard) and `columnStyles[idx]?.minWidth` similarly.

**Step 4: Run tests**

```bash
cd frontend && npx pnpm vitest run src/components/shared/__tests__/universal-table.test.tsx
```

**Step 5: Commit**

```bash
git add frontend/src/components/shared/universal-table.tsx frontend/src/components/shared/__tests__/universal-table.test.tsx
git commit -m "feat(universal-table): add rowActions prop with click propagation stop"
```

---

## Task 4: Wire edit icon + archive row action in Applications page

**Files:**
- Modify: `frontend/src/routes/_authenticated/applications.tsx`

**Context:** Add a pencil icon `detailHeaderActions` that opens `ApplicationForm` for the selected app. Add `rowActions` with `ArchiveDialog` per row. Remove the `bookmarkOpen` state and `FullApplicationForm` for bookmark (handled in Task 12 — for now just leave it, we remove it in Task 12). Also stop passing `defaultStatus="bookmarked"` (leave the form for now).

**Step 1: Add edit state and wire headerActions + rowActions**

In `ApplicationsPage`:

1. Add state: `const [editingSelectedApp, setEditingSelectedApp] = useState<ApplicationWithCompany | null>(null);`

2. Change `PageLayout` to:
```tsx
<PageLayout
  detailPanel={selectedApp ? <ApplicationDetail application={selectedApp} /> : null}
  onDetailClose={() => setSelectedId(null)}
  detailWidth="lg"
  detailHeaderActions={
    selectedApp ? (
      <Button
        variant="ghost"
        size="icon"
        aria-label="Edit application"
        onClick={() => setEditingSelectedApp(selectedApp)}
      >
        <PencilIcon className="size-4" />
      </Button>
    ) : undefined
  }
>
```

3. Change `UniversalTable` to add:
```tsx
rowActions={(app) => (
  <ArchiveDialog
    applicationId={(app as ApplicationListItem).id}
    onArchived={() => setSelectedId(null)}
  />
)}
```

4. Add `ApplicationForm` for editing the selected app (add near the other dialogs):
```tsx
<ApplicationForm
  open={!!editingSelectedApp}
  onOpenChange={(open) => { if (!open) setEditingSelectedApp(null); }}
  application={editingSelectedApp}
/>
```

5. Add missing import: `PencilIcon` from `lucide-react`, `ApplicationForm` is already imported.

**Step 2: Run the full test suite**

```bash
cd frontend && npx pnpm vitest run
```

Expected: all pass.

**Step 3: Commit**

```bash
git add frontend/src/routes/_authenticated/applications.tsx
git commit -m "feat(applications): add edit headerAction and archive rowAction"
```

---

## Task 5: Wire archive row action in Companies page

**Files:**
- Modify: `frontend/src/routes/_authenticated/companies.tsx`

**Context:** Add `rowActions` with a simple archive button. `useArchiveCompany` already exists in `lib/queries/companies`. Also wire `detailHeaderActions` with a pencil icon that opens `CompanyForm` in edit mode for the selected company.

**Step 1: Update `companies.tsx`**

Add imports:
```tsx
import { ArchiveIcon, PencilIcon } from "lucide-react"; // add PencilIcon, ArchiveIcon
import { useArchiveCompany } from "@/lib/queries/companies"; // add useArchiveCompany
```

In `CompaniesPage`, add:
```tsx
const archiveCompany = useArchiveCompany();
```

Change `PageLayout`:
```tsx
<PageLayout
  detailPanel={selectedCompany ? <CompanyDetail company={selectedCompany} /> : null}
  onDetailClose={() => setSelectedId(null)}
  detailHeaderActions={
    selectedCompany ? (
      <>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Edit company"
          onClick={() => {
            setFormMode("edit");
            setEditingCompany(selectedCompany);
            setFormOpen(true);
          }}
        >
          <PencilIcon className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Archive company"
          onClick={() => archiveCompany.mutate({ id: selectedCompany.id })}
        >
          <ArchiveIcon className="size-4" />
        </Button>
      </>
    ) : undefined
  }
>
```

Add `rowActions` to `UniversalTable`:
```tsx
rowActions={(company) => (
  <Button
    variant="ghost"
    size="icon-xs"
    aria-label="Archive company"
    onClick={() => archiveCompany.mutate({ id: (company as Company).id })}
  >
    <ArchiveIcon className="size-3.5" />
  </Button>
)}
```

**Step 2: Run tests**

```bash
cd frontend && npx pnpm vitest run
```

**Step 3: Commit**

```bash
git add frontend/src/routes/_authenticated/companies.tsx
git commit -m "feat(companies): add edit headerAction and archive rowAction"
```

---

## Task 6: Wire edit icon in Events page

**Files:**
- Modify: `frontend/src/routes/_authenticated/events.tsx`

**Context:** Add pencil icon `detailHeaderActions` that opens `AddEventDialog` in edit mode for the selected event. `AddEventDialog` (in `components/applications/add-event-dialog.tsx`) supports `mode="edit"` and `event` prop.

**Step 1: Update `events.tsx`**

Add imports:
```tsx
import { PencilIcon } from "lucide-react"; // add
import type { Event } from "@/lib/queries/events"; // add
import { AddEventDialog } from "@/components/applications/add-event-dialog"; // add
```

Add state in `EventsPage`:
```tsx
const [editingEvent, setEditingEvent] = useState<Event | null>(null);
```

Change `PageLayout`:
```tsx
<PageLayout
  detailPanel={selectedEvent ? <EventDetail event={selectedEvent} /> : null}
  onDetailClose={() => setSelectedId(null)}
  detailHeaderActions={
    selectedEvent ? (
      <Button
        variant="ghost"
        size="icon"
        aria-label="Edit event"
        onClick={() => setEditingEvent(selectedEvent)}
      >
        <PencilIcon className="size-4" />
      </Button>
    ) : undefined
  }
>
```

Add dialog near bottom of JSX:
```tsx
<AddEventDialog
  open={!!editingEvent}
  onOpenChange={(open) => { if (!open) setEditingEvent(null); }}
  applicationId={editingEvent?.application_id ?? ""}
  mode="edit"
  event={editingEvent ?? undefined}
/>
```

**Step 2: Check `AddEventDialog` props** — verify it accepts `event?: Event` and `mode?: "create" | "edit"` by quickly reading the prop types in `add-event-dialog.tsx`. If the prop shape differs, adjust accordingly.

**Step 3: Run tests**

```bash
cd frontend && npx pnpm vitest run
```

**Step 4: Commit**

```bash
git add frontend/src/routes/_authenticated/events.tsx
git commit -m "feat(events): add edit headerAction for selected event"
```

---

## Task 7: Fix cards filling width in ApplicationDetail and EventDetail

**Files:**
- Modify: `frontend/src/components/applications/application-detail.tsx`
- Modify: `frontend/src/components/events/event-detail.tsx`

**Context:** Cards render in `md:grid-cols-2` which is awkward in a narrow side panel. Switch to single-column `space-y-4` layout so cards use full panel width.

**Step 1: Fix `application-detail.tsx`**

Find and change:
```tsx
// OLD
<div className="grid gap-6 md:grid-cols-2">

// NEW
<div className="space-y-4">
```

**Step 2: Fix `event-detail.tsx`**

The top-level `div` is already `space-y-6` which is fine. Ensure each `Card` has no fixed width. Verify `<div className="space-y-6">` at the root — no changes needed unless a specific card has fixed width.

**Step 3: Run tests**

```bash
cd frontend && npx pnpm vitest run
```

**Step 4: Commit**

```bash
git add frontend/src/components/applications/application-detail.tsx frontend/src/components/events/event-detail.tsx
git commit -m "fix(detail-views): use full-width single-column card layout"
```

---

## Task 8: Create `DetailLayout` reusable component

**Files:**
- Create: `frontend/src/components/shared/detail-layout.tsx`

**Context:** The `DetailLayout` is the shared shell for entity detail panels: sticky header section (icon, name, meta rows, badge row) + shadcn Tabs. All future entity detail views drop this in and fill tabs with their own content.

**Step 1: Create `detail-layout.tsx`**

```tsx
import { ExternalLink } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DetailMeta {
  icon: React.ReactNode;
  text: string;
  href?: string;
}

interface DetailTab {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface DetailLayoutProps {
  icon: React.ReactNode;
  name: string;
  meta?: DetailMeta[];
  badges?: React.ReactNode;
  tabs: DetailTab[];
  defaultTab: string;
}

export function DetailLayout({ icon, name, meta = [], badges, tabs, defaultTab }: DetailLayoutProps) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{icon}</span>
          <h2 className="text-xl font-semibold">{name}</h2>
        </div>

        {meta.length > 0 && (
          <div className="space-y-1">
            {meta.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="shrink-0">{item.icon}</span>
                {item.href ? (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-foreground hover:underline"
                  >
                    {item.text}
                    <ExternalLink className="size-3" />
                  </a>
                ) : (
                  <span>{item.text}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {badges && <div className="flex flex-wrap gap-1.5 pt-1">{badges}</div>}
      </div>

      <Separator />

      {/* Tabs */}
      <Tabs defaultValue={defaultTab}>
        <TabsList className="w-full">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="flex-1 text-xs">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="mt-4">
            {tab.content}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
```

**Step 2: No test needed for this pure presentation component** — it will be covered by the CompanyDetail tests in the next task.

**Step 3: Commit**

```bash
git add frontend/src/components/shared/detail-layout.tsx
git commit -m "feat(detail-layout): add reusable entity detail shell with header and tabs"
```

---

## Task 9: Rebuild CompanyDetail using DetailLayout

**Files:**
- Modify: `frontend/src/components/companies/company-detail.tsx`
- Modify: `frontend/src/components/companies/__tests__/company-detail.test.tsx`

**Context:** Full rebuild of `CompanyDetail`. Use `DetailLayout` as the shell. Four tabs: Overview (data quality + key-value grid + ratings + description), Research (culture + tech stack pills + benefits pills + pros/cons + notes), Apps (count + link button + app cards), Links (link type cards).

### Helpers

Define at top of file:

```tsx
// Parse newline-separated string into array of items
function parseList(raw: string | null): string[] {
  if (!raw) return [];
  return raw.split("\n").map((s) => s.trim()).filter(Boolean);
}

// Calculate data quality completeness out of 12 tracked fields
function calcCompleteness(c: Company): number {
  const fields = [
    c.name, c.industry, c.location, c.size, c.founded,
    c.description, c.culture, c.tech_stack, c.benefits,
    c.pros, c.cons, c.researched,
  ];
  const filled = fields.filter((f) => f !== null && f !== undefined && f !== "").length;
  return Math.round((filled / fields.length) * 100);
}

function qualityLabel(pct: number): { label: string; color: string } {
  if (pct >= 90) return { label: "Excellent", color: "bg-green-500 text-white" };
  if (pct >= 70) return { label: "Good", color: "bg-blue-500 text-white" };
  if (pct >= 50) return { label: "Fair", color: "bg-amber-500 text-white" };
  return { label: "Needs Work", color: "bg-red-500 text-white" };
}

// Format salary range from salary object
function formatSalary(min?: number, max?: number, currency = "USD"): string | null {
  if (!min && !max) return null;
  const fmt = new Intl.NumberFormat("en-US", {
    style: "currency", currency, maximumFractionDigits: 0,
  });
  if (min && max) return `${fmt.format(min)} – ${fmt.format(max)}`;
  if (min) return `${fmt.format(min)}+`;
  return `Up to ${fmt.format(max!)}`;
}
```

### Link type icon map

```tsx
import {
  Briefcase, Building2, ExternalLink, Globe, Link2, MapPin, Newspaper,
  Star, TrendingUp,
} from "lucide-react";

const LINK_TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  website: Globe,
  careers: Briefcase,
  "news/blog": Newspaper,
  linkedin: Link2,
  glassdoor: Star,
  crunchbase: TrendingUp,
};
```

### Overview tab component

```tsx
function OverviewTab({ company }: { company: Company }) {
  const pct = calcCompleteness(company);
  const quality = qualityLabel(pct);
  const ratings = company.ratings as Record<string, number> | null;

  return (
    <div className="space-y-6">
      {/* Data Quality */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Data Quality</span>
          <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", quality.color)}>
            {quality.label}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Completeness</span>
          <span>{pct}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted">
          <div
            className="h-2 rounded-full bg-foreground transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Key-value grid */}
      {(company.industry || company.size || company.founded) && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          {company.industry && (
            <div>
              <p className="text-xs text-muted-foreground">Industry</p>
              <p className="text-sm font-medium">{company.industry}</p>
            </div>
          )}
          {company.size && (
            <div>
              <p className="text-xs text-muted-foreground">Company Size</p>
              <p className="text-sm font-medium">{company.size}</p>
            </div>
          )}
          {company.founded && (
            <div>
              <p className="text-xs text-muted-foreground">Founded</p>
              <p className="text-sm font-medium">{company.founded}</p>
            </div>
          )}
        </div>
      )}

      {/* Ratings */}
      {ratings && Object.keys(ratings).length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Ratings</p>
          {ratings.overall != null && (
            <div className="flex items-center justify-between">
              <span className="text-sm">Overall</span>
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn(
                        "size-3.5",
                        star <= Math.round(ratings.overall)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground",
                      )}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">{ratings.overall.toFixed(1)}</span>
              </div>
            </div>
          )}
          {[
            ["Work-Life Balance", "work_life_balance"],
            ["Compensation", "compensation"],
            ["Career Growth", "career_growth"],
            ["Management", "management"],
          ].map(([label, key]) =>
            ratings[key] != null ? (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className="text-sm">{(ratings[key] as number).toFixed(1)}</span>
              </div>
            ) : null,
          )}
        </div>
      )}

      {/* Description */}
      {company.description && (
        <div className="space-y-1">
          <p className="text-sm font-medium">Description</p>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{company.description}</p>
        </div>
      )}
    </div>
  );
}
```

### Research tab component

```tsx
function ResearchTab({ company }: { company: Company }) {
  const techStack = parseList(company.tech_stack);
  const benefits = parseList(company.benefits);
  const pros = parseList(company.pros);
  const cons = parseList(company.cons);

  const hasContent = company.culture || techStack.length || benefits.length
    || pros.length || cons.length || company.notes;

  if (!hasContent) {
    return <p className="text-sm text-muted-foreground">No research data yet.</p>;
  }

  return (
    <div className="space-y-5">
      {company.culture && (
        <div className="space-y-1">
          <p className="text-sm font-medium">Culture</p>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{company.culture}</p>
        </div>
      )}

      {techStack.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-sm font-medium">Tech Stack</p>
          <div className="flex flex-wrap gap-1.5">
            {techStack.map((item) => (
              <span
                key={item}
                className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      {benefits.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-sm font-medium">Benefits</p>
          <div className="flex flex-wrap gap-1.5">
            {benefits.map((item) => (
              <span
                key={item}
                className="rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      {(pros.length > 0 || cons.length > 0) && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-green-600">Pros</p>
            <ul className="space-y-0.5">
              {pros.map((item) => (
                <li key={item} className="flex items-start gap-1.5 text-sm text-muted-foreground">
                  <span className="mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-red-600">Cons</p>
            <ul className="space-y-0.5">
              {cons.map((item) => (
                <li key={item} className="flex items-start gap-1.5 text-sm text-muted-foreground">
                  <span className="mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {(company as Company & { notes?: string | null }).notes && (
        <div className="space-y-1">
          <p className="text-sm font-medium">Notes</p>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {(company as Company & { notes?: string | null }).notes}
          </p>
        </div>
      )}
    </div>
  );
}
```

Note: if `notes` doesn't exist on the Company type, omit that section.

### Apps tab component

```tsx
import { useApplicationsByCompany } from "@/lib/queries/applications"; // verify hook name

function AppsTab({ companyId }: { companyId: string }) {
  const { data: apps = [] } = useApplicationsByCompany(companyId);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{apps.length} application{apps.length !== 1 ? "s" : ""}</span>
        <Button variant="outline" size="sm" asChild>
          <a href="/applications">
            <Link2 className="size-3.5" />
            Link Application
          </a>
        </Button>
      </div>

      {apps.length === 0 && (
        <p className="text-sm text-muted-foreground">No applications linked to this company.</p>
      )}

      <div className="space-y-2">
        {apps.map((app) => (
          <div key={app.id} className="rounded-md border p-3">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium">{app.position}</p>
              <Badge variant="secondary" className="shrink-0 text-xs">
                {app.status}
              </Badge>
            </div>
            {app.applied_at && (
              <p className="text-xs text-muted-foreground mt-1">
                Applied {formatDate(app.applied_at)}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Note:** Check if `useApplicationsByCompany` exists in `lib/queries/applications.ts`. If not, use `useApplications({ companyId })` or add the hook. The app card shows just position, status badge, and applied date for now (matching the screenshot — no salary needed if data isn't readily available).

### Links tab component

```tsx
type CompanyLink = { type: string; name: string; url: string };

function LinksTab({ links }: { links: CompanyLink[] }) {
  if (links.length === 0) {
    return <p className="text-sm text-muted-foreground">No links added.</p>;
  }

  return (
    <div className="space-y-2">
      {links.map((link, i) => {
        const Icon = LINK_TYPE_ICONS[link.type] ?? Globe;
        return (
          <a
            key={i}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-md border p-3 hover:bg-muted/50 transition-colors"
          >
            <Icon className="size-4 shrink-0 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{link.name}</p>
              <p className="text-xs text-muted-foreground truncate">{link.url}</p>
            </div>
            <ExternalLink className="size-4 shrink-0 text-muted-foreground" />
          </a>
        );
      })}
    </div>
  );
}
```

### Main `CompanyDetail` component

```tsx
export function CompanyDetail({ company }: CompanyDetailProps) {
  const links = (Array.isArray(company.links) ? company.links : []) as CompanyLink[];
  const websiteLink = links.find((l) => l.type === "website");
  const tags = Array.isArray(company.tags) ? (company.tags as string[]) : [];
  const ratings = company.ratings as Record<string, number> | null;

  const meta = [
    company.location && { icon: <MapPin className="size-3.5" />, text: company.location },
    websiteLink && {
      icon: <Globe className="size-3.5" />,
      text: websiteLink.url,
      href: websiteLink.url,
    },
  ].filter(Boolean) as DetailMeta[];

  const badges = (
    <>
      {company.researched && (
        <Badge variant="default" className="text-xs">Researched</Badge>
      )}
      {tags.map((tag) => (
        <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
      ))}
    </>
  );

  const pct = calcCompleteness(company);

  const tabs = [
    {
      id: "overview",
      label: "Overview",
      content: <OverviewTab company={company} />,
    },
    {
      id: "research",
      label: "Research",
      content: <ResearchTab company={company} />,
    },
    {
      id: "apps",
      label: `Apps`,
      content: <AppsTab companyId={company.id} />,
    },
    {
      id: "links",
      label: "Links",
      content: <LinksTab links={links} />,
    },
  ];

  return (
    <DetailLayout
      icon={<Building2 className="size-5" />}
      name={company.name}
      meta={meta}
      badges={badges}
      tabs={tabs}
      defaultTab="overview"
    />
  );
}
```

**Step 1: Update `__tests__/company-detail.test.tsx`**

Existing tests may reference the old card-based layout. Update them to match the new tab-based structure:

```tsx
it("renders company name in header", () => {
  render(<CompanyDetail company={mockCompany} />);
  expect(screen.getByText(mockCompany.name)).toBeInTheDocument();
});

it("shows Overview tab by default", () => {
  render(<CompanyDetail company={mockCompany} />);
  expect(screen.getByRole("tab", { name: "Overview" })).toHaveAttribute("data-state", "active");
});

it("shows Research tab content when clicked", async () => {
  render(<CompanyDetail company={{ ...mockCompany, culture: "Great culture" }} />);
  fireEvent.click(screen.getByRole("tab", { name: "Research" }));
  expect(await screen.findByText("Great culture")).toBeInTheDocument();
});

it("shows data quality completeness", () => {
  render(<CompanyDetail company={mockCompany} />);
  expect(screen.getByText(/completeness/i)).toBeInTheDocument();
});
```

**Step 2: Run tests**

```bash
cd frontend && npx pnpm vitest run src/components/companies/__tests__/company-detail.test.tsx
```

Fix any failures (mock data may need updating for new structure).

**Step 3: Run all tests**

```bash
cd frontend && npx pnpm vitest run
```

**Step 4: Commit**

```bash
git add frontend/src/components/companies/company-detail.tsx frontend/src/components/companies/__tests__/company-detail.test.tsx frontend/src/components/shared/detail-layout.tsx
git commit -m "feat(company-detail): rebuild with DetailLayout tabs — Overview, Research, Apps, Links"
```

---

## Task 10: Add bookmark button to EasyAddForm

**Files:**
- Modify: `frontend/src/components/applications/easy-add-form.tsx`

**Context:** Add a `<Bookmark>` icon button to the right of the "Add Application" submit button in `DialogFooter`. Clicking it calls `createApplication` with `status: "bookmarked"` and `applied_at: null`.

**Step 1: Update `easy-add-form.tsx`**

Add import: `import { BookmarkIcon } from "lucide-react";`

Add a bookmark handler in the component:
```tsx
const handleBookmark = async () => {
  const values = watch(); // get current form values without validation
  if (!values.company_id || !values.position) return; // require at least these
  await createApplication.mutateAsync({
    company_id: values.company_id,
    position: values.position,
    url: values.url || null,
    status: "bookmarked",
    employment_type: "full-time",
    applied_at: null,
  });
  onSuccess?.();
  onOpenChange(false);
};
```

In `DialogFooter`, add the bookmark button between Cancel and the submit button:
```tsx
<DialogFooter>
  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
    Cancel
  </Button>
  <Button
    type="button"
    variant="outline"
    size="icon"
    disabled={!watch("company_id") || !watch("position") || createApplication.isPending}
    onClick={handleBookmark}
    aria-label="Bookmark for later"
    title="Bookmark for later"
  >
    <BookmarkIcon className="size-4" />
  </Button>
  <Button type="submit" disabled={isSubmitting}>
    {isSubmitting ? "Saving..." : "Add Application"}
  </Button>
</DialogFooter>
```

**Note:** Check if `createApplication.mutateAsync` accepts `applied_at`. If the payload type doesn't include it, use `status: "bookmarked"` only (the backend may handle setting `applied_at: null` automatically for bookmarked status).

**Step 2: Run tests**

```bash
cd frontend && npx pnpm vitest run
```

**Step 3: Commit**

```bash
git add frontend/src/components/applications/easy-add-form.tsx
git commit -m "feat(easy-add-form): add bookmark button"
```

---

## Task 11: Add bookmark button to FullApplicationForm + bookmarked edit UX

**Files:**
- Modify: `frontend/src/components/applications/full-application-form.tsx`

**Context:** Two changes:
1. Add bookmark button to `DialogFooter` (same as EasyAddForm)
2. When `defaultStatus === "bookmarked"` AND an existing application is being edited (future — for now just detect when the form opens with a bookmarked status), show "Set to Applied" + "Cancel" instead of the regular submit button.

**Step 1: Detect bookmarked edit mode**

`FullApplicationForm` currently only handles create. Add an `application` prop for editing:

```tsx
interface FullApplicationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  prefill?: { company?: string; position?: string; url?: string };
  defaultStatus?: string;
  application?: ApplicationWithCompany | null; // for editing
}
```

When `application` is provided and `application.status === "bookmarked"`, show:
```tsx
{isBookmarkedEdit ? (
  <DialogFooter>
    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
      Cancel
    </Button>
    <Button type="button" onClick={handleSetApplied}>
      Set to Applied
    </Button>
  </DialogFooter>
) : (
  <DialogFooter>
    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
      Cancel
    </Button>
    <Button type="button" variant="outline" size="icon" onClick={handleBookmark} title="Bookmark for later">
      <BookmarkIcon className="size-4" />
    </Button>
    <Button type="submit" disabled={isSubmitting}>
      {isSubmitting ? "Saving..." : "New Application"}
    </Button>
  </DialogFooter>
)}
```

Where `isBookmarkedEdit = !!application && application.status === "bookmarked"`.

`handleSetApplied` calls `updateApplication.mutateAsync({ id: application.id, status: "applied", applied_at: new Date().toISOString() })` then closes the form.

**Note:** You may need to import `useUpdateApplication` from applications queries. If a bookmarked application editing UX via `FullApplicationForm` isn't fully wired to the applications page yet, just ensure the form correctly detects and shows the correct footer — the page-level wiring can be done when needed.

**Step 2: Run tests**

```bash
cd frontend && npx pnpm vitest run
```

**Step 3: Commit**

```bash
git add frontend/src/components/applications/full-application-form.tsx
git commit -m "feat(full-application-form): add bookmark button and bookmarked edit UX"
```

---

## Task 12: Remove bookmark button from Applications page header

**Files:**
- Modify: `frontend/src/routes/_authenticated/applications.tsx`

**Context:** The standalone bookmark button in the page header (`BookmarkIcon` button + associated `bookmarkOpen` state + second `FullApplicationForm` with `defaultStatus="bookmarked"`) is removed. The bookmark flow now lives inside the forms.

**Step 1: Remove from `applications.tsx`**

Remove:
- `const [bookmarkOpen, setBookmarkOpen] = useState(false);`
- The `<Button ... onClick={() => setBookmarkOpen(true)}><BookmarkIcon /></Button>` from the header
- The `<FullApplicationForm open={bookmarkOpen} onOpenChange={setBookmarkOpen} defaultStatus="bookmarked" />` from dialogs
- `BookmarkIcon` import if no longer used

**Step 2: Run tests**

```bash
cd frontend && npx pnpm vitest run
```

**Step 3: Commit**

```bash
git add frontend/src/routes/_authenticated/applications.tsx
git commit -m "fix(applications): remove header bookmark button, replaced by form bookmark buttons"
```

---

## Task 13: Fix events form scrollability

**Files:**
- Modify: `frontend/src/components/events/schedule-dialog.tsx`

**Context:** `ScheduleDialog` uses `<DialogContent className="sm:max-w-md">` with a `<form>` wrapping a `<div className="space-y-4 py-4">`. On small screens the top and bottom of the form is inaccessible. Wrap the form body in a `ScrollArea`.

**Step 1: Update `schedule-dialog.tsx`**

Add import: `import { ScrollArea } from "@/components/ui/scroll-area";`

Wrap the form body `<div className="space-y-4 py-4">...</div>` with:
```tsx
<ScrollArea className="max-h-[calc(85vh-10rem)] pr-3">
  <div className="space-y-4 py-4">
    {/* all form fields */}
  </div>
</ScrollArea>
```

Place the `ScrollArea` between `<DialogHeader>` and `<DialogFooter>`, inside the `<form>`.

**Step 2: Run tests**

```bash
cd frontend && npx pnpm vitest run src/components/events/__tests__/schedule-dialog.test.tsx
```

**Step 3: Commit**

```bash
git add frontend/src/components/events/schedule-dialog.tsx
git commit -m "fix(schedule-dialog): make form body scrollable on small screens"
```

---

## Task 14: Remove tab stop from date/time picker icons

**Files:**
- Modify: `frontend/src/components/events/schedule-dialog.tsx`

**Context:** The date picker `<PopoverTrigger>` renders a `<Button>` that receives focus when tabbing. Add `tabIndex={-1}` so the button doesn't consume a tab stop (the picker remains accessible via mouse/click, just not via Tab).

**Step 1: Update the date picker trigger in `schedule-dialog.tsx`**

Find the `<PopoverTrigger asChild>` wrapping the date picker button:
```tsx
// BEFORE
<Button
  variant="outline"
  className={cn("w-full justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}
  aria-label="Pick a date"
>

// AFTER
<Button
  variant="outline"
  tabIndex={-1}
  className={cn("w-full justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}
  aria-label="Pick a date"
>
```

The time input (native `<input type="time">`) already receives focus naturally — no change needed there.

**Step 2: Run tests**

```bash
cd frontend && npx pnpm vitest run src/components/events/__tests__/schedule-dialog.test.tsx
```

**Step 3: Commit**

```bash
git add frontend/src/components/events/schedule-dialog.tsx
git commit -m "fix(schedule-dialog): remove tab stop from date picker trigger button"
```

---

## Task 15: Fix DurationCombobox keyboard navigation

**Files:**
- Modify: `frontend/src/components/events/duration-combobox.tsx`
- Modify: `frontend/src/components/events/__tests__/duration-combobox.test.tsx`

**Context:** The trigger button for `DurationCombobox` doesn't respond to `ArrowUp`/`ArrowDown` keys when closed. Add a `onKeyDown` handler on the trigger button that opens the popover and navigates.

Since the combobox uses Radix `Popover` + `Command`, the arrow key navigation inside the open list is already handled by `Command`. The fix is simpler: ensure the trigger button opens the popover when `ArrowDown` is pressed, and let Radix handle internal navigation.

**Step 1: Add failing test to `duration-combobox.test.tsx`**

```tsx
it("opens when ArrowDown is pressed on trigger", async () => {
  render(<DurationCombobox value={undefined} onChange={vi.fn()} />);
  const trigger = screen.getByRole("combobox", { name: /duration/i });
  fireEvent.keyDown(trigger, { key: "ArrowDown" });
  expect(await screen.findByText("15 min")).toBeInTheDocument();
});
```

**Step 2: Run to verify fail**

```bash
cd frontend && npx pnpm vitest run src/components/events/__tests__/duration-combobox.test.tsx
```

**Step 3: Add `onKeyDown` to the trigger button in `duration-combobox.tsx`**

```tsx
<Button
  type="button"
  variant="outline"
  role="combobox"
  aria-expanded={open}
  aria-label="Duration"
  className="w-full justify-between font-normal"
  onPointerDown={(e) => e.preventDefault()}
  onKeyDown={(e) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
    }
  }}
>
```

**Step 4: Run tests**

```bash
cd frontend && npx pnpm vitest run src/components/events/__tests__/duration-combobox.test.tsx
```

**Step 5: Commit**

```bash
git add frontend/src/components/events/duration-combobox.tsx frontend/src/components/events/__tests__/duration-combobox.test.tsx
git commit -m "fix(duration-combobox): open on ArrowDown/ArrowUp key press"
```

---

## Task 16: Fix ContactCombobox — keyboard search + tab into new contact form

**Files:**
- Modify: `frontend/src/components/events/contact-combobox.tsx`
- Modify: `frontend/src/components/companies/__tests__/contact-combobox.test.tsx`

**Two problems:**
1. When the combobox popover opens, the `CommandInput` inside doesn't receive focus automatically — the user cannot type without clicking
2. When a new contact form is created (after typing and hitting Enter), the first input field in the new contact form doesn't auto-focus

**Step 1: Write failing tests**

In `contact-combobox.test.tsx`, add:

```tsx
it("focuses search input when combobox opens", async () => {
  render(<ContactCombobox companyId="c1" selectedContactIds={[]} onAdd={vi.fn()} />);
  fireEvent.click(screen.getByRole("combobox"));
  // The CommandInput should receive focus
  const searchInput = screen.getByPlaceholderText("Search by name...");
  expect(document.activeElement).toBe(searchInput);
});
```

**Step 2: Fix auto-focus on combobox open**

In `ContactCombobox`, when `open` changes to `true`, focus the `CommandInput`. Use `useEffect` with a `ref`:

```tsx
import { useCallback, useEffect, useRef, useState } from "react";

// Add ref for the command input:
const searchInputRef = useRef<HTMLInputElement>(null);

// Auto-focus when opening:
useEffect(() => {
  if (open) {
    // Small delay to let Radix mount the popover content
    const timer = setTimeout(() => searchInputRef.current?.focus(), 0);
    return () => clearTimeout(timer);
  }
}, [open]);

// Add ref to CommandInput:
<CommandInput
  ref={searchInputRef}
  placeholder="Search by name..."
  value={searchText}
  onValueChange={setSearchText}
/>
```

**Step 3: Fix auto-focus when new contact form mounts**

Add a `ref` to the first input in the inline create form (`new-contact-name`) and focus it when `creating` becomes `true`:

```tsx
const newContactNameRef = useRef<HTMLInputElement>(null);

useEffect(() => {
  if (creating) {
    const timer = setTimeout(() => newContactNameRef.current?.focus(), 0);
    return () => clearTimeout(timer);
  }
}, [creating]);

// Add ref to the name input:
<Input
  id="new-contact-name"
  ref={newContactNameRef}
  value={newName}
  onChange={(e) => setNewName(e.target.value)}
/>
```

**Step 4: Run tests**

```bash
cd frontend && npx pnpm vitest run src/components/companies/__tests__/contact-combobox.test.tsx
```

**Step 5: Commit**

```bash
git add frontend/src/components/events/contact-combobox.tsx frontend/src/components/companies/__tests__/contact-combobox.test.tsx
git commit -m "fix(contact-combobox): auto-focus search on open, auto-focus name field on new contact"
```

---

## Task 17: Add new event types to schedule dialog, add-event dialog, and event timeline

**Files:**
- Modify: `frontend/src/components/events/schedule-dialog.tsx`
- Modify: `frontend/src/components/applications/add-event-dialog.tsx`
- Modify: `frontend/src/components/applications/event-timeline.tsx`
- Modify: `frontend/src/components/events/event-detail.tsx`

**Step 1: Add to `EVENT_TYPE_OPTIONS` in `schedule-dialog.tsx` and `add-event-dialog.tsx`**

Append to both files' `EVENT_TYPE_OPTIONS` constant:

```tsx
{ value: "received-offer", label: "Received Offer" },
{ value: "accepted-offer", label: "Accepted Offer" },
{ value: "rejected-offer", label: "Rejected Offer" },
{ value: "offer-withdrawn", label: "Offer Withdrawn" },
{ value: "follow-up", label: "Follow Up" },
{ value: "hiring-manager", label: "Hiring Manager" },
{ value: "peer-interview", label: "Peer Interview" },
```

**Step 2: Add to `EVENT_TYPE_CONFIG` in `event-timeline.tsx`**

Import needed icons (add to existing imports):
```tsx
import { CheckCircle, DollarSign, XCircle, AlertTriangle, RefreshCw, User2, Users2 } from "lucide-react";
```

Append to `EVENT_TYPE_CONFIG`:
```tsx
"received-offer": { label: "Received Offer", icon: DollarSign },
"accepted-offer": { label: "Accepted Offer", icon: CheckCircle },
"rejected-offer": { label: "Rejected Offer", icon: XCircle },
"offer-withdrawn": { label: "Offer Withdrawn", icon: AlertTriangle },
"follow-up": { label: "Follow Up", icon: RefreshCw },
"hiring-manager": { label: "Hiring Manager", icon: User2 },
"peer-interview": { label: "Peer Interview", icon: Users2 },
```

**Step 3: Add to `EVENT_TYPE_LABELS` in `event-detail.tsx`**

```tsx
"received-offer": "Received Offer",
"accepted-offer": "Accepted Offer",
"rejected-offer": "Rejected Offer",
"offer-withdrawn": "Offer Withdrawn",
"follow-up": "Follow Up",
"hiring-manager": "Hiring Manager",
"peer-interview": "Peer Interview",
```

**Step 4: Run tests**

```bash
cd frontend && npx pnpm vitest run
```

**Step 5: Commit**

```bash
git add frontend/src/components/events/schedule-dialog.tsx frontend/src/components/applications/add-event-dialog.tsx frontend/src/components/applications/event-timeline.tsx frontend/src/components/events/event-detail.tsx
git commit -m "feat(events): add 7 new event types — offers, follow-up, hiring-manager, peer-interview"
```

---

## Task 18: Fix Documents sidebar — snap to left

**Files:**
- Modify: `frontend/src/routes/_authenticated/documents.tsx`

**Context:** The desktop sidebar is `<div className="hidden md:flex w-[320px] shrink-0">` which is already the first child in the flex row — it should be on the left. If the issue is visual (sidebar appears misaligned or offset), check `DocumentSidebar` internally for any absolute/relative positioning that might be causing it to drift.

**Step 1: Investigate**

Read `frontend/src/components/documents/document-sidebar.tsx` briefly and check if it has any `absolute`, `fixed`, or margin/padding that would offset it from the left edge.

**Step 2: Fix**

If the sidebar has `ml-auto` or similar, remove it.

If `DocumentSidebar` uses `position: absolute` or similar that places it away from the left, switch to a `relative`/`static` layout.

A common fix: ensure the outer wrapper uses `border-r` and `h-full` without any left offset:
```tsx
// In documents.tsx, desktop sidebar wrapper:
<div className="hidden md:flex w-[320px] shrink-0 border-r">{sidebarContent}</div>
```

**Step 3: Run tests and commit**

```bash
cd frontend && npx pnpm vitest run
git add frontend/src/routes/_authenticated/documents.tsx
git commit -m "fix(documents): ensure sidebar snaps to left edge"
```

---

## Final Verification

After all tasks complete:

**Step 1: Run full test suite**

```bash
cd frontend && npx pnpm vitest run
```

Expected: all tests pass.

**Step 2: Run type check**

```bash
cd frontend && npx pnpm tsc --noEmit
```

Expected: no type errors.

**Step 3: Build check**

```bash
cd frontend && npx pnpm build
```

Expected: clean build.

**Step 4: Manual smoke test checklist**
- [ ] Open Companies page → click a row → panel opens on the RIGHT
- [ ] No horizontal scrollbar appears when panel opens
- [ ] Scroll content in panel — content scrolls without scrolling the whole page
- [ ] Edit pencil icon appears in panel header (left of X) on all three pages
- [ ] Archive button appears in applications and companies table rows
- [ ] Company detail shows tabs: Overview, Research, Apps, Links
- [ ] Data quality completeness bar is visible on Overview tab
- [ ] Bookmark button appears on EasyAddForm and FullApplicationForm footers
- [ ] Old bookmark button gone from Applications page header
- [ ] Events form scrolls on small screens
- [ ] Duration combobox opens on ArrowDown
- [ ] New event types appear in the type dropdown
- [ ] Documents sidebar is on the left
