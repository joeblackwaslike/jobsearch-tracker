# Design: Modal Overflow & Interview Duration Fixes

**Date:** 2026-02-21
**Source:** `docs/next-iteration.md`

## Overview

Six frontend bugs across Applications, Companies, and Interviews. The modal overflow has failed to be fixed in three prior iterations — this time root cause was validated live in the browser via Chrome DevTools before proposing any fix.

---

## Bug Group 1: Modal Overflow — All 4 Dialogs (Add/Edit Applications, Add/Edit Companies)

### Verified Root Cause

Debugged live in browser by inspecting computed styles. Two problems confirmed in `scroll-area.tsx`:

**Problem 1:** `ScrollAreaPrimitive.Root` base className is `cn("relative", className)` — missing `overflow-hidden`. Without it, the viewport's content bleeds visually outside the root element instead of being clipped.

**Problem 2:** `ScrollAreaPrimitive.Viewport` has `size-full` (`height: 100%`). In CSS, `height: 100%` on a child does NOT resolve when the parent only has `max-height` (not an explicit `height`). The viewport was computing to 1412px even when the root had `max-height: 289px` — meaning the viewport was never constrained, Radix detected no overflow, and showed no scrollbar.

Evidence from browser inspection:
- Root: `overflow: visible`, `height: 289px`, `scrollHeight: 1412px`
- Viewport: `height: 1412px`, `maxHeight: none`, `clientHeight: 1412`, `scrollHeight: 1412`
- After fix applied inline: `vp.maxH=289px`, `vp.clientH=289`, `vp.scrollH=1412`, `canScroll=true` ✓

### Fix

Two-line change to `frontend/src/components/ui/scroll-area.tsx`:

1. Root: add `overflow-hidden` to base className
2. Viewport: add `style={{ maxHeight: 'inherit' }}` — propagates the root's `max-height` to the viewport, constraining the scrollable element

This is a **global fix** — all four modals (Add Application, Edit Application, Add Company, Edit Company) are fixed automatically. No changes needed to dialog or form components.

**Files changed:**
- `frontend/src/components/ui/scroll-area.tsx`

### Regression Tests

Three invariants tested in `scroll-area.test.tsx` (new file):

1. Root element has `overflow-hidden` class
2. Viewport element has `max-height: inherit` inline style
3. When root has a `max-h-` class, `canScroll` is true when content exceeds viewport (verified via `scrollHeight > clientHeight`)

---

## Bug Group 2: Add Interview Duration Popover Closes on Mouse Release

### Root Cause (Hypothesis)

Radix `Popover` dismisses on pointer-up outside the trigger. The `PopoverTrigger` button receives `pointerdown` and opens the popover, but `pointerup` fires while the pointer has shifted slightly outside the button bounds, which Radix interprets as a click-outside and immediately dismisses.

### Fix

Add `onPointerDown={(e) => e.preventDefault()}` to the `PopoverTrigger` button in `schedule-dialog.tsx`. This is the Radix-documented pattern for preventing premature dismiss on triggers that open popovers.

**Validation:** Verified working in browser after applying the fix.

**Files changed:**
- `frontend/src/components/interviews/schedule-dialog.tsx`

---

## Bug Group 3: Edit Interview Shows Number Input for Duration

### Root Cause

When the duration combobox was added to `ScheduleDialog` in the previous iteration, `AddEventDialog` (the component used for editing interviews from the Interviews page) was not updated. It still renders `<input type="number">` for the `duration_minutes` field.

### Fix

Extract the duration combobox logic from `ScheduleDialog` into a shared `DurationCombobox` component in `frontend/src/components/interviews/duration-combobox.tsx`. Replace the inline combobox JSX in `ScheduleDialog` and the number input in `AddEventDialog` with this shared component.

**Files changed:**
- `frontend/src/components/interviews/duration-combobox.tsx` (new)
- `frontend/src/components/interviews/schedule-dialog.tsx` (use DurationCombobox)
- `frontend/src/components/applications/add-event-dialog.tsx` (replace number input with DurationCombobox)

---

## Implementation Order

1. **scroll-area.tsx fix** — global, fixes all 4 modal overflow bugs, lowest risk
2. **Popover fix** — single line in schedule-dialog.tsx, validate in browser
3. **DurationCombobox extraction** — create shared component, update both dialogs
