# Design: Next Iteration 2

**Date:** 2026-02-21
**Source:** `docs/next-iteration.md`

---

## Overview

Six categories of work across General UI, Applications, Companies, Interviews, and DB migrations. All changes are frontend-first with two small DB schema additions.

---

## 1. New Shared UI Components

### `frontend/src/components/ui/url-input.tsx`

Controlled component wrapping `<Input>`.

**Props:** `value`, `onChange`, `validate=true`, `allowBlank=true`, `id?`, `placeholder?`, `className?`, `error?`

**Behavior:**
- On blur: strip whitespace, then validate with `new URL(value)` if non-empty, or flag invalid if empty and `!allowBlank`
- Shows inline `<p className="text-sm text-destructive">` error when invalid
- Used via react-hook-form `<Controller>` in all forms
- Accepts optional `error` prop for form-level error passthrough

### `frontend/src/components/ui/star-rating.tsx`

**Props:** `value: 1–5 | null`, `onChange: (v: number | null) => void`

**Behavior:**
- 5 `<Star>` icons (lucide-react, `size-5`) in a row
- Stars ≤ value: `fill-yellow-400 text-yellow-400`; stars > value: outline
- Click on the currently-selected star → clears to null
- Hover preview on unfilled stars
- Accessible: `role="radiogroup"` on container, each star is a `<button>`

---

## 2. Application Changes

### `full-application-form.tsx`
- **Remove auto-resume**: Delete the `useEffect` that reads resume from localStorage and pre-populates `selectedResumeId`. `EasyAddForm` retains this behavior.
- **Remove "Resume" label**: Remove the `<Label>Resume</Label>` from the Documents fieldset.
- **Salary range**: Update `SalaryRangeSlider` props to `min={100000}` `max={600000}` (annual), `$1k` steps.
- **Job URL**: Replace plain `<Input>` with `<UrlInput>` via `<Controller>`.
- **`defaultStatus` prop**: Accept optional `defaultStatus?: string` prop (default `"applied"`). Used by Bookmark button to open with `"bookmarked"` status.

### Bookmark Button

Two locations get a new icon-only button to the **left** of the existing primary button:

| Location | Existing button | New button |
|---|---|---|
| Applications page header | "New Application" | `<Bookmark size={16} />` `aria-label="Bookmark job"` |
| EasyAddForm trigger area | "Quick Add" | `<Bookmark size={16} />` `aria-label="Bookmark job"` |

Both open `FullApplicationForm` (or `EasyAddForm`) with `defaultStatus="bookmarked"`.

### DB Migration: `applied_at` default
```sql
ALTER TABLE applications
  ALTER COLUMN applied_at SET DEFAULT (now() AT TIME ZONE 'utc');
```

---

## 3. Company Form Changes (`company-form.tsx`)

### Field Group Restructure

| Fieldset | Fields |
|---|---|
| **Basic Information** | Name, Description, Industry (dropdown), Size (select), Location (CityCombobox), Founded (year input) |
| **Company Links** | Website, Careers Page, LinkedIn, Glassdoor, News, Crunchbase — all `UrlInput` |
| **Company Ratings** | Overall, Work-Life Balance, Compensation, Career Growth, Management, Culture — all `StarRating` |
| **Research Notes** | Culture + Benefits (side-by-side), Pros + Cons (side-by-side), Tech Stack (single-line), Tags (TagInput), Researched (checkbox) |
| **Contacts** | Edit mode only: `<CompanyContacts companyId={company.id} />`. Hidden in create mode. |

### Field-by-Field Changes

- **Industry**: `<Input>` → `<Select>` with the 50-item list (see below). Stored as `string`.
- **Founded**: `<Input type="date">` → `<Input type="number" placeholder="e.g. 2012" min={1800} max={2099}>`. Stored as string year.
- **Location**: `<Input>` → `<CityCombobox>` (same component as application form).
- **Links**: Add `crunchbase` field to `linksSchema`; all 6 link fields use `<UrlInput>` via `<Controller>`.
- **Ratings**: 6 `<Select>` dropdowns → 6 `<StarRating>` components. Schema stays `z.string()` (`"1"`–`"5"`); star component converts to/from number internally.
- **Tags**: `z.string()` comma-separated `<Input>` → `z.array(z.string())` with `<TagInput>`. Update `companyToFormValues` and `formValuesToPayload`.
- **Culture + Benefits**: Stacked → `grid grid-cols-2 gap-4`.
- **Tech Stack**: `<textarea>` → `<Input>` (single line).
- **Contacts section**: Shown only when `mode === "edit" && company?.id`.

