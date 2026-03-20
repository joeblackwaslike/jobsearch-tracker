# Builtin (Built In)

## Detection

- Hosts: `builtin.com`, `www.builtin.com`
- URL pattern: `builtin.com/job/{slug}/{id}`
- Example: `builtin.com/job/software-engineer-new-grad-2026/7670222`

## Job Detail Page

Confirmed via browser eval on `builtin.com/job/software-engineer-new-grad-2026/7670222` (Benchling):

```json
{
  "url": "https://builtin.com/job/software-engineer-new-grad-2026/7670222",
  "h1": "Software Engineer, New Grad (2026)",
  "h1Class": "fw-extrabold fs-xl mb-sm",
  "directApply": false,
  "hiringOrganization": { "name": "Benchling" }
}
```

**Title selector**: `h1` (class `fw-extrabold fs-xl mb-sm`, but bare `h1` is sufficient)

**Company** — three reliable options (ranked):
1. **JSON-LD** (most reliable): `script[type="application/ld+json"]` → `@graph[?(@type=="JobPosting")].hiringOrganization.name`
2. **Page title**: `document.title` → `"{title} - {company} | Built In"` → split on ` - ` and ` | `
3. **DOM link**: `Array.from(document.querySelectorAll('a[href*="/company/"]')).find(a => a.textContent.trim())?.textContent.trim()`
   - Note: first `a[href*="/company/"]` wraps a logo `<img>` and has empty text — skip it

**h1 parent HTML** (confirms structure):
```html
<div class="mb-sm d-inline-flex align-items-center">
  <a href="/company/benchling" target="_blank"><picture>...</picture></a>
  <a href="/company/benchling" target="_blank" class="hover-underline text-pretty-blue font-barlow fw-med...">Benchling</a>
</div>
<h1 class="fw-extrabold fs-xl mb-sm">Software Engineer, New Grad (2026)</h1>
```

## Apply Flow

Builtin is a **pure aggregator** — no hosted application form.

```html
<a href="https://boards.greenhouse.io/benchling/jobs/7386982?gh_jid=7386982&gh_src=afbade281us"
   target="_blank" @click="applyClick"
   class="btn btn-lg bg-pretty-blue ...">Apply</a>
```

- Apply button opens external ATS in a **new tab** (`target="_blank"`)
- `directApply: false` confirmed in JSON-LD structured data
- Observed ATS: Greenhouse (`boards.greenhouse.io`) — other ATS providers also used
- `gh_src=afbade281us` — Builtin's Greenhouse source tracking param

## Recommended Strategy

**`watchForIntent`**

1. On `builtin.com/job/...`, extract title + company (prefer JSON-LD for company)
2. Store `PendingIntent` when user views the job
3. When Apply is clicked (new tab opens to ATS), the ATS adapter fires `TRACK`
4. Match by `atsDomain` + company name similarity

Alternatively: listen for the Apply `@click` event on the button before the new tab opens — but this is fragile since `target="_blank"` can't be easily intercepted pre-navigation in an extension content script.

## Current Adapter Selectors

From `extension/src/content/adapters/builtin.ts` (pre-research):
- Title: `h1[class*='job-title']`, `.job-info h1` — **WRONG**, real h1 class is `fw-extrabold fs-xl mb-sm`
- Company: `a[class*='company']`, `[class*='company-title']` — **WRONG**, real company link class is `hover-underline text-pretty-blue font-barlow fw-med...`

**Both selectors need updating.** Use `h1` + JSON-LD or page title for company.

## Notes

- Builtin has city-specific subdomains (`builtin.com/jobs/chicago` etc.) but job pages are always at the root domain
- `@click="applyClick"` on the apply button suggests a Vue.js frontend — class names may be stable
- `builtin.com` → may redirect to city variant — host matching on `builtin.com` covers all
- Some job listings may link to Lever, Workday, or other ATS providers — the external link target varies per posting
