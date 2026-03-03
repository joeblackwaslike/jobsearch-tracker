# Design: Companies + Events UI Fixes

**Date:** 2026-02-26
**Branch:** chore/commit-remaining

---

## Overview

Targeted UI fixes across the Company detail view, Company table, Company form, and Events schedule dialog. One new dependency (`react-markdown` + `remark-gfm`) is added for markdown rendering of description and culture fields.

---

## Section 1 — Company Detail View

### 1. Header URL/icons — black color

**File:** `frontend/src/components/shared/detail-layout.tsx`

The meta row currently renders in `text-muted-foreground`. For `href` items the anchor resets only on hover. Change the anchor's default color to `text-foreground` so the URL text and `ExternalLink` icon are black by default.

### 2. Ratings — fix missing Work-Life Balance and Career Growth rows

**File:** `frontend/src/components/companies/company-detail.tsx`

Root cause: the display looks for `workLifeBalance` / `careerGrowth` but the form schema saves them as `work_life` / `growth`. Update the ratings key map in `OverviewTab` to use `work_life` and `growth`.

### 3. Overview tab — description moves above key-value grid

**File:** `frontend/src/components/companies/company-detail.tsx`

Reorder the blocks in `OverviewTab`: Data Quality → Description → key-value grid → Ratings.

### 4. Markdown rendering — description and culture

**New file:** `frontend/src/components/ui/markdown-content.tsx`

Install `react-markdown` + `remark-gfm`. Create a `<MarkdownContent>` component that renders markdown as prose. Apply to:
- `description` in `OverviewTab` (replace `<p className="whitespace-pre-wrap">`)
- `culture` in `ResearchTab` (replace `<p className="whitespace-pre-wrap">`)

Benefits, pros, cons continue to use list/chip rendering — no change there.

### 5. Apps tab — add cursor-pointer

**File:** `frontend/src/components/companies/company-detail.tsx`

Add `cursor-pointer` to the application card `<button>` className in `AppsTab`.

### 6. Links tab — filter website, enforce sort order

**File:** `frontend/src/components/companies/company-detail.tsx`

- Filter out the website link from the `LinksTab` (it's already shown in the header).
- Sort remaining links by: `careers → news → linkedin → glassdoor → crunchbase`.

---

## Section 2 — Company Table

### 7. Remove edit and archive buttons

**File:** `frontend/src/components/companies/company-table.tsx`

Remove the `<TableHead className="w-24" />` column header and the actions `<TableCell>` with the `Pencil` and `Archive` buttons. Remove unused imports: `Archive`, `Pencil`, `useArchiveCompany`. The whole row is already clickable.

---

## Section 3 — Company Form

### 8. Location and founded side by side

**File:** `frontend/src/components/companies/company-form.tsx`

Wrap the location (`CityCombobox`) and founded (`Input`) fields in a `<div className="grid grid-cols-2 gap-4">`.

### 9. Taller textareas for culture, benefits, pros, cons

**File:** `frontend/src/components/companies/company-form.tsx`

Change `min-h-[60px]` → `min-h-[90px]` on the culture, benefits, pros, and cons `<textarea>` elements.

---

## Section 4 — Events Schedule Dialog

### 10. Remove extra date picker button

**File:** `frontend/src/components/events/schedule-dialog.tsx`

The previous fix added a Popover + calendar icon Button next to the native `<input type="date">` as a "mouse-only helper". The user sees this as an unwanted artifact. Remove the Popover, PopoverTrigger, PopoverContent, Button, and Calendar combo from the date field. Remove the `selectedDate` state variable (only used to sync with the calendar). Remove now-unused imports (`CalendarIcon`, `Calendar`, `Popover`, `PopoverTrigger`, `PopoverContent`). The native `<input type="date">` is keyboard navigable by default.

---

## Files Changed

| File | Change |
|------|--------|
| `frontend/src/components/shared/detail-layout.tsx` | URL/icon color in header |
| `frontend/src/components/companies/company-detail.tsx` | Ratings keys, description placement, markdown, cursor, links filter+sort |
| `frontend/src/components/ui/markdown-content.tsx` | New reusable markdown component |
| `frontend/src/components/companies/company-table.tsx` | Remove action buttons |
| `frontend/src/components/companies/company-form.tsx` | Layout + textarea heights |
| `frontend/src/components/events/schedule-dialog.tsx` | Remove calendar popover button |

**Dependency added:** `react-markdown`, `remark-gfm`
