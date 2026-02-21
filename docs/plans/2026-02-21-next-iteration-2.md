# Next Iteration 2 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Deliver the complete set of UI/UX improvements from `docs/next-iteration.md`: two new reusable UI components, application form polish, a full company form restructure, and interview dialog fixes — backed by two DB migrations.

**Architecture:** All changes are frontend-first (React/TypeScript in `frontend/src/`). Two small Supabase SQL migrations land first. New shared components live in `frontend/src/components/ui/`. Domain components (`company-form.tsx`, `full-application-form.tsx`, `schedule-dialog.tsx`) are edited in-place following the existing controlled-component and react-hook-form `Controller` patterns.

**Tech Stack:** React 19, TypeScript, react-hook-form, Zod, TanStack Query, Tailwind CSS, Radix UI, shadcn/ui, Lucide React, Vitest + Testing Library, Supabase (Postgres)

---

## Running Tests

```bash
bun run --cwd frontend test --run
# or to run a single file:
bun run --cwd frontend test --run src/components/ui/__tests__/url-input.test.tsx
```

---

## Task 1: DB Migration — `applied_at` Default

**Files:**
- Create: `supabase/migrations/20260221140000_applied_at_default.sql`

**Step 1: Create the migration file**

```sql
-- Set applied_at default to current UTC timestamp
ALTER TABLE applications
  ALTER COLUMN applied_at SET DEFAULT (now() AT TIME ZONE 'utc');
```

**Step 2: Apply locally (if running Supabase locally)**

```bash
supabase db reset
# or just apply to local dev:
supabase migration up
```

**Step 3: Commit**

```bash
git add supabase/migrations/20260221140000_applied_at_default.sql
git commit -m "feat: set applied_at default to current utc timestamp"
```

---

## Task 2: DB Migration — `events.notes` Column

**Files:**
- Create: `supabase/migrations/20260221140001_events_notes.sql`

**Step 1: Create the migration file**

```sql
-- Add notes column to events table
ALTER TABLE events
  ADD COLUMN notes text NOT NULL DEFAULT '';
```

**Step 2: Apply locally**

```bash
supabase migration up
```

**Step 3: Commit**

```bash
git add supabase/migrations/20260221140001_events_notes.sql
git commit -m "feat: add notes column to events table"
```

---

## Task 3: New Component — `UrlInput`

**Files:**
- Create: `frontend/src/components/ui/url-input.tsx`
- Create: `frontend/src/components/ui/__tests__/url-input.test.tsx`

**Step 1: Write the failing tests**

```tsx
// frontend/src/components/ui/__tests__/url-input.test.tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@/test/test-utils";
import { UrlInput } from "../url-input";

describe("UrlInput", () => {
  it("renders an input", () => {
    render(<UrlInput value="" onChange={vi.fn()} />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("calls onChange when typing", () => {
    const onChange = vi.fn();
    render(<UrlInput value="" onChange={onChange} />);
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "https://example.com" },
    });
    expect(onChange).toHaveBeenCalledWith("https://example.com");
  });

  it("shows no error for valid URL on blur", () => {
    render(<UrlInput value="https://example.com" onChange={vi.fn()} />);
    fireEvent.blur(screen.getByRole("textbox"));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows error for invalid URL on blur when validate=true", () => {
    render(<UrlInput value="not-a-url" onChange={vi.fn()} validate />);
    fireEvent.blur(screen.getByRole("textbox"));
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("allows blank when allowBlank=true (default)", () => {
    render(<UrlInput value="" onChange={vi.fn()} validate />);
    fireEvent.blur(screen.getByRole("textbox"));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("rejects blank when allowBlank=false", () => {
    render(<UrlInput value="" onChange={vi.fn()} validate allowBlank={false} />);
    fireEvent.blur(screen.getByRole("textbox"));
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("shows external error prop", () => {
    render(<UrlInput value="" onChange={vi.fn()} error="Required" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Required");
  });

  it("strips whitespace before validating", () => {
    render(<UrlInput value="  https://example.com  " onChange={vi.fn()} validate />);
    fireEvent.blur(screen.getByRole("textbox"));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
```

**Step 2: Run tests — expect failure**

```bash
bun run --cwd frontend test --run src/components/ui/__tests__/url-input.test.tsx
```

Expected: FAIL — `UrlInput` not found.

