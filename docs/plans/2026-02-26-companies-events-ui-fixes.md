# Companies + Events UI Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Apply 10 targeted UI fixes across Company detail, Company table, Company form, and the Events schedule dialog.

**Architecture:** All changes are in the React frontend. One new package (`react-markdown` + `remark-gfm`) is added for markdown rendering. Each task is scoped to one or two files, with test updates where existing tests break.

**Tech Stack:** React 19, TypeScript, Vitest + React Testing Library, Tailwind CSS, react-hook-form, TanStack Router

---

## Prerequisites

All commands run from: `frontend/` directory (`/Users/joeblack/github/joeblackwaslike/jobsearch-tracker/frontend`)

Run tests: `npm run test -- <file-path>` (underlying runner is `vitest run`)
Run all tests: `npm run test`

---

## Task 1: Install react-markdown + remark-gfm

**Files:**
- Modify: `package.json`

**Step 1: Install packages**

```bash
cd /Users/joeblack/github/joeblackwaslike/jobsearch-tracker/frontend
npx pnpm add react-markdown remark-gfm
```

**Step 2: Verify installation**

```bash
npm run test
```

Expected: all existing tests still pass

**Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "deps(frontend): add react-markdown and remark-gfm"
```

---

## Task 2: Create `<MarkdownContent>` component

**Files:**
- Create: `src/components/ui/markdown-content.tsx`
- Create: `src/components/ui/__tests__/markdown-content.test.tsx`

**Step 1: Write the failing test**

Create `src/components/ui/__tests__/markdown-content.test.tsx`:

```typescript
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MarkdownContent } from "../markdown-content";

