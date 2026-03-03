# Design: UI Polish & Bug Fixes

**Date:** 2026-02-22
**Status:** Approved

## Overview

Four small, targeted fixes across the application form, company form, duration combobox, and event dialog. No architectural changes, no migrations, no new components.

---

## Fix 1 — Source/Location Side-by-Side (Add & Edit Application Forms)

**Files:** `frontend/src/components/applications/full-application-form.tsx`, `frontend/src/components/applications/application-form.tsx`

**Change:** In the "Job Details" fieldset, place `CityCombobox` (Location) and `SourceCombobox` (Source) side-by-side using `<div className="grid grid-cols-2 gap-4">`. Remove `SourceCombobox` from the "Additional Information" fieldset. The "Additional Information" section retains only Tags (and Notes in the Add form).

No logic changes — pure JSX layout restructuring in both forms.

---

## Fix 2 — Founded Year DB Bug (Company Form)

**File:** `frontend/src/components/companies/company-form.tsx`

**Root cause:** The `founded` DB column is `DATE` type. Sending a plain year string like `"2020"` fails PostgREST validation; it expects ISO 8601 format `"YYYY-MM-DD"`.

**Fix:** Update two helper functions:

- `companyToFormValues`: Extract the year from the stored date string.
  ```ts
  founded: company.founded ? company.founded.slice(0, 4) : ""
  ```
- `formValuesToPayload`: Append `-01-01` when saving.
  ```ts
  founded: values.founded ? `${values.founded}-01-01` : null
  ```

The `type="number"` input, `z.string()` schema, and all other form logic remain unchanged.

---

## Fix 3 — Duration Combobox: Enter Key Selects Preset

**File:** `frontend/src/components/interviews/duration-combobox.tsx`

**Change:** Add an `onKeyDown` handler to `CommandInput`. On Enter:

1. Parse the current input as an integer.
2. If it matches a `DURATION_OPTIONS` value → call `onChange(parsed)`, clear input, close popover.
3. If it's a valid positive integer not in presets → same (confirm the custom value).
4. Otherwise → no-op.

`shouldFilter` and list rendering remain unchanged.

---

## Fix 4 — Event Dialog Scrollability

**File:** `frontend/src/components/applications/add-event-dialog.tsx`

**Change:**
- Add `max-h-[90vh] overflow-hidden` to `<DialogContent>`.
- Wrap the form body in `<ScrollArea className="max-h-[70vh] pr-4">`.
- Keep `<DialogFooter>` outside the `ScrollArea` so it stays pinned at the bottom.
- Import `ScrollArea` from `@/components/ui/scroll-area`.

Mirrors the pattern already used in `application-form.tsx`.
