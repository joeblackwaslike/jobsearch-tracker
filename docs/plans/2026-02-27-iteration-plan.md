# Iteration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Four discrete frontend improvements: verify/remove per-row company buttons, searchable industry combobox, conditional bookmarked timeline milestone, and a new URL import feature that fetches job postings and pre-fills the full application form.

**Architecture:** All changes are isolated to frontend components in `frontend/src/`. The URL import utility is a pure TS module; the fetch strategy uses client-side CORS proxies with a TODO for future server-side migration. The `FullApplicationForm` prefill prop is broadened to accept the full extracted job data shape. Tests use Vitest + Testing Library.

**Tech Stack:** React 19, TanStack Start/Router, Vitest, Testing Library, shadcn/ui (`Command` + `Popover` for combobox), Zod

---

## Task 1: Verify companies table has no per-row buttons

**Files:**
- Read: `frontend/src/components/companies/company-table.tsx`
- Read: `frontend/src/components/companies/__tests__/company-table.test.tsx`

**Step 1: Run the existing test**

```bash
cd frontend && npx pnpm test -- --reporter=verbose src/components/companies/__tests__/company-table.test.tsx
```

Expected: 3 tests pass, including `"does not render edit or archive action buttons"`.

**Step 2: Confirm no buttons exist in company-table.tsx**

The test at line 49–53 already asserts this. The table uses row `onClick` only. No code changes needed.

**Step 3: Commit**

```bash
git commit --allow-empty -m "chore: verify company table has no per-row edit/archive buttons (already clean)"
```

---

## Task 2: Industry searchable combobox

**Files:**
- Create: `frontend/src/components/companies/industry-combobox.tsx`
- Create: `frontend/src/components/companies/__tests__/industry-combobox.test.tsx`
- Modify: `frontend/src/components/companies/company-form.tsx`

### Step 1: Write the failing test

Create `frontend/src/components/companies/__tests__/industry-combobox.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { IndustryCombobox } from "../industry-combobox";

describe("IndustryCombobox", () => {
  it("renders with placeholder when no value", () => {
    render(<IndustryCombobox value="" onChange={vi.fn()} />);
    expect(screen.getByRole("combobox")).toHaveTextContent("Select industry");
  });

  it("shows selected value", () => {
    render(<IndustryCombobox value="Analytics" onChange={vi.fn()} />);
    expect(screen.getByRole("combobox")).toHaveTextContent("Analytics");
  });

  it("filters options by search input", async () => {
    render(<IndustryCombobox value="" onChange={vi.fn()} />);
    await userEvent.click(screen.getByRole("combobox"));
    await userEvent.type(screen.getByPlaceholderText("Search industry..."), "fin");
    expect(screen.getByText("Finance and Accounting")).toBeInTheDocument();
    expect(screen.queryByText("Analytics")).not.toBeInTheDocument();
  });

  it("calls onChange when an option is selected", async () => {
    const onChange = vi.fn();
    render(<IndustryCombobox value="" onChange={onChange} />);
    await userEvent.click(screen.getByRole("combobox"));
    await userEvent.click(screen.getByText("Analytics"));
    expect(onChange).toHaveBeenCalledWith("Analytics");
  });
});
```

### Step 2: Run test to verify it fails

```bash
cd frontend && npx pnpm test -- --reporter=verbose src/components/companies/__tests__/industry-combobox.test.tsx
```

Expected: FAIL — `Cannot find module '../industry-combobox'`

### Step 3: Create the component

Create `frontend/src/components/companies/industry-combobox.tsx`:

