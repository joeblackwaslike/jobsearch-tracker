# Design: Next Iteration Bugfixes

**Date:** 2026-02-21
**Source:** `docs/next-iteration.md`

## Overview

Five frontend bugfixes across Companies, Applications, Interviews, and the global UI. Includes regression tests for the modal overflow fix.

---

## Bug 1: Company Create Form — Restore Full Fields

**Problem:** The create mode of `CompanyForm` was changed to show only a single Company Name field. All other fields (description, links, industry, size, location, culture, benefits, etc.) are inaccessible when creating a new company.

**Fix:** Remove the `isCreate` conditional that renders the minimal one-field layout. Both create and edit modes render the full multi-section form inside a `ScrollArea`. The dialog title/description and submit button label still vary by mode. The schema already supports all fields.

**Files changed:**
- `frontend/src/components/companies/company-form.tsx`
- `frontend/src/components/companies/__tests__/company-form.test.tsx` (update existing test)

---

## Bug 2: Modal Overflow — Applications & Companies

**Problem:** When form content is taller than the viewport, the `DialogContent` with `overflow-hidden` clips the form, and the `DialogFooter` (Cancel/Submit buttons) lives outside the `ScrollArea`, making it inaccessible.

**Fix (Option A — minimal):**
- Remove `overflow-hidden` from `DialogContent` (keep `max-h-[90vh]`)
- Set `ScrollArea` to `max-h-[calc(85vh-8rem)]` to account for dialog header
- Move `DialogFooter` inside the `ScrollArea`, after the last fieldset

Applies to both `FullApplicationForm` (create) and `CompanyForm` (create + edit, unified after Bug 1 fix).

**Files changed:**
- `frontend/src/components/applications/full-application-form.tsx`
- `frontend/src/components/companies/company-form.tsx`

### Regression Tests

Three invariants tested per component using `data-slot` attributes on Radix primitives:

1. **`[data-slot="dialog-content"]` has no `overflow-hidden` class**
   Prevents re-adding the clipping constraint.

2. **`[data-slot="scroll-area"]` has a `max-h-` class**
   Ensures height-capping is applied so scrolling activates.

3. **Both Cancel and Submit buttons are inside the `ScrollArea`** (via `toContainElement`)
   Core regression guard — if footer moves outside ScrollArea again, this fails.

Coverage: 6 tests for `CompanyForm` (create + edit × 3 invariants), 3 tests for `FullApplicationForm` (× 3 invariants).

**Files changed:**
- `frontend/src/components/applications/__tests__/full-application-form.test.tsx`
- `frontend/src/components/companies/__tests__/company-form.test.tsx`

---

## Bug 3: Avatar Fallback — Single Initial

**Problem:** `getUserInitials()` in `user-menu.tsx` uses `email.slice(0, 2)`, showing two characters from the email address instead of one.

**Fix:** Change to `email.slice(0, 1)`.

**Files changed:**
- `frontend/src/components/layout/user-menu.tsx`

---

## Bug 4: Interview Duration — Combobox with Text Override

**Problem:** The duration field in `ScheduleDialog` is a plain `<Select>`, limiting users to preset values (15–180 min in 15-min increments). No way to enter a custom duration.

**Fix (Option A):** Replace the `<Select>` with an inline `DurationCombobox` using the existing `Command` + `Popover` pattern (same as `CompanyCombobox`, `InterviewerCombobox`). User can type any number interpreted as minutes, or pick from the preset list. Value stored as `number | undefined` — no schema changes needed.

Preset labels follow the existing `DURATION_OPTIONS` format. Typed custom values display as `"{n} min"` or formatted (e.g. `"75 min"` → `"1 hr 15 min"`) if they match a preset.

**Files changed:**
- `frontend/src/components/interviews/schedule-dialog.tsx`

---

## Bug 5: New Interview Not Reflected in List

**Problem:** After creating an interview via `ScheduleDialog`, the Interviews page doesn't update. The `useCreateEvent` mutation invalidates `["events", ...]` and `["applications"]`, but the Interviews page uses separate query keys `["interviews", "upcoming"]` and `["interviews", "past"]` — which are never invalidated.

**Fix:** Add two invalidations to `useCreateEvent`'s `onSuccess` callback in `events.ts`:
```ts
queryClient.invalidateQueries({ queryKey: ["interviews", "upcoming"] });
queryClient.invalidateQueries({ queryKey: ["interviews", "past"] });
```

**Files changed:**
- `frontend/src/lib/queries/events.ts`

---

## Implementation Order

1. Bug 5 — cache invalidation (smallest, no UI risk)
2. Bug 3 — avatar single initial (one-liner)
3. Bug 1 — restore company create form (prerequisite for Bug 2 company tests)
4. Bug 2 — modal overflow fix + regression tests (depends on Bug 1 for CompanyForm)
5. Bug 4 — duration combobox (independent, saved for last as most involved)
