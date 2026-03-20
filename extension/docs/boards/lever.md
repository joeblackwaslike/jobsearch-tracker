# Lever

## Detection

- Host: `jobs.lever.co`
- URL pattern: `jobs.lever.co/{company}/{jobId}`
- Apply page: `jobs.lever.co/{company}/{jobId}/apply`

## Job Detail Page

Confirmed via browser eval on `jobs.lever.co/jobgether/a6ea3078-d243-4dc8-8ee2-0e040c4a1348`:

```json
{
  "title": "Jobgether - Remote Python Engineer",
  "h2": "<h2>Remote Python Engineer</h2>",
  "postingHeadline": "<div class=\"posting-headline\"><h2>Remote Python Engineer</h2>...",
  "applyBtn": "<a class=\"postings-btn template-btn-submit cerulean\" href=\"https://jobs.lever.co/jobgether/.../apply\">apply for this job</a>",
  "companyEl": null,
  "companyFromURL": "jobgether",
  "urlPath": "/jobgether/a6ea3078-d243-4dc8-8ee2-0e040c4a1348"
}
```

- **Title selector**: `.posting-headline h2` (confirmed)
- **Company**: Not in DOM — extracted from URL path `pathname.split('/')[1]` (e.g. `"jobgether"`)
- **Apply button**: `a.postings-btn.template-btn-submit` or `a[href*="/apply"]`
- **Page structure**: `div.content > div.content-wrapper.posting-page > div.posting-header > div.posting-headline`

No `.company-name` element exists on the page. Title is always in `h2`, never `h1`.

## Apply Flow

Clicking the apply button navigates to a **new page**: `jobs.lever.co/{company}/{jobId}/apply`

The `/apply` page contains the actual application form (SSR or light SPA):
- Standard Lever form fields: name, email, phone, resume upload, LinkedIn, cover letter
- Form POSTs to `jobs.lever.co/{company}/{jobId}/apply` (same URL, POST method)
- Success confirmation: URL changes to `jobs.lever.co/{company}/{jobId}/apply/confirmation` (needs browser verification)

> **TODO**: Still need browser research on the `/apply` page to confirm:
> - Exact form `action` attribute
> - Success URL or success DOM element
> - Whether form is SSR (watchable via XHR intercept) or native HTML form

## Recommended Strategy

**`watchForSubmission`** on the `/apply` subpage.

Since the adapter hosts match `jobs.lever.co`, it runs on both the job detail page AND the `/apply` page. Options:

1. **Preferred**: On `/apply` URL, intercept the form submit (`addEventListener('submit', ...)` on `form`) — POST fires to same URL. Listen for redirect to `/apply/confirmation` as success signal.
2. **Fallback**: On job detail page, record `watchForIntent` when apply button is clicked, then match when ATS redirects land.

The form-intercept approach is more reliable since it only fires on actual submit (not on every Apply click).

## Current Adapter Selectors

From `extension/src/content/adapters/lever.ts`:
- Title: `.posting-headline h2`, fallback `h2.posting-title`
- Inject target: `.postings-btn-wrapper`, `.posting-apply`, `.template-btn-submit`
- Company: `pathname.split('/')[1]` (already correct)

## Notes

- Lever is used by many companies (Jobgether, Anthropic, etc.) — all at `jobs.lever.co`
- Some companies use Lever via custom domains (e.g. `jobs.company.com`) — those would NOT be caught by the `jobs.lever.co` host match
- The `template-btn-submit` class is stable across Lever tenants (it's part of Lever's own CSS)