```tsx
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const INDUSTRY_OPTIONS = [
  "Analytics",
  "Engineering, Product and Design",
  "Finance and Accounting",
  "Human Resources",
  "Infrastructure",
  "Legal",
  "Marketing",
  "Office Management",
  "Operations",
  "Productivity",
  "Recruiting and Talent",
  "Retail",
  "Sales",
  "Security",
  "Supply Chain and Logistics",
  "Asset Management",
  "Banking and Exchange",
  "Consumer Finance",
  "Credit and Lending",
  "Insurance",
  "Payments",
  "Apparel and Cosmetics",
  "Consumer Electronics",
  "Content",
  "Food and Beverage",
  "Gaming",
  "Home and Personal",
  "Job and Career Services",
  "Social",
  "Transportation Services",
  "Travel, Leisure and Tourism",
  "Virtual and Augmented Reality",
  "Consumer Health and Wellness",
  "Diagnostics",
  "Drug Discovery and Delivery",
  "Healthcare IT",
  "Healthcare Services",
  "Industrial Bio",
  "Medical Devices",
  "Therapeutics",
  "Education",
  "Agriculture",
  "Automotive",
  "Aviation and Space",
  "Climate",
  "Defense",
  "Drones",
  "Energy",
  "Manufacturing and Robotics",
  "Construction",
  "Housing and Real Estate",
  "Government",
] as const;

interface IndustryComboboxProps {
  value: string;
  onChange: (value: string) => void;
}

export function IndustryCombobox({ value, onChange }: IndustryComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = INDUSTRY_OPTIONS.filter((opt) =>
    opt.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className="truncate">{value || "Select industry"}</span>
          <ChevronsUpDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search industry..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>No industry found.</CommandEmpty>
            <CommandGroup>
              {filtered.map((opt) => (
                <CommandItem
                  key={opt}
                  value={opt}
                  onSelect={(val) => {
                    onChange(val);
                    setSearch("");
                    setOpen(false);
                  }}
                >
                  <CheckIcon
                    className={cn("mr-2 size-4", value === opt ? "opacity-100" : "opacity-0")}
                  />
                  {opt}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
```

### Step 4: Run tests to verify they pass

```bash
cd frontend && npx pnpm test -- --reporter=verbose src/components/companies/__tests__/industry-combobox.test.tsx
```

Expected: 4 tests PASS

### Step 5: Replace the industry Select in company-form.tsx

In `frontend/src/components/companies/company-form.tsx`:

1. Add import at top (after existing imports):
```tsx
import { IndustryCombobox } from "./industry-combobox";
```

2. Remove the `INDUSTRY_OPTIONS` constant (lines ~102–155) — it now lives in `industry-combobox.tsx`.

3. Replace the industry `<Select>` block (the entire `<div className="space-y-2">` that contains `<Label>Industry</Label>` and the Select) with:
```tsx
<div className="space-y-2">
  <Label>Industry</Label>
  <IndustryCombobox
    value={watch("industry") ?? ""}
    onChange={(v) => setValue("industry", v)}
  />
</div>
```

### Step 6: Run existing company-form tests

```bash
cd frontend && npx pnpm test -- --reporter=verbose src/components/companies/__tests__/company-form.test.tsx
```

Expected: all pass

### Step 7: Commit

```bash
git add frontend/src/components/companies/industry-combobox.tsx \
        frontend/src/components/companies/__tests__/industry-combobox.test.tsx \
        frontend/src/components/companies/company-form.tsx
git commit -m "feat(companies): searchable industry combobox"
```

---

## Task 3: Application timeline — hide bookmarked milestone when applied

**Files:**
- Modify: `frontend/src/components/applications/application-detail.tsx`
- Modify: `frontend/src/components/applications/__tests__/application-detail.test.tsx`

### Step 1: Write the failing test

In `frontend/src/components/applications/__tests__/application-detail.test.tsx`, add this test inside the `describe("ApplicationDetail")` block (after line 233):

```tsx
it("hides 'Bookmarked' milestone when applied_at is set", () => {
  const appliedApp = {
    ...mockApplication,
    applied_at: "2026-01-20T00:00:00Z",
  };
  render(<ApplicationDetail application={appliedApp} />);
  expect(screen.queryByText("Bookmarked")).not.toBeInTheDocument();
});
```

### Step 2: Run test to verify it fails

```bash
cd frontend && npx pnpm test -- --reporter=verbose src/components/applications/__tests__/application-detail.test.tsx
```

Expected: new test FAILS — "Bookmarked" is found in the document

### Step 3: Apply the fix in application-detail.tsx

Find the "Bookmarked milestone" block in `application-detail.tsx` (around line 261–270). It currently looks like:

```tsx
{/* Bookmarked milestone */}
<div className="flex gap-4">
  <div className="relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full border bg-background">
    <BookmarkIcon className="size-4 text-muted-foreground" />
  </div>
  <div className="flex-1 pb-6">
    <p className="text-sm font-medium">Bookmarked</p>
    <p className="text-xs text-muted-foreground">{formatDate(application.created_at)}</p>
  </div>
</div>
```

Wrap it with a conditional:

