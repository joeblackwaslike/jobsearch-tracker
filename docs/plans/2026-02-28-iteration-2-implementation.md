# Iteration 2 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix combobox scroll/filter bugs, add Browserless edge function for URL import, improve data extraction quality, auto-create companies from import data, and migrate application.location (string) to application.locations (string[]).

**Architecture:** Frontend bug fixes are isolated component changes. URL import is refactored to call a Supabase Edge Function (Deno) instead of CORS proxies. The locations migration is a DB migration + cascading type/component update.

**Tech Stack:** React 19, TanStack, shadcn/ui (cmdk), Supabase Edge Functions (Deno), Vitest + Testing Library, Biome, pnpm via `npx pnpm`

---

## Preamble: Running things

- **Tests:** `cd frontend && npx pnpm test` (vitest run — all tests)
- **Single test file:** `cd frontend && npx pnpm test src/components/applications/__tests__/source-combobox.test.tsx`
- **Type check:** `cd frontend && npx pnpm run type`
- **Lint:** `cd frontend && npx pnpm run lint`
- **DB reset (applies all migrations):** `cd frontend && npx pnpm run db:reset`
- **Regenerate Supabase types:** `cd frontend && npx pnpm run db:types`
- **Start edge functions locally:** `supabase functions serve`
- **Test file pattern:** import from `@/test/test-utils`, use `describe/it/expect/vi` from vitest

---

## Task 1: Fix SourceCombobox — separate search state from selected value

**Problem:** `CommandInput value={value}` uses the selected source (e.g. `"linkedin"`) as the live cmdk filter. When a value is set, the list collapses to only matching items and the user can't scroll other options.

**Files:**
- Modify: `frontend/src/components/applications/source-combobox.tsx`
- Modify: `frontend/src/components/applications/__tests__/source-combobox.test.tsx`

---

**Step 1: Add a test that exposes the bug**

In `source-combobox.test.tsx`, add:

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@/test/test-utils";
import { SourceCombobox } from "../source-combobox";

