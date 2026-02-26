# Frontend Iteration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix company detail data bugs, add URL-based detail state to companies and applications pages, fix events form accessibility, and update seed data.

**Architecture:** Fixes are grouped by feature area. URL state changes (Groups 3 & 4) share a pattern: add `detail` to the route's `validateSearch`, replace local `selectedId` state with `searchParams.detail`, and navigate with `push` (not `replace`) to preserve back-button behavior. Company detail data fixes are all in `company-detail.tsx` and are pure logic/render changes. Events form fixes are each isolated to a single component.

**Tech Stack:** React 19, TanStack Router, TanStack Query, shadcn/ui, Tailwind CSS, Vitest + Testing Library, pnpm (use `npx pnpm` — pnpm is not in PATH)

---

## Group 1: Company Detail Bugs

### Task 1: Fix links parsing in company-detail.tsx

Links are stored as a flat object `{website: "url", careers: "url"}` but the code guards with `Array.isArray()` which always returns false.

**Files:**
- Modify: `frontend/src/components/companies/company-detail.tsx:364`
- Modify: `frontend/src/components/companies/__tests__/company-detail.test.tsx`

**Step 1: Write the failing test**

Open `frontend/src/components/companies/__tests__/company-detail.test.tsx` and add this test to the `describe` block:

```tsx
it("renders links in links tab when stored as flat object", async () => {
  const user = userEvent.setup();
  render(
    <CompanyDetail
      company={{
        ...mockCompany,
        links: { website: "https://example.com", careers: "https://example.com/jobs" } as unknown as null,
      }}
    />,
  );
  await user.click(screen.getByRole("tab", { name: "Links" }));
  expect(screen.getByText("Website")).toBeInTheDocument();
  expect(screen.getByText("Careers Page")).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

```bash
cd frontend && npx pnpm vitest run src/components/companies/__tests__/company-detail.test.tsx
```

Expected: FAIL — "No links added" renders instead of link names.

**Step 3: Fix links parsing in company-detail.tsx**

Replace lines 363–365 (the `CompanyDetail` function opening, links and websiteLink lines):

```tsx
// Old:
const links = (Array.isArray(company.links) ? company.links : []) as CompanyLink[];
const websiteLink = links.find((l) => l.type === "website");

// New — convert flat object to CompanyLink[]:
const LINK_NAMES: Record<string, string> = {
  website: "Website",
  careers: "Careers Page",
  news: "News",
  linkedin: "LinkedIn",
  glassdoor: "Glassdoor",
  crunchbase: "Crunchbase",
};

const rawLinks = (company.links as Record<string, string> | null) ?? {};
const links: CompanyLink[] = Object.entries(rawLinks)
  .filter(([, url]) => Boolean(url))
  .map(([type, url]) => ({ type, name: LINK_NAMES[type] ?? type, url }));

