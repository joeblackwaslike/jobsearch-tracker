# Iteration Design — 2026-02-27

## Summary

Four discrete frontend changes for this iteration, in order of complexity.

---

## 1. Companies Table — Remove Per-Row Buttons

**Status:** Likely already done.

`company-table.tsx` has no explicit edit/archive buttons per row — rows are click-to-open-edit already. Verify visually during implementation; if nothing to remove, mark complete.

---

## 2. Industry Select — Searchable Combobox

**File:** `frontend/src/components/companies/company-form.tsx`

**Current state:** Plain `<Select>` with 55+ hardcoded `INDUSTRY_OPTIONS`.

**Change:** Replace with a new `IndustryCombobox` component that uses the `Command` + `Popover` pattern (same as `CityCombobox`). No free-text entry needed — just filter the existing `INDUSTRY_OPTIONS` array. Component lives at `src/components/companies/industry-combobox.tsx`.

---

## 3. Application Timeline — Bookmarked Date Visibility

**File:** `frontend/src/components/applications/application-detail.tsx`

**Current state:** "Bookmarked" milestone always renders using `created_at`. "Applied" milestone only renders when `applied_at` is set.

**Change:** Only show the "Bookmarked" milestone when `application.applied_at` is falsy. Wrap the bookmarked `<div>` block in `{!application.applied_at && ...}`.

---

## 4. URL Import Feature

### Overview

A new entry point that lets users paste a job posting URL, fetches and parses JSON-LD / meta / HTML to extract job data, then opens the full application form pre-filled.

### New files

- `frontend/src/lib/url-import.ts` — fetch + parse utility (based on POC in `docs/next-iteration.md`)
- `frontend/src/components/applications/url-import-dialog.tsx` — minimal single-field dialog

### Modified files

- `frontend/src/components/applications/full-application-form.tsx` — extend `prefill` prop to accept full `ExtractedJobData` shape
- `frontend/src/routes/_authenticated/applications.tsx` — add "Import from URL" button next to existing add buttons

### UX Flow

```
Applications page header:
  [+ Easy Add]  [↓ Import from URL]

  ↓ user clicks "Import from URL"

┌──────────────────────────────┐
│  Import from URL             │
│                              │
│  Job posting URL:            │
│  [https://...          ]     │
│  [fetching... spinner]       │
│                              │
│  [Cancel]        [Import]    │
└──────────────────────────────┘

  ↓ fetch on blur OR on Import click
  ↓ close URL dialog
  ↓ open FullApplicationForm with prefill
  ↓ submit button auto-focused (Enter submits)
```

### Fetch strategy

- Direct `fetch()` first (works if CORS-enabled)
- Falls back to `allorigins.win` then `corsproxy.io`
- `// TODO: move to a server-side /api/fetch-url route to eliminate third-party proxy dependency`

### Failure handling

If fetch fails or returns no parseable data: open `FullApplicationForm` with only `url` pre-filled. No error state shown to user.

### Prefill fields mapped from `ExtractedJobData`

| Extracted field | Form field |
|---|---|
| `position` | `position` |
| `companyName` | company search text (ComboBox) |
| `location` | `location` |
| `workType` | `work_type` |
| `employmentType` | `employment_type` |
| `salaryMin` / `salaryMax` / `salaryCurrency` | `salary.min` / `salary.max` / `salary.currency` |
| `jobDescription` | `job_description` |
| `source` | `source` |
| `jobUrl` | `url` |