describe("MarkdownContent", () => {
  it("renders plain text", () => {
    render(<MarkdownContent content="Hello world" />);
    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });

  it("renders bold text from markdown", () => {
    render(<MarkdownContent content="**bold text**" />);
    const bold = document.querySelector("strong");
    expect(bold).toBeInTheDocument();
    expect(bold?.textContent).toBe("bold text");
  });

  it("renders a bulleted list from markdown", () => {
    render(<MarkdownContent content="- item one\n- item two" />);
    expect(screen.getByText("item one")).toBeInTheDocument();
    expect(screen.getByText("item two")).toBeInTheDocument();
    expect(document.querySelectorAll("li")).toHaveLength(2);
  });

  it("renders a heading from markdown", () => {
    render(<MarkdownContent content="## Section" />);
    expect(document.querySelector("h2")).toBeInTheDocument();
  });

  it("renders nothing when content is null", () => {
    const { container } = render(<MarkdownContent content={null} />);
    expect(container.firstChild).toBeNull();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm run test -- src/components/ui/__tests__/markdown-content.test.tsx
```

Expected: FAIL — "MarkdownContent" module not found

**Step 3: Create the component**

Create `src/components/ui/markdown-content.tsx`:

```typescript
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownContentProps {
  content: string | null | undefined;
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  if (!content) return null;

  return (
    <div className="prose prose-sm max-w-none text-sm text-muted-foreground [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0 [&_p]:my-1 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

```bash
npm run test -- src/components/ui/__tests__/markdown-content.test.tsx
```

Expected: PASS (5 tests)

**Step 5: Commit**

```bash
git add src/components/ui/markdown-content.tsx src/components/ui/__tests__/markdown-content.test.tsx
git commit -m "feat(ui): add MarkdownContent component with react-markdown + remark-gfm"
```

---

## Task 3: Fix company-detail tests first (links tab + description)

Two existing tests will break from upcoming changes. Fix them before touching the component.

**Files:**
- Modify: `src/components/companies/__tests__/company-detail.test.tsx`

**Step 1: Identify the two tests that will break**

1. `"renders links in links tab when stored as flat object"` (line ~87) — currently asserts `"Website"` is visible in links tab. After the fix, website is filtered out.
2. `"renders description when present"` (line ~79) — uses `getByText("Great company to work for")`. With markdown rendering wrapping in a `<p>`, the text node is still reachable but may be inside a container. This should still pass, no change needed.

**Step 2: Update the links test**

In `src/components/companies/__tests__/company-detail.test.tsx`, replace:

```typescript
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

With:

```typescript
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
  // Website is shown in the header, not the links tab
  expect(screen.queryByText("Website")).not.toBeInTheDocument();
  expect(screen.getByText("Careers Page")).toBeInTheDocument();
});
```

**Step 3: Run tests to confirm existing suite still passes**

```bash
npm run test -- src/components/companies/__tests__/company-detail.test.tsx
```

Expected: same pass/fail count as before (the test we changed should still pass since we haven't changed the component yet — but actually it may fail now if "Website" IS currently in the tab; that's fine, we expect it to fail now, and our component change will make it pass)

> Note: After this change the updated test will FAIL until Task 4 is done. That's correct TDD behavior.

**Step 4: Commit**

```bash
git add src/components/companies/__tests__/company-detail.test.tsx
git commit -m "test(company-detail): update links tab test — website filtered from links tab"
```

---

## Task 4: Fix company-detail component

**Files:**
- Modify: `src/components/companies/company-detail.tsx`

Changes in this task:
- Move description above key-value grid in `OverviewTab`
- Render description with `<MarkdownContent>` instead of `<p>`
- Render culture with `<MarkdownContent>` in `ResearchTab`
- Add `cursor-pointer` to apps card button
- Filter website from links tab + enforce sort order

**Step 1: Run the failing test from Task 3**

```bash
npm run test -- src/components/companies/__tests__/company-detail.test.tsx
```

Expected: `"renders links in links tab"` FAILS (Website is still shown)

**Step 2: Apply all changes to `company-detail.tsx`**

At the top of the file, add the import:
```typescript
import { MarkdownContent } from "@/components/ui/markdown-content";
```

**`OverviewTab` — reorder blocks and use MarkdownContent for description:**

Replace the entire `OverviewTab` function body with this ordering (Data Quality → Description → key-value grid → Ratings):

```typescript
function OverviewTab({ company }: { company: Company }) {
  const pct = calcCompleteness(company);
  const quality = qualityLabel(pct);
  const ratingsRaw = company.ratings as Record<string, unknown> | null;
  const ratings = ratingsRaw
    ? (Object.fromEntries(
        Object.entries(ratingsRaw).map(([k, v]) => [k, Number(v)]),
      ) as Record<string, number>)
    : null;

  return (
    <div className="space-y-6">
      {/* Data Quality */}
      <div className="rounded-md border bg-muted/30 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-lg font-medium">Data Quality</span>
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

      {/* Description */}
      {company.description && (
        <div className="space-y-1">
          <p className="text-lg font-medium">Description</p>
          <MarkdownContent content={company.description} />
        </div>
      )}

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
          <p className="text-lg font-medium">Ratings</p>
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
          {(
            [
              ["Work-Life Balance", "workLifeBalance"],
              ["Compensation", "compensation"],
              ["Career Growth", "careerGrowth"],
              ["Culture", "culture"],
              ["Management", "management"],
            ] as [string, string][]
          ).map(([label, key]) =>
            ratings[key] != null ? (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className="text-sm">{(ratings[key] as number).toFixed(1)}</span>
              </div>
            ) : null,
          )}
        </div>
      )}
    </div>
  );
}
```

**`ResearchTab` — use MarkdownContent for culture:**

Replace the culture block:
```typescript
{company.culture && (
  <div className="space-y-1">
    <p className="text-lg font-medium">Culture</p>
    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{company.culture}</p>
  </div>
)}
```

With:
```typescript
{company.culture && (
  <div className="space-y-1">
    <p className="text-lg font-medium">Culture</p>
    <MarkdownContent content={company.culture} />
  </div>
)}
```

**`AppsTab` — add `cursor-pointer`:**

Change the button className from:
```
className="w-full rounded-md border p-3 text-left transition-colors hover:bg-muted/50"
```
To:
```
className="w-full cursor-pointer rounded-md border p-3 text-left transition-colors hover:bg-muted/50"
```

**`LinksTab` — filter website, enforce sort order:**

Add a sort-order constant just before `LinksTab`:
```typescript
const LINK_SORT_ORDER = ["careers", "news", "linkedin", "glassdoor", "crunchbase"];
```

Replace the `LinksTab` function:
```typescript
function LinksTab({ links }: { links: CompanyLink[] }) {
  const sorted = links
    .filter((l) => l.type !== "website")
    .sort((a, b) => {
      const ai = LINK_SORT_ORDER.indexOf(a.type);
      const bi = LINK_SORT_ORDER.indexOf(b.type);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });

  if (sorted.length === 0) {
    return <p className="text-sm text-muted-foreground">No links added.</p>;
  }

  return (
    <div className="space-y-2">
      {sorted.map((link, i) => {
        const Icon = LINK_TYPE_ICONS[link.type] ?? Globe;
        return (
          <a
            key={i}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-md border p-3 transition-colors hover:bg-muted/50"
          >
            <Icon className="size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{link.name}</p>
              <p className="truncate text-xs text-muted-foreground">{link.url}</p>
            </div>
            <ExternalLink className="size-4 shrink-0 text-muted-foreground" />
          </a>
        );
      })}
    </div>
  );
}
```

**Step 3: Run tests**

```bash
npm run test -- src/components/companies/__tests__/company-detail.test.tsx
```

Expected: all tests PASS

**Step 4: Commit**

```bash
git add src/components/companies/company-detail.tsx
git commit -m "fix(company-detail): markdown for description/culture, description placement, cursor on apps, filter+sort links tab"
```

---

## Task 5: Fix detail-layout — header URL/icon color

**Files:**
- Modify: `src/components/shared/detail-layout.tsx`

**Step 1: Apply the change**

In `detail-layout.tsx`, the `href` anchor currently has `hover:text-foreground hover:underline` (only foreground on hover). Change it to be foreground by default:

Replace:
```typescript
className="flex items-center gap-1 hover:text-foreground hover:underline"
```

With:
```typescript
className="flex items-center gap-1 text-foreground hover:underline"
```

This makes the URL text and the `ExternalLink` icon black/foreground by default in all `DetailLayout` headers.

**Step 2: Run all tests**

```bash
npm run test
```

Expected: all pass (no tests cover this styling detail)

**Step 3: Commit**

```bash
git add src/components/shared/detail-layout.tsx
git commit -m "fix(detail-layout): header URL and icon color — foreground by default"
```

---

## Task 6: Fix company-table — remove edit and archive buttons

The existing tests for the edit pencil button and archive button will break. Update them first.

**Files:**
- Modify: `src/components/companies/__tests__/company-table.test.tsx`
- Modify: `src/components/companies/company-table.tsx`

**Step 1: Update the tests to remove button-specific cases**

In `company-table.test.tsx`, remove or update these three tests:

1. `"calls onEdit when pencil icon is clicked"` — remove (pencil button is gone)
2. `"calls useArchiveCompany.mutate when archive icon is clicked"` — remove (archive button is gone)
3. `"archive button click does not trigger row click (stops propagation)"` — remove (archive button is gone)

Also remove the `mockArchiveMutate` mock and `useArchiveCompany` from the vi.mock block since the component will no longer use it.

Replace the full test file content:

```typescript
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Company } from "@/lib/queries/companies";
import { CompanyTable } from "../company-table";

vi.mock("@/lib/queries/companies", () => ({
  useArchiveCompany: () => ({ mutate: vi.fn(), isPending: false }),
}));

const companies = [
  {
    id: "c1",
    user_id: "u1",
    name: "Acme Corp",
    industry: "Tech",
    location: "Remote",
    size: "50-200",
    researched: true,
    tags: ["startup", "saas"],
    ratings: null,
    website: null,
    notes: null,
    archived_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
] as unknown as Company[];

describe("CompanyTable", () => {
  const onEdit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders company rows", () => {
    render(<CompanyTable data={companies} onEdit={onEdit} />);
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    expect(screen.getByText("Tech")).toBeInTheDocument();
  });

  it("calls onEdit when row is clicked", async () => {
    render(<CompanyTable data={companies} onEdit={onEdit} />);
    await userEvent.click(screen.getByText("Acme Corp"));
    expect(onEdit).toHaveBeenCalledWith(companies[0]);
  });

  it("does not render edit or archive action buttons", () => {
    render(<CompanyTable data={companies} onEdit={onEdit} />);
    expect(screen.queryByTitle("Edit company")).not.toBeInTheDocument();
    expect(screen.queryByTitle("Archive company")).not.toBeInTheDocument();
  });
});
```

**Step 2: Run tests to confirm the new test fails (archive/edit buttons still present)**

```bash
npm run test -- src/components/companies/__tests__/company-table.test.tsx
```

Expected: `"does not render edit or archive action buttons"` FAILS

**Step 3: Update `company-table.tsx`**

Remove `Archive`, `Pencil` from lucide-react imports, remove `useArchiveCompany` import, remove the actions `<TableHead>` and its `<TableCell>`.

The updated file:

```typescript
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Company } from "@/lib/queries/companies";