**Step 3: Implement `UrlInput`**

```tsx
// frontend/src/components/ui/url-input.tsx
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface UrlInputProps {
  value: string;
  onChange: (value: string) => void;
  validate?: boolean;
  allowBlank?: boolean;
  id?: string;
  placeholder?: string;
  className?: string;
  error?: string;
}

function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export function UrlInput({
  value,
  onChange,
  validate = true,
  allowBlank = true,
  id,
  placeholder = "https://...",
  className,
  error: externalError,
}: UrlInputProps) {
  const [localError, setLocalError] = useState<string | null>(null);

  const handleBlur = () => {
    if (!validate) {
      setLocalError(null);
      return;
    }
    const trimmed = value.trim();
    if (trimmed === "") {
      setLocalError(allowBlank ? null : "URL is required");
    } else if (!isValidUrl(trimmed)) {
      setLocalError("Must be a valid URL (e.g. https://example.com)");
    } else {
      setLocalError(null);
    }
  };

  const displayError = externalError ?? localError;

  return (
    <div className="space-y-1">
      <Input
        id={id}
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={cn(displayError && "border-destructive", className)}
        aria-invalid={!!displayError}
        aria-describedby={displayError ? `${id}-error` : undefined}
      />
      {displayError && (
        <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
          {displayError}
        </p>
      )}
    </div>
  );
}
```

**Step 4: Run tests — expect pass**

```bash
bun run --cwd frontend test --run src/components/ui/__tests__/url-input.test.tsx
```

Expected: All 8 tests PASS.

**Step 5: Commit**

```bash
git add frontend/src/components/ui/url-input.tsx \
        frontend/src/components/ui/__tests__/url-input.test.tsx
git commit -m "feat: add UrlInput component with blur validation"
```

---

## Task 4: New Component — `StarRating`

**Files:**
- Create: `frontend/src/components/ui/star-rating.tsx`
- Create: `frontend/src/components/ui/__tests__/star-rating.test.tsx`

**Step 1: Write the failing tests**

```tsx
// frontend/src/components/ui/__tests__/star-rating.test.tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@/test/test-utils";
import { StarRating } from "../star-rating";

describe("StarRating", () => {
  it("renders 5 star buttons", () => {
    render(<StarRating value={null} onChange={vi.fn()} />);
    expect(screen.getAllByRole("button")).toHaveLength(5);
  });

  it("calls onChange with star number when clicked", () => {
    const onChange = vi.fn();
    render(<StarRating value={null} onChange={onChange} />);
    fireEvent.click(screen.getAllByRole("button")[2]); // 3rd star = value 3
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it("clears rating when the current star is clicked again", () => {
    const onChange = vi.fn();
    render(<StarRating value={3} onChange={onChange} />);
    fireEvent.click(screen.getAllByRole("button")[2]); // click star 3 again
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("renders with accessible label via aria-label on container", () => {
    render(<StarRating value={4} onChange={vi.fn()} aria-label="Overall rating" />);
    expect(screen.getByRole("group", { name: "Overall rating" })).toBeInTheDocument();
  });
});
```

**Step 2: Run tests — expect failure**

```bash
bun run --cwd frontend test --run src/components/ui/__tests__/star-rating.test.tsx
```

Expected: FAIL — `StarRating` not found.

**Step 3: Implement `StarRating`**

```tsx
// frontend/src/components/ui/star-rating.tsx
import { StarIcon } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number | null;
  onChange: (value: number | null) => void;
  "aria-label"?: string;
  className?: string;
}

export function StarRating({ value, onChange, "aria-label": ariaLabel, className }: StarRatingProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  const active = hovered ?? value ?? 0;

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn("flex items-center gap-1", className)}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          aria-label={`${star} star${star !== 1 ? "s" : ""}`}
          onClick={() => onChange(value === star ? null : star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(null)}
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
        >
          <StarIcon
            className={cn(
              "size-5 transition-colors",
              star <= active
                ? "fill-yellow-400 text-yellow-400"
                : "fill-none text-muted-foreground",
            )}
          />
        </button>
      ))}
    </div>
  );
}
```

**Step 4: Run tests — expect pass**

```bash
bun run --cwd frontend test --run src/components/ui/__tests__/star-rating.test.tsx
```

Expected: All 4 tests PASS.

**Step 5: Commit**

