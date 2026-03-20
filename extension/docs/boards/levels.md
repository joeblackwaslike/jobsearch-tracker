# Levels.fyi

## Detection

- Hosts: `www.levels.fyi`, `levels.fyi`
- Job detail pages use a **query param**, not a path-based ID:
  - `levels.fyi/jobs?jobId={id}` (global search)
  - `levels.fyi/jobs/company/{company-slug}/title/{title-slug}?jobId={id}` (filtered)
  - Example: `levels.fyi/jobs/company/google/title/software-engineer?jobId=123141784149598918`

**Detection signal**: `location.pathname.startsWith('/jobs')` AND `new URLSearchParams(location.search).get('jobId') !== null`

> **⚠️ Existing adapter URL detection is wrong**: The current adapter checks for `/jobs/{id}/{company}/{title}` path structure (4 segments), but the real URL puts the ID in a `?jobId=` query param, not in the path.

## Job Detail Page

Confirmed via browser eval on `levels.fyi/jobs/company/google/title/software-engineer?jobId=123141784149598918`:

```json
{
  "jobId": "123141784149598918",
  "jobTitleH1": {
    "text": "Senior Software Engineer, XR Engineering Productivity",
    "cls": "",
    "parentCls": "job-details-header-module-scss-module__CqpRoW__jobTitleRow"
  },
  "companyNameEl": {
    "text": "Google",
    "cls": "company-jobs-preview-card-module-scss-module__h_Bkua__companyNameAndPromotedContainer",
    "tag": "SPAN"
  },
  "applyNowButton": {
    "href": "https://careers.google.com/jobs/results/112862209423352518-senior-software-engineer/?src=levels.fyi&utm_source=levels.fyi",
    "target": "_blank"
  }
}
```

**h1 structure**: Two h1 elements on the page:
1. `"Google Software Engineer Jobs"` — page header (ignore)
2. `"Senior Software Engineer, XR Engineering Productivity"` — job title (use this)

**Title selector**: Second h1 — `document.querySelectorAll('h1')[1]` or:
- `document.querySelector('[class*="jobTitleRow"] h1')`
- Or: `Array.from(document.querySelectorAll('h1')).find(h => !h.textContent.includes('Jobs'))`
- JSON-LD also available: `script[type="application/ld+json"]` → `@type=JobPosting` → `title`

**Company selector**: `[class*="companyName"]` → text `"Google"` (class is a CSS module hash but `companyName` substring is stable)

Also available from URL: `location.pathname.split('/')[3]` when on `/jobs/company/{slug}/...` pages (= `"google"` → capitalize → `"Google"`)

## Apply Flow

Levels.fyi is a **pure aggregator** — no hosted application form.

```html
<a href="https://careers.google.com/jobs/results/..."
   class="...applyNowButton..."
   target="_blank" rel="noreferrer">Apply Now</a>
```

- Apply button: `[class*="applyNowButton"]` — opens external company ATS in **new tab**
- URL includes `utm_source=levels.fyi` tracking param
- External ATS varies: Google Careers, Greenhouse, Lever, Workday, Ashby, etc.

## Recommended Strategy

**`watchForIntent`**

1. Detect `location.pathname.startsWith('/jobs')` AND `?jobId=` param present
2. Extract title (second h1) + company (`[class*="companyName"]`)
3. Store `PendingIntent`
4. ATS adapter fires `TRACK` when user applies on external site

## Current Adapter Issues

From `extension/src/content/adapters/levels.ts`:

| Issue | Current (broken) | Fix |
|-------|-----------------|-----|
| URL detection | `parts[0]==='jobs' && parts.length>=4` | Check `?jobId=` param |
| Title | `document.querySelector('h1')` — gets page header | Use second h1 or `[class*="jobTitleRow"] h1` |
| Company | `parts[2]` as company slug | Use `[class*="companyName"]` or URL slug with correct path index |

## Notes

- Levels.fyi stores the selected job in `?jobId=` param — URL changes when clicking different jobs in the list without full page reload
- The page title format: `"{title} | {Company} | Levels.fyi"` — also usable for extraction
- JSON-LD `JobPosting` schema is present with full title — most reliable extraction method
- `companyName` CSS module class is stable despite hash suffix (hashed CSS modules keep the base name as substring)
- User-provided URL format: `levels.fyi/jobs?locationSlug=united-states&jobId={id}` — `?jobId=` is always present