```tsx
{/* Bookmarked milestone — only shown when not yet applied */}
{!application.applied_at && (
  <div className="flex gap-4">
    <div className="relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full border bg-background">
      <BookmarkIcon className="size-4 text-muted-foreground" />
    </div>
    <div className="flex-1 pb-6">
      <p className="text-sm font-medium">Bookmarked</p>
      <p className="text-xs text-muted-foreground">{formatDate(application.created_at)}</p>
    </div>
  </div>
)}
```

### Step 4: Run all application-detail tests

```bash
cd frontend && npx pnpm test -- --reporter=verbose src/components/applications/__tests__/application-detail.test.tsx
```

Expected: all tests pass (including the existing "renders 'Bookmarked' milestone" test which uses `applied_at: null`)

### Step 5: Commit

```bash
git add frontend/src/components/applications/application-detail.tsx \
        frontend/src/components/applications/__tests__/application-detail.test.tsx
git commit -m "fix(application-detail): hide bookmarked milestone when applied_at is set"
```

---

## Task 4: URL import utility

**Files:**
- Create: `frontend/src/lib/url-import.ts`
- Create: `frontend/src/lib/__tests__/url-import.test.ts`

This is the fetch + parse utility from the POC. We write it with tests for the pure parsing functions (`parseSalary`, `detectWorkType`, `detectEmploymentType`, `getSourceFromUrl`, `isLikelyJobUrl`). The `fetchJobFromUrl` function is not unit-tested (it makes network calls) but is tested via integration in Task 6.

### Step 1: Write tests for pure utility functions

Create `frontend/src/lib/__tests__/url-import.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  detectEmploymentType,
  detectWorkType,
  getSourceFromUrl,
  isLikelyJobUrl,
  parseSalary,
} from "../url-import";

describe("parseSalary", () => {
  it("parses a dollar range", () => {
    expect(parseSalary("$120,000 - $180,000")).toEqual({
      min: 120000,
      max: 180000,
      currency: "USD",
    });
  });

  it("parses a k-notation range", () => {
    expect(parseSalary("$120k - $180k")).toEqual({
      min: 120000,
      max: 180000,
      currency: "USD",
    });
  });

  it("returns empty object for empty string", () => {
    expect(parseSalary("")).toEqual({});
  });

  it("detects GBP currency", () => {
    const result = parseSalary("£50,000 - £70,000");
    expect(result.currency).toBe("GBP");
  });
});

describe("detectWorkType", () => {
  it("detects remote", () => {
    expect(detectWorkType("This is a fully remote position")).toBe("remote");
  });

  it("detects hybrid", () => {
    expect(detectWorkType("Hybrid work arrangement available")).toBe("hybrid");
  });

  it("detects onsite", () => {
    expect(detectWorkType("Must work on-site in our office")).toBe("onsite");
  });

  it("returns undefined for no match", () => {
    expect(detectWorkType("Great opportunity")).toBeUndefined();
  });
});

describe("detectEmploymentType", () => {
  it("detects full-time from explicit label", () => {
    expect(detectEmploymentType("Employment Type: Full Time")).toBe("full-time");
  });

  it("detects contract", () => {
    expect(detectEmploymentType("Job Type: Contract")).toBe("contract");
  });

  it("detects internship", () => {
    expect(detectEmploymentType("Summer Internship 2026")).toBe("internship");
  });

  it("returns undefined for no match", () => {
    expect(detectEmploymentType("Come work with us")).toBeUndefined();
  });
});

describe("getSourceFromUrl", () => {
  it("returns known job board name", () => {
    expect(getSourceFromUrl("https://www.linkedin.com/jobs/view/123")).toBe("LinkedIn");
    expect(getSourceFromUrl("https://greenhouse.io/jobs/abc")).toBe("Greenhouse");
  });

  it("extracts domain name for unknown sites", () => {
    expect(getSourceFromUrl("https://careers.somecompany.com/job/456")).toBe("Careers");
  });

  it("returns Web for invalid url", () => {
    expect(getSourceFromUrl("not-a-url")).toBe("Web");
  });
});

describe("isLikelyJobUrl", () => {
  it("returns true for known job board domains", () => {
    expect(isLikelyJobUrl("https://www.linkedin.com/jobs/view/123")).toBe(true);
  });

  it("returns true for /jobs/ path", () => {
    expect(isLikelyJobUrl("https://somecompany.com/jobs/senior-engineer")).toBe(true);
  });

  it("returns true for /careers/ path", () => {
    expect(isLikelyJobUrl("https://company.com/careers/frontend")).toBe(true);
  });

  it("returns false for non-job urls", () => {
    expect(isLikelyJobUrl("https://google.com")).toBe(false);
  });

  it("returns false for invalid url", () => {
    expect(isLikelyJobUrl("not-a-url")).toBe(false);
  });
});
```