```bash
git add frontend/src/components/ui/star-rating.tsx \
        frontend/src/components/ui/__tests__/star-rating.test.tsx
git commit -m "feat: add StarRating component with hover preview and toggle-clear"
```

---

## Task 5: Fix `DurationCombobox`

**Files:**
- Modify: `frontend/src/components/interviews/duration-combobox.tsx`
- Modify: `frontend/src/components/interviews/__tests__/duration-combobox.test.tsx`

**Step 1: Read the test file to understand current coverage**

```bash
cat frontend/src/components/interviews/__tests__/duration-combobox.test.tsx
```

**Step 2: Add failing tests for the fixes**

Open `frontend/src/components/interviews/__tests__/duration-combobox.test.tsx` and add:

```tsx
it("has correct value for 20 min option (not 15)", () => {
  const onChange = vi.fn();
  render(<DurationCombobox value={undefined} onChange={onChange} />);
  // Open the combobox
  fireEvent.click(screen.getByRole("combobox"));
  // The "20 min" item should be present
  expect(screen.getByText("20 min")).toBeInTheDocument();
});

it("shows 'Use N min' option when typing a valid non-preset number", async () => {
  render(<DurationCombobox value={undefined} onChange={vi.fn()} />);
  fireEvent.click(screen.getByRole("combobox"));
  const input = screen.getByPlaceholderText(/minutes/i);
  fireEvent.change(input, { target: { value: "90" } });
  // 90 is a preset — no custom item
  expect(screen.queryByText(/use 90 min/i)).not.toBeInTheDocument();
  // Now try a non-preset
  fireEvent.change(input, { target: { value: "77" } });
  expect(screen.getByText(/use 77 min/i)).toBeInTheDocument();
});

it("selecting 'Use N min' calls onChange with parsed number", () => {
  const onChange = vi.fn();
  render(<DurationCombobox value={undefined} onChange={onChange} />);
  fireEvent.click(screen.getByRole("combobox"));
  const input = screen.getByPlaceholderText(/minutes/i);
  fireEvent.change(input, { target: { value: "77" } });
  fireEvent.click(screen.getByText(/use 77 min/i));
  expect(onChange).toHaveBeenCalledWith(77);
});
```

**Step 3: Run tests — expect failures**

```bash
bun run --cwd frontend test --run src/components/interviews/__tests__/duration-combobox.test.tsx
```

**Step 4: Implement the fixes in `duration-combobox.tsx`**

Two changes:

1. Fix the `DURATION_OPTIONS` array — change the second `{ value: 15, label: "20 min" }` to `{ value: 20, label: "20 min" }`.

2. Add a dynamic custom CommandItem before the preset list. Inside the `<CommandGroup>`, before the `DURATION_OPTIONS.map(...)`, add:

```tsx
{(() => {
  const parsed = parseInt(input, 10);
  const isValidCustom =
    !Number.isNaN(parsed) &&
    parsed > 0 &&
    !DURATION_OPTIONS.some((o) => o.value === parsed);
  if (!isValidCustom) return null;
  return (
    <CommandItem
      key="__custom__"
      value="__custom__"
      onSelect={() => {
        onChange(parsed);
        setInput("");
        setOpen(false);
      }}
    >
      <CheckIcon className="mr-2 size-4 opacity-0" />
      Use {parsed} min
    </CommandItem>
  );
})()}
```

**Step 5: Run tests — expect pass**

```bash
bun run --cwd frontend test --run src/components/interviews/__tests__/duration-combobox.test.tsx
```

**Step 6: Commit**

```bash
git add frontend/src/components/interviews/duration-combobox.tsx \
        frontend/src/components/interviews/__tests__/duration-combobox.test.tsx
git commit -m "fix: correct 20min option value and add custom 'Use N min' item to DurationCombobox"
```

---

## Task 6: Update `ScheduleDialog`

**Files:**
- Modify: `frontend/src/components/interviews/schedule-dialog.tsx`
- Modify: `frontend/src/components/interviews/__tests__/schedule-dialog.test.tsx`

Three changes: description → single-line, meeting URL → UrlInput, add Notes field.

**Step 1: Add failing tests**

Open `frontend/src/components/interviews/__tests__/schedule-dialog.test.tsx` and add:

```tsx
it("renders description as a single-line input (not textarea)", () => {
  // open dialog somehow — check the existing test setup for how to open it
  // then:
  const descInput = screen.getByLabelText(/description/i);
  expect(descInput.tagName).toBe("INPUT");
});

it("renders a Notes textarea", () => {
  const notesArea = screen.getByLabelText(/notes/i);
  expect(notesArea.tagName).toBe("TEXTAREA");
});
```

Check the existing test setup (how dialog is opened) before adding — mirror that pattern.

**Step 2: Run tests — expect failure**

```bash
bun run --cwd frontend test --run src/components/interviews/__tests__/schedule-dialog.test.tsx
```

**Step 3: Edit `schedule-dialog.tsx`**

a. Add `notes` to schema:
```ts
const scheduleFormSchema = z.object({
  // ... existing fields ...
  notes: z.string().default(""),
});
```

b. Add `notes: ""` to `defaultValues` and `reset()` calls.

c. Replace the `<textarea>` Description field with a single-line `<Input>`:
```tsx
{/* Description */}
<div className="space-y-2">
  <Label htmlFor="schedule-description">Description</Label>
  <Input
    id="schedule-description"
    placeholder="Description of interview"
    {...register("description")}
  />
</div>
```

d. Add `UrlInput` import and replace the Meeting URL `<Input>` with a `<Controller>`-wrapped `<UrlInput>`:
```tsx
import { Controller } from "react-hook-form";
import { UrlInput } from "@/components/ui/url-input";

// ...

{/* URL */}
<div className="space-y-2">
  <Label>Meeting URL</Label>
  <Controller
    name="url"
    control={control}
    render={({ field }) => (
      <UrlInput
        id="schedule-url"
        value={field.value}
        onChange={field.onChange}
        placeholder="https://..."
      />
    )}
  />
</div>
```

Also destructure `control` from `useForm`.

e. Add Notes textarea after Description:
```tsx
{/* Notes */}
<div className="space-y-2">
  <Label htmlFor="schedule-notes">Notes</Label>
  <textarea
    id="schedule-notes"
    className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    placeholder="Notes about this interview..."
    {...register("notes")}
  />
</div>
```

f. Pass `notes` in the `createEvent.mutateAsync(...)` call:
```ts
const newEvent = await createEvent.mutateAsync({
  // ... existing fields ...
  notes: values.notes || "",
});
```

**Step 4: Update the events query type if needed**

Check `frontend/src/lib/queries/events.ts` — if the `CreateEventPayload` type doesn't include `notes`, add it:
```ts
notes?: string;
```

**Step 5: Run tests — expect pass**

```bash
bun run --cwd frontend test --run src/components/interviews/__tests__/schedule-dialog.test.tsx
```

**Step 6: Commit**

```bash
git add frontend/src/components/interviews/schedule-dialog.tsx \
        frontend/src/components/interviews/__tests__/schedule-dialog.test.tsx \
        frontend/src/lib/queries/events.ts
git commit -m "feat: update schedule dialog — single-line description, notes field, UrlInput for meeting URL"
```

---

## Task 7: Update `FullApplicationForm`

**Files:**
- Modify: `frontend/src/components/applications/full-application-form.tsx`
- Modify: `frontend/src/components/ui/salary-range-slider.tsx`
- Modify: `frontend/src/routes/_authenticated/applications.tsx`
- Modify: `frontend/src/components/applications/__tests__/full-application-form.test.tsx`

**Step 1: Add failing tests**

In `frontend/src/components/applications/__tests__/full-application-form.test.tsx`, add:

```tsx
it("does NOT pre-populate resume from localStorage on open", () => {
  localStorage.setItem("thrive:default_resume_id", "some-doc-id");
  // render and open the FullApplicationForm
  // verify selectedResumeId starts null / no resume shown as selected
  // the DocumentTypePicker should show no pre-selected value
  // (mock useSnapshotDocument and check it's not called)
});

it("does not render a 'Resume' label in the Documents section", () => {
  // open dialog
  // check no element with text "Resume" inside the Documents fieldset
  const docSection = screen.queryByText("Resume");
  expect(docSection).not.toBeInTheDocument();
});
```

Check the existing test file for how FullApplicationForm is rendered/opened before writing.

**Step 2: Run tests — expect failure**

```bash
bun run --cwd frontend test --run src/components/applications/__tests__/full-application-form.test.tsx
```

