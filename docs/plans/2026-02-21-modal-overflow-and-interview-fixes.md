# Modal Overflow & Interview Duration Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix 6 frontend bugs: modal overflow in all 4 Add/Edit dialogs (via a global ScrollArea fix), Add Interview duration popover closing immediately, and Edit Interview showing a number input instead of a combobox.

**Architecture:** Task 1 is a 2-line change to `scroll-area.tsx` that globally fixes all 4 modal overflow bugs — no dialog or form component changes needed. Task 2 is a 1-line fix to the PopoverTrigger. Task 3 extracts a shared `DurationCombobox` component used by both dialogs.

**Tech Stack:** React, TypeScript, Vitest, React Testing Library, Radix UI, Tailwind CSS, Biome (linter)

**Design doc:** `docs/plans/2026-02-21-modal-overflow-and-interview-fixes-design.md`

---

## Run commands from: `frontend/`

- **Tests (single file):** `npm test -- src/path/to/file.test.tsx`
- **Tests (all):** `npm test`
- **Lint:** `npm run lint`
- **Type check:** `npx tsc --noEmit`

---

### Task 1: Fix ScrollArea — global modal overflow fix

**Files:**
- Modify: `frontend/src/components/ui/scroll-area.tsx`
- Create: `frontend/src/components/ui/__tests__/scroll-area.test.tsx`

#### Step 1: Write the failing tests

Create `frontend/src/components/ui/__tests__/scroll-area.test.tsx`:

```tsx
import { describe, expect, it } from "vitest";
import { render } from "@/test/test-utils";
import { ScrollArea } from "../scroll-area";

describe("ScrollArea", () => {
  it("root has overflow-hidden class", () => {
    render(<ScrollArea><div>content</div></ScrollArea>);
    const root = document.querySelector('[data-slot="scroll-area"]');
    expect(root).toHaveClass("overflow-hidden");
  });

  it("viewport has max-height inherit style", () => {
    render(<ScrollArea><div>content</div></ScrollArea>);
    const viewport = document.querySelector('[data-slot="scroll-area-viewport"]');
    expect(viewport).toHaveStyle({ maxHeight: "inherit" });
  });

  it("viewport scrolls when root has max-h and content overflows", () => {
    render(
      <ScrollArea className="max-h-[100px]">
        <div style={{ height: "500px" }}>tall content</div>
      </ScrollArea>
    );
    const viewport = document.querySelector('[data-slot="scroll-area-viewport"]');
    expect(viewport?.scrollHeight).toBeGreaterThan(viewport?.clientHeight ?? 0);
  });
});
```

#### Step 2: Run tests to confirm they fail

```bash
cd frontend && npm test -- src/components/ui/__tests__/scroll-area.test.tsx
```

Expected: FAIL — `overflow-hidden` class not present, `maxHeight` style not present.

#### Step 3: Apply the fix to scroll-area.tsx

In `frontend/src/components/ui/scroll-area.tsx`, make two changes:

**Change 1** — line 16, add `overflow-hidden` to Root:
```tsx
// Before
className={cn("relative", className)}

// After
className={cn("relative overflow-hidden", className)}
```

**Change 2** — add `style={{ maxHeight: "inherit" }}` to Viewport (line 19–24):
```tsx
// Before
<ScrollAreaPrimitive.Viewport
  data-slot="scroll-area-viewport"
  className="focus-visible:ring-ring/50 size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:outline-1"
>

// After
<ScrollAreaPrimitive.Viewport
  data-slot="scroll-area-viewport"
  className="focus-visible:ring-ring/50 size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:outline-1"
  style={{ maxHeight: "inherit" }}
>
```

#### Step 4: Run tests to confirm they pass

```bash
cd frontend && npm test -- src/components/ui/__tests__/scroll-area.test.tsx
```

Expected: all 3 PASS.

#### Step 5: Run lint and full test suite

```bash
cd frontend && npm run lint && npm test
```

Expected: no lint errors, all tests PASS.

#### Step 6: Verify fix in browser

Open the app, click "New Application" button. The modal should now scroll — you should be able to reach all fields including the bottom (Documents, Resume) and the Cancel/Add Application buttons. Do the same for Edit Application, Add Company, Edit Company.

#### Step 7: Commit

```bash
git add frontend/src/components/ui/scroll-area.tsx \
        frontend/src/components/ui/__tests__/scroll-area.test.tsx
git commit -m "fix: add overflow-hidden and max-height:inherit to ScrollArea to enable scrolling"
```

---

### Task 2: Fix Add Interview duration popover closing on mouse release

**Files:**
- Modify: `frontend/src/components/interviews/schedule-dialog.tsx:415`

**Context:** The `PopoverTrigger` button currently has `onPointerDown={() => setDurationOpen(true)}`. This conflicts with Radix's built-in toggle: pointerdown opens the popover, then the resulting click event triggers Radix's `onOpenChange` toggle which immediately closes it. The fix: replace the handler with `e.preventDefault()`, which prevents Radix's dismiss layer from firing on the trigger's pointerdown event. The controlled `onOpenChange={setDurationOpen}` on the `Popover` already handles open/close correctly.