const websiteLink = links.find((l) => l.type === "website");
```

Also delete the now-unused `type CompanyLink` import if it still references the old pattern — actually keep it, the type is still used below.

**Step 4: Run test to verify it passes**

```bash
cd frontend && npx pnpm vitest run src/components/companies/__tests__/company-detail.test.tsx
```

Expected: PASS

**Step 5: Commit**

```bash
git add frontend/src/components/companies/company-detail.tsx frontend/src/components/companies/__tests__/company-detail.test.tsx
git commit -m "fix(company-detail): parse links from flat object format"
```

---

### Task 2: Fix parseList to split on commas and newlines

`parseList` splits only on `\n` but `tech_stack` and `benefits` are stored as comma-separated strings like `"React, TypeScript, AWS"`.

**Files:**
- Modify: `frontend/src/components/companies/company-detail.tsx` (the `parseList` function, around line 41)

**Step 1: Write the failing test**

Add to `company-detail.test.tsx`:

```tsx
it("renders individual tech stack badges from comma-separated string", async () => {
  const user = userEvent.setup();
  render(
    <CompanyDetail
      company={{ ...mockCompany, tech_stack: "React, TypeScript, AWS" } as Company}
    />,
  );
  await user.click(screen.getByRole("tab", { name: "Research" }));
  expect(screen.getByText("React")).toBeInTheDocument();
  expect(screen.getByText("TypeScript")).toBeInTheDocument();
  expect(screen.getByText("AWS")).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

```bash
cd frontend && npx pnpm vitest run src/components/companies/__tests__/company-detail.test.tsx
```

Expected: FAIL — one badge containing "React, TypeScript, AWS" instead of three.

**Step 3: Fix parseList**

Replace the `parseList` function (lines 41–47):

```tsx
function parseList(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}
```

**Step 4: Run test to verify it passes**

```bash
cd frontend && npx pnpm vitest run src/components/companies/__tests__/company-detail.test.tsx
```

Expected: PASS

**Step 5: Commit**

```bash
git add frontend/src/components/companies/company-detail.tsx frontend/src/components/companies/__tests__/company-detail.test.tsx
git commit -m "fix(company-detail): parse tech_stack and benefits as comma-or-newline lists"
```

---

### Task 3: Fix ratings keys and add culture/management rows

The DB stores ratings in camelCase (`workLifeBalance`, `careerGrowth`) but the code looks for snake_case (`work_life_balance`, `career_growth`). Also missing `culture` and `management` rows.

**Files:**
- Modify: `frontend/src/components/companies/company-detail.tsx` (the `OverviewTab` ratings section, around lines 173–188)
- Modify: `frontend/src/components/companies/__tests__/company-detail.test.tsx`

**Step 1: Write the failing test**

Add to `company-detail.test.tsx`:

```tsx
it("renders work-life balance and career growth ratings from camelCase keys", () => {
  render(
    <CompanyDetail
      company={{
        ...mockCompany,
        ratings: {
          overall: 4.2,
          workLifeBalance: 4.0,
          compensation: 4.5,
          careerGrowth: 4.3,
          culture: 4.1,
          management: 3.9,
        } as unknown as null,
      }}
    />,
  );
  expect(screen.getByText("Work-Life Balance")).toBeInTheDocument();
  expect(screen.getByText("Career Growth")).toBeInTheDocument();
  expect(screen.getByText("Culture")).toBeInTheDocument();
  expect(screen.getByText("Management")).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

```bash
cd frontend && npx pnpm vitest run src/components/companies/__tests__/company-detail.test.tsx
```

Expected: FAIL — those rows don't appear.

**Step 3: Fix rating row config in OverviewTab**

In `company-detail.tsx`, find the ratings row config inside `OverviewTab` (around line 173). Replace:

```tsx
// Old:
[
  ["Work-Life Balance", "work_life_balance"],
  ["Compensation", "compensation"],
  ["Career Growth", "career_growth"],
  ["Management", "management"],
] as [string, string][]

// New:
[
  ["Work-Life Balance", "workLifeBalance"],
  ["Compensation", "compensation"],
  ["Career Growth", "careerGrowth"],
  ["Culture", "culture"],
  ["Management", "management"],
] as [string, string][]
```

**Step 4: Run test to verify it passes**

```bash
cd frontend && npx pnpm vitest run src/components/companies/__tests__/company-detail.test.tsx
```

Expected: PASS

**Step 5: Commit**

```bash
git add frontend/src/components/companies/company-detail.tsx frontend/src/components/companies/__tests__/company-detail.test.tsx
git commit -m "fix(company-detail): fix camelCase rating keys, add culture and management rows"
```

---

### Task 4: Update heading section — remove tags, make Researched badge black

Remove `tags` badges from the header. Change the Researched badge to solid black.

**Files:**
- Modify: `frontend/src/components/companies/company-detail.tsx` (lines ~366–390, the `badges` const and `tags` usage)
- Modify: `frontend/src/components/companies/__tests__/company-detail.test.tsx`

**Step 1: Update the existing "renders tags as badges" test**

The test at line 63–67 checks that tags render as badges. After this change, tags won't appear. Update it:

```tsx
// Replace the "renders tags as badges" test with:
it("does not render tags as badges in the header", () => {
  render(<CompanyDetail company={mockCompany} />);
  expect(screen.queryByText("startup")).not.toBeInTheDocument();
  expect(screen.queryByText("remote")).not.toBeInTheDocument();
});
```

**Step 2: Run tests to confirm that test currently fails (tags still appear)**

```bash
cd frontend && npx pnpm vitest run src/components/companies/__tests__/company-detail.test.tsx
```

Expected: FAIL for the updated test.

**Step 3: Update badges const in CompanyDetail**

Replace the `badges` const (around lines 377–390):

```tsx
// Old:
const badges = (
  <>
    {company.researched && (
      <Badge variant="default" className="text-xs">
        Researched
      </Badge>
    )}
    {tags.map((tag) => (
      <Badge key={tag} variant="outline" className="text-xs">
        {tag}
      </Badge>
    ))}
  </>
);

// New:
const badges = company.researched ? (
  <Badge className="bg-foreground text-background text-xs">Researched</Badge>
) : null;
```

Also remove the `tags` const on line 366 (it's no longer needed):
```tsx
// Delete this line:
const tags = Array.isArray(company.tags) ? (company.tags as string[]) : [];
```

**Step 4: Run tests to verify they pass**

```bash
cd frontend && npx pnpm vitest run src/components/companies/__tests__/company-detail.test.tsx
```

Expected: PASS

**Step 5: Commit**

```bash
git add frontend/src/components/companies/company-detail.tsx frontend/src/components/companies/__tests__/company-detail.test.tsx
git commit -m "fix(company-detail): remove tags from header badges, use solid black for Researched badge"
```

---

### Task 5: Data quality card styling and section heading sizes

Pure styling changes — no tests needed.

**Files:**
- Modify: `frontend/src/components/companies/company-detail.tsx` (OverviewTab)

**Step 1: Wrap data quality block**

In `OverviewTab`, find the data quality `<div className="space-y-2">` (around line 105). Wrap the entire block in:

```tsx
<div className="rounded-md border bg-muted/30 p-3 space-y-2">
  {/* Data Quality content — remove the inner space-y-2 div, merge it */}
  ...
</div>
```

Replace:
```tsx
{/* Data Quality */}
<div className="space-y-2">
```
With:
```tsx
{/* Data Quality */}
<div className="rounded-md border bg-muted/30 p-3 space-y-2">
```

**Step 2: Increase section heading sizes**

Find all three section headings in `OverviewTab` and `ResearchTab`. Change `text-sm font-medium` → `text-lg font-medium` for these specific labels:

In `OverviewTab`:
- `<p className="text-sm font-medium">Data Quality</p>` → `<p className="text-lg font-medium">Data Quality</p>`
  Wait — the Data Quality label is a `<span className="text-sm font-medium">`. Update that span too.
- `<p className="text-sm font-medium">Ratings</p>` → `<p className="text-lg font-medium">Ratings</p>`
- `<p className="text-sm font-medium">Description</p>` → `<p className="text-lg font-medium">Description</p>`

In `ResearchTab`:
- `<p className="text-sm font-medium">Culture</p>` → `<p className="text-lg font-medium">Culture</p>`
- `<p className="text-sm font-medium">Tech Stack</p>` → `<p className="text-lg font-medium">Tech Stack</p>`
- `<p className="text-sm font-medium">Benefits</p>` → `<p className="text-lg font-medium">Benefits</p>`
- `<p className="text-sm font-medium text-green-600">Pros</p>` → keep color, change to `text-lg`
- `<p className="text-sm font-medium text-red-600">Cons</p>` → keep color, change to `text-lg`

**Step 3: Verify the app compiles**

```bash
cd frontend && npx pnpm tsc --noEmit
```

Expected: no output (no errors).

**Step 4: Commit**

```bash
git add frontend/src/components/companies/company-detail.tsx
git commit -m "fix(company-detail): data quality card border/bg, section headings text-lg"
```

---

## Group 2: Companies Table Fixes

### Task 6: Remove tags column from companyTableSchema

**Files:**
- Modify: `frontend/src/schemas/table-schemas.tsx` (lines 208–232, the `tags` column object)

**Step 1: Delete the tags column**

In `table-schemas.tsx`, find and delete the entire `tags` column object from `companyTableSchema.columns` (the block from `{ id: "tags", ...` through its closing `},`).

**Step 2: Verify no TypeScript errors**

```bash
cd frontend && npx pnpm tsc --noEmit
```

**Step 3: Commit**

```bash
git add frontend/src/schemas/table-schemas.tsx
git commit -m "fix(companies-table): remove tags column"
```

---

### Task 7: Add edit icon to companies table row actions

**Files:**
- Modify: `frontend/src/routes/_authenticated/companies.tsx` (the `rowActions` prop, around lines 232–242)

**Step 1: Add pencil button to rowActions**

Replace the `rowActions` prop in the `<UniversalTable>`:

```tsx
rowActions={(company) => (
  <>
    <Button
      variant="ghost"
      size="icon-xs"
      aria-label="Edit company"
      onClick={(e) => {
        e.stopPropagation();
        setFormMode("edit");
        setEditingCompany(company as Company);
        setFormOpen(true);
      }}
    >
      <PencilIcon className="size-3.5" />
    </Button>
    <Button
      variant="ghost"
      size="icon-xs"
      aria-label="Archive company"
      onClick={() => archiveCompany.mutate((company as Company).id)}
    >
      <ArchiveIcon className="size-3.5" />
    </Button>
  </>
)}
```

Note: `PencilIcon` is already imported at line 9.

**Step 2: Verify no TypeScript errors**

```bash
cd frontend && npx pnpm tsc --noEmit
```

**Step 3: Commit**

```bash
git add frontend/src/routes/_authenticated/companies.tsx
git commit -m "fix(companies): add edit icon to table row actions"
```

---

## Group 3: Companies Page URL-Based Detail State

### Task 8: Replace selectedId local state with ?detail= URL param in companies page

**Files:**
- Modify: `frontend/src/routes/_authenticated/companies.tsx`

**Step 1: Add `detail` to route search schema**

Find `interface CompaniesSearch` (around line 30) and add `detail`:

```tsx
interface CompaniesSearch {
  search?: string;
  detail?: string;
}
```

Update `validateSearch`:

```tsx
validateSearch: (search: Record<string, unknown>): CompaniesSearch => ({
  search: (search.search as string) || undefined,
  detail: (search.detail as string) || undefined,
}),
```

**Step 2: Replace selectedId state with URL param**

Remove the `const [selectedId, setSelectedId] = useState<string | null>(null);` line.

Replace all usages:

- `selectedId` → `searchParams.detail ?? null` (or `searchParams.detail ?? ""` for the query)
- `setSelectedId(company.id)` (in `onRowClick`) → `navigate({ to: "/companies", search: (prev: CompaniesSearch) => ({ ...prev, detail: (company as Company).id }) })`
- `setSelectedId(null)` (in `onDetailClose`) → `navigate({ to: "/companies", search: (prev: CompaniesSearch) => ({ ...prev, detail: undefined }) })`

The `useCompany` call:
```tsx
const { data: selectedCompany } = useCompany(searchParams.detail ?? "");
```

The `selectedId` reference in `<UniversalTable>`:
```tsx
selectedId={searchParams.detail ?? null}
```

The `detailPanel` condition:
```tsx
detailPanel={selectedCompany ? <CompanyDetail company={selectedCompany} /> : null}
```

**Step 3: Verify no TypeScript errors**

```bash
cd frontend && npx pnpm tsc --noEmit
```

**Step 4: Manual smoke test**

Run the dev server (`cd frontend && npx pnpm dev`) and verify:
- Clicking a company row updates the URL to `?detail=<id>` and opens the panel
- Pressing the browser back button closes the panel
- Closing the panel via the X button updates the URL (removes `detail`)

**Step 5: Commit**

```bash
git add frontend/src/routes/_authenticated/companies.tsx
git commit -m "feat(companies): persist detail panel selection in URL as ?detail=<id>"
```

---

## Group 4: Company Detail Apps Tab

### Task 9: Add `detail` param to applications route

This is a prerequisite for app card navigation from the companies detail panel.

**Files:**
- Modify: `frontend/src/routes/_authenticated/applications.tsx`

**Step 1: Add `detail` to the Zod schema**

Find `applicationsSearchSchema` (around line 35). Add:

```tsx
detail: z.string().optional().catch(undefined),
```

**Step 2: Replace selectedId local state**

Remove `const [selectedId, setSelectedId] = useState<string | null>(null);` (line 115).

Replace all references:
- `selectedId` for the query → `searchParams.detail ?? ""`
- `selectedId` for `<UniversalTable selectedId>` → `searchParams.detail ?? null`
- Row click handler (currently `setSelectedId(...)`) → `navigate({ to: "/applications", search: (prev: ApplicationsSearch) => ({ ...prev, detail: (app as ApplicationListItem).id }) })`
- Detail close handler (currently `setSelectedId(null)`) → `navigate({ to: "/applications", search: (prev: ApplicationsSearch) => ({ ...prev, detail: undefined }), replace: true })`

Note: closing the applications detail panel uses `replace: true` (not push) — navigating away from a company card to an application is a deliberate navigation, but closing the applications panel itself is not a meaningful back-button destination.

**Step 3: Verify no TypeScript errors**

```bash
cd frontend && npx pnpm tsc --noEmit
```

**Step 4: Commit**

```bash
git add frontend/src/routes/_authenticated/applications.tsx
git commit -m "feat(applications): persist detail panel selection in URL as ?detail=<id>"
```

---

### Task 10: Update AppsTab — count in label, remove buttons, add card navigation

**Files:**
- Modify: `frontend/src/components/companies/company-detail.tsx`

**Step 1: Lift useApplicationsByCompany hook to CompanyDetail**

In `CompanyDetail`, add the hook call (it's currently inside `AppsTab`):

```tsx
import { useApplicationsByCompany } from "@/lib/queries/applications";
import { useNavigate } from "@tanstack/react-router";

// Inside CompanyDetail function:
const navigate = useNavigate();
const { data: appsResult } = useApplicationsByCompany(company.id);
const apps = appsResult?.data ?? [];
```

**Step 2: Update AppsTab props and signature**

Change `AppsTab` to accept `apps` and `navigate` instead of fetching internally:

```tsx
function AppsTab({
  apps,
  onAppClick,
}: {
  apps: { id: string; position: string; status: string; applied_at: string | null }[];
  onAppClick: (appId: string) => void;
}) {
```

Remove the `useApplicationsByCompany` call from inside `AppsTab`.

**Step 3: Update AppsTab render — remove buttons, add click handler**

Replace the full `AppsTab` return:

```tsx
return (
  <div className="space-y-2">
    {apps.length === 0 && (
      <p className="text-sm text-muted-foreground">No applications linked to this company.</p>
    )}
    {apps.map((app) => (
      <button
        key={app.id}
        type="button"
        className="w-full rounded-md border p-3 text-left transition-colors hover:bg-muted/50"
        onClick={() => onAppClick(app.id)}
      >
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium">{app.position}</p>
          <Badge variant="secondary" className="shrink-0 text-xs">
            {app.status}
          </Badge>
        </div>
        {app.applied_at && (
          <p className="mt-1 text-xs text-muted-foreground">
            Applied {formatDate(app.applied_at)}
          </p>
        )}
      </button>
    ))}
  </div>
);
```

Remove: `Link2` import (no longer used in `AppsTab`), the count `<span>`, and the "All Applications" `<Button>`.

**Step 4: Update the tabs array in CompanyDetail**

```tsx
{
  id: "apps",
  label: `Apps (${apps.length})`,
  content: (
    <AppsTab
      apps={apps}
      onAppClick={(appId) =>
        navigate({ to: "/applications", search: { detail: appId } })
      }
    />
  ),
},
```

**Step 5: Update the mock in the test file**

The test currently mocks `useApplicationsByCompany` inside the component. Since we moved the hook up, update the mock in `company-detail.test.tsx`:

The mock is already at the top:
```tsx
vi.mock("@/lib/queries/applications", () => ({
  useApplicationsByCompany: () => ({ data: { data: [], count: 0 } }),
}));
```

Also mock `useNavigate` since `CompanyDetail` now calls it:
```tsx
vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-router")>();
  return { ...actual, useNavigate: () => vi.fn() };
});
```

**Step 6: Run tests**

```bash
cd frontend && npx pnpm vitest run src/components/companies/__tests__/company-detail.test.tsx
```

Expected: PASS

**Step 7: Verify no TypeScript errors**

```bash
cd frontend && npx pnpm tsc --noEmit
```

**Step 8: Commit**

```bash
git add frontend/src/components/companies/company-detail.tsx frontend/src/components/companies/__tests__/company-detail.test.tsx
git commit -m "feat(company-detail): apps tab count label, remove buttons, navigate to applications on card click"
```

---

## Group 5: Events Form Fixes

### Task 11: Date field — native input + calendar button (mouse-only)

Replace the single calendar-only button with a text `<input type="date">` plus a `tabIndex={-1}` calendar icon.

**Files:**
- Modify: `frontend/src/components/events/schedule-dialog.tsx` (date field block, around lines 350–381)

**Step 1: Restructure the date field**

Replace the entire date `<div className="space-y-2">` block:

```tsx
<div className="space-y-2">
  <Label>Date</Label>
  <div className="flex gap-2">
    <Input
      type="date"
      className="flex-1"
      value={watch("date")}
      onChange={(e) => {
        const val = e.target.value;
        setValue("date", val, { shouldValidate: true });
        setSelectedDate(val ? new Date(`${val}T00:00:00`) : undefined);
      }}
    />
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          tabIndex={-1}
          aria-label="Open date picker"
          type="button"
        >
          <CalendarIcon className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0"
        align="end"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => {
            setSelectedDate(date);
            setValue("date", date ? format(date, "yyyy-MM-dd") : "", {
              shouldValidate: true,
            });
          }}
        />
      </PopoverContent>
    </Popover>
  </div>
