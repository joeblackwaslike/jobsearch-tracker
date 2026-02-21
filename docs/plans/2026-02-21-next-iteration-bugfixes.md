# Next Iteration Bugfixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix 5 frontend bugs across Companies, Applications, Interviews, and global UI, with overflow regression tests.

**Architecture:** All fixes are isolated to existing components. No new routes, no schema changes, no new dependencies. Tests use the existing vitest + React Testing Library setup with `data-slot` attribute selectors to assert DOM structure for the overflow regression tests.

**Tech Stack:** React, TypeScript, Vitest, React Testing Library, jest-dom, Radix UI, TanStack Query, Biome (linter)

**Design doc:** `docs/plans/2026-02-21-next-iteration-bugfixes-design.md`

---

## Run commands from: `frontend/`

- **Tests (single file):** `npm test -- src/path/to/file.test.tsx`
- **Tests (all):** `npm test`
- **Lint fix:** `npm run lint`
- **Type check:** `npx tsc --noEmit`

---

### Task 1: Fix interview list cache invalidation

**Files:**
- Modify: `frontend/src/lib/queries/events.ts`

**Step 1: Write the failing test**

Open `frontend/src/lib/queries/events.ts` and find `useCreateEvent`. The `onSuccess` callback currently calls:
```ts
queryClient.invalidateQueries({ queryKey: ["events", { applicationId: variables?.application_id }] });
queryClient.invalidateQueries({ queryKey: ["applications"] });
```

There is no test file for the query hooks directly — this bug is verified by the interviews page not updating. We will verify the fix manually after implementing, then commit.

**Step 2: Add the two missing invalidations**

In `frontend/src/lib/queries/events.ts`, find the `useCreateEvent` hook's `onSuccess` callback and add after the existing two `invalidateQueries` calls:

```ts
queryClient.invalidateQueries({ queryKey: ["interviews", "upcoming"] });
queryClient.invalidateQueries({ queryKey: ["interviews", "past"] });
```

The `onSuccess` block should now contain 4 invalidations total.

**Step 3: Run lint**

```bash
cd frontend && npm run lint
```
Expected: no errors.

**Step 4: Commit**

```bash
git add frontend/src/lib/queries/events.ts
git commit -m "fix: invalidate interviews queries after creating event"
```

---

### Task 2: Fix avatar fallback to single initial

**Files:**
- Modify: `frontend/src/components/layout/user-menu.tsx:28-30`

**Step 1: Locate the function**

In `user-menu.tsx` at line 28:
```ts
function getUserInitials(email: string): string {
  return email.slice(0, 2).toUpperCase();
}
```

**Step 2: Change to single character**

```ts
function getUserInitials(email: string): string {
  return email.slice(0, 1).toUpperCase();
}
```

**Step 3: Run lint**

```bash
cd frontend && npm run lint
```
Expected: no errors.

**Step 4: Commit**

```bash
git add frontend/src/components/layout/user-menu.tsx
git commit -m "fix: avatar fallback shows single initial from email"
```

---

### Task 3: Restore full company create form

**Context:** `company-form.tsx` currently has an `isCreate` conditional (line ~261) that renders only a Company Name field in create mode. We need both modes to render the full multi-section form.

**Files:**
- Modify: `frontend/src/components/companies/company-form.tsx`
- Modify: `frontend/src/components/companies/__tests__/company-form.test.tsx`

**Step 1: Update the existing test first (TDD)**

In `company-form.test.tsx`, the first test currently says:
```ts
it("renders create mode with Add Company title and only name field", () => {
  render(<CompanyForm open={true} onOpenChange={noop} mode="create" />);
  expect(screen.getByRole("heading", { name: "Add Company" })).toBeInTheDocument();
  expect(
    screen.getByText("Enter the company name to add it to your directory."),
  ).toBeInTheDocument();
  expect(screen.getByLabelText("Company Name")).toBeInTheDocument();
  expect(screen.queryByText("Basic Information")).not.toBeInTheDocument();
});
```

