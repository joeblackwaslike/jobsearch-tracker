# Wellfound (formerly AngelList)

## Detection

- Host: `wellfound.com`
- URL pattern: `wellfound.com/jobs/{id}-{slug}`
- Example: `wellfound.com/jobs/3941681-forward-deployed-engineer`
- Body class on job detail page: `route--JobListing`

## Job Detail Page

Confirmed via browser research on `wellfound.com/jobs/3941681-forward-deployed-engineer`:

**Page title format**: `"{Title} at {Company} • {location} | Wellfound"`

```text
"Forward Deployed Engineer at GrowthX • United States • Remote (Work from Home) | Wellfound"
```

**DOM structure**:

```text
h1                           → job title: "Forward Deployed Engineer"
a[href*="/company/"]         → company name: "GrowthX" (links to wellfound.com/company/growthx-5)
h2.mb-2.text-2xl             → "About the job" (NOT company)
h2.text-2xl.text-brand-pink  → "About the company" (section header, NOT company name)
h3.inline.text-md.font-semibold → company name (repeated): "GrowthX"
```

**Selectors**:

- **Title**: `h1` (always the job title on `route--JobListing` pages)
- **Company**: `a[href*="/company/"]` → first match is the company link
- **Company alt**: `h3.inline` or extract from page title via `" at "` split

**No h1 class** — h1 is unstyled/component-level, reliable by tag on this route.

## Apply Flow

Wellfound **hosts its own application flow** (not an external ATS redirect).

- Apply requires login — unauthenticated users see "Not Available" in place of the apply button
- The apply button is rendered as a `<button>` element (15 buttons on the page, 0 inputs)
- No links to Greenhouse/Lever/Workday/Ashby found in the DOM
- Wellfound collects applications through Wellfound Talent profile system

> **TODO**: Login and research the apply flow:
>
> - What button selector triggers apply? (`button[class*="apply"]`? A specific label?)
> - Does clicking Apply open a modal, a new page, or an inline form?
> - What network request fires on submit? (POST to `wellfound.com/api/...`?)
> - Is there a confirmation message/URL?

## Recommended Strategy

**`watchForSubmission`** — Wellfound hosts the apply flow itself, so XHR intercept is feasible.

Likely flow:

1. User clicks Apply button (requires login)
2. Wellfound's apply modal/page opens
3. User submits their Wellfound profile → POST to Wellfound API
4. Confirmation shown in modal or redirect

Alternatively, **`watchForIntent`** if the apply API endpoint is difficult to intercept.

## Current Adapter Selectors

From `extension/src/content/adapters/wellfound.ts` (pre-research):

- Title: `h1[class*='job-title']`, `[class*='job-title'] h1` (may be wrong — confirmed h1 has no specific class)
- Company: `[class*='company-name'] a`, `a[class*='startup-name']` (may be wrong — confirmed it's `a[href*="/company/"]`)

**The existing title selector likely needs updating** — the real h1 has no class, use bare `h1` on `route--JobListing` pages.

## Notes

- Wellfound jobs page listing: `wellfound.com/jobs` is a filterable SPA with 130k+ jobs
- Login wall prevents seeing the apply button / form without a Wellfound account
- The `Not Available` text observed near apply area likely means "apply unavailable without login"
- Company role listing URL alternative: `wellfound.com/company/{slug}/jobs/{id}` (may also exist)
- User-provided direct job URL format: `wellfound.com/jobs?job_listing_slug={id}-{slug}` also works
