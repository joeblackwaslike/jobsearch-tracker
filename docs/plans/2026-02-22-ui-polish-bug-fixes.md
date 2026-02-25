# UI Polish & Bug Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Four targeted UI/UX fixes: move Source into Job Details (side-by-side with Location) in both application forms, fix the founded-year DB failure in the company form, add Enter-key preset selection to DurationCombobox, and make the event dialog scrollable on small screens.

**Architecture:** All changes are isolated to individual components. No new components, no DB migrations, no shared logic changes. The founded-year fix converts between a plain year string in the UI and a `YYYY-01-01` ISO date for the `DATE` DB column.

**Tech Stack:** React 18, react-hook-form, zod, @tanstack/react-table, Radix UI, Tailwind CSS, vitest, @testing-library/react

---

## Context

All work happens in `frontend/`. Run tests from the `frontend/` directory.

**Run a single test file:**
```bash
npx vitest run --reporter=verbose src/components/applications/__tests__/full-application-form.test.tsx
```

**Run all tests:**
```bash
npm test
```

**Key files:**
- `src/components/applications/full-application-form.tsx` — Add Application modal
- `src/components/applications/application-form.tsx` — Edit Application modal
- `src/components/companies/company-form.tsx` — Add/Edit Company modal
- `src/components/interviews/duration-combobox.tsx` — Duration picker
- `src/components/applications/add-event-dialog.tsx` — Add/Edit Event dialog
- Tests live alongside components in `__tests__/` sibling directories

---

### Task 1: Source in Job Details — FullApplicationForm

**Files:**
- Modify: `src/components/applications/full-application-form.tsx`
- Test: `src/components/applications/__tests__/full-application-form.test.tsx`

**Step 1: Write the failing test**

Add to `full-application-form.test.tsx` (new `describe` block at the end of the file):

```tsx
import { within } from "@testing-library/react";

describe("source field placement", () => {
  it("renders Source inside the Job Details fieldset", () => {
    render(<FullApplicationForm open={true} onOpenChange={vi.fn()} />);
    const jobDetails = screen.getByText("Job Details").closest("fieldset")!;
    expect(within(jobDetails).getByText("Source")).toBeInTheDocument();
  });

  it("does not render Source in the Additional Information fieldset", () => {
    render(<FullApplicationForm open={true} onOpenChange={vi.fn()} />);
    const additional = screen.getByText("Additional Information").closest("fieldset")!;
    expect(within(additional).queryByText("Source")).not.toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run --reporter=verbose src/components/applications/__tests__/full-application-form.test.tsx
```

Expected: FAIL — "Source" found in Additional Information, not Job Details.

**Step 3: Implement the layout change**

In `full-application-form.tsx`, find the "Job Details" fieldset (around line 307). Replace the standalone Location `<div>` with a 2-column grid containing both Location and Source:

```tsx
{/* Job Details */}
<fieldset className="space-y-4">
  <legend className="text-sm font-semibold text-muted-foreground">Job Details</legend>

  <div className="grid grid-cols-2 gap-4">
    <div className="space-y-2">
      <Label>Work Type</Label>
      {/* ...existing work type Select... */}
    </div>
    <div className="space-y-2">
      <Label>Employment Type</Label>
      {/* ...existing employment type Select... */}
    </div>
  </div>

  {/* NEW: Location + Source side by side */}
  <div className="grid grid-cols-2 gap-4">
    <div className="space-y-2">
      <Label>Location</Label>
      <CityCombobox
        value={watch("location") ?? ""}
        onChange={(v) => setValue("location", v)}
      />
    </div>
    <div className="space-y-2">
      <Label>Source</Label>
      <SourceCombobox
        value={watch("source") ?? ""}
        onChange={(v) => setValue("source", v)}
      />
    </div>
  </div>

  {/* ...rest of Job Details (URL, job_description) unchanged... */}
</fieldset>
```

Then in the "Additional Information" fieldset, **remove** the `SourceCombobox` block entirely. The section should only contain Tags and Notes.

**Step 4: Run test to verify it passes**

```bash
npx vitest run --reporter=verbose src/components/applications/__tests__/full-application-form.test.tsx
```

Expected: All tests PASS.

**Step 5: Commit**

```bash
git add src/components/applications/full-application-form.tsx \
        src/components/applications/__tests__/full-application-form.test.tsx
git commit -m "feat: move source field into job details section in add application form"
```

---

### Task 2: Source in Job Details — ApplicationForm (Edit)

**Files:**
- Modify: `src/components/applications/application-form.tsx`
- Test: `src/components/applications/__tests__/application-form.test.tsx`

**Step 1: Write the failing test**

Add to `application-form.test.tsx` at the end:

```tsx
import { within } from "@testing-library/react";

describe("source field placement", () => {
  it("renders Source inside the Job Details fieldset", () => {
    render(<ApplicationForm open={true} onOpenChange={vi.fn()} application={null} />);
    const jobDetails = screen.getByText("Job Details").closest("fieldset")!;
    expect(within(jobDetails).getByText("Source")).toBeInTheDocument();
  });

  it("does not render Source in the Additional Information fieldset", () => {
    render(<ApplicationForm open={true} onOpenChange={vi.fn()} application={null} />);
    const additional = screen.getByText("Additional Information").closest("fieldset")!;
    expect(within(additional).queryByText("Source")).not.toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run --reporter=verbose src/components/applications/__tests__/application-form.test.tsx
```

Expected: FAIL.

**Step 3: Implement the layout change**

In `application-form.tsx`, apply the same change as Task 1: wrap Location and Source in a `grid grid-cols-2 gap-4` div in the "Job Details" fieldset, and remove Source from "Additional Information".

The Location block in the edit form is around line 335. The Source block is around line 381. Move Source up alongside Location, same grid pattern as Task 1.

**Step 4: Run test to verify it passes**

```bash
npx vitest run --reporter=verbose src/components/applications/__tests__/application-form.test.tsx
```

Expected: All tests PASS.

**Step 5: Commit**

```bash
git add src/components/applications/application-form.tsx \
        src/components/applications/__tests__/application-form.test.tsx
git commit -m "feat: move source field into job details section in edit application form"
```

---

### Task 3: Founded Year DB Fix — CompanyForm

**Files:**
- Modify: `src/components/companies/company-form.tsx`
- Test: `src/components/companies/__tests__/company-form.test.tsx`

**Background:** The `founded` DB column is `DATE` type. PostgREST rejects a plain year like `"2020"` — it requires ISO format `"2020-01-01"`. The existing `mockCompany` fixture in the test already has `founded: "2015-01-01"`, confirming this is the expected DB format.

**Step 1: Write the failing tests**

Add to `company-form.test.tsx` (new `describe` block):

```tsx
describe("founded year conversion", () => {
  it("displays only the year portion of the founded date in the input", () => {
    render(
      <CompanyForm open={true} onOpenChange={noop} mode="edit" company={mockCompany as never} />,
    );
    // founded is "2015-01-01" in DB; input should show just "2015"
    expect(screen.getByLabelText("Founded (year)")).toHaveValue(2015);
  });

  it("calls updateMutateAsync with founded as a full ISO date string", async () => {
    const user = userEvent.setup();
    render(
      <CompanyForm open={true} onOpenChange={noop} mode="edit" company={mockCompany as never} />,
    );
    await user.click(screen.getByRole("button", { name: "Save Changes" }));
    await waitFor(() => {
      expect(updateMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ founded: "2015-01-01" }),
      );
    });
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run --reporter=verbose src/components/companies/__tests__/company-form.test.tsx
```

Expected: FAIL — input shows full date string, payload sends year string without `-01-01`.

**Step 3: Fix `companyToFormValues`**

In `company-form.tsx`, update the `companyToFormValues` helper:

```ts
// Before:
founded: company.founded ?? "",

// After:
founded: company.founded ? company.founded.slice(0, 4) : "",
```

**Step 4: Fix `formValuesToPayload`**

```ts
// Before:
founded: values.founded || null,

// After:
founded: values.founded ? `${values.founded}-01-01` : null,
```

**Step 5: Run test to verify it passes**

```bash
npx vitest run --reporter=verbose src/components/companies/__tests__/company-form.test.tsx
```

Expected: All tests PASS.

**Step 6: Commit**

```bash
git add src/components/companies/company-form.tsx \
        src/components/companies/__tests__/company-form.test.tsx
git commit -m "fix: convert founded year to ISO date for DATE column on save"
```

---

### Task 4: Duration Combobox — Enter Key Selects Preset

**Files:**
- Modify: `src/components/interviews/duration-combobox.tsx`
- Test: `src/components/interviews/__tests__/duration-combobox.test.tsx`

**Step 1: Write the failing tests**

Add to `duration-combobox.test.tsx`:

```tsx
it("pressing Enter when input matches a preset calls onChange with that preset and closes", async () => {
  const onChange = vi.fn();
  const { default: userEvent } = await import("@testing-library/user-event");
  const user = userEvent.setup();
  render(<DurationCombobox value={undefined} onChange={onChange} />);
  await user.click(screen.getByRole("combobox", { name: "Duration" }));
  const input = screen.getByPlaceholderText(/minutes/i);
  await user.type(input, "30");
  await user.keyboard("{Enter}");
  expect(onChange).toHaveBeenCalledWith(30);
});

it("pressing Enter when input is a valid custom number calls onChange and closes", async () => {
  const onChange = vi.fn();
  const { default: userEvent } = await import("@testing-library/user-event");
  const user = userEvent.setup();
  render(<DurationCombobox value={undefined} onChange={onChange} />);
  await user.click(screen.getByRole("combobox", { name: "Duration" }));
  const input = screen.getByPlaceholderText(/minutes/i);
  await user.type(input, "77");
  await user.keyboard("{Enter}");
  expect(onChange).toHaveBeenCalledWith(77);
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run --reporter=verbose src/components/interviews/__tests__/duration-combobox.test.tsx
```