#### Step 1: Write the failing test

Add to `frontend/src/components/interviews/__tests__/schedule-dialog.test.tsx`:

```tsx
it("duration popover stays open after clicking the trigger", async () => {
  const { user } = render(<ScheduleDialog open={true} onOpenChange={vi.fn()} />);
  const trigger = screen.getByRole("combobox", { name: "Duration" });
  await user.click(trigger);
  // Popover content should be visible and stay visible
  expect(screen.getByPlaceholderText("Minutes (e.g. 45) or pick below...")).toBeInTheDocument();
});
```

#### Step 2: Run test to confirm it fails

```bash
cd frontend && npm test -- src/components/interviews/__tests__/schedule-dialog.test.tsx
```

Expected: FAIL — popover closes immediately after click.

#### Step 3: Apply the fix

In `frontend/src/components/interviews/schedule-dialog.tsx`, find line 415:

```tsx
// Before (line 415)
onPointerDown={() => setDurationOpen(true)}

// After
onPointerDown={(e) => e.preventDefault()}
```

#### Step 4: Run tests to confirm they pass

```bash
cd frontend && npm test -- src/components/interviews/__tests__/schedule-dialog.test.tsx
```

Expected: all tests PASS.

#### Step 5: Verify in browser

Open the Interviews page, click "Schedule Interview". Click the Duration field. The combobox should open and **stay open** after releasing the mouse button. Select a preset (e.g. "30 min") and confirm the button label updates.

#### Step 6: Commit

```bash
git add frontend/src/components/interviews/schedule-dialog.tsx
git commit -m "fix: prevent duration popover from closing immediately on pointer release"
```

---

### Task 3: Extract DurationCombobox and fix Edit Interview

**Files:**
- Create: `frontend/src/components/interviews/duration-combobox.tsx`
- Modify: `frontend/src/components/interviews/schedule-dialog.tsx`
- Modify: `frontend/src/components/applications/add-event-dialog.tsx`
- Create: `frontend/src/components/interviews/__tests__/duration-combobox.test.tsx`

**Context:** `schedule-dialog.tsx` has the full duration combobox implementation inline. `add-event-dialog.tsx` (used for edit from the Interviews page) still uses `<input type="number">`. Extract to a shared component, use it in both.

#### Step 1: Write failing test for DurationCombobox

Create `frontend/src/components/interviews/__tests__/duration-combobox.test.tsx`:

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/test-utils";
import { DurationCombobox } from "../duration-combobox";

describe("DurationCombobox", () => {
  it("shows placeholder when no value", () => {
    render(<DurationCombobox value={undefined} onChange={vi.fn()} />);
    expect(screen.getByRole("combobox", { name: "Duration" })).toHaveTextContent("Select duration...");
  });

  it("shows formatted value when preset selected", () => {
    render(<DurationCombobox value={30} onChange={vi.fn()} />);
    expect(screen.getByRole("combobox", { name: "Duration" })).toHaveTextContent("30 min");
  });

  it("shows formatted value for custom duration", () => {
    render(<DurationCombobox value={75} onChange={vi.fn()} />);
    expect(screen.getByRole("combobox", { name: "Duration" })).toHaveTextContent("1 hr 15 min");
  });

  it("calls onChange with preset value when option selected", async () => {
    const onChange = vi.fn();
    const { user } = render(<DurationCombobox value={undefined} onChange={onChange} />);
    await user.click(screen.getByRole("combobox", { name: "Duration" }));
    await user.click(screen.getByText("30 min"));
    expect(onChange).toHaveBeenCalledWith(30);
  });

  it("calls onChange with undefined when None selected", async () => {
    const onChange = vi.fn();
    const { user } = render(<DurationCombobox value={30} onChange={onChange} />);
    await user.click(screen.getByRole("combobox", { name: "Duration" }));
    await user.click(screen.getByText("None"));
    expect(onChange).toHaveBeenCalledWith(undefined);
  });
});
```

#### Step 2: Run test to confirm it fails

```bash
cd frontend && npm test -- src/components/interviews/__tests__/duration-combobox.test.tsx
```

Expected: FAIL — `DurationCombobox` not found.

#### Step 3: Create DurationCombobox component

Create `frontend/src/components/interviews/duration-combobox.tsx`:

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

const DURATION_OPTIONS = [
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "1 hr" },
  { value: 75, label: "1 hr 15 min" },
  { value: 90, label: "1 hr 30 min" },
  { value: 105, label: "1 hr 45 min" },
  { value: 120, label: "2 hr" },
  { value: 135, label: "2 hr 15 min" },
  { value: 150, label: "2 hr 30 min" },
  { value: 165, label: "2 hr 45 min" },
  { value: 180, label: "3 hr" },
] as const;

function formatDuration(minutes: number): string {
  const preset = DURATION_OPTIONS.find((o) => o.value === minutes);
  if (preset) return preset.label;
  if (minutes < 60) return `${minutes} min`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins === 0 ? `${hrs} hr` : `${hrs} hr ${mins} min`;
}

interface DurationComboboxProps {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
}

export function DurationCombobox({ value, onChange }: DurationComboboxProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Duration"
          className="w-full justify-between font-normal"
          onPointerDown={(e) => e.preventDefault()}
        >
          {value != null ? formatDuration(value) : "Select duration..."}
          <ChevronsUpDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command shouldFilter={false}>
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
          />
          <CommandList>
            <CommandEmpty>Type a number of minutes.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="__none__"
                onSelect={() => {
                  onChange(undefined);
                  setInput("");
                  setOpen(false);
                }}
              >
                <CheckIcon
                  className={cn("mr-2 size-4", value == null ? "opacity-100" : "opacity-0")}
                />
                None
              </CommandItem>
              {DURATION_OPTIONS.map((opt) => (
                <CommandItem
                  key={opt.value}
                  value={opt.value.toString()}
                  onSelect={() => {
                    onChange(opt.value);
                    setInput("");
                    setOpen(false);
                  }}
                >
                  <CheckIcon
                    className={cn(
                      "mr-2 size-4",
                      value === opt.value ? "opacity-100" : "opacity-0",
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
  );
}
```

