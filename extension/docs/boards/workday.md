# Workday

## Detection

- Host patterns:
  - `*.wd1.myworkdayjobs.com`
  - `*.wd3.myworkdayjobs.com`
  - `*.wd5.myworkdayjobs.com`
  - `*.workday.com` (some enterprise deployments)
- URL pattern: `{company}.wd{N}.myworkdayjobs.com/en-{locale}/{tenant}/job/{slug}`
- Example: `dowjones.wd1.myworkdayjobs.com/en-US/Dow_Jones_Career/job/Summer-2026-Internship---Software-Engineering-Intern_Job_Req_48494`

## Job Detail Page

Confirmed via browser research on `dowjones.wd1.myworkdayjobs.com`:

- **Rendering**: Full SPA (React). Initial HTML contains only a banner image + privacy notice link. Content renders client-side.
- **Apply button**: Confirmed present after JS renders (awaiting `Apply` text succeeds)
- **Company**: Extracted from subdomain — `location.hostname.split('.')[0]` → `"dowjones"`
- **Title selector**: `[data-automation-id="jobPostingHeader"]` (Workday's standard automation ID)
- **Apply button selector**: `[data-automation-id="applyButton"]`

Workday uses `data-automation-id` attributes consistently across all tenants — these are stable selectors.

> **TODO**: Browser eval on the job page to confirm `data-automation-id` values and get actual job title text.
> The two research agents both ran into shared-browser-tab conflicts before completing this eval.

## Apply Flow

Workday's apply flow is an **inline multi-step wizard** within the same SPA:

1. User clicks Apply button → wizard opens (may require login/account creation)
2. Steps: Contact info → Resume → Work experience → Screening questions → Review
3. URL changes at each step: `{base}/job/{slug}/apply/{step}` (or stays on same URL with route hash)
4. Final confirmation: typically shows a success message, URL may contain `/confirmationCheckout/` or `/apply/success`

> **TODO**: Browser research on the apply wizard to confirm:
> - Exact URL pattern during apply steps
> - Whether form submit fires XHR (interceptable) or is opaque SPA state change
> - Success DOM element (`[data-automation-id="confirmation"]`?)
> - Whether login is required before Apply button is active

## Recommended Strategy

**`watchForSubmission`** — but complex due to SPA nature.

Options:
1. **URL-change observer**: Watch for URL to contain `/apply/` — fires when user enters the apply wizard. Record intent at that point.
2. **XHR intercept**: Workday's apply wizard likely POSTs to a Workday API endpoint. Intercepting `fetch`/`XHR` on `myworkdayjobs.com/api/apply` would give the cleanest signal.
3. **DOM confirmation observer**: `MutationObserver` watching for a success confirmation element.

The URL-change approach is simplest to implement reliably, but fires on entry to the wizard (intent), not on completion (submission). For highest accuracy, combine: record intent on wizard entry, confirm on URL reaching confirmation step.

## Current Adapter Selectors

From `extension/src/content/adapters/workday.ts`:
- Title: `[data-automation-id="jobPostingHeader"]`
- Apply button: `[data-automation-id="applyButton"]`
- Company: `hostname.split('.')[0]`

These selectors are aligned with Workday's published automation IDs and should be reliable.

## Notes

- Workday is one of the most common enterprise ATS platforms — many large companies (Amazon, Microsoft, etc.) use it
- Some companies use Workday via their own domain (e.g. `careers.company.com`) rather than `*.myworkdayjobs.com` — those require separate detection
- The `en-US` locale prefix in URLs may vary (`en-GB`, etc.) — host matching is sufficient, no locale parsing needed
- Workday requires login to complete an application; the extension should track intent on Apply click, not wait for full submission