### Step 2: Run test to verify it fails

```bash
cd frontend && npx pnpm test -- --reporter=verbose src/lib/__tests__/url-import.test.ts
```

Expected: FAIL — `Cannot find module '../url-import'`

### Step 3: Create the utility

Create `frontend/src/lib/url-import.ts` with the full content from `docs/next-iteration.md` (the POC code). The only additions:
- Add this comment above `fetchJobFromUrl`:
```ts
// TODO: move fetch logic to a server-side /api/fetch-url route to eliminate
// reliance on third-party CORS proxies (allorigins.win, corsproxy.io).
```

Copy the full POC code as-is. Do not modify the logic.

### Step 4: Run tests to verify they pass

```bash
cd frontend && npx pnpm test -- --reporter=verbose src/lib/__tests__/url-import.test.ts
```

Expected: all tests PASS

### Step 5: Commit

```bash
git add frontend/src/lib/url-import.ts \
        frontend/src/lib/__tests__/url-import.test.ts
git commit -m "feat(url-import): add job URL fetch and parse utility"
```

---

## Task 5: URL import dialog component

**Files:**
- Create: `frontend/src/components/applications/url-import-dialog.tsx`
- Create: `frontend/src/components/applications/__tests__/url-import-dialog.test.tsx`

### Step 1: Write the failing test

Create `frontend/src/components/applications/__tests__/url-import-dialog.test.tsx`:

```tsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { UrlImportDialog } from "../url-import-dialog";

// Mock the utility so we control fetch behavior
vi.mock("@/lib/url-import", () => ({
  fetchJobFromUrl: vi.fn(),
  isLikelyJobUrl: vi.fn(() => true),
}));

import { fetchJobFromUrl } from "@/lib/url-import";

describe("UrlImportDialog", () => {
  it("renders with URL input", () => {
    render(<UrlImportDialog open={true} onOpenChange={vi.fn()} onImport={vi.fn()} />);
    expect(screen.getByText("Import from URL")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("https://...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /import/i })).toBeInTheDocument();
  });

  it("shows loading state while fetching", async () => {
    vi.mocked(fetchJobFromUrl).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ jobUrl: "https://example.com" }), 100))
    );
    render(<UrlImportDialog open={true} onOpenChange={vi.fn()} onImport={vi.fn()} />);
    const input = screen.getByPlaceholderText("https://...");
    await userEvent.type(input, "https://jobs.example.com/swe");
    await userEvent.click(screen.getByRole("button", { name: /import/i }));
    expect(screen.getByText(/fetching/i)).toBeInTheDocument();
  });

  it("calls onImport with extracted data on success", async () => {
    const extracted = {
      jobUrl: "https://jobs.example.com/swe",
      position: "Software Engineer",
      companyName: "Acme Corp",
    };
    vi.mocked(fetchJobFromUrl).mockResolvedValue(extracted);
    const onImport = vi.fn();
    render(<UrlImportDialog open={true} onOpenChange={vi.fn()} onImport={onImport} />);
    const input = screen.getByPlaceholderText("https://...");
    await userEvent.type(input, "https://jobs.example.com/swe");
    await userEvent.click(screen.getByRole("button", { name: /import/i }));
    await waitFor(() => expect(onImport).toHaveBeenCalledWith(extracted));
  });

  it("calls onImport with just the url on fetch error", async () => {
    vi.mocked(fetchJobFromUrl).mockRejectedValue(new Error("network error"));
    const onImport = vi.fn();
    render(<UrlImportDialog open={true} onOpenChange={vi.fn()} onImport={onImport} />);
    const input = screen.getByPlaceholderText("https://...");
    await userEvent.type(input, "https://jobs.example.com/swe");
    await userEvent.click(screen.getByRole("button", { name: /import/i }));
    await waitFor(() =>
      expect(onImport).toHaveBeenCalledWith({ jobUrl: "https://jobs.example.com/swe" })
    );
  });
});
```

### Step 2: Run test to verify it fails

