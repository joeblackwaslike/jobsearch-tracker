# Design: Dropdown Scroll Bugfix + Auto-Resume Pre-selection

Date: 2026-02-28

## Overview

Two tasks for this iteration:

1. **Dropdown scroll bugfix** — combobox dropdowns (industries, locations on company form; source on application form) no longer allow scrolling through options. Browser-first debugging approach.
2. **Auto-resume pre-selection** — `FullApplicationForm` should pre-select the last-used resume every time it opens, not just when submitted.

---

## Bug 1: Dropdown Scroll

### Affected Components

- `frontend/src/components/companies/industry-combobox.tsx` — Industries field on company form
- `frontend/src/components/applications/city-multi-combobox.tsx` — Locations field on company/application form
- `frontend/src/components/applications/source-combobox.tsx` — Source field on application form

### Approach

Browser-first debugging. A previous code-reading-based fix attempt failed, so we go straight to the browser.

**Debug steps:**

1. Load the dev server, open the company add/edit form
2. Open the Industries dropdown
3. Inspect `[data-slot="command-list"]` — check computed `overflow-y`, `max-height`, and whether the element is overflowing
4. Check ancestors for `pointer-events: none` or `overflow: hidden` that could block scroll events
5. Use DevTools Event Listeners panel to identify which element is capturing scroll events
6. Apply targeted fix based on findings; likely candidates:
   - `overflow-hidden` on `Command` root in `command.tsx` clipping `CommandList`
   - `overscroll-contain` missing from `CommandList`, causing scroll bubbling to parent
   - `PopoverContent` width or height constraint collapsing the scroll area
7. Verify fix on all three affected comboboxes before closing

### Files Likely to Change

- `frontend/src/components/ui/command.tsx` — may need `overflow-hidden` removed from `Command` root
- Possibly individual combobox files if the fix is component-specific

---

## Bug 2: Auto-Resume Pre-selection

### Current Behavior

- `FullApplicationForm` has a `DocumentTypePicker` for resume selection
- On submit, the selected resume ID is saved to `localStorage` under key `tracker:default_resume_id`
- On form open, `setSelectedResumeId(null)` is called — the localStorage value is never read back

### Desired Behavior

Every time the form opens, pre-select the last-used resume from localStorage (if one exists).

### Change

In `frontend/src/components/applications/full-application-form.tsx`, inside the `useEffect` that runs on `open`:

```ts
// Before
setSelectedResumeId(null);

// After
setSelectedResumeId(localStorage.getItem("tracker:default_resume_id"));
```

No other changes needed. The `DocumentTypePicker` already handles displaying whatever ID is set, and the submit path already persists it back.

### Files to Change

- `frontend/src/components/applications/full-application-form.tsx` — one-line change in `useEffect`