Replace it with:
```ts
it("renders create mode with Add Company title and full form", () => {
  render(<CompanyForm open={true} onOpenChange={noop} mode="create" />);
  expect(screen.getByRole("heading", { name: "Add Company" })).toBeInTheDocument();
  expect(screen.getByText("Basic Information")).toBeInTheDocument();
  expect(screen.getByText("Links")).toBeInTheDocument();
  expect(screen.getByText("Research Notes")).toBeInTheDocument();
  expect(screen.getByText("Ratings (1-5)")).toBeInTheDocument();
});
```

**Step 2: Run test to confirm it fails**

```bash
cd frontend && npm test -- src/components/companies/__tests__/company-form.test.tsx
```
Expected: FAIL — "Basic Information" not found in create mode.

**Step 3: Remove the isCreate conditional rendering**

In `company-form.tsx`, find the JSX inside `<form>`. It currently looks like:
```tsx
{isCreate ? (
  /* ---- Create mode: minimal ---- */
  <div className="space-y-4 py-4">
    <div className="space-y-2">
      <Label htmlFor="name">Company Name</Label>
      <Input id="name" placeholder="e.g. Acme Corp" {...register("name")} />
      {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
    </div>
  </div>
) : (
  /* ---- Edit mode: all fields in scroll area ---- */
  <ScrollArea className="max-h-[70vh] pr-4">
    ...all fieldsets...
  </ScrollArea>
)}
```

Delete the entire ternary and keep only the `ScrollArea` block (the edit-mode branch). The `ScrollArea`'s `className` will be updated in Task 4 — leave it as-is for now.

Also remove the `isCreate` variable declaration if it's no longer used:
```ts
const isCreate = mode === "create";  // DELETE this line
```

And update the `DialogContent` className — remove the ternary on `className`:
```tsx
// Before
<DialogContent
  className={isCreate ? "sm:max-w-md" : "sm:max-w-2xl max-h-[90vh] overflow-hidden"}
>

// After
<DialogContent className="sm:max-w-2xl max-h-[90vh]">
```

Note: `overflow-hidden` is intentionally removed here (the overflow fix in Task 4 will finalize this).

Also update the `DialogDescription`:
```tsx
// Before
<DialogDescription>
  {isCreate
    ? "Enter the company name to add it to your directory."
    : "Update company details and research notes."}
</DialogDescription>

// After
<DialogDescription>
  {mode === "create"
    ? "Add a new company to your directory."
    : "Update company details and research notes."}
</DialogDescription>
```

**Step 4: Run tests**

```bash
cd frontend && npm test -- src/components/companies/__tests__/company-form.test.tsx
```
Expected: all tests PASS.

**Step 5: Run lint**

```bash
cd frontend && npm run lint
```
Expected: no errors.

**Step 6: Commit**

```bash
git add frontend/src/components/companies/company-form.tsx \
        frontend/src/components/companies/__tests__/company-form.test.tsx
git commit -m "fix: restore full field form for company create mode"
```

---

### Task 4: Fix modal overflow — move footer inside ScrollArea

**Context:** Both `FullApplicationForm` and `CompanyForm` have their `DialogFooter` (Cancel/Submit buttons) outside the `ScrollArea`. This makes buttons inaccessible when the form overflows. The fix moves the footer inside the `ScrollArea` and adjusts the max-height.

**Files:**
- Modify: `frontend/src/components/applications/full-application-form.tsx`
- Modify: `frontend/src/components/companies/company-form.tsx`
- Modify: `frontend/src/components/applications/__tests__/full-application-form.test.tsx`
- Modify: `frontend/src/components/companies/__tests__/company-form.test.tsx`

#### Sub-task 4a: Write regression tests first (TDD)

**Step 1: Add overflow regression tests to `full-application-form.test.tsx`**

Append this `describe` block to the file:

```ts
describe("modal overflow regression", () => {
  it("dialog content does not have overflow-hidden class", () => {
    render(<FullApplicationForm open={true} onOpenChange={vi.fn()} />);
    const dialogContent = document.querySelector('[data-slot="dialog-content"]');
    expect(dialogContent).not.toHaveClass("overflow-hidden");
  });

  it("scroll area has a max-height constraint", () => {
    render(<FullApplicationForm open={true} onOpenChange={vi.fn()} />);
    const scrollArea = document.querySelector('[data-slot="scroll-area"]');
    expect(scrollArea?.className).toMatch(/max-h-/);
  });

  it("cancel and submit buttons are inside the scroll area", () => {
    render(<FullApplicationForm open={true} onOpenChange={vi.fn()} />);
    const scrollArea = document.querySelector('[data-slot="scroll-area"]');
    expect(scrollArea).toContainElement(
      screen.getByRole("button", { name: "Add Application" }),
    );
    expect(scrollArea).toContainElement(
      screen.getByRole("button", { name: "Cancel" }),
    );
  });
});
```

**Step 2: Add overflow regression tests to `company-form.test.tsx`**

Append this `describe` block to the file:

```ts
describe("modal overflow regression", () => {
  it("dialog content does not have overflow-hidden class in create mode", () => {
    render(<CompanyForm open={true} onOpenChange={noop} mode="create" />);
    const dialogContent = document.querySelector('[data-slot="dialog-content"]');
    expect(dialogContent).not.toHaveClass("overflow-hidden");
  });

  it("dialog content does not have overflow-hidden class in edit mode", () => {
    render(<CompanyForm open={true} onOpenChange={noop} mode="edit" company={mockCompany as never} />);
    const dialogContent = document.querySelector('[data-slot="dialog-content"]');
    expect(dialogContent).not.toHaveClass("overflow-hidden");
  });

  it("scroll area has a max-height constraint in create mode", () => {
    render(<CompanyForm open={true} onOpenChange={noop} mode="create" />);
    const scrollArea = document.querySelector('[data-slot="scroll-area"]');
    expect(scrollArea?.className).toMatch(/max-h-/);
  });

  it("scroll area has a max-height constraint in edit mode", () => {
    render(<CompanyForm open={true} onOpenChange={noop} mode="edit" company={mockCompany as never} />);
    const scrollArea = document.querySelector('[data-slot="scroll-area"]');
    expect(scrollArea?.className).toMatch(/max-h-/);
  });

  it("cancel and submit buttons are inside the scroll area in create mode", () => {
    render(<CompanyForm open={true} onOpenChange={noop} mode="create" />);
    const scrollArea = document.querySelector('[data-slot="scroll-area"]');
    expect(scrollArea).toContainElement(
      screen.getByRole("button", { name: "Add Company" }),
    );
    expect(scrollArea).toContainElement(
      screen.getByRole("button", { name: "Cancel" }),
    );
  });

  it("cancel and submit buttons are inside the scroll area in edit mode", () => {
    render(<CompanyForm open={true} onOpenChange={noop} mode="edit" company={mockCompany as never} />);
    const scrollArea = document.querySelector('[data-slot="scroll-area"]');
    expect(scrollArea).toContainElement(
      screen.getByRole("button", { name: "Save Changes" }),
    );
    expect(scrollArea).toContainElement(
      screen.getByRole("button", { name: "Cancel" }),
    );
  });
});
```

**Step 3: Run tests to confirm they fail**

```bash
cd frontend && npm test -- src/components/applications/__tests__/full-application-form.test.tsx \
                           src/components/companies/__tests__/company-form.test.tsx
```
Expected: the new tests FAIL — buttons not inside scroll area, `overflow-hidden` present.

#### Sub-task 4b: Fix `FullApplicationForm`

**Step 4: Update `full-application-form.tsx`**

Find the `DialogContent` (around line 223):
```tsx
<DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden">
```
Change to:
```tsx
<DialogContent className="sm:max-w-2xl max-h-[90vh]">
```

Find the `ScrollArea` (around line 230):
```tsx
<ScrollArea className="max-h-[70vh] pr-4">
```
Change to:
```tsx
<ScrollArea className="max-h-[calc(85vh-8rem)] pr-4">
```