Expected: FAIL — Enter key does nothing currently.

**Step 3: Add the `onKeyDown` handler**

In `duration-combobox.tsx`, add a `handleKeyDown` function and attach it to `CommandInput`:

```tsx
const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key !== "Enter") return;
  const parsed = parseInt(input, 10);
  if (Number.isNaN(parsed) || parsed <= 0) return;
  e.preventDefault();
  onChange(parsed);
  setInput("");
  setOpen(false);
};
```

On the `CommandInput`:

```tsx
<CommandInput
  placeholder="Minutes (e.g. 45) or pick below..."
  value={input}
  onValueChange={(val) => {
    setInput(val);
    const parsed = parseInt(val, 10);
    if (!Number.isNaN(parsed) && parsed > 0) {
      onChange(parsed);
    } else if (val === "") {
      onChange(undefined);
    }
  }}
  onKeyDown={handleKeyDown}
/>
```

**Step 4: Run test to verify it passes**

```bash
npx vitest run --reporter=verbose src/components/interviews/__tests__/duration-combobox.test.tsx
```

Expected: All tests PASS.

**Step 5: Commit**

```bash
git add src/components/interviews/duration-combobox.tsx \
        src/components/interviews/__tests__/duration-combobox.test.tsx
git commit -m "feat: select duration preset by typing number and pressing Enter"
```

---

### Task 5: Event Dialog — Scrollability

**Files:**
- Modify: `src/components/applications/add-event-dialog.tsx`
- Test: `src/components/applications/__tests__/add-event-dialog.test.tsx`

**Step 1: Write the failing tests**

Add to `add-event-dialog.test.tsx`:

```tsx
describe("dialog scrollability", () => {
  it("dialog content has a max-height constraint", () => {
    render(<AddEventDialog {...defaultProps} mode="create" />);
    const content = document.querySelector('[data-slot="dialog-content"]');
    expect(content?.className).toMatch(/max-h-/);
  });

  it("scroll area exists with a max-height constraint", () => {
    render(<AddEventDialog {...defaultProps} mode="create" />);
    const scrollArea = document.querySelector('[data-slot="scroll-area"]');
    expect(scrollArea).toBeInTheDocument();
    expect(scrollArea?.className).toMatch(/max-h-/);
  });

  it("footer buttons are outside the scroll area", () => {
    render(<AddEventDialog {...defaultProps} mode="create" />);
    const scrollArea = document.querySelector('[data-slot="scroll-area"]');
    const cancelBtn = screen.getByRole("button", { name: "Cancel" });
    expect(scrollArea).not.toContainElement(cancelBtn);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run --reporter=verbose src/components/applications/__tests__/add-event-dialog.test.tsx
```

Expected: FAIL — no scroll area, no max-height, footer is inside the form body.

**Step 3: Implement the scrollable layout**

In `add-event-dialog.tsx`:

1. Add the `ScrollArea` import:
   ```tsx
   import { ScrollArea } from "@/components/ui/scroll-area";
   ```

2. Update `DialogContent` to add height constraints:
   ```tsx
   <DialogContent className="sm:max-w-md max-h-[90vh] overflow-hidden">
   ```

3. Wrap the form fields in `ScrollArea`, keeping `DialogFooter` outside:
   ```tsx
   <form onSubmit={handleSubmit(onSubmit)}>
     <ScrollArea className="max-h-[70vh] pr-4">
       <div className="space-y-4 py-4">
         {/* ...all existing form field blocks unchanged... */}
       </div>
     </ScrollArea>

     <DialogFooter>
       <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
         Cancel
       </Button>
       <Button type="submit" disabled={isSubmitting}>
         {isSubmitting ? "Saving..." : isCreate ? "Add Event" : "Save Changes"}
       </Button>
     </DialogFooter>
   </form>
   ```

**Step 4: Run test to verify it passes**

```bash
npx vitest run --reporter=verbose src/components/applications/__tests__/add-event-dialog.test.tsx
```

Expected: All tests PASS.

**Step 5: Run full test suite**

```bash
npm test
```

Expected: All tests PASS.

**Step 6: Commit**

```bash
git add src/components/applications/add-event-dialog.tsx \
        src/components/applications/__tests__/add-event-dialog.test.tsx
git commit -m "feat: make event dialog scrollable on small screens"
```