#### Step 4: Run DurationCombobox tests to confirm they pass

```bash
cd frontend && npm test -- src/components/interviews/__tests__/duration-combobox.test.tsx
```

Expected: all 5 PASS.

#### Step 5: Update schedule-dialog.tsx to use DurationCombobox

In `frontend/src/components/interviews/schedule-dialog.tsx`:

**5a.** Add import at top (after other interview imports):
```tsx
import { DurationCombobox } from "@/components/interviews/duration-combobox";
```

**5b.** Remove these now-unused items:
- The `DURATION_OPTIONS` constant (lines 65–78)
- The `formatDuration` function (lines 80–87)
- The `durationOpen` state: `const [durationOpen, setDurationOpen] = useState(false);` (line 127)
- The `durationInput` state: `const [durationInput, setDurationInput] = useState("");` (line 128)
- The cleanup in `handleOpenChange`: `setDurationInput("");` and `setDurationOpen(false);` (lines 241–242)

**5c.** Remove these now-unused imports (if no longer used elsewhere in the file):
- `CheckIcon` from lucide-react
- `ChevronsUpDownIcon` from lucide-react
- `Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList` from `@/components/ui/command`

**5d.** Replace the entire Duration `<div>` block (lines 404–483) with:
```tsx
{/* Duration */}
<div className="space-y-2">
  <Label>Duration</Label>
  <DurationCombobox
    value={watch("duration_minutes")}
    onChange={(v) => setValue("duration_minutes", v)}
  />
</div>
```

#### Step 6: Run schedule-dialog tests

```bash
cd frontend && npm test -- src/components/interviews/__tests__/schedule-dialog.test.tsx
```

Expected: all tests PASS (including the one added in Task 2).

#### Step 7: Update add-event-dialog.tsx to use DurationCombobox

In `frontend/src/components/applications/add-event-dialog.tsx`:

**7a.** Add import:
```tsx
import { DurationCombobox } from "@/components/interviews/duration-combobox";
```

**7b.** Replace the Duration field (lines 334–342):
```tsx
// Before
{/* Duration */}
<div className="space-y-2">
  <Label htmlFor="event-duration">Duration (minutes)</Label>
  <Input
    id="event-duration"
    type="number"
    placeholder="e.g. 30"
    {...register("duration_minutes", { valueAsNumber: true })}
  />
</div>

// After
{/* Duration */}
<div className="space-y-2">
  <Label>Duration</Label>
  <DurationCombobox
    value={watch("duration_minutes")}
    onChange={(v) => setValue("duration_minutes", v)}
  />
</div>
```

#### Step 8: Run add-event-dialog tests

```bash
cd frontend && npm test -- src/components/applications/__tests__/add-event-dialog.test.tsx
```

Expected: all tests PASS.

#### Step 9: Run lint and full test suite

```bash
cd frontend && npm run lint && npm test
```

Expected: no lint errors, all tests PASS.

#### Step 10: Verify in browser

Open Interviews page. Click the pencil/edit icon on an existing interview. The Duration field should show the combobox (not a number input). It should open and stay open. Selecting a preset should update the field. Also verify Add Interview still works correctly.

#### Step 11: Commit

```bash
git add frontend/src/components/interviews/duration-combobox.tsx \
        frontend/src/components/interviews/__tests__/duration-combobox.test.tsx \
        frontend/src/components/interviews/schedule-dialog.tsx \
        frontend/src/components/applications/add-event-dialog.tsx
git commit -m "feat: extract DurationCombobox and use in both schedule and edit event dialogs"
```

---

## Final Verification

```bash
cd frontend && npm test && npm run lint && npx tsc --noEmit
```

Expected: all tests green, no lint errors, no type errors.
