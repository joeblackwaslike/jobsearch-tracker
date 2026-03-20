# YCombinator Company Jobs

## domains:
* ycombinator.com
* www.ycombinator.com

## Detection
URL path matches `/companies/{slug}/jobs/{id}` on `ycombinator.com`.

```ts
hostname === "ycombinator.com" || hostname === "www.ycombinator.com"
&& /^\/companies\/[^/]+\/jobs\/[^/]+/.test(pathname)
```

## URL Patterns
- Company directory: `https://www.ycombinator.com/companies`
- Job listing: `https://www.ycombinator.com/companies/{company-slug}/jobs/{jobId}-{job-title}`
  - Example: `/companies/multifactor/jobs/lcpd60A-engineering-lead`
  - Example: `/companies/stardex/jobs/lag1C1P-customer-success-engineer-ai-data-migration`
  - Note: `{jobId}` is a short alphanumeric hash (e.g. `lcpd60A`), not a numeric ID

## Application Method

⚠️ **Critical finding:** The "Apply" button on YC company job pages links to `/apply`
(`apply.ycombinator.com/home`), which is the **Y Combinator batch application for companies
to join YC** — not a job seeker application. There is no direct job application form on
`ycombinator.com`.

**Actual application path:** Users interested in working at a YC company must either:
1. Navigate to `workatastartup.com` (YC's job board for seekers) and apply there, OR
2. Apply directly on the company's own careers page / ATS

**Relationship with workatastartup.com:**
- `workatastartup.com` is YC's job seeker platform — same portfolio companies, separate UX
- Application at `workatastartup.com/application` requires a YC account and redirects to login
- Job listings are loaded via client-side React (no job URLs in SSR HTML)
- The two platforms share infrastructure (both served from `bookface-static.ycombinator.com`)

## DOM Selectors (SSR — server-rendered)

```js
// Job title
document.querySelector('h1')?.textContent?.trim()

// Company name — first H2 after the H1
// (page structure: h1=job title, h2=company name, h2="About the role", h2=sections...)
document.querySelector('h2')?.textContent?.trim()
// or more robustly: the company slug from the URL
location.pathname.match(/\/companies\/([^/]+)\/jobs\//)?.[1]
  .replace(/-/g, ' ')  // rough name from slug
```

## Intent Tracking Assessment

**Verdict: Not recommended as an intent-tracking source.**

- The Apply button does NOT go to a company ATS — it applies to YC itself
- No outbound ATS redirect to intercept
- Users who want to apply to the company will navigate away manually (no trackable signal)

If tracking is desired:
- Record intent on page load (company + title from DOM above)
- Source = `"ycombinator"`
- `atsDomain = null` (no way to know where user will end up)
- Use 30-minute tight TTL for matching

## Notes
- Pages are SSR: title, company, job description, skills all in HTML
- `og:title` format: `"{Job Title} at {Company} | Y Combinator"`
- Researched via: curl (zero browser tokens), 2026-03-07
- See also: `workatastartup.md` (the actual job application platform)