</div>
```

**Step 2: Verify no TypeScript errors**

```bash
cd frontend && npx pnpm tsc --noEmit
```

**Step 3: Commit**

```bash
git add frontend/src/components/events/schedule-dialog.tsx
git commit -m "fix(schedule-dialog): date field — native input + calendar picker as mouse-only helper"
```

---

### Task 12: Time field — hide browser clock icon

**Files:**
- Modify: `frontend/src/components/events/schedule-dialog.tsx` (time Input, around line 385)

**Step 1: Add CSS to hide the clock indicator**

Find:
```tsx
<Input id="schedule-time" type="time" {...register("time")} />
```

Replace with:
```tsx
<Input
  id="schedule-time"
  type="time"
  className="[&::-webkit-calendar-picker-indicator]:hidden"
  {...register("time")}
/>
```

**Step 2: Verify no TypeScript errors**

```bash
cd frontend && npx pnpm tsc --noEmit
```

**Step 3: Commit**

```bash
git add frontend/src/components/events/schedule-dialog.tsx
git commit -m "fix(schedule-dialog): hide time field clock icon to remove extra tab stop"
```

---

### Task 13: Contact combobox — fix keyboard access via onOpenAutoFocus

When opened via keyboard, the Radix Popover's default focus management conflicts with the `useEffect` focus approach. Replace with Radix's `onOpenAutoFocus`.

**Files:**
- Modify: `frontend/src/components/events/contact-combobox.tsx` (PopoverContent, around line 174)

**Step 1: Write the failing test**

Open `frontend/src/components/events/__tests__/contact-combobox.test.tsx` and check if the existing "focuses search input when combobox opens" test passes. If it already passes in JSDOM, we still need to verify the fix is correct. Add a test for keyboard-triggered open:

```tsx
it("search input is interactive after keyboard open", async () => {
  const user = userEvent.setup();
  // render with required props — check existing test file for the mock setup
  // Tab to the trigger button
  await user.tab();
  // Press Enter to open
  await user.keyboard("{Enter}");
  // Should be able to type in the search
  await user.keyboard("alice");
  const searchInput = screen.getByPlaceholderText("Search by name...");
  expect(searchInput).toHaveValue("alice");
});
```

Note: If the test file already has a comprehensive focus test that covers this, skip adding a new one and proceed to the fix.

**Step 2: Add onOpenAutoFocus to PopoverContent**

In `contact-combobox.tsx`, find the `<PopoverContent>` (around line 174) and add the prop:

```tsx
<PopoverContent
  className="w-[--radix-popover-trigger-width] p-0"
  align="start"
  onOpenAutoFocus={(e) => {
    e.preventDefault();
    searchInputRef.current?.focus();
  }}