**Step 3: Edit `full-application-form.tsx`**

a. **Remove auto-resume**: In the `useEffect`, delete these two lines:
```ts
const savedId = localStorage.getItem("thrive:default_resume_id");
setSelectedResumeId(savedId ?? null);
```

b. **Remove "Resume" label**: In the Documents fieldset, delete:
```tsx
<Label>Resume</Label>
```

c. **Add `defaultStatus` prop**:
```tsx
interface FullApplicationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  prefill?: { company?: string; position?: string; url?: string };
  defaultStatus?: string;
}
```

In `defaultValues` and the reset call, use `status: defaultStatus ?? "applied"`.

d. **UrlInput for URL field**: Add `Controller` import and `control` from `useForm`. Replace:
```tsx
<Input id="full-url" placeholder="https://..." {...register("url")} />
```
with:
```tsx
<Controller
  name="url"
  control={control}
  render={({ field }) => (
    <UrlInput
      id="full-url"
      value={field.value}
      onChange={field.onChange}
    />
  )}
/>
```
Also add: `import { UrlInput } from "@/components/ui/url-input";`

**Step 4: Update `SalaryRangeSlider` for 100k–600k annual range**

In `frontend/src/components/ui/salary-range-slider.tsx`:

```tsx
// Change these two lines:
const sliderMin = isYearly ? 100_000 : 0;
const sliderMax = isYearly ? 600_000 : 500;

// Update safeMin/safeMax:
const safeMin = Math.max(sliderMin, Math.min(min, sliderMax));
const safeMax = Math.max(sliderMin, Math.min(max, sliderMax));

// Update handlePeriodChange reset:
function handlePeriodChange(newPeriod: string) {
  onChange({ period: newPeriod, currency, min: 0, max: 0 });
}

// Update the SliderPrimitive.Root min prop:
<SliderPrimitive.Root
  min={sliderMin}   // was: min={0}
  max={sliderMax}
  // ...
>

// Update the floor/ceiling labels:
<span>{isYearly ? "$100k" : "$0"}</span>   // was "$0"
<span>{isYearly ? "$600k" : "$500"}</span>  // was "$1M"/"$500"
```

Note: When `min === 0 && max === 0`, `rangeLabel` still shows "Not specified" (existing logic). The slider thumb will rest at sliderMin visually until the user interacts — acceptable.

**Step 5: Add Bookmark button in `applications.tsx`**

In `frontend/src/routes/_authenticated/applications.tsx`:

a. Add state: `const [bookmarkOpen, setBookmarkOpen] = useState(false);`

b. Import `BookmarkIcon` from lucide-react.

c. In the header button group, add before the Easy Add button:
```tsx
<Button
  variant="outline"
  size="icon"
  aria-label="Bookmark job"
  title="Bookmark"
  onClick={() => setBookmarkOpen(true)}
>
  <BookmarkIcon className="size-4" />
</Button>
```

d. Add a second `FullApplicationForm` below the first:
```tsx
<FullApplicationForm
  open={bookmarkOpen}
  onOpenChange={setBookmarkOpen}
  defaultStatus="bookmarked"
/>
```

**Step 6: Run full test suite**

```bash
bun run --cwd frontend test --run
```

Expected: All tests pass.

**Step 7: Commit**

```bash
git add frontend/src/components/applications/full-application-form.tsx \
        frontend/src/components/applications/__tests__/full-application-form.test.tsx \
        frontend/src/components/ui/salary-range-slider.tsx \
        frontend/src/routes/_authenticated/applications.tsx
git commit -m "feat: application form — remove auto-resume, 100-600k salary, UrlInput, bookmark button"
```

---

## Task 8: Refactor `CompanyForm`

This is the largest task. Work through each change group sequentially.

**Files:**
- Modify: `frontend/src/components/companies/company-form.tsx`
- Modify: `frontend/src/components/companies/__tests__/company-form.test.tsx`

### 8a — Schema + payload changes

**Step 1: Update schema and helper functions**

In `company-form.tsx`:

a. Add `crunchbase` to `linksSchema`:
```ts
const linksSchema = z.object({
  website: z.string().default(""),
  careers: z.string().default(""),
  linkedin: z.string().default(""),
  glassdoor: z.string().default(""),
  news: z.string().default(""),
  crunchbase: z.string().default(""),
});
```

