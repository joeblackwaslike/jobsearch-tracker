# Google Jobs

## Detection

Google Jobs is embedded within Google Search — it is not a standalone job board. Two activation modes:

1. **`udm=8` mode**: `google.com/search?q=...&udm=8` — explicit Google Jobs search
2. **Jobs panel**: Regular search results with a jobs panel injected via `ibp=htl;jobs` or organically

**URL signal**: `new URLSearchParams(location.search).get("udm") === "8"`

**DOM signal**: Presence of `.gws-plugins-horizon-jobs__tl-lif` or `[class*="jobDetails"]`

Note: `udm=8` is the more reliable signal. The DOM-based fallback catches jobs panels on regular SERP pages.

## Job Detail Panel

Google Jobs renders a two-panel layout:
- **Left panel**: List of job results
- **Right panel**: Selected job detail (`.gws-plugins-horizon-jobs__tl-lif`)

**Selectors** (from adapter + general knowledge):
- **Title**: `.gws-plugins-horizon-jobs__tl-lif h2` or `[data-ved] h2`
- **Company**: `.gws-plugins-horizon-jobs__tl-lif [class*='company']`
- **Panel container**: `.gws-plugins-horizon-jobs__tl-lif` or `[class*="jobDetails"]`

> **TODO**: Browser research still needed to confirm these selectors are live.
> The research agent was redirected to Wellfound before reaching Google Jobs UI.
> Verified: `ibp=htl;jobs` param triggers Google Jobs panel (agent confirmed page showed "Forward Deployed Engineer" heading before redirect).

## Apply Flow

Google Jobs is an **aggregator only** — it does not host application forms.

Clicking "Apply" on a Google Jobs listing:
- Opens the external company ATS (Greenhouse, Lever, Workday, Wellfound, etc.) in a **new tab** or same tab
- The destination URL is the company's actual job posting
- Google does not participate in or observe the application submission

**This is a pure `watchForIntent` scenario.**

The intent is recorded when the user views a job in Google Jobs. The actual TRACK event fires later when the user submits an application on the external ATS.

## Recommended Strategy

**`watchForIntent`**

1. Detect Google Jobs mode via `udm=8` param or `.gws-plugins-horizon-jobs__tl-lif` presence
2. Extract `position` + `company` from the job detail panel
3. Store as `PendingIntent` in `chrome.storage.local` with TTL (2hr)
4. When the user subsequently applies on the ATS (fires `TRACK`), match by company name similarity

**Matching**: Use the same `atsDomain` + company name fuzzy match as other intent-tracking boards.

## Current Adapter

From `extension/src/content/adapters/google.ts`:
```ts
hosts: ["www.google.com"]
// extract(): checks udm=8 OR jobs panel DOM presence
// title: .gws-plugins-horizon-jobs__tl-lif h2 ?? [data-ved] h2
// company: .gws-plugins-horizon-jobs__tl-lif [class*='company']
// getInjectTarget(): .gws-plugins-horizon-jobs__tl-lif ?? [class*='jobDetails']
```

The adapter is already structured correctly for intent tracking. The inject target is the job detail panel itself (not an apply button), which is appropriate since the extension button should be visible while the user views the job.

## Notes

- Google's class names (`gws-plugins-horizon-jobs__tl-lif`) are stable BEM-style but could change with Google UI updates
- The `udm=8` param is Google's official "Jobs" mode URL parameter — more stable than class names
- Job details panel updates dynamically as the user clicks different jobs in the left panel — the adapter needs to handle `MutationObserver` or re-extract on URL hash/param changes
- Company name from Google Jobs may differ slightly from the ATS company name (e.g. "Dow Jones" vs "News Corp") — fuzzy matching is important
- Google may block or rate-limit automated access; the extension runs in the user's real session so this is not a concern