interface CompanyTableProps {
  data: Company[];
  onEdit: (company: Company) => void;
}

export function CompanyTable({ data, onEdit }: CompanyTableProps) {
  return (
    <div className="overflow-x-auto rounded-md border w-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Industry</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Researched</TableHead>
            <TableHead>Tags</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((company) => {
            const tags = Array.isArray(company.tags) ? (company.tags as string[]) : [];
            return (
              <TableRow key={company.id} className="cursor-pointer" onClick={() => onEdit(company)}>
                <TableCell className="font-medium">{company.name}</TableCell>
                <TableCell>{company.industry || "--"}</TableCell>
                <TableCell>{company.location || "--"}</TableCell>
                <TableCell>{company.size || "--"}</TableCell>
                <TableCell>
                  {company.researched ? (
                    <Badge variant="secondary" className="text-xs">
                      Yes
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">No</span>
                  )}
                </TableCell>
                <TableCell>
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
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
```

**Step 4: Run tests**

```bash
npm run test -- src/components/companies/__tests__/company-table.test.tsx
```

Expected: all 3 tests PASS

**Step 5: Commit**

```bash
git add src/components/companies/company-table.tsx src/components/companies/__tests__/company-table.test.tsx
git commit -m "fix(company-table): remove edit and archive action buttons"
```

---

## Task 7: Fix company-form — ratings keys, layout, textarea heights

**Files:**
- Modify: `src/components/companies/company-form.tsx`

Three changes in this task:
1. Rename `work_life`→`workLifeBalance` and `growth`→`careerGrowth` in schema + form (fix missing ratings rows bug)
2. Location + founded side by side
3. Culture, benefits, pros, cons textarea height → 90px

### 7a. Ratings key alignment

The form currently saves `work_life` and `growth`, but the detail view reads `workLifeBalance` and `careerGrowth`. Fix by renaming the form schema keys to match the display.

**In `ratingsSchema`**, rename the two fields:
```typescript
const ratingsSchema = z.object({
  overall: z.string().default(""),
  workLifeBalance: z.string().default(""),   // was: work_life
  compensation: z.string().default(""),
  careerGrowth: z.string().default(""),      // was: growth
  management: z.string().default(""),
  culture: z.string().default(""),
});
```

**In the `companyFormSchema` default**, update the ratingsSchema default:
```typescript
ratings: ratingsSchema.default({
  overall: "",
  workLifeBalance: "",
  compensation: "",
  careerGrowth: "",
  management: "",
  culture: "",
}),
```

**In `companyToFormValues`**, update the ratings block to read new keys with snake_case fallback for any old data:
```typescript
ratings: {
  overall: ratings.overall ?? "",
  workLifeBalance: ratings.workLifeBalance ?? ratings.work_life ?? "",
  compensation: ratings.compensation ?? "",
  careerGrowth: ratings.careerGrowth ?? ratings.growth ?? "",
  management: ratings.management ?? "",
  culture: ratings.culture ?? "",
},
```

**In `CompanyForm` JSX**, update the StarRating field mapping array (the `as const` tuple array):
```typescript
["ratings.overall", "Overall"],
["ratings.workLifeBalance", "Work-Life Balance"],  // was ratings.work_life
["ratings.compensation", "Compensation"],
["ratings.careerGrowth", "Career Growth"],          // was ratings.growth
["ratings.management", "Management"],
["ratings.culture", "Culture"],
```

Also update the two `watch()` and `setValue()` calls for these fields (TypeScript will catch them).

**In the `reset()` call** for create mode:
```typescript
reset({ name: "", researched: false });
```
No change needed — the schema defaults handle the rest.

### 7b. Location + Founded side by side

Currently location is in its own `<div className="space-y-2">` and founded is separate. Wrap both in a 2-col grid.

Replace:
```typescript
<div className="space-y-2">
  <Label>Location</Label>
  <CityCombobox
    value={watch("location") ?? ""}
    onChange={(v) => setValue("location", v)}
  />
</div>

<div className="space-y-2">
  <Label htmlFor="founded">Founded (year)</Label>
  <Input
    id="founded"
    type="number"
    placeholder="e.g. 2012"
    min={1800}
    max={2099}
    {...register("founded")}
  />
</div>
```

With:
```typescript
<div className="grid grid-cols-2 gap-4">
  <div className="space-y-2">
    <Label>Location</Label>
    <CityCombobox
      value={watch("location") ?? ""}
      onChange={(v) => setValue("location", v)}
    />
  </div>
  <div className="space-y-2">
    <Label htmlFor="founded">Founded (year)</Label>
    <Input
      id="founded"
      type="number"
      placeholder="e.g. 2012"
      min={1800}
      max={2099}
      {...register("founded")}
    />
  </div>
</div>
```

### 7c. Textarea heights

Change `min-h-[60px]` → `min-h-[90px]` on the four textareas: culture, benefits, pros, cons.

There are four occurrences in the Research Notes fieldset. Do a targeted find-and-replace for each textarea's className string.

**Step 1: Run existing form tests to confirm they pass before changes**

```bash
npm run test -- src/components/companies/__tests__/company-form.test.tsx
```

Expected: all pass

**Step 2: Apply all three changes above to `company-form.tsx`**

(TypeScript errors will guide you to any missed field references)

**Step 3: Run tests**

```bash
npm run test -- src/components/companies/__tests__/company-form.test.tsx
```

Expected: all pass

**Step 4: Commit**

```bash
git add src/components/companies/company-form.tsx
git commit -m "fix(company-form): align ratings keys to camelCase, location+founded side-by-side, taller research textareas"
```

---

## Task 8: Fix schedule-dialog — remove extra date picker button

**Files:**
- Modify: `src/components/events/schedule-dialog.tsx`

**Step 1: Run existing tests first**

```bash
npm run test -- src/components/events/__tests__/schedule-dialog.test.tsx
```

Expected: all pass (baseline)

**Step 2: Apply the change**

In `schedule-dialog.tsx`, locate the Date field section (around line 350-394). The current structure is:

```tsx
<div className="flex gap-2">
  <Input type="date" ... />
  <Popover>
    <PopoverTrigger asChild>
      <Button variant="outline" size="icon" tabIndex={-1} ...>
        <CalendarIcon className="size-4" />
      </Button>
    </PopoverTrigger>
    <PopoverContent ...>
      <Calendar ... />
    </PopoverContent>
  </Popover>
</div>
```

Replace the entire `<div className="flex gap-2">` wrapper with just the Input:

```tsx
<Input
  type="date"
  value={watch("date")}
  onChange={(e) => {
    setValue("date", e.target.value, { shouldValidate: true });
  }}
/>
```

Remove:
- The `<div className="flex gap-2">` wrapper
- The entire `<Popover>...</Popover>` block (PopoverTrigger, Button, CalendarIcon, PopoverContent, Calendar)
- The `selectedDate` state variable (`const [selectedDate, setSelectedDate] = useState<Date | undefined>()`)
- Any `setSelectedDate(...)` calls

Remove now-unused imports. Check the top of the file — if `CalendarIcon`, `Calendar`, `Popover`, `PopoverTrigger`, `PopoverContent` are no longer used anywhere else in the component, remove them from their respective import lines.

**Step 3: Run tests**

```bash
npm run test -- src/components/events/__tests__/schedule-dialog.test.tsx
```

Expected: all pass

**Step 4: Run full test suite**

```bash
npm run test
```

Expected: all tests pass

**Step 5: Commit**

```bash
git add src/components/events/schedule-dialog.tsx
git commit -m "fix(schedule-dialog): remove extra calendar popover button from date field"
```

---

## Final Verification

```bash
cd /Users/joeblack/github/joeblackwaslike/jobsearch-tracker/frontend
npm run test
```

All tests should pass. Manually verify in the browser:
- Company detail: URL in header is black, work-life/career growth ratings show, description at top rendered as markdown, culture as markdown, apps cards show pointer cursor, links tab sorted with no website entry
- Company table: no edit/archive buttons
- Company form: location + founded side by side, taller research note textareas
- Schedule/add event dialog: only one date input, no calendar button