b. Change `tags` from `z.string()` to `z.array(z.string())`:
```ts
tags: z.array(z.string()).default([]),
```

c. Update `companyToFormValues` — tags:
```ts
// was: const tags = Array.isArray(company.tags) ? (company.tags as string[]).join(", ") : "";
tags: Array.isArray(company.tags) ? (company.tags as string[]) : [],
```
Also add `crunchbase: links.crunchbase ?? ""` inside the links object.

d. Update `formValuesToPayload` — tags:
```ts
// was: split by comma
tags: values.tags.length > 0 ? values.tags : null,
```
Remove the old comma-split logic.

**Step 2: Add the Industry options constant**

```ts
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
```

**Step 3: Add new imports to the top of `company-form.tsx`**

```tsx
import { Controller } from "react-hook-form";
import { CityCombobox } from "@/components/applications/city-combobox";
import { TagInput } from "@/components/ui/tag-input";
import { StarRating } from "@/components/ui/star-rating";
import { UrlInput } from "@/components/ui/url-input";
```

Also add `control` to the `useForm` destructure.

**Step 4: Commit schema changes before touching JSX**

```bash
git add frontend/src/components/companies/company-form.tsx
git commit -m "refactor: update company form schema — crunchbase link, array tags, industry options"
```

### 8b — JSX: Basic Information fieldset

Replace the current Basic Information fieldset with:

```tsx
<fieldset className="space-y-4">
  <legend className="text-sm font-semibold text-muted-foreground">Basic Information</legend>

  <div className="space-y-2">
    <Label htmlFor="name">Name *</Label>
    <Input id="name" {...register("name")} />
    {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
  </div>

  <div className="space-y-2">
    <Label htmlFor="description">Description</Label>
    <textarea
      id="description"
      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      {...register("description")}
    />
  </div>

  <div className="grid grid-cols-2 gap-4">
    <div className="space-y-2">
      <Label>Industry</Label>
      <Select
        value={watch("industry") ?? ""}
        onValueChange={(v) => setValue("industry", v)}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select industry" />
        </SelectTrigger>
        <SelectContent>
          {INDUSTRY_OPTIONS.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
    <div className="space-y-2">
      <Label>Size</Label>
      <Select value={watch("size") ?? ""} onValueChange={(v) => setValue("size", v)}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select size" />
        </SelectTrigger>
        <SelectContent>
          {SIZE_OPTIONS.map((s) => (
            <SelectItem key={s} value={s}>{s}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  </div>

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
</fieldset>
```

### 8c — JSX: Company Links fieldset

Replace the current Links fieldset:

```tsx
<fieldset className="space-y-4">
  <legend className="text-sm font-semibold text-muted-foreground">Company Links</legend>
  <div className="grid grid-cols-2 gap-4">
    {(
      [
        ["links.website", "Website"],
        ["links.careers", "Careers Page"],
        ["links.linkedin", "LinkedIn"],
        ["links.glassdoor", "Glassdoor"],
        ["links.news", "News"],
        ["links.crunchbase", "Crunchbase"],
      ] as const
    ).map(([field, label]) => (
      <div key={field} className="space-y-2">
        <Label>{label}</Label>
        <Controller
          name={field}
          control={control}
          render={({ f }) => (
            <UrlInput value={f.value} onChange={f.onChange} />
          )}
        />
      </div>
    ))}
  </div>
</fieldset>
```

Note: Use `render={({ field }) => ...}` (not `f`).

### 8d — JSX: Company Ratings fieldset

Replace the current Ratings fieldset:

```tsx
<fieldset className="space-y-4">
  <legend className="text-sm font-semibold text-muted-foreground">Company Ratings</legend>
  <div className="grid grid-cols-2 gap-4">
    {(
      [
        ["ratings.overall", "Overall"],
        ["ratings.work_life", "Work-Life Balance"],
        ["ratings.compensation", "Compensation"],
        ["ratings.growth", "Career Growth"],
        ["ratings.management", "Management"],
        ["ratings.culture", "Culture"],
      ] as const
    ).map(([field, label]) => (
      <div key={field} className="space-y-2">
        <Label>{label}</Label>
        <StarRating
          aria-label={label}
          value={watch(field) ? Number(watch(field)) : null}
          onChange={(v) => setValue(field, v != null ? String(v) : "")}
        />
      </div>
    ))}
  </div>
</fieldset>
```