>
```

Remove the `useEffect` that does the same thing (the one that fires when `open` is true, around lines 73–78) since `onOpenAutoFocus` handles it more reliably:

```tsx
// Delete this useEffect:
useEffect(() => {
  if (open) {
    const timer = setTimeout(() => searchInputRef.current?.focus(), 0);
    return () => clearTimeout(timer);
  }
}, [open]);
```

**Step 3: Run tests**

```bash
cd frontend && npx pnpm vitest run src/components/events/__tests__/contact-combobox.test.tsx
```

Expected: PASS

**Step 4: Commit**

```bash
git add frontend/src/components/events/contact-combobox.tsx frontend/src/components/events/__tests__/contact-combobox.test.tsx
git commit -m "fix(contact-combobox): use onOpenAutoFocus for reliable keyboard focus on open"
```

---

## Group 6: Seed Data

### Task 14: Add culture and management to company ratings in seed files

**Files:**
- Modify: `supabase/seed.sql` (lines 32–44, company INSERT values)
- Modify: `supabase/seed.ts` (company objects)

**Step 1: Update seed.sql**

For each company in the INSERT, add `culture` and `management` keys to the ratings JSON. Use values consistent with the company's overall rating. Example mapping (adjust per company feel):

```sql
-- TechCorp Inc (overall 4.2):
'{"overall":4.2,"workLifeBalance":4,"compensation":4.5,"careerGrowth":4.3,"culture":4.0,"management":4.1}'

