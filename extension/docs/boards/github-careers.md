# GitHub Careers

## domains:

* github.careers
* www.github.careers

## Detection

Hostname is `github.careers` or `www.github.careers`.

Note: `github.com/careers` redirects → `github.careers` (different domain).

## URL Patterns

* Home: `https://www.github.careers/careers-home`
* Job listings: `https://www.github.careers/careers-home/categories` or similar
* Job detail: `https://careers-githubinc.icims.com/jobs/{numericId}/{title}/job`
  * Note: Clicking a job listing navigates from `github.careers` to `careers-githubinc.icims.com`

## Application Method

**GitHub uses iCIMS ATS** (not Greenhouse, despite being a Microsoft company).

Verified: `github.careers` page contains links to:

* `globalcareers-githubinc.icims.com/jobs/login` (international applicants)
* `careers-githubinc.icims.com/jobs/login` (US applicants)

The job listing page (`github.careers`) is an intermediate branded page. Clicking a job
redirects to the iCIMS-hosted application form at `careers-githubinc.icims.com`.

**The `gh_jid` param is NOT present** — the existing `greenhouse-careers` adapter does NOT
cover GitHub Careers.

## ATS: iCIMS

iCIMS is a major ATS not yet covered by any existing adapter. GitHub Careers is a good
first candidate if iCIMS support is added. iCIMS job pages typically:

* Use URL: `{company}-githubinc.icims.com/jobs/{numericId}/{slug}/job` or `/apply`
* Submit to an iCIMS API endpoint
* Require login to apply (SSO or iCIMS account)

## Intent Tracking / Watchdog Assessment

**Two-stage tracking possible:**

**Stage 1 — github.careers page:**

* User lands on a GitHub job listing link
* Record intent: company = "GitHub", title from job title element
* Watch for outbound click to `careers-githubinc.icims.com`
* `atsDomain = "careers-githubinc.icims.com"`

**Stage 2 — iCIMS submission (future work):**

* iCIMS adapter would handle the actual form submission at `careers-githubinc.icims.com`
* Covered once iCIMS adapter is implemented

## Extension Interception Strategy

Until an iCIMS adapter exists:

* Add `github.careers` and `www.github.careers` to the `github-careers` adapter (or new `github` adapter)
* Extract: company = `"GitHub"` (hardcoded, always GitHub on this domain)
* Extract: job title from page DOM (needs browser verification for selector)
* Watch for outbound click to `*.icims.com`
* Record intent with `atsDomain = "careers-githubinc.icims.com"`

When iCIMS adapter is added:

* iCIMS `watchForSubmission` handles the final step
* Background matches intent → enriches `TRACK` with `source: "github-careers"`

## Notes

* `github.careers` is a custom-branded career site (Microsoft/GitHub branding)
* iCIMS is used for: GitHub, and many other enterprise companies (Instacart, GM, Verizon, etc.) — worth implementing as a general iCIMS adapter
* The `github.careers` home page is SSR with 504k HTML
* Researched via: curl (zero browser tokens), 2026-03-07
* **Action item:** Add iCIMS to the tracking-automation plan as a new board/ATS to research