```bash
cd frontend && npx pnpm test -- --reporter=verbose src/components/applications/__tests__/url-import-dialog.test.tsx
```

Expected: FAIL — `Cannot find module '../url-import-dialog'`

### Step 3: Create the component

Create `frontend/src/components/applications/url-import-dialog.tsx`:

```tsx
import { LinkIcon, LoaderIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type ExtractedJobData, fetchJobFromUrl } from "@/lib/url-import";

interface UrlImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (data: ExtractedJobData) => void;
}

export function UrlImportDialog({ open, onOpenChange, onImport }: UrlImportDialogProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleImport = async () => {
    if (!url.trim()) return;
    setLoading(true);
    try {
      const data = await fetchJobFromUrl(url.trim());
      onImport(data);
    } catch {
      onImport({ jobUrl: url.trim() });
    } finally {
      setLoading(false);
      setUrl("");
      onOpenChange(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleImport();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import from URL</DialogTitle>
          <DialogDescription>
            Paste a job posting URL to auto-fill the application form.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="import-url">Job posting URL</Label>
            <Input
              id="import-url"
              placeholder="https://..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
          </div>
          {loading && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <LoaderIcon className="size-4 animate-spin" />
              Fetching job details...
            </p>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!url.trim() || loading}>
            <LinkIcon className="size-4" />
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### Step 4: Run tests to verify they pass

```bash
cd frontend && npx pnpm test -- --reporter=verbose src/components/applications/__tests__/url-import-dialog.test.tsx
```

Expected: all 4 tests PASS

### Step 5: Commit

```bash
git add frontend/src/components/applications/url-import-dialog.tsx \
        frontend/src/components/applications/__tests__/url-import-dialog.test.tsx
git commit -m "feat(url-import): add URL import dialog component"
```

---

## Task 6: Extend FullApplicationForm to accept URL import prefill

**Files:**
- Modify: `frontend/src/components/applications/full-application-form.tsx`
- Modify: `frontend/src/components/applications/__tests__/full-application-form.test.tsx`

The `FullApplicationForm` currently has:
```ts
prefill?: { company?: string; position?: string; url?: string };
```

We need to extend it to also accept fields from `ExtractedJobData`.

### Step 1: Write failing tests

In `frontend/src/components/applications/__tests__/full-application-form.test.tsx`, check what existing tests look like, then add:

```tsx
it("pre-fills all URL import fields when importData is provided", async () => {
  render(
    <FullApplicationForm
      open={true}
      onOpenChange={vi.fn()}
      importData={{
        jobUrl: "https://example.com/job",
        position: "Staff Engineer",
        companyName: "Acme Corp",
        location: "Remote",
        workType: "remote",
        employmentType: "full-time",
        salaryMin: 150000,
        salaryMax: 200000,
        salaryCurrency: "USD",
        jobDescription: "Build great things",
        source: "LinkedIn",
      }}
    />
  );
  expect(screen.getByDisplayValue("Staff Engineer")).toBeInTheDocument();
  expect(screen.getByDisplayValue("https://example.com/job")).toBeInTheDocument();
});
```

### Step 2: Run test to verify it fails

```bash
cd frontend && npx pnpm test -- --reporter=verbose src/components/applications/__tests__/full-application-form.test.tsx
```

Expected: new test FAILS — `importData` prop not recognized yet

### Step 3: Extend FullApplicationForm

In `frontend/src/components/applications/full-application-form.tsx`:

1. Add import:
```ts
import type { ExtractedJobData } from "@/lib/url-import";
```

2. Extend `FullApplicationFormProps`:
```ts
interface FullApplicationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  prefill?: { company?: string; position?: string; url?: string };
  importData?: ExtractedJobData;  // <-- add this
  defaultStatus?: string;
  application?: ApplicationWithCompany | null;
}
```

3. In the component, add `importData` to destructured props.

4. In the `useEffect` that handles form reset when `open` changes, extend the default values to also read from `importData`. The effect already runs on `open`:

```ts
useEffect(() => {
  if (open) {
    if (application) {
      reset(applicationToFormValues(application));
    } else {
      reset({
        company_id: "",
        company_name: importData?.companyName ?? prefill?.company ?? "",
        position: importData?.position ?? prefill?.position ?? "",
        url: importData?.jobUrl ?? prefill?.url ?? "",
        status: defaultStatus ?? "applied",
        work_type: importData?.workType ?? "",
        employment_type: importData?.employmentType ?? "full-time",
        location: importData?.location ?? "",
        salary: {
          min: importData?.salaryMin,
          max: importData?.salaryMax,
          currency: importData?.salaryCurrency ?? "USD",
          period: "yearly",
        },
        job_description: importData?.jobDescription ?? "",
        source: importData?.source ?? prefill?.url ? getSourceFromUrl(prefill?.url ?? "") : "",
        interest: "medium",
        tags: [],
        notes: "",
      });
    }
  }
}, [open, application, importData, prefill, defaultStatus, reset]);
```

> **Note:** You will also need to import `getSourceFromUrl` from `@/lib/url-import` if using it for source auto-detection.

5. Add `importData` to the `useEffect` dependency array.

6. The `CompanyCombobox` is pre-filled via `company_name` initial search text. Ensure the `initialSearchText` prop on `CompanyCombobox` reads from the form's `company_name` field (which is already set from `importData?.companyName`).

7. **Auto-focus submit button:** Add `autoFocus` to the submit button when `importData` is provided:
```tsx
<Button
  type="submit"
  disabled={isSubmitting}
  autoFocus={!!importData}
