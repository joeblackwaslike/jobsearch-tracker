# Iteration 2 Design — Combobox fixes, URL import improvements, multi-location

**Date:** 2026-02-28
**Status:** Approved

---

## Overview

Four groups of work:

1. Fix combobox scroll/filter bugs across company and application forms
2. Replace CORS-proxy URL fetching with a Supabase Edge Function (Browserless)
3. Improve URL import data extraction (jsonLD-first, HTML→markdown, auto-create company)
4. Migrate `application.location` (single string) to `application.locations` (text array)

---

## Section 1 — Combobox scroll/filter fixes

### SourceCombobox

**Root cause:** `CommandInput value={value}` uses the *selected value* as the live cmdk filter. When a value is already selected (e.g. `"linkedin"`), the list collapses to only matching items — nothing to scroll.

**Fix:** Add a separate `search` state (same pattern as `IndustryCombobox`). Wire `CommandInput` to `search`/`setSearch`. Filter items against `search`. On select, call `onChange(val)` and reset `search` to `""`. The `CommandEmpty` "Use X" fallback uses `search` as the custom value. On popover close, reset `search`.

### IndustryCombobox / CityCombobox

**Root cause:** Both have correct separate search states. The scroll issue is the `CommandList` inside `PopoverContent` — shadcn's default `max-h-[300px] overflow-y-auto` class can be masked by the parent container.

**Fix:** Add `className="max-h-[300px] overflow-y-auto"` explicitly to `CommandList` in both components.

### Company table per-row buttons

The code (`company-table.tsx`, `company-card.tsx`) is already clean — no per-row edit/archive buttons exist. This is a stale dev server / HMR artifact. No code changes required; a hard refresh resolves it.

---

## Section 2 — Supabase Edge Function for Browserless fetch

### Edge function

New file: `supabase/functions/fetch-job-url/index.ts`

- Accepts `POST { url: string }`
- Reads `BROWSERLESS_API_KEY` from Deno env
- Calls `https://chrome.browserless.io/content?token=KEY` with `{ url }` body
- Returns `{ html: string }`
- API key lives in `supabase/.env` (local) and Supabase project secrets (production) — never in `frontend/.env.local`

### Frontend changes

In `frontend/src/lib/url-import.ts`, `fetchJobFromUrl` replaces the entire direct-fetch + CORS-proxy chain with a single Supabase functions call:

```ts
const { data, error } = await supabase.functions.invoke("fetch-job-url", {
  body: { url },
});
if (error) throw new Error("Failed to fetch job posting");
html = data.html;
```

No fallback chain — the edge function is the sole fetch mechanism.

---

## Section 3 — Extraction improvements + auto-create company

### jsonLD-first ordering in `extractFromMetaTags`

Reorganize `extractFromMetaTags`:
1. Parse JSON-LD `<script type="application/ld+json">` **first**
2. If a `JobPosting` node is found, populate all fields and skip OG/meta entirely
3. The `description` field from JSON-LD is HTML — convert to markdown using `turndown`
4. Only fall through to OG/meta selectors when JSON-LD finds nothing useful

Rename internally to `extractStructuredData` (no public API change).

### Auto-create company on form open

When `FullApplicationForm` opens with `importData.companyName` set, a `useEffect` fires:

1. Calls `createCompany.mutateAsync({ name: importData.companyName })`
2. Sets `company_id` and `company_name` in the form via `setValue`
3. `CompanyCombobox` shows the resolved company as already selected — no user action required

If creation fails (network error, duplicate), the form falls back to the current manual flow with `initialSearchText` pre-filled so the user can retry.

---

## Section 4 — Location → Locations

### DB migration

New file: `supabase/migrations/TIMESTAMP_application_locations.sql`

```sql
ALTER TABLE applications ADD COLUMN locations TEXT[] DEFAULT '{}';
UPDATE applications SET locations = ARRAY[location] WHERE location IS NOT NULL AND location != '';
ALTER TABLE applications DROP COLUMN location;
```

### TypeScript types

- `ApplicationWithCompany`: remove `location: string | null`, add `locations: string[]`
- `ExtractedJobData`: change `location?: string` to `locations?: string[]`
- Extraction logic: `jobLocation` in JSON-LD can be an array — collect all values

### FullApplicationForm

- Schema: `location: z.string()` → `locations: z.array(z.string()).default([])`
- Replace `CityCombobox` with new `CityMultiCombobox` component
- `CityMultiCombobox`: user picks a city → added as a badge-pill to an array (similar UX to `TagInput`); pills are removable
- `formValuesToPayload`: `location` → `locations`

### ApplicationDetail

- Replace single location string display with a flex row of small badges
- If `locations` is empty, render `--`

### ApplicationTable

- Display `locations.join(", ")` (or just first value if space is tight)

### Filters

- Location filter updated to use Postgres array-contains (`@>`) logic

---

## Files affected (summary)

| File | Change |
|------|--------|
| `frontend/src/components/applications/source-combobox.tsx` | Separate search state |
| `frontend/src/components/companies/industry-combobox.tsx` | Explicit CommandList max-h |
| `frontend/src/components/applications/city-combobox.tsx` | Explicit CommandList max-h |
| `frontend/src/lib/url-import.ts` | Browserless edge fn call, jsonLD-first, locations[] |
| `frontend/src/components/applications/url-import-dialog.tsx` | Pass locations[] |
| `frontend/src/components/applications/full-application-form.tsx` | locations[], auto-create company, CityMultiCombobox |
| `frontend/src/components/applications/city-combobox.tsx` | New CityMultiCombobox export (or separate file) |
| `frontend/src/components/applications/application-detail.tsx` | Display locations[] |
| `frontend/src/components/applications/application-table.tsx` | Display locations[].join |
| `frontend/src/components/applications/application-filters.tsx` | Array contains filter |
| `frontend/src/lib/queries/applications.ts` | Updated types |
| `supabase/functions/fetch-job-url/index.ts` | New edge function |
| `supabase/migrations/TIMESTAMP_application_locations.sql` | DB migration |