Find the `DialogFooter` (currently after `</ScrollArea>`, outside it):
```tsx
          </ScrollArea>

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Add Application"}
            </Button>
          </DialogFooter>
        </form>
```

Move `DialogFooter` inside `ScrollArea`, after the last `</fieldset>` and before `</div>` that closes the inner content div. The result should look like:
```tsx
          <ScrollArea className="max-h-[calc(85vh-8rem)] pr-4">
            <div className="space-y-6 py-4">
              {/* ... all fieldsets ... */}

              <DialogFooter className="mt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Add Application"}
                </Button>
              </DialogFooter>
            </div>
          </ScrollArea>
        </form>
```

#### Sub-task 4c: Fix `CompanyForm`

**Step 5: Update `company-form.tsx`**

The `DialogContent` was already updated in Task 3 to remove `overflow-hidden`. Confirm it reads:
```tsx
<DialogContent className="sm:max-w-2xl max-h-[90vh]">
```

Find the `ScrollArea` (the edit-mode branch, now the only branch):
```tsx
<ScrollArea className="max-h-[70vh] pr-4">
```
Change to:
```tsx
<ScrollArea className="max-h-[calc(85vh-8rem)] pr-4">
```

Find the `DialogFooter` (currently after `</ScrollArea>`):
```tsx
          </ScrollArea>

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : isCreate ? "Add Company" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
```

Note: `isCreate` is removed — update the submit button label to use `mode`:
```tsx
{isSubmitting ? "Saving..." : mode === "create" ? "Add Company" : "Save Changes"}
```

Move `DialogFooter` inside `ScrollArea`, after the last `</fieldset>` (Contacts) and before `</div>`:
```tsx
          <ScrollArea className="max-h-[calc(85vh-8rem)] pr-4">
            <div className="space-y-6 py-4">
              {/* ... all fieldsets ... */}

              <DialogFooter className="mt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : mode === "create" ? "Add Company" : "Save Changes"}
                </Button>
              </DialogFooter>
            </div>
          </ScrollArea>
        </form>
```

**Step 6: Run all affected tests**

```bash
cd frontend && npm test -- src/components/applications/__tests__/full-application-form.test.tsx \
                           src/components/companies/__tests__/company-form.test.tsx
```
Expected: ALL tests PASS including the 9 new regression tests.

**Step 7: Run lint and type check**

```bash
cd frontend && npm run lint && npx tsc --noEmit
```
Expected: no errors.

**Step 8: Commit**

```bash
git add frontend/src/components/applications/full-application-form.tsx \
        frontend/src/components/companies/company-form.tsx \
        frontend/src/components/applications/__tests__/full-application-form.test.tsx \
        frontend/src/components/companies/__tests__/company-form.test.tsx
git commit -m "fix: move dialog footer inside scroll area to fix modal overflow"
```

---

### Task 5: Interview duration — combobox with text override

**Context:** Replace the `<Select>` duration field in `ScheduleDialog` with a combobox that allows typing a custom duration in minutes. The existing `DURATION_OPTIONS` array stays. No changes to schema or form values — `duration_minutes` remains `number | undefined`.

**Files:**
- Modify: `frontend/src/components/interviews/schedule-dialog.tsx`

**Step 1: Review the existing duration Select block to replace**

In `schedule-dialog.tsx` around line 392, the current block is:
```tsx
{/* Duration */}
<div className="space-y-2">
  <Label htmlFor="schedule-duration">Duration</Label>
  <Select
    value={watch("duration_minutes")?.toString() ?? "__none__"}
    onValueChange={(v) =>
      setValue("duration_minutes", v === "__none__" ? undefined : Number(v))
    }
  >
    <SelectTrigger id="schedule-duration" aria-label="Duration">
      <SelectValue placeholder="Select duration..." />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="__none__">None</SelectItem>
      {DURATION_OPTIONS.map((opt) => (
        <SelectItem key={opt.value} value={opt.value.toString()}>
          {opt.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>
```

**Step 2: Add a helper function to format minutes**

Add this helper near the top of the file, after the `DURATION_OPTIONS` constant:

```ts
function formatDuration(minutes: number): string {
  const preset = DURATION_OPTIONS.find((o) => o.value === minutes);
  if (preset) return preset.label;
  if (minutes < 60) return `${minutes} min`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins === 0 ? `${hrs} hr` : `${hrs} hr ${mins} min`;
}
```

**Step 3: Add state for the duration combobox**

Add two new state variables inside `ScheduleDialog`, alongside the existing state:
```ts
const [durationOpen, setDurationOpen] = useState(false);
const [durationInput, setDurationInput] = useState("");
```

**Step 4: Replace the Select block with a Combobox**

Replace the entire Duration `<div>` block from Step 1 with:

```tsx
{/* Duration */}
<div className="space-y-2">
  <Label>Duration</Label>
  <Popover open={durationOpen} onOpenChange={setDurationOpen}>
    <PopoverTrigger asChild>
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={durationOpen}
        className="w-full justify-between font-normal"
        aria-label="Duration"
      >
        {watch("duration_minutes") != null
          ? formatDuration(watch("duration_minutes") as number)
          : "Select duration..."}
        <ChevronsUpDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
      <Command shouldFilter={false}>
        <CommandInput
          placeholder="Minutes (e.g. 45) or pick below..."
          value={durationInput}
          onValueChange={(val) => {
            setDurationInput(val);
            const parsed = parseInt(val, 10);
            if (!Number.isNaN(parsed) && parsed > 0) {
              setValue("duration_minutes", parsed);
            } else if (val === "") {
              setValue("duration_minutes", undefined);
            }
          }}
        />
        <CommandList>
          <CommandEmpty>Type a number of minutes.</CommandEmpty>
          <CommandGroup>
            <CommandItem
              value="__none__"
              onSelect={() => {
                setValue("duration_minutes", undefined);
                setDurationInput("");
                setDurationOpen(false);
              }}
            >
              <CheckIcon
                className={cn(
                  "mr-2 size-4",
                  watch("duration_minutes") == null ? "opacity-100" : "opacity-0",
                )}
              />
              None
            </CommandItem>
            {DURATION_OPTIONS.map((opt) => (
              <CommandItem
                key={opt.value}
                value={opt.value.toString()}
                onSelect={() => {
                  setValue("duration_minutes", opt.value);
                  setDurationInput("");
                  setDurationOpen(false);
                }}
              >
                <CheckIcon
                  className={cn(
                    "mr-2 size-4",
                    watch("duration_minutes") === opt.value ? "opacity-100" : "opacity-0",
                  )}
                />
                {opt.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>
</div>
```

**Step 5: Remove now-unused Select imports**

The `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue` imports are no longer used in the file. Remove them from the import block. Verify `ChevronsUpDownIcon` and `CheckIcon` are already imported (they are, used by the application combobox).

**Step 6: Reset duration state on dialog close**

In `handleOpenChange`, add cleanup for the new state:
```ts
const handleOpenChange = (newOpen: boolean) => {
  if (!newOpen) {
    reset();
    setSelectedInterviewers([]);
    setSelectedDate(undefined);
    setDurationInput("");   // add this
    setDurationOpen(false); // add this
  }
  onOpenChange(newOpen);
};
```

**Step 7: Run the schedule dialog tests**

```bash
cd frontend && npm test -- src/components/interviews/__tests__/schedule-dialog.test.tsx
```
Expected: all existing tests PASS.

**Step 8: Run lint and type check**

```bash
cd frontend && npm run lint && npx tsc --noEmit
```
Expected: no errors.

**Step 9: Run full test suite**

```bash
cd frontend && npm test
```
Expected: all tests PASS.

**Step 10: Commit**

```bash
git add frontend/src/components/interviews/schedule-dialog.tsx
git commit -m "fix: replace duration select with combobox supporting custom input"
```

---

## Final Verification

After all tasks complete:

```bash
cd frontend && npm test && npm run lint && npx tsc --noEmit
```

Expected: all tests green, no lint errors, no type errors.
