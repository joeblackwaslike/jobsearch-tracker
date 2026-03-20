# TeamBlind (Blind)

## Detection

- Host: `www.teamblind.com`
- URL pattern: `teamblind.com/jobs/{id}` (numeric job ID)
- Example: `teamblind.com/jobs/311478158?page=1&remoteOnly=1&searchKeyword=Software+Engineer`
- Query params (`page`, `remoteOnly`, `searchKeyword`) are search-context — job ID is the only stable identifier

## Job Detail Page

Confirmed via browser eval on `teamblind.com/jobs/305253011` (Klaviyo - Lead Software Engineer):

```json
{
  "url": "https://www.teamblind.com/jobs/305253011",
  "title": "Lead Software Engineer - New Products at Klaviyo | Blind Job Board - Blind",
  "h1": "Lead Software Engineer - New Products",
  "h1Class": "text-lg/5 font-bold",
  "companyAnchor": { "text": "Klaviyo", "href": "https://www.teamblind.com/company/Klaviyo" },
  "applyBtn": { "href": "https://grnh.se/uv9rr89i3us", "text": "Apply" }
}
```

**Title selector**: `h1` (class `text-lg/5 font-bold` — or bare `h1`)

**Company** — two reliable options:
1. **Page title**: `document.title` → `"{title} at {company} | Blind Job Board - Blind"` → split on ` at ` (last occurrence before ` | `)
2. **DOM link**: `Array.from(document.querySelectorAll('a[href*="/company/"]')).find(a => a.textContent.trim())?.textContent.trim()`
   - First `a[href*="/company/"]` wraps a logo (empty text) — skip it; second has company name

**h2 structure**: `["Job Description", "Lead Software Engineer, New Products", "About the Company"]`
— h2s are section headers, not useful for company extraction.

## Apply Flow

TeamBlind is a **pure aggregator** — no hosted application form.

```json
{
  "tag": "A",
  "text": "Apply",
  "href": "https://grnh.se/uv9rr89i3us",
  "cls": "inline-flex items-center justify-center rounded-lg text-sm font-semibold ..."
}
```

- Apply button links to **external ATS via URL shortener** (`grnh.se` = Greenhouse shortlink)
- May also link directly to Lever, Workday, etc. depending on company
- No forms on the page (`forms: []`)
- No `greenhouse.io`, `lever.co`, etc. direct links visible — ATS URLs are hidden behind shorteners/redirects

## Recommended Strategy

**`watchForIntent`**

1. On `teamblind.com/jobs/{id}`, extract title + company
2. Store `PendingIntent` when user views the job
3. Apply button click opens ATS (via redirect chain) — ATS adapter fires `TRACK`
4. Match by company name similarity

## Current Adapter Selectors

From `extension/src/content/adapters/blind.ts` (pre-research):
- Title: `h1[class*='title']`, `.posting-header h1` — **WRONG**, real h1 class is `text-lg/5 font-bold`
- Company: `[class*='company-name']`, `.company-info a` — **WRONG**, real company is `a[href*="/company/"]` (skip first empty match)

**Both selectors need updating.** Use `h1` + page title or `a[href*="/company/"]` for company.

## Notes

- TeamBlind is primarily a professional community/forum (discussions, salary info) that also has a job board
- Job board URL: `teamblind.com/jobs` shows 10,000+ listings
- Company pages at `teamblind.com/company/{CompanyName}` with `/jobs` sub-path
- The numeric job IDs (`/jobs/305253011`) are TeamBlind's internal IDs, not the ATS job ID
- Page title og:title is generic (`"Blind - Anonymous and Professional Community"`) — use `document.title` instead
- `grnh.se` is Greenhouse's URL shortener — external links check for it won't find direct `greenhouse.io` URLs
