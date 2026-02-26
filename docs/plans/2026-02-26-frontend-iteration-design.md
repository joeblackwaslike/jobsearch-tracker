# Frontend Iteration Design — 2026-02-26

## Scope

Six groups of fixes across company detail, companies table, companies URL state, events forms, and seed data.

---

## Group 1: Company Detail Bugs

### Links Parsing

The company form saves links as a flat object `{website: "url", careers: "url", ...}`. The detail view incorrectly guards with `Array.isArray()`, which is always false for an object, so the links tab always shows "No links added."

**Fix:** Convert the flat object to `CompanyLink[]` using `Object.entries`, mapping each key to `{type: key, name: LINK_NAMES[key], url: value}`. Filter out empty values.

### Tech Stack / Benefits Parsing

`parseList` splits only on `\n`, but the DB stores comma-separated values (e.g. `"React, TypeScript, AWS"`).

**Fix:** Change the split regex to `/[,\n]/` and trim each item.

### Ratings Keys

DB stores camelCase keys (`workLifeBalance`, `careerGrowth`) but the code maps against `work_life_balance`, `career_growth`, causing those rows to silently not render.

**Fix:** Update the row config to use camelCase keys. Add `["Culture", "culture"]` and `["Management", "management"]` rows.

### Heading Section

- Website URL and location are already wired into `meta[]` — they will appear correctly once links parsing is fixed.
- Remove `tags` from the badges fragment. Keep only the `Researched` badge.
- Change the Researched badge to `bg-foreground text-background` for a solid black appearance.

### Data Quality Card

Wrap the data quality block in `<div className="rounded-md border bg-muted/30 p-3">` to give it subtle visual separation.

### Section Heading Sizes

Change "Data Quality", "Ratings", and "Description" headings from `text-sm font-medium` to `text-lg font-medium`.

---

## Group 2: Companies Table Fixes

### Remove Tags Column

Delete the `tags` column definition from `companyTableSchema` in `table-schemas.tsx`.

### Add Edit Icon to Row Actions

In `companies.tsx`, the `rowActions` callback currently renders only the archive button. Add a pencil `<Button>` before it that calls `setFormMode("edit")`, `setEditingCompany(company)`, `setFormOpen(true)`. Stop propagation on click.

---

## Group 3: Companies Page URL-Based Detail State

Replace local `selectedId` React state with a URL search param `detail`.

### Route Schema

Add `detail?: string` to `CompaniesSearch`. Update `validateSearch` to include it.

### Selection / Deselection

- **Select:** `navigate({ to: "/companies", search: (prev) => ({ ...prev, detail: company.id }) })` — pushes a new history entry so back button works.
- **Deselect (close panel):** `navigate({ to: "/companies", search: (prev) => ({ ...prev, detail: undefined }) })` — also pushes.
- **Read:** Use `searchParams.detail ?? ""` in place of `selectedId` everywhere.

### Query

`useCompany` is already called with the selected ID — feed it `searchParams.detail ?? ""` directly.

---

## Group 4: Company Detail Apps Tab

### Prerequisites

Add `detail?: string` to the applications route's `validateSearch` (same pattern as companies). The applications page reads `detail` from the URL and uses it as the selected app ID, replacing any existing local state for that.

### Tab Label with Count

Lift `useApplicationsByCompany` from inside `AppsTab` up to `CompanyDetail`. Pass `apps` and `companyId` into `AppsTab` as props. Use `apps.length` in the tab label: `Apps (${apps.length})`.

### Remove Redundant UI

Remove the "All Applications" button and the `"{N} application(s)"` count span from `AppsTab`.

### App Card Navigation

Each app card gets an `onClick`:
```tsx
navigate({ to: "/applications", search: { detail: app.id } })
```
Pushes a new history entry. Import `useNavigate` in `company-detail.tsx`.

---

## Group 5: Events Form Fixes

### Date Field (Option C: Input + Calendar Button)

Replace the single calendar-picker button with a two-element row:
1. `<Input type="date">` — tabbable, typeable, wired to `register("date")`.
2. A small calendar icon button with `tabIndex={-1}` — opens the existing date picker popover (mouse-only). When a date is selected from the popover, it syncs back via `setValue("date", ...)` and updates `selectedDate`.

### Time Field — Hide Clock Icon

Add `className="[&::-webkit-calendar-picker-indicator]:hidden"` to the time `<Input>`. Hides the browser's native clock icon via a Tailwind arbitrary pseudo-element selector; the input remains fully functional and tabbable.

### Contact Combobox Keyboard Access

Replace the `useEffect` + `setTimeout` focus approach with Radix's `onOpenAutoFocus` on `PopoverContent`:
```tsx
onOpenAutoFocus={(e) => {
  e.preventDefault();
  searchInputRef.current?.focus();
}}
```
Fires after Radix mounts the popover content, overriding Radix's default focus behavior and reliably landing keyboard focus on the search input.

This fix applies to both `schedule-dialog.tsx` and `add-event-dialog.tsx` (both use `ContactCombobox`).

---

## Group 6: Seed Data

Add `culture` and `management` rating keys to each company entry in both `supabase/seed.sql` and `supabase/seed.ts`, with realistic values consistent with the existing ratings for each company.

---

## Implementation Order

1. Group 1 — Company detail bugs (links, parsing, ratings, heading, styling)
2. Group 2 — Companies table (remove tags col, add edit icon)
3. Group 3 — Companies URL state (`?detail=<id>`)
4. Group 4 — Apps tab (depends on Group 3 URL pattern + applications route update)
5. Group 5 — Events form fixes (independent)
6. Group 6 — Seed data (independent)

Groups 5 and 6 are fully independent and can be done in any order after Group 1.
