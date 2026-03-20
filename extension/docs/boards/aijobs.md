# aijobs.net

## domains:
* aijobs.net
* www.aijobs.net

## Detection
URL path matches `/job/{slug}/` on `aijobs.net`.

```ts
hostname === "aijobs.net" && /^\/job\/[^/]+\/$/.test(pathname)
```

## URL Patterns
- Listing: `https://aijobs.net/` or `https://aijobs.net/jobs/`
- Job detail: `https://aijobs.net/job/{title-slug-{numericId}}/`
  - Example: `/job/senior-software-engineer-aiml-ai-and-infrastructure-sunnyvale-ca-usa-10366/`
- Apply gateway: `https://aijobs.net/job/{hashId}/apply/`
  - Note: `{hashId}` is a different, shorter ID from the slug ID (e.g. `lwmUs8LhTcaHgq7`)
  - When **not logged in**: 302 → redirects back to the job detail page (useless)
  - When **logged in**: presumably redirects to the external company ATS URL

## Application Method
Redirect aggregator — Apply redirects (via login gate) to external company ATS.

## Intent Tracking

### Limitation: company name not on job detail page
The job detail page HTML **does not include the company name**. The page only shows:
- Job title (H1, page title)
- Location, salary, level, job type
- Skills, perks, description

The company name appears only in the **Related Jobs** section (other jobs from same company) and is not reliably extractable from the current job's DOM.

**Workaround candidates:**
1. Parse company from the apply gateway URL hash ID via an API call (unknown endpoint)
2. Require user to be logged in — the full job data is likely returned via JS API after login

### DOM selectors (what IS extractable)
```js
// Job title
document.querySelector('h1')?.textContent?.trim()
// or
document.querySelector('title')?.textContent?.split(' - ')[0]?.trim()

// Location (not company)
// visible in page text near salary info, no stable selector found
```

### Apply button
```js
document.querySelector('a.btn.btn-primary[href*="/apply/"]')?.href
// href pattern: /job/{hashId}/apply/
```

## Extension Interception Strategy

**Recommendation: skip automatic intent tracking for aijobs.net.** The missing company name makes reliable intent recording impossible without additional API calls.

If implemented, limit to:
- Record intent on Apply button click
- Job title from H1
- Company = `null` (unknown) → relies on short-TTL fuzzy matching at the ATS end

## Notes
- Powered by Foorilla (`foorilla.com`) — same engine likely used for related scraper boards
- The apply hash ID (`lwmUs8LhTcaHgq7`) is distinct from the numeric slug ID — unclear what it encodes
- No JSON-LD structured data on job pages
- Anti-bot: no Cloudflare observed, standard nginx server
- Researched via: curl + DOM inspection (zero browser tokens), 2026-03-07
