# Work at a Startup (YC)

## Detection

- Host: `www.workatastartup.com`
- URL pattern: `workatastartup.com/jobs/{id}` (numeric job ID)
- Example: `workatastartup.com/jobs/90059`

## Job Detail Page

Confirmed via browser eval on `workatastartup.com/jobs/90059` (Software Engineer at Forge, W24):

```json
{
  "jobTitleEl": { "sel": ".job-name", "text": "Software Engineer", "cls": "job-name shrink text-orange-500" },
  "companyName": { "sel": ".company-name", "text": "Software Engineer at Forge (W24)", "cls": "company-name text-2xl font-bold" },
  "applyHref": "https://account.ycombinator.com/authenticate?continue=https://www.workatastartup.com/",
  "pageTitle": "Software Engineer at Forge | Y Combinator's Work at a Startup"
}
```

**Title selector**: `.job-name` (class `job-name shrink text-orange-500`) — text is the raw job title ("Software Engineer")

**Company** — tricky, several options:
1. `.company-name` text = `"Software Engineer at Forge (W24)"` — needs parsing: split on `" at "`, take everything after, strip ` (W24)` batch suffix with regex `/\s*\([A-Z]\d+\)$/`
2. `a[href*="/companies/"]` → href `workatastartup.com/companies/forge` → extract slug, capitalize
3. **Page title**: `"{title} at {company} | Y Combinator's Work at a Startup"` → split on `" at "` and `" | "` → "Forge"

**DOM structure**:
```
span.company-name.text-2xl.font-bold  → "Software Engineer at Forge (W24)"
div.job-name.shrink.text-orange-500   → "Software Engineer"  ← job title
h2.text-2xl.mb-5                      → "Other jobs at Forge"
a[href*="/companies/forge"]            → company link (empty text, wraps logo)
```

No h1 found on the page — title is NOT in an h1.

## Apply Flow

Apply requires **YC account login**.

```
Apply button → https://account.ycombinator.com/authenticate?continue=https://www.workatastartup.com/
```

- Only 1 button on the page (DOM: "Interactive: 1 buttons") — that's the Apply button
- Clicking triggers redirect to `account.ycombinator.com/authenticate`
- The `continue` URL goes back to `workatastartup.com/` root (not the specific job) — session must store the job context
- After login: presumably shows a YC-hosted application form (profile-based, not external ATS redirect)

> **TODO**: Login and research the post-auth apply flow to confirm:
> - What URL appears after login (specific job apply page?)
> - Does YC show a hosted form or redirect to external ATS?
> - What network request fires on submit?

## Recommended Strategy

**`watchForIntent`** (conservative — apply flow requires login and is unclear post-auth)

1. On `workatastartup.com/jobs/{id}`, detect job page
2. Extract title from `.job-name`, company from page title parsing or `.company-name` parse
3. Store `PendingIntent` when user clicks Apply (listens for `a[href*="ycombinator.com/authenticate"]` click)
4. If YC's apply form is hosted on `workatastartup.com` post-auth, consider upgrading to `watchForSubmission`

## Current Adapter Selectors

From `extension/src/content/adapters/workatastartup.ts` (pre-research):
- Title: `h1.company-name`, `.listing-title h1`, `.job-name` — **`.job-name` is CORRECT** ✓
- Company: `.company-header h1`, `[class*='startup-name']` — **WRONG**; use `.company-name` with parsing or page title

## Notes

- Workatastartup is exclusively YC-batch startups — well-defined audience
- The "Forge (W24)" suffix in `.company-name` is the YC batch — strip it with `/\s*\([A-Z]\d+\)$/`
- The page title format `"{title} at {company} | Y Combinator's Work at a Startup"` is the cleanest source for both title and company
- The `.job-name` text is already clean (no company appended) — reliable for position
- User-provided URL: `workatastartup.com/jobs/87016` confirms the same numeric ID pattern
