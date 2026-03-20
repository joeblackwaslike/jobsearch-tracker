# Welcome to the Jungle

## domains:
* welcometothejungle.com
* www.welcometothejungle.com

## Detection
Hostname is `welcometothejungle.com` and path includes `/companies/{slug}/jobs/`.

```ts
(hostname === "welcometothejungle.com" || hostname === "www.welcometothejungle.com")
&& /\/companies\/[^/]+\/jobs\//.test(pathname)
```

## URL Patterns
- Jobs listing: `https://www.welcometothejungle.com/en/jobs`
- Job detail: `https://www.welcometothejungle.com/{locale}/companies/{company-slug}/jobs/{job-slug}_{location-suffix}`
  - Example: `/en/companies/dataiku/jobs/marketing-campaign-operations-manager_new-york`
  - Example: `/fr/companies/dataiku/jobs/responsable-marketing_paris`
  - `{locale}` is `en` or `fr` (both variants exist)
  - `{location-suffix}` is a location slug appended with underscore (e.g. `_new-york`, `_remote`)

## Application Method
Redirect to external company ATS. WTTJ does not host application forms — the Apply button
navigates the user to the company's ATS (Greenhouse, Ashby, Lever, Workday, etc.).

The Apply button is **not present in server-rendered HTML** — it is injected by React after
page load. However, the job title and company are available in the SSR HTML.

## Intent Tracking

### Data extraction (SSR — reliable)

```js
// Company name — two reliable methods:

// Method 1: from URL slug (most reliable)
location.pathname.match(/\/companies\/([^/]+)\/jobs\//)?.[1]
  // e.g. "dataiku" — may need humanization (replace hyphens, title-case)

// Method 2: from OG title (more human-readable, pre-humanized)
// OG title format: "{Job Title}  – {Company} – {Contract Type} – {Location}"
document.querySelector('meta[property="og:title"]')?.content
  ?.split('–')[1]?.trim()
  // e.g. "Dataiku"

// Job title
// Method 1: OG title (everything before first " – ")
document.querySelector('meta[property="og:title"]')?.content
  ?.split('–')[0]?.trim()
  // e.g. "Marketing Campaign Operations Manager"

// Method 2: H2 (first one is job title in listing context)
document.querySelector('h2')?.textContent?.trim()
```

### Apply button (JS-rendered — watch for click)
The Apply button is rendered by React after page load. Use MutationObserver or click-event
delegation on the document root to detect clicks matching an "apply" button:

```js
document.addEventListener('click', (e) => {
  const el = e.target.closest('a[href], button');
  if (!el) return;
  const text = el.textContent.toLowerCase();
  const href = el.getAttribute('href') ?? '';
  if (text.includes('apply') || href.includes('apply')) {
    // Record intent
    const atsDomain = extractDomain(href); // may be null if JS-navigated
  }
}, true);
```

### Is the ATS URL in the Apply href?
**Unknown from curl.** The Apply button is JS-rendered; its `href` value is not in the SSR HTML.
Needs browser verification. If the ATS URL is in the href, `atsDomain` can be decoded before
the redirect; if not, use `null`.

## Extension Interception Strategy

1. Detect job detail page via URL pattern check
2. Extract company from URL slug (Method 1 above) — reliable
3. Extract job title from OG title (Method 1 above) — reliable
4. Register click listener for Apply button (document-level delegation)
5. On click: capture `href` if available, extract `atsDomain` from it
6. Call `record(jobData, "welcometothejungle", atsDomain)` (intent tracking)

**Trigger on Apply click** (not page load) to minimize false positives from browsing.

## Notes
- Site is React SPA but job content is server-rendered (290k HTML, rich content)
- `og:title` format confirmed: `"{Title}  – {Company} – {Type} – {Location}"` (double space before dashes)
- French locale (`/fr/...`) follows same URL and DOM structure
- Researched via: curl + HTML extraction (zero browser tokens), 2026-03-07