### 8e — JSX: Research Notes fieldset

Replace the current Research Notes fieldset:

```tsx
<fieldset className="space-y-4">
  <legend className="text-sm font-semibold text-muted-foreground">Research Notes</legend>

  <div className="grid grid-cols-2 gap-4">
    <div className="space-y-2">
      <Label htmlFor="culture">Culture</Label>
      <textarea
        id="culture"
        className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        {...register("culture")}
      />
    </div>
    <div className="space-y-2">
      <Label htmlFor="benefits">Benefits</Label>
      <textarea
        id="benefits"
        className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        {...register("benefits")}
      />
    </div>
  </div>

  <div className="grid grid-cols-2 gap-4">
    <div className="space-y-2">
      <Label htmlFor="pros">Pros</Label>
      <textarea
        id="pros"
        className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        {...register("pros")}
      />
    </div>
    <div className="space-y-2">
      <Label htmlFor="cons">Cons</Label>
      <textarea
        id="cons"
        className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        {...register("cons")}
      />
    </div>
  </div>

  <div className="space-y-2">
    <Label htmlFor="tech_stack">Tech Stack</Label>
    <Input id="tech_stack" placeholder="React, Node.js, PostgreSQL..." {...register("tech_stack")} />
  </div>

  <div className="space-y-2">
    <Label>Tags</Label>
    <TagInput
      value={watch("tags") ?? []}
      onChange={(tags) => setValue("tags", tags)}
    />
  </div>

  <div className="flex items-center gap-2">
    <Checkbox
      id="researched"
      checked={watch("researched") ?? false}
      onCheckedChange={(checked) => setValue("researched", checked === true)}
    />
    <Label htmlFor="researched">Researched</Label>
  </div>
</fieldset>
```

### 8f — JSX: Contacts fieldset (edit mode only)

```tsx
{mode === "edit" && company?.id && (
  <fieldset className="space-y-4">
    <legend className="text-sm font-semibold text-muted-foreground">Contacts</legend>
    <CompanyContacts companyId={company.id} />
  </fieldset>
)}
```

Remove the old Contacts fieldset.

### 8g — Remove unused imports

After all JSX changes, remove `RATING_OPTIONS` constant and any unused imports (e.g. old `Select` items if ratings no longer use them — keep `Select` since Industry/Size still use it).

### 8h — Add tests for key changes

In `frontend/src/components/companies/__tests__/company-form.test.tsx`, add:

```tsx
it("renders Industry as a dropdown (select)", () => {
  // open create modal
  // find the industry select trigger
  expect(screen.getByRole("combobox", { name: /industry/i })).toBeInTheDocument();
});

it("renders Tags as TagInput chips (not plain text input)", () => {
  // open edit modal with company that has tags
  // should show chip badges not comma-separated string
});

it("does not render Contacts section in create mode", () => {
  // open create modal
  expect(screen.queryByText("Contacts")).not.toBeInTheDocument();
});

it("renders Contacts section in edit mode", () => {
  // open edit modal with a company
  expect(screen.getByText("Contacts")).toBeInTheDocument();
});
```

**Step 5: Run full test suite**

```bash
bun run --cwd frontend test --run
```

Fix any failures before committing.

**Step 6: Commit**

```bash
git add frontend/src/components/companies/company-form.tsx \
        frontend/src/components/companies/__tests__/company-form.test.tsx
git commit -m "feat: company form — industry dropdown, CityCombobox, UrlInput links, StarRating, TagInput, side-by-side layout, restructured sections"
```

---

## Task 9: Full Test Run + TypeScript Check

**Step 1: Run all tests**

```bash
bun run --cwd frontend test --run
```

Expected: All tests pass (no skips, no failures).

**Step 2: TypeScript check**

```bash
bun run --cwd frontend tsc --noEmit
```

Expected: No errors.

**Step 3: Build check**

```bash
bun run --cwd frontend build
```

Expected: Build succeeds.

**Step 4: Fix any issues found above before proceeding.**

---

## Task 10: Final Commit + Summary

```bash
git log --oneline -10
```

Verify all feature commits are present. If any tasks were combined, ensure each logical change has its own commit.

Push the branch:

```bash
git push -u origin HEAD
```