describe("SourceCombobox", () => {
  it("renders with placeholder when no value", () => {
    render(<SourceCombobox value="" onChange={vi.fn()} />);
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("displays selected value", () => {
    render(<SourceCombobox value="linkedin" onChange={vi.fn()} />);
    expect(screen.getByText("linkedin")).toBeInTheDocument();
  });

  it("shows all options when opened even when a value is selected", async () => {
    render(<SourceCombobox value="linkedin" onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole("combobox"));
    // Should show other options, not just linkedin
    expect(screen.getByText("indeed")).toBeInTheDocument();
  });

  it("calls onChange with custom value when user types and confirms", async () => {
    const onChange = vi.fn();
    render(<SourceCombobox value="" onChange={onChange} />);
    fireEvent.click(screen.getByRole("combobox"));
    const input = screen.getByPlaceholderText("Search or type source...");
    fireEvent.change(input, { target: { value: "custom-board" } });
    // CommandEmpty "Use custom-board" button
    fireEvent.click(screen.getByText(/Use "custom-board"/));
    expect(onChange).toHaveBeenCalledWith("custom-board");
  });
});
```

**Step 2: Run the test — confirm "shows all options" fails**

```bash
cd frontend && npx pnpm test src/components/applications/__tests__/source-combobox.test.tsx
```
Expected: FAIL on "shows all options when opened even when a value is selected"

**Step 3: Fix source-combobox.tsx**

Replace the entire file:

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

const SOURCE_OPTIONS = [
  "blind",
  "builtin",
  "dice",
  "github",
  "glassdoor",
  "google jobs",
  "google search",
  "indeed",
  "levels",
  "linkedin",
  "monster",
  "other",
  "referral",
  "theirstack",
  "welcome to the jungle",
  "wellfound",
  "workatastartup",
  "ziprecruiter",
];

interface SourceComboboxProps {
  value: string;
  onChange: (value: string) => void;
}

export function SourceCombobox({ value, onChange }: SourceComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = SOURCE_OPTIONS.filter((opt) =>
    opt.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setSearch("");
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className="truncate">{value || "Select or type source..."}</span>
          <ChevronsUpDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search or type source..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList className="max-h-[300px] overflow-y-auto">
            <CommandEmpty>
              <button
                type="button"
                className="px-3 py-2 text-sm w-full text-left hover:bg-accent"
                onClick={() => {
                  onChange(search);
                  setSearch("");
                  setOpen(false);
                }}
              >
                Use &ldquo;{search}&rdquo;
              </button>
            </CommandEmpty>
            <CommandGroup>
              {filtered.map((option) => (
                <CommandItem
                  key={option}
                  value={option}
                  onSelect={(val) => {
                    onChange(val);
                    setSearch("");
                    setOpen(false);
                  }}
                >
                  <CheckIcon
                    className={cn("mr-2 size-4", value === option ? "opacity-100" : "opacity-0")}
                  />
                  {option}
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

**Step 4: Run tests — all pass**

```bash
cd frontend && npx pnpm test src/components/applications/__tests__/source-combobox.test.tsx
```
Expected: 4 PASS

**Step 5: Commit**

```bash
git add frontend/src/components/applications/source-combobox.tsx \
        frontend/src/components/applications/__tests__/source-combobox.test.tsx
git commit -m "fix(source-combobox): separate search state from selected value, fix scroll"
```

---

## Task 2: Fix IndustryCombobox and CityCombobox scroll

**Problem:** `CommandList` doesn't have an explicit max-height/overflow in the component — the shadcn default class can be blocked by the parent popover container. Add `className="max-h-[300px] overflow-y-auto"` to `CommandList` in both components.

**Files:**
- Modify: `frontend/src/components/companies/industry-combobox.tsx`
- Modify: `frontend/src/components/applications/city-combobox.tsx`

---

**Step 1: Fix IndustryCombobox**

In `industry-combobox.tsx`, find the `<CommandList>` opening tag and change it to:

```tsx
<CommandList className="max-h-[300px] overflow-y-auto">
```

**Step 2: Fix CityCombobox**

In `city-combobox.tsx`, find the `<CommandList>` opening tag and change it to:

```tsx
<CommandList className="max-h-[300px] overflow-y-auto">
```

**Step 3: Run all tests**

```bash
cd frontend && npx pnpm test
```
Expected: all pass (no behavior change, only CSS)

**Step 4: Commit**

```bash
git add frontend/src/components/companies/industry-combobox.tsx \
        frontend/src/components/applications/city-combobox.tsx
git commit -m "fix(comboboxes): add explicit max-h and overflow to CommandList for scrolling"
```

---

## Task 3: Supabase Edge Function — fetch-job-url

**Purpose:** Proxy Browserless `/content` API server-side. Keeps `BROWSERLESS_API_KEY` out of the browser. Returns raw HTML for a given URL.

**Files:**
- Create: `supabase/functions/fetch-job-url/index.ts`

---

**Step 1: Create the edge function**

```ts
// supabase/functions/fetch-job-url/index.ts
const BROWSERLESS_API_KEY = Deno.env.get("BROWSERLESS_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!BROWSERLESS_API_KEY) {
      return new Response(
        JSON.stringify({ error: "BROWSERLESS_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return new Response(
        JSON.stringify({ error: "url is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid URL" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const response = await fetch(
      `https://chrome.browserless.io/content?token=${BROWSERLESS_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      },
    );

    if (!response.ok) {
      const text = await response.text();
      return new Response(
        JSON.stringify({ error: `Browserless error: ${response.status}`, detail: text }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const html = await response.text();

    return new Response(
      JSON.stringify({ html }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
```

**Step 2: Add BROWSERLESS_API_KEY to local supabase env**

Create or update `supabase/.env` (this file is gitignored):

```bash
# Check if supabase/.env exists
cat supabase/.env 2>/dev/null || echo "creating"
```

Add to `supabase/.env`:
```
BROWSERLESS_API_KEY=your-key-from-frontend-.env.local
```

> The key is already in `frontend/.env.local` — copy the value from there.

**Step 3: Serve the function locally and smoke-test**

```bash
# In one terminal
supabase functions serve fetch-job-url --env-file supabase/.env

# In another terminal — test with curl
curl -X POST http://localhost:54321/functions/v1/fetch-job-url \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```
Expected: `{"html": "<!doctype html>..."}` or a Browserless error if the key is invalid.

**Step 4: Commit**

```bash
git add supabase/functions/fetch-job-url/index.ts
git commit -m "feat(edge-fn): add fetch-job-url edge function using Browserless /content"
```

---

## Task 4: Update frontend to call the edge function

**Files:**
- Modify: `frontend/src/lib/url-import.ts`

---

**Step 1: Replace the fetch block in `fetchJobFromUrl`**

Find the `try` block that starts with `// Try fetching directly first` (lines ~522–561). Replace the entire inner try/catch/proxy chain with a single edge function call:

```ts
import { createClient } from "@/lib/supabase/client";

// Inside fetchJobFromUrl, replace the html fetch block:
const supabase = createClient();
const { data, error: fnError } = await supabase.functions.invoke("fetch-job-url", {
  body: { url },
});
if (fnError || !data?.html) {
  throw fnError ?? new Error("fetch-job-url returned no HTML");
}
const html: string = data.html;
```

The `createClient` import should be added at the top of `url-import.ts` alongside existing imports.

Remove the old `proxyUrls` array and the direct fetch attempt entirely. The rest of the function (pattern matching, extraction, post-processing) is unchanged.

**Step 2: Run existing url-import tests**

```bash
cd frontend && npx pnpm test src/lib/__tests__/url-import.test.ts 2>/dev/null || \
  npx pnpm test --reporter=verbose 2>&1 | grep -E "(url-import|PASS|FAIL)"
```

> If there are no url-import unit tests (the fetch is mocked in tests or there are none), just run `npx pnpm test` and confirm nothing is broken.

**Step 3: Type check**

```bash
cd frontend && npx pnpm run type
```
Expected: no errors

**Step 4: Commit**

```bash
git add frontend/src/lib/url-import.ts
git commit -m "feat(url-import): replace CORS proxy chain with Browserless edge function"
```

---

## Task 5: jsonLD-first extraction + HTML-to-markdown for description

**Files:**
- Modify: `frontend/src/lib/url-import.ts`
- Install: `turndown` + `@types/turndown`

---

**Step 1: Install turndown**

```bash
cd frontend && npx pnpm add turndown && npx pnpm add -D @types/turndown
```

**Step 2: Refactor `extractFromMetaTags` — jsonLD first, description as markdown**

The function currently tries OG/meta first, then jsonLD at the bottom. Invert this.

Replace the `extractFromMetaTags` function body. The new structure:

```ts
import TurndownService from "turndown";

const turndown = new TurndownService({ headingStyle: "atx", bulletListMarker: "-" });

function extractFromMetaTags(html: string): Partial<ExtractedJobData> {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const data: Partial<ExtractedJobData> = {};

  // --- 1. JSON-LD (highest priority) ---
  const jsonLdScripts = doc.querySelectorAll('script[type="application/ld+json"]');
  for (const script of jsonLdScripts) {
    try {
      const jsonData = JSON.parse(script.textContent || "");
      const jobPosting = Array.isArray(jsonData)
        ? jsonData.find((item) => item["@type"] === "JobPosting")
        : jsonData["@type"] === "JobPosting"
          ? jsonData
          : null;

      if (jobPosting) {
        data.position = jobPosting.title;
        data.companyName = jobPosting.hiringOrganization?.name;

        // jobLocation can be a single object or an array
        const jobLocations = Array.isArray(jobPosting.jobLocation)
          ? jobPosting.jobLocation
          : jobPosting.jobLocation
            ? [jobPosting.jobLocation]
            : [];
        const locationStrings = jobLocations
          .map(
            (loc: { address?: { addressLocality?: string; addressRegion?: string } }) =>
              [loc.address?.addressLocality, loc.address?.addressRegion]
                .filter(Boolean)
                .join(", "),
          )
          .filter(Boolean);
        if (locationStrings.length > 0) {
          data.locations = locationStrings;
        }

        // Description: convert HTML to markdown
        if (jobPosting.description) {
          data.jobDescription = turndown.turndown(jobPosting.description);
        }

        if (jobPosting.baseSalary) {
          const salary = jobPosting.baseSalary;
          data.salaryCurrency = salary.currency;
          if (salary.value) {
            if (typeof salary.value === "object") {
              data.salaryMin = salary.value.minValue;
              data.salaryMax = salary.value.maxValue;
            } else {
              data.salaryMin = salary.value;
              data.salaryMax = salary.value;
            }
          }
        }

        if (jobPosting.employmentType) {
          const empType = Array.isArray(jobPosting.employmentType)
            ? jobPosting.employmentType[0]
            : jobPosting.employmentType;
          data.employmentType = detectEmploymentType(empType);
        }

        if (jobPosting.jobLocationType === "TELECOMMUTE") {
          data.workType = "remote";
        }

        // If we got the key fields from JSON-LD, return early
        if (data.position && data.companyName) {
          return data;
        }
      }
    } catch {
      // Invalid JSON, continue
    }
  }

  // --- 2. Open Graph / meta tags (fallback) ---
  const metaSelectors = {
    position: [
      'meta[property="og:title"]',
      'meta[name="twitter:title"]',
      'meta[name="title"]',
    ],
    companyName: ['meta[property="og:site_name"]', 'meta[name="author"]'],
    jobDescription: [
      'meta[property="og:description"]',
      'meta[name="description"]',
      'meta[name="twitter:description"]',
    ],
  };

  for (const [field, selectors] of Object.entries(metaSelectors)) {
    if ((data as Record<string, unknown>)[field]) continue; // already set by JSON-LD
    for (const selector of selectors) {
      const meta = doc.querySelector(selector);
      const content = meta?.getAttribute("content")?.trim();
      if (content) {
        (data as Record<string, unknown>)[field] = content;
        break;
      }
    }
  }

  // Split combined "Job Title | Company" patterns (OG fallback only)
  if (data.position && !data.companyName) {
    const combinedPatterns = [
      /^(.+?)\s*\|\s*(.+?)$/,
      /^(.+?)\s+at\s+(.+?)$/i,
      /^(.+?)\s*[-–—]\s*(.+?)$/,
    ];
    for (const pattern of combinedPatterns) {
      const match = data.position.match(pattern);
      if (match) {
        const cleanTitle = match[1].trim();
        const cleanCompany = match[2].trim();
        if (cleanTitle.length > 2 && cleanCompany.length > 1) {
          data.position = cleanTitle;
          data.companyName = cleanCompany;
          break;
        }
      }
    }
  }

  // Clean "in United States" from title (OG fallback)
  if (data.position) {
    const locationInTitle = data.position.match(/^(.+?)\s+in\s+([\w\s]+?)$/i);
    if (locationInTitle) {
      const locationIndicators = [
        "united states", "usa", "uk", "canada", "remote",
        "california", "new york", "texas", "florida",
      ];
      if (locationIndicators.some((loc) => locationInTitle[2].toLowerCase().includes(loc))) {
        data.position = locationInTitle[1].trim();
        if (!data.locations?.length) {
          data.locations = [locationInTitle[2].trim()];
        }
      }
    }
  }

  // Page title as last resort
  if (!data.position) {
    const title = doc.querySelector("title")?.textContent?.trim();
    if (title) {
      const match = title.match(/^(.+?)\s*(?:at|@|-|–|—|\|)\s*(.+?)(?:\s*[-|]|$)/);
      if (match) {
        data.position = match[1].trim();
        if (!data.companyName) data.companyName = match[2].trim();
      } else {
        data.position = title;
      }
    }
  }

  return data;
}
```

**Also update `ExtractedJobData` interface** — change `location?: string` to `locations?: string[]`:

```ts
export interface ExtractedJobData {
  position?: string;
  companyName?: string;
  locations?: string[];        // was: location?: string
  workType?: "remote" | "hybrid" | "onsite";
  employmentType?: "full-time" | "part-time" | "contract" | "internship";
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  jobDescription?: string;
  jobUrl: string;
  source?: string;
}
```

**Update all references to `result.location` in `fetchJobFromUrl`** — change to `result.locations` (it's an array now). Search for `result.location` and `data.location` throughout the function and update accordingly. The pattern-based location extraction at the bottom of `fetchJobFromUrl` (lines ~654–675) should push to `result.locations = [location]` instead of `result.location = location`.

**Step 3: Run tests**

```bash
cd frontend && npx pnpm test
```

**Step 4: Type check**

```bash
cd frontend && npx pnpm run type
```

Fix any type errors before continuing.

**Step 5: Commit**

```bash
git add frontend/src/lib/url-import.ts frontend/package.json frontend/pnpm-lock.yaml
git commit -m "feat(url-import): jsonLD-first extraction, HTML-to-markdown description, locations array"
```

---

## Task 6: Auto-create company when FullApplicationForm opens with importData

**Problem:** After URL import, `company_name` is pre-filled but `company_id` is empty. The user must manually open the dropdown and click "Create". We fix this by auto-creating the company in a `useEffect` when `importData.companyName` is set.

**Files:**
- Modify: `frontend/src/components/applications/full-application-form.tsx`
- Modify: `frontend/src/components/applications/__tests__/full-application-form.test.tsx`

---

**Step 1: Read the existing full-application-form test to understand mock patterns**

```bash
cat frontend/src/components/applications/__tests__/full-application-form.test.tsx
```

**Step 2: Add a failing test for auto-company-creation**

In `full-application-form.test.tsx`, add a test that opens the form with `importData` containing a `companyName` and verifies the company combobox shows the resolved company. Look at how existing tests mock `useCreateCompany` — replicate that pattern.

The test should assert that after the form opens with `importData.companyName = "Acme Corp"`, the company combobox trigger shows "Acme Corp" (not "Select company...").

```tsx
it("auto-creates company when opened with importData.companyName", async () => {
  // Mock useCreateCompany to return a fake company
  // (follow existing test patterns for mocking mutations)
  const importData = {
    jobUrl: "https://example.com/job",
    companyName: "Acme Corp",
    position: "Software Engineer",
  };
  render(<FullApplicationForm open importData={importData} onOpenChange={vi.fn()} />);
  // Company should be auto-resolved — not showing "Select company..."
  await waitFor(() => {
    expect(screen.queryByText("Select company...")).not.toBeInTheDocument();
  });
});
```

**Step 3: Run tests — confirm the new test fails**

```bash
cd frontend && npx pnpm test src/components/applications/__tests__/full-application-form.test.tsx
```

**Step 4: Add the auto-create useEffect to FullApplicationForm**

In `full-application-form.tsx`, after the existing `useEffect` that resets the form on open, add:

```tsx
// Auto-create company when form opens with importData.companyName
useEffect(() => {
  if (!open || !importData?.companyName) return;

  let cancelled = false;

  async function autoCreate() {
    try {
      const result = await createCompany.mutateAsync({ name: importData!.companyName! });
      if (!cancelled) {
        setValue("company_id", result.id, { shouldValidate: true });
        setValue("company_name", result.name);
      }
    } catch {
      // Company may already exist — search for it instead.
      // The user can still manually select/create via the combobox.
    }
  }

  autoCreate();
  return () => { cancelled = true; };
}, [open, importData?.companyName]); // eslint-disable-line react-hooks/exhaustive-deps
```

> Note: `useCreateCompany` already exists as `const createCompany = useCreateCompany()` at the top of the component — reuse it here.

**Step 5: Run tests**

```bash
cd frontend && npx pnpm test src/components/applications/__tests__/full-application-form.test.tsx
```

**Step 6: Commit**

```bash
git add frontend/src/components/applications/full-application-form.tsx \
        frontend/src/components/applications/__tests__/full-application-form.test.tsx
git commit -m "fix(url-import): auto-create company when form opens with importData.companyName"
```

---

## Task 7: DB migration — location → locations

**Files:**
- Create: `supabase/migrations/20260228180000_application_locations.sql`

---

**Step 1: Write the migration**

```sql
-- supabase/migrations/20260228180000_application_locations.sql

-- Add the new array column
ALTER TABLE applications ADD COLUMN locations TEXT[] NOT NULL DEFAULT '{}';

-- Migrate existing single-location strings into the first array element
UPDATE applications
SET locations = ARRAY[location]
WHERE location IS NOT NULL AND location != '';

-- Drop the old column
ALTER TABLE applications DROP COLUMN location;
```

**Step 2: Apply the migration locally**

```bash
cd frontend && npx pnpm run db:reset
```
Expected: Supabase resets and applies all migrations including the new one. If it errors, check SQL syntax.

**Step 3: Regenerate TypeScript types**

```bash
cd frontend && npx pnpm run db:types
```

This updates `frontend/src/lib/supabase/types.ts`. After running, verify that `applications` table type no longer has `location` and now has `locations: string[]`.

**Step 4: Commit**

```bash
git add supabase/migrations/20260228180000_application_locations.sql \
        frontend/src/lib/supabase/types.ts
git commit -m "feat(db): migrate applications.location varchar to locations text[]"
```

---

## Task 8: Update queries/applications.ts for locations

The generated types now use `locations: string[]`. The query file has a hardcoded `location.ilike` in the search filter — update it.

**Files:**
- Modify: `frontend/src/lib/queries/applications.ts`

---

**Step 1: Update the search filter**

Find:
```ts
query = query.or(`position.ilike.%${search}%,location.ilike.%${search}%`);
```

Replace with (array contains search via `cs` — Postgres text[] contains):
```ts
query = query.ilike("position", `%${search}%`);
```

> Location search via text[] requires different syntax (`cs` for contains or a raw filter). For now, remove location from the text search. If location search is needed later, it can be added as a separate filter. YAGNI.

**Step 2: Update `formValuesToPayload` in full-application-form.tsx**

The form's `formValuesToPayload` currently maps `location: values.location || null`. Update to:
```ts
locations: values.locations ?? [],
```

**Step 3: Type check — fix all remaining type errors**

```bash
cd frontend && npx pnpm run type
```

Work through any `location` → `locations` type errors. Common locations:
- `application-table.tsx` — displays `application.location`
- `application-detail.tsx` — displays `application.location`
- `application-form.tsx` (the original simple form) — check if it has a location field

**Step 4: Run all tests**

```bash
cd frontend && npx pnpm test
```

Fix any test failures from type changes before continuing.

**Step 5: Commit**

```bash
git add frontend/src/lib/queries/applications.ts \
        frontend/src/components/applications/full-application-form.tsx
git commit -m "fix(queries): update applications query for locations text[] column"
```

---

## Task 9: Create CityMultiCombobox component

**Purpose:** Multi-value version of CityCombobox. User picks cities from the list; each selection becomes a removable badge-pill. Values are stored as `string[]`.

**Files:**
- Create: `frontend/src/components/applications/city-multi-combobox.tsx`
- Create: `frontend/src/components/applications/__tests__/city-multi-combobox.test.tsx`

---

**Step 1: Write the failing test**

```tsx
// city-multi-combobox.test.tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@/test/test-utils";
import { CityMultiCombobox } from "../city-multi-combobox";

describe("CityMultiCombobox", () => {
  it("renders with placeholder when empty", () => {
    render(<CityMultiCombobox value={[]} onChange={vi.fn()} />);
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("displays selected values as badges", () => {
    render(<CityMultiCombobox value={["New York, NY", "Austin, TX"]} onChange={vi.fn()} />);
    expect(screen.getByText("New York, NY")).toBeInTheDocument();
    expect(screen.getByText("Austin, TX")).toBeInTheDocument();
  });

  it("calls onChange with new array when a city is removed", () => {
    const onChange = vi.fn();
    render(<CityMultiCombobox value={["New York, NY", "Austin, TX"]} onChange={onChange} />);
    // Each badge has an ×/remove button — click the first one
    const removeButtons = screen.getAllByRole("button", { name: /remove/i });
    fireEvent.click(removeButtons[0]);
    expect(onChange).toHaveBeenCalledWith(["Austin, TX"]);
  });
});
```

**Step 2: Run test — confirm FAIL**

```bash
cd frontend && npx pnpm test src/components/applications/__tests__/city-multi-combobox.test.tsx
```

**Step 3: Implement CityMultiCombobox**

```tsx
// city-multi-combobox.tsx
import { CheckIcon, ChevronsUpDownIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
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
import cities from "@/data/major-us-cities.json";
import { cn } from "@/lib/utils";

interface CityMultiComboboxProps {
  value: string[];
  onChange: (value: string[]) => void;
}

export function CityMultiCombobox({ value, onChange }: CityMultiComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = (cities as string[])
    .filter((c) => c.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 50);

  function handleSelect(city: string) {
    if (value.includes(city)) {
      onChange(value.filter((v) => v !== city));
    } else {
      onChange([...value, city]);
    }
    setSearch("");
  }

  function handleRemove(city: string) {
    onChange(value.filter((v) => v !== city));
  }

  function handleCustom() {
    if (search && !value.includes(search)) {
      onChange([...value, search]);
    }
    setSearch("");
    setOpen(false);
  }

  return (
    <div className="space-y-2">
      <Popover
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) setSearch("");
        }}
      >
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            <span className="truncate text-muted-foreground">
              {value.length === 0 ? "Add location..." : `${value.length} location${value.length > 1 ? "s" : ""}`}
            </span>
            <ChevronsUpDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search city..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList className="max-h-[300px] overflow-y-auto">
              <CommandEmpty>
                {search ? (
                  <button
                    type="button"
                    className="px-3 py-2 text-sm w-full text-left hover:bg-accent"
                    onClick={handleCustom}
                  >
                    Add &ldquo;{search}&rdquo;
                  </button>
                ) : (
                  <span className="px-3 py-2 text-sm text-muted-foreground">
                    Type to search cities
                  </span>
                )}
              </CommandEmpty>
              <CommandGroup>
                {filtered.map((city) => (
                  <CommandItem
                    key={city}
                    value={city}
                    onSelect={() => handleSelect(city)}
                  >
                    <CheckIcon
                      className={cn(
                        "mr-2 size-4",
                        value.includes(city) ? "opacity-100" : "opacity-0",
                      )}
                    />
                    {city}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {value.map((city) => (
            <Badge key={city} variant="secondary" className="gap-1 pr-1">
              {city}
              <button
                type="button"
                aria-label={`Remove ${city}`}
                onClick={() => handleRemove(city)}
                className="ml-1 rounded-full hover:bg-muted"
              >
                <XIcon className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
```

**Step 4: Run tests — all pass**

```bash
cd frontend && npx pnpm test src/components/applications/__tests__/city-multi-combobox.test.tsx
```

**Step 5: Commit**

```bash
git add frontend/src/components/applications/city-multi-combobox.tsx \
        frontend/src/components/applications/__tests__/city-multi-combobox.test.tsx
git commit -m "feat(city-multi-combobox): add multi-value city selection component"
```

---

## Task 10: Wire CityMultiCombobox into FullApplicationForm

**Files:**
- Modify: `frontend/src/components/applications/full-application-form.tsx`

---

**Step 1: Update the schema**

Find:
```ts
location: z.string().default(""),
```
Replace with:
```ts
locations: z.array(z.string()).default([]),
```

**Step 2: Update defaultValues and reset block**

In `defaultValues` and the `reset({...})` call inside the `useEffect`, change:
```ts
location: "",
```
to:
```ts
locations: importData?.locations ?? [],
```

**Step 3: Replace CityCombobox with CityMultiCombobox in the JSX**

Find the Location grid cell:
```tsx
<CityCombobox
  value={watch("location") ?? ""}
  onChange={(v) => setValue("location", v)}
/>
```
Replace with:
```tsx
<CityMultiCombobox
  value={watch("locations") ?? []}
  onChange={(v) => setValue("locations", v)}
/>
```

Update the import at the top: remove `CityCombobox` import (or keep if used elsewhere), add:
```ts
import { CityMultiCombobox } from "./city-multi-combobox";
```

**Step 4: Run all tests + type check**

```bash
cd frontend && npx pnpm test && npx pnpm run type
```

Fix any remaining issues.

**Step 5: Commit**

```bash
git add frontend/src/components/applications/full-application-form.tsx
git commit -m "feat(full-application-form): use CityMultiCombobox for locations array field"
```

---

## Task 11: Update ApplicationDetail to display locations[]

**Files:**
- Modify: `frontend/src/components/applications/application-detail.tsx`

---

**Step 1: Find the location display**

Search for `application.location` in `application-detail.tsx`. It will be somewhere in the details grid. It currently renders a single string.

**Step 2: Update to render a badge list**

Replace the single location display with:

```tsx
{/* Location */}
{(application.locations?.length ?? 0) > 0 ? (
  <div className="flex flex-wrap gap-1">
    {(application.locations as string[]).map((loc) => (
      <Badge key={loc} variant="outline" className="text-xs font-normal">
        {loc}
      </Badge>
    ))}
  </div>
) : (
  <span className="text-muted-foreground">--</span>
)}
```

**Step 3: Run all tests**

```bash
cd frontend && npx pnpm test
```

**Step 4: Commit**

```bash
git add frontend/src/components/applications/application-detail.tsx
git commit -m "feat(application-detail): display locations as badge list"
```

---

## Task 12: Update ApplicationTable for locations[]

**Files:**
- Modify: `frontend/src/components/applications/application-table.tsx`

---

**Step 1: Find the location column cell**

Search for `application.location` or a location column in `application-table.tsx`.

**Step 2: Update to join locations array**

Replace any single `application.location` render with:

```tsx
{(application.locations as string[])?.join(", ") || "--"}
```

**Step 3: Run all tests + type check**

```bash
cd frontend && npx pnpm test && npx pnpm run type
```

**Step 4: Final lint pass**

```bash
cd frontend && npx pnpm run lint
```

**Step 5: Commit**

```bash
git add frontend/src/components/applications/application-table.tsx
git commit -m "feat(application-table): display locations array joined as string"
```

---

## Done

After Task 12 passes, run the full suite one final time:

```bash
cd frontend && npx pnpm test && npx pnpm run type && npx pnpm run lint:check
```

All green = iteration complete. Use `superpowers:finishing-a-development-branch` to decide on merge strategy.