>
  {isSubmitting ? "Saving..." : application ? "Save Changes" : "Add Application"}
</Button>
```

### Step 4: Run all full-application-form tests

```bash
cd frontend && npx pnpm test -- --reporter=verbose src/components/applications/__tests__/full-application-form.test.tsx
```

Expected: all tests PASS

### Step 5: Commit

```bash
git add frontend/src/components/applications/full-application-form.tsx \
        frontend/src/components/applications/__tests__/full-application-form.test.tsx
git commit -m "feat(full-application-form): accept URL import prefill data"
```

---

## Task 7: Wire up URL import in the applications page

**Files:**
- Modify: `frontend/src/routes/_authenticated/applications.tsx`

### Step 1: Make the changes

In `frontend/src/routes/_authenticated/applications.tsx`:

1. Add imports:
```tsx
import { LinkIcon } from "lucide-react";
import { UrlImportDialog } from "@/components/applications/url-import-dialog";
import type { ExtractedJobData } from "@/lib/url-import";
```

2. Add state:
```tsx
const [urlImportOpen, setUrlImportOpen] = useState(false);
const [importData, setImportData] = useState<ExtractedJobData | undefined>(undefined);
```

3. Add handler:
```tsx
const handleImport = useCallback((data: ExtractedJobData) => {
  setImportData(data);
  setFormOpen(true);
}, []);
```

4. Add the "Import from URL" button to the header button group (before "New Application"):
```tsx
<div className="flex items-center gap-2">
  <Button variant="outline" onClick={() => setEasyAddOpen(true)}>
    <ZapIcon className="size-4" />
    Easy Add
  </Button>
  <Button variant="outline" onClick={() => setUrlImportOpen(true)}>
    <LinkIcon className="size-4" />
    Import URL
  </Button>
  <Button onClick={() => { setImportData(undefined); setFormOpen(true); }}>
    <PlusIcon className="size-4" />
    New Application
  </Button>
</div>
```

5. Pass `importData` to `FullApplicationForm` and clear it when the dialog closes:
```tsx
<FullApplicationForm
  open={formOpen}
  onOpenChange={(open) => {
    setFormOpen(open);
    if (!open) setImportData(undefined);
  }}
  importData={importData}
/>
```

6. Add the `UrlImportDialog` in the dialogs section:
```tsx
<UrlImportDialog
  open={urlImportOpen}
  onOpenChange={setUrlImportOpen}
  onImport={handleImport}
/>
```

### Step 2: Run the full test suite

```bash
cd frontend && npx pnpm test -- --reporter=verbose
```

Expected: all tests PASS

### Step 3: Commit

```bash
git add frontend/src/routes/_authenticated/applications.tsx
git commit -m "feat(applications): add Import from URL button and wire up full form prefill"
```

---

## Task 8: Final verification

### Step 1: Run full test suite

```bash
cd frontend && npx pnpm test
```

Expected: all tests PASS, no new failures

### Step 2: Type-check

```bash
cd frontend && npx pnpm exec tsc --noEmit
```

Expected: no type errors

### Step 3: Commit if clean

If any type fixes were needed, commit them:

```bash
git add -p
git commit -m "fix: type errors after url import wiring"
```