-- StartupXYZ (overall 3.8):
'{"overall":3.8,"workLifeBalance":3.5,"compensation":4,"careerGrowth":3.7,"culture":3.6,"management":3.4}'

-- BigTech Solutions (overall 4.5):
'{"overall":4.5,"workLifeBalance":4.2,"compensation":4.8,"careerGrowth":4.6,"culture":4.3,"management":4.4}'
```

Apply similar reasoning to all 13 companies. Keep values within ±0.5 of the overall rating.

**Step 2: Update seed.ts**

In `supabase/seed.ts`, find the Company interface (it already has `culture?: number` and `management?: number` in ratings). Find where company seed objects are defined and add the same values.

**Step 3: Commit**

```bash
git add supabase/seed.sql supabase/seed.ts
git commit -m "fix(seed): add culture and management to company ratings"
```

---

## Summary of Commits

| # | Commit message |
|---|----------------|
| 1 | fix(company-detail): parse links from flat object format |
| 2 | fix(company-detail): parse tech_stack and benefits as comma-or-newline lists |
| 3 | fix(company-detail): fix camelCase rating keys, add culture and management rows |
| 4 | fix(company-detail): remove tags from header badges, use solid black for Researched badge |
| 5 | fix(company-detail): data quality card border/bg, section headings text-lg |
| 6 | fix(companies-table): remove tags column |
| 7 | fix(companies): add edit icon to table row actions |
| 8 | feat(companies): persist detail panel selection in URL as ?detail=<id> |
| 9 | feat(applications): persist detail panel selection in URL as ?detail=<id> |
| 10 | feat(company-detail): apps tab count label, remove buttons, navigate to applications on card click |
| 11 | fix(schedule-dialog): date field — native input + calendar picker as mouse-only helper |
| 12 | fix(schedule-dialog): hide time field clock icon to remove extra tab stop |
| 13 | fix(contact-combobox): use onOpenAutoFocus for reliable keyboard focus on open |
| 14 | fix(seed): add culture and management to company ratings |