### Industry Options (50 items)
Analytics, Engineering Product and Design, Finance and Accounting, Human Resources, Infrastructure, Legal, Marketing, Office Management, Operations, Productivity, Recruiting and Talent, Retail, Sales, Security, Supply Chain and Logistics, Asset Management, Banking and Exchange, Consumer Finance, Credit and Lending, Insurance, Payments, Apparel and Cosmetics, Consumer Electronics, Content, Food and Beverage, Gaming, Home and Personal, Job and Career Services, Social, Transportation Services, Travel Leisure and Tourism, Virtual and Augmented Reality, Consumer Health and Wellness, Diagnostics, Drug Discovery and Delivery, Healthcare IT, Healthcare Services, Industrial Bio, Medical Devices, Therapeutics, Education, Agriculture, Automotive, Aviation and Space, Climate, Defense, Drones, Energy, Manufacturing and Robotics, Construction, Housing and Real Estate, Government

---

## 4. Interview Changes

### `schedule-dialog.tsx`
- **Description**: `<textarea>` → `<Input>` (single line). Placeholder: `"Description of interview"`.
- **Meeting URL**: Replace `<Input>` with `<UrlInput>` via `<Controller>`.
- **Notes**: New `<textarea>` below Description. Label: `"Notes"`. Schema: `notes: z.string().default("")`. Persisted to `events.notes` column.

### `duration-combobox.tsx` — Bug Fixes

**Fix 1 — Duplicate value bug:** `{ value: 15, label: "20 min" }` → `{ value: 20, label: "20 min" }`.

**Fix 2 — Enter key doesn't select typed value:** Add a dynamic `CommandItem` at the top of the list:
- Visible when: typed input is a valid positive integer AND doesn't match a preset value exactly
- Label: `"Use {N} min"` (where N is the parsed integer)
- `value="__custom__"`
- `onSelect`: calls `onChange(parsed)`, clears input, closes popover
- Being first in the list, it receives keyboard focus on first keystroke → Enter selects it

### DB Migration: `events.notes`
```sql
ALTER TABLE events
  ADD COLUMN notes text NOT NULL DEFAULT '';
```

---

## 5. Implementation Order

1. DB migrations — `applied_at` default, `events.notes`
2. New UI components — `url-input.tsx`, `star-rating.tsx`
3. Duration combobox fix — 20min bug + dynamic "Use X min" item
4. Interview dialog — description single-line, Notes field, UrlInput for meeting URL
5. Application changes — remove auto-resume, remove label, salary 100–600k, UrlInput, Bookmark button
6. Company form — full restructure (largest change)

---

## New Files

| File | Purpose |
|---|---|
| `frontend/src/components/ui/url-input.tsx` | HTTP URL input with validation |
| `frontend/src/components/ui/star-rating.tsx` | 5-star rating widget |
| `supabase/migrations/YYYYMMDD_applied_at_default.sql` | Set applied_at default |
| `supabase/migrations/YYYYMMDD_events_notes.sql` | Add notes column to events |

## Modified Files

| File | Change |
|---|---|
| `frontend/src/components/interviews/duration-combobox.tsx` | Fix 20min bug + Enter key support |
| `frontend/src/components/interviews/schedule-dialog.tsx` | Description single-line, Notes field, UrlInput |
| `frontend/src/components/applications/full-application-form.tsx` | Remove auto-resume, salary range, UrlInput, defaultStatus prop |
| `frontend/src/components/applications/easy-add-form.tsx` | Bookmark button support |
| `frontend/src/components/applications/application-table.tsx` (or page) | Bookmark button in header |
| `frontend/src/components/companies/company-form.tsx` | Full restructure per spec |
