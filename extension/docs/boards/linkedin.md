# LinkedIn Easy Apply — Network Traffic Notes

Captured via Chrome DevTools MCP on 2026-03-06.

---

## Key Endpoints

### 1. Load Job Posting Detail

```text
GET /voyager/api/graphql
  ?includeWebMetadata=true
  &variables=(cardSectionTypes:List(TOP_CARD,HOW_YOU_FIT_CARD),jobPostingUrn:urn%3Ali%3Afsd_jobPosting%3A{jobId},...)
  &queryId=voyagerJobsDashJobPostings.891aed7916d7453a37e4bbf5f1f60de4
```

Returns full job posting metadata. Card sections are fetched individually (TOP_CARD, JOB_DESCRIPTION_CARD, COMPANY_CARD, SALARY_CARD, BENEFITS_CARD, HOW_YOU_MATCH_CARD, etc.).

### 2. Load Application Form

```text
GET /voyager/api/graphql
  ?includeWebMetadata=true
  &variables=(jobPostingUrn:urn%3Ali%3Afsd_jobPosting%3A{jobId})
  &queryId=voyagerJobsDashOnsiteApplyApplication.a1ce7ed0aefd0c79e2f6a351d1c4907e
```

Loads the Easy Apply form fields and pre-filled profile data. The `included` array contains 16 objects. Key types:

**`com.linkedin.voyager.dash.jobs.JobPosting`**

```json
{
  "entityUrn": "urn:li:fsd_jobPosting:4370884325",
  "trackingUrn": "urn:li:jobPosting:4370884325",
  "companyDetails": {
    "name": "Alpaca",
    "jobCompany": { "*company": "urn:li:fsd_company:9300556" }
  }
}
```

⚠️ Job **title** is NOT in this recipe's `JobPosting` object — use the TOP_CARD or `voyagerJobsDashJobPostings` call instead (see below).

**`com.linkedin.voyager.dash.organization.Company`**

```json
{
  "entityUrn": "urn:li:fsd_company:9300556",
  "name": "Alpaca"
}
```

**`com.linkedin.voyager.dash.jobs.OnsiteApplyApplication`**

```json
{
  "entityUrn": "urn:li:fsd_onsiteApplyApplication:4370884325",
  "*jobPosting": "urn:li:fsd_jobPosting:4370884325",
  "*jobSeekerApplicationDetail": "urn:li:fsd_jobSeekerApplicationDetail:4370884325",
  "draftApplication": false,
  "lastPageLeftOff": 0,
  "applicantProfile": { "*elements": ["urn:li:fsd_profile:{profileId}"] }
}
```

**`com.linkedin.voyager.dash.jobs.JobSeekerApplicationDetail`**

```json
{
  "entityUrn": "urn:li:fsd_jobSeekerApplicationDetail:4370884325",
  "applicantTrackingSystemName": "LinkedIn"
}
```

`applicantTrackingSystemName` = `"LinkedIn"` for Easy Apply jobs (LinkedIn's own ATS). Will differ for jobs that redirect to an external ATS.

**`com.linkedin.voyager.dash.jobs.Resume`** (one per uploaded resume, all returned)

```json
{
  "entityUrn": "urn:li:fsd_resume:/{base64}.pdf",
  "fileName": "Joe_Black_v3.5.pdf",
  "fileSize": 35284,
  "fileType": "PDF",
  "createdAt": 1772788854082,
  "lastUsedAt": 1772788857533,
  "downloadUrl": "https://www.linkedin.com/ambry/?x-li-ambry-ep=..."
}
```

All resumes on the account are returned. Cross-reference `entityUrn` with `fileUploadResponses[0].inputUrn` from the submit body to identify which resume was used.

**`com.linkedin.voyager.dash.common.forms.FormElement`** (one per form field)

- Fields observed: `phoneNumber~country`, `phoneNumber~nationalNumber`, `multipleChoice` (email)
- Each has `urn`, `title.text`, `required`, and pre-filled `input` value

### 3. Submit Application ⭐

```text
POST /voyager/api/voyagerJobsDashOnsiteApplyApplication?action=submitApplication
```

**Required headers:**

- `csrf-token: ajax:{value}` — matches the `JSESSIONID` cookie value
- `x-restli-protocol-version: 2.0.0`
- `accept: application/vnd.linkedin.normalized+json+2.1`
- `content-type: application/json; charset=UTF-8`

**Request body:**

```json
{
  "followCompany": false,
  "referenceId": "8nmPSZ4WdgrwyUEE5gnWsA==",
  "trackingCode": "d_flagship3_job_home",
  "responses": [
    {
      "formElementUrn": "urn:li:fsd_formElement:urn:li:jobs_applyformcommon_easyApplyFormElement:({jobId},{fieldId},multipleChoice)",
      "formElementInputValues": [
        { "entityInputValue": { "inputEntityName": "user@email.com" } }
      ]
    },
    {
      "formElementUrn": "urn:li:fsd_formElement:urn:li:jobs_applyformcommon_easyApplyFormElement:({jobId},{fieldId},phoneNumber~country)",
      "formElementInputValues": [
        {
          "entityInputValue": {
            "inputEntityName": "United States (+1)",
            "inputEntityUrn": "urn:li:country:us"
          }
        }
      ]
    },
    {
      "formElementUrn": "urn:li:fsd_formElement:urn:li:jobs_applyformcommon_easyApplyFormElement:({jobId},{fieldId},phoneNumber~nationalNumber)",
      "formElementInputValues": [
        { "textInputValue": "6465550000" }
      ]
    }
  ],
  "fileUploadResponses": [
    {
      "inputUrn": "urn:li:fsd_resume:/AAYEAQC1AAgAAQAAAAAAAI3yWUTZt3vySIGqImNdZeDWGQ.pdf",
      "formElementUrn": "urn:li:fsu_jobApplicationFileUploadFormElement:urn:li:jobs_applyformcommon_easyApplyFormElement:({jobId},{fieldId},document)"
    }
  ],
  "trackingId": "..."
}
```

**Response (200):**

```json
{
  "data": {
    "$type": "com.linkedin.restli.common.ActionResponse",
    "*value": "urn:li:fsd_jobSeekerApplicationDetail:{jobId}"
  },
  "included": [
    {
      "$type": "com.linkedin.voyager.dash.jobs.JobSeekerApplicationDetail",
      "entityUrn": "urn:li:fsd_jobSeekerApplicationDetail:{jobId}",
      "applied": true,
      "appliedAt": 1772793650724
    }
  ]
}
```

### 4. Job Posting Detail — TOP_CARD ⭐ (job title + location)

```text
GET /voyager/api/graphql
  ?includeWebMetadata=true
  &variables=(cardSectionTypes:List(TOP_CARD,HOW_YOU_FIT_CARD),jobPostingUrn:urn%3Ali%3Afsd_jobPosting%3A{jobId},includeSecondaryActionsV2:true,jobDetailsContext:(isJobSearch:false))
  &queryId=voyagerJobsDashJobPostingDetailSections.772cd794c28e3200864f81d143911057
```

Fires when the job detail panel opens. Contains `JobPosting` and `JobPostingCard` objects:

**`com.linkedin.voyager.dash.jobs.JobPosting`**

```json
{
  "entityUrn": "urn:li:fsd_jobPosting:4370884325",
  "trackingUrn": "urn:li:jobPosting:4370884325",
  "title": "Senior Software Engineer",
  "jobState": "LISTED",
  "createdAt": 1770675594000,
  "*location": "urn:li:fsd_geo:103644278",
  "*jobWorkplaceTypes": ["urn:li:fsd_workplaceType:2"],
  "repostedJob": false
}
```

**`com.linkedin.voyager.dash.jobs.JobPostingCard`**

```json
{
  "entityUrn": "urn:li:fsd_jobPostingCard:(4370884325,JOB_DETAILS)",
  "jobPostingTitle": "Senior Software Engineer",
  "navigationBarSubtitle": "Alpaca · United States (Remote)",
  "primaryDescription": { "text": "Alpaca" }
}
```

`navigationBarSubtitle` is a pre-formatted `"Company · Location"` string — very convenient.

### 5. Job Posting Full Detail — voyagerJobsDashJobPostings ⭐ (richest source)

```text
GET /voyager/api/graphql
  ?includeWebMetadata=true
  &variables=(jobPostingUrn:urn%3Ali%3Afsd_jobPosting%3A{jobId})
  &queryId=voyagerJobsDashJobPostings.891aed7916d7453a37e4bbf5f1f60de4
```

The richest single endpoint. Contains the full `JobPosting` object:

```json
{
  "entityUrn": "urn:li:fsd_jobPosting:4370884325",
  "preDashNormalizedJobPostingUrn": "urn:li:fs_normalized_jobPosting:4370884325",
  "title": "Senior Software Engineer",
  "description": { "text": "Role: Senior Software Engineer\nLocation: Remote in North America..." },
  "jobState": "LISTED",
  "listedAt": 1770675625000,
  "originalListedAt": 1770675625000,
  "expireAt": 1773267624000,
  "jobFunctions": ["ENG"],
  "*employmentStatus": "urn:li:fsd_employmentStatus:FULL_TIME",
  "*standardizedTitle": "urn:li:fsd_standardizedTitle:9",
  "*industryV2Taxonomy": ["urn:li:fsd_industryV2:43"],
  "*location": "urn:li:fsd_geo:103644278",
  "companyDetails": { "name": "Alpaca", "*company": "urn:li:fsd_company:9300556" }
}
```

Also returns `Geo`, `Company`, `EmploymentStatus`, `StandardizedTitle`, `IndustryV2` in `included`:

```json
{
  "geo": { "abbreviatedLocalizedName": "United States", "countryISOCode": "US" },
  "employmentStatus": { "localizedName": "Full-time" },
  "standardizedTitle": { "name": "Software Engineer" },
  "industry": { "name": "Financial Services" },
  "company": {
    "name": "Alpaca",
    "universalName": "alpacamarkets",
    "url": "https://www.linkedin.com/company/alpacamarkets/"
  }
}
```

### 6. External ATS Apply Signal ⭐

```text
POST /flagship-web/rsc-action/actions/server-request
  ?sduiid=com.linkedin.sdui.requests.jobSeeker.shareProfileWithJobPosterRequest
```

Fires when user clicks Apply on a non-Easy Apply job (before the external tab opens). This is the only LinkedIn-side signal for external applications.

**Request body:**

```json
{
  "requestId": "com.linkedin.sdui.requests.jobSeeker.shareProfileWithJobPosterRequest",
  "serverRequest": {
    "requestedArguments": {
      "payload": {
        "jobId": "4293947555",
        "addMemberPreferencesOverride": false
      }
    }
  }
}
```

The external ATS URL opens in a new tab simultaneously. LinkedIn does **not** provide the ATS URL in this API call — it's only available in the DOM (the Apply button's `href`) or from the `companyApplyUrl` field in `voyagerJobsDashJobPostings` (only fires from search results view, not direct `/jobs/view/` URLs).

**Apply button href (DOM):**

```text
https://www.linkedin.com/redir/redirect/?url={encoded_ats_url}&urlhash={hash}&isSdui=true
```

Decode the `url` query param to get the raw ATS URL:

```text
https://jobs.ashbyhq.com/kindred/ac098955-f86f-4aeb-8578-c2b2b96c11d9/application?utm_source=57133knwx9&source=LinkedIn
```

The ATS hostname (`jobs.ashbyhq.com`) identifies the ATS. `source=LinkedIn` is appended by LinkedIn to all external redirects.

**Architecture note:** LinkedIn has fully migrated to SDUI/RSC architecture. All job detail calls (`peopleWhoCanHelp`, `aboutTheJob`, `jobMatch`, etc.) are now `POST /flagship-web/rsc-action/actions/component` returning binary `application/octet-stream` — not parseable JSON. The `voyagerJobsDashJobPostings` graphql calls only appeared in older client sessions (`clientVersion: 1.13.42636`) and may no longer be reliably available.

**Getting job metadata on SDUI pages:**

- `document.title` → `"Senior / Staff Backend Engineer | Kindred | LinkedIn"` — parse as `"{title} | {company} | LinkedIn"` ✓
- Job ID → from `window.location` (`currentJobId=` param on search results, or `/jobs/view/{id}/` on detail pages) ✓
- ATS URL → decode Apply button `href` `url` param ✓
- No h1 elements on SDUI pages — obfuscated class names, DOM structure not reliable beyond `document.title`

**Implication for extension:** The DOM is the most reliable source for external ATS jobs. On click of Apply:

1. Read `document.title` → parse title + company
2. Read `window.location` → extract jobId
3. Read Apply button `href` → decode `url` param for ATS URL + detect ATS from hostname
4. Confirm via `shareProfileWithJobPosterRequest` firing (has jobId in payload)

### 7. Post-Apply Promos (confirmation modal data)

```text
GET /voyager/api/graphql
  ?variables=(jobPosting:urn%3Ali%3Afsd_jobPosting%3A{jobId},screenContext:POST_APPLY_MODAL)
  &queryId=voyagerJobsDashPostApplyPromos.3705ea6526066bf185aebc1c942c339b
```

### 5. Job Posting Activity Log (fires on job view)

```text
POST /flagship-web/rsc-action/actions/server-request
  ?sduiid=com.linkedin.sdui.requests.jobSeeker.jobPostingActivityLog
```

Fires when you open/view a job posting. Useful signal for detecting "viewed" state.

---

## Stable Job URL

```text
https://www.linkedin.com/jobs/view/{jobId}/
```

Example: `https://www.linkedin.com/jobs/view/4370884325/`

The `jobId` is the numeric suffix in every URN (`urn:li:fsd_jobPosting:4370884325`). This URL is stable, shareable, and works without being logged in (redirects to login but preserves the job). The search results URL (`/jobs/search-results/?currentJobId=...`) is **not** stable — it includes session-scoped query params.

---

## Extension Interception Strategy

Intercept `POST /voyager/api/voyagerJobsDashOnsiteApplyApplication?action=submitApplication`.

**Recommended: intercept two calls and merge:**

1. **`voyagerJobsDashJobPostings` GET** (fires when job detail panel opens) → cache job metadata keyed by `jobId`:
   - `title`, `description.text`, `listedAt`, `jobFunctions`, `employmentStatus.localizedName`
   - `company.name`, `company.universalName`, `company.url`
   - `geo.abbreviatedLocalizedName`, `geo.countryISOCode`
   - `industry.name`, `standardizedTitle.name`
   - Stable URL: `https://www.linkedin.com/jobs/view/{jobId}/`

2. **`voyagerJobsDashOnsiteApplyApplication?action=submitApplication` POST** → confirm and record:
   - **Job ID**: parse from `included[0].entityUrn` → `urn:li:fsd_jobSeekerApplicationDetail:{jobId}`
   - **Applied timestamp**: `included[0].appliedAt` (Unix ms)
   - **Confirmation**: `included[0].applied === true`
   - **Resume used**: `request.fileUploadResponses[0].inputUrn` (match against cached resume list from form load)

For CSRF: the `csrf-token` header value equals the `JSESSIONID` cookie (format: `ajax:{digits}`). The extension can read this from `document.cookie` or the request headers.

---

## URN Patterns

| Entity | URN format |
| ------ | ---------- |
| Job posting | `urn:li:fsd_jobPosting:{jobId}` |
| Application detail | `urn:li:fsd_jobSeekerApplicationDetail:{jobId}` |
| Resume | `urn:li:fsd_resume:/{base64}.pdf` |
| Form element | `urn:li:fsd_formElement:urn:li:jobs_applyformcommon_easyApplyFormElement:({jobId},{fieldId},{type})` |

---

## Intent Tracking Strategy (External Apply)

### Signal

When the user clicks Apply on a non-Easy-Apply job, LinkedIn fires:

```text
POST /flagship-web/rsc-action/actions/server-request
  ?sduiid=com.linkedin.sdui.requests.jobSeeker.shareProfileWithJobPosterRequest
```

This is the best **confirmation** signal, but the job metadata must come from the DOM because the
API body only contains `jobId`.

### Apply Button Decode

The Apply button href is a LinkedIn redirect wrapper:

```text
https://www.linkedin.com/redir/redirect/?url={encoded_ats_url}&urlhash={hash}&isSdui=true
```

Decode:

```ts
const params = new URLSearchParams(new URL(applyHref).search);
const atsUrl = decodeURIComponent(params.get("url") ?? "");
const atsDomain = atsUrl ? new URL(atsUrl).hostname : null;
// e.g. "jobs.ashbyhq.com"
```

### Recommended Adapter Strategy (`watchForIntent`)

On the job detail page:

1. Call `extract()` → get `{ position, company }` from `document.title`.
2. Find the Apply button via `[aria-label*="Apply"]` or `.jobs-apply-button--top-card`.
3. Check if the button's `href` is a LinkedIn redirect (contains `/redir/redirect/`):
   - **Yes (external apply):** Attach a click listener. On click, decode `href` → extract
     `atsDomain`. Call `record(jobData, "linkedin", atsDomain)`.
   - **No href or Easy Apply modal:** This is an Easy Apply job → handled by `watchForSubmission`
     (see below); do not record intent.
4. Return cleanup that removes the click listener.

**Why click, not page-load?** Recording intent on page load would create false positives every time
the user browses a LinkedIn job without applying. Detecting the click ties the intent to an actual
apply action.

### Easy Apply — Submission Detection (`watchForSubmission`)

Intercept:

```text
POST /voyager/api/voyagerJobsDashOnsiteApplyApplication?action=submitApplication
```

The response `included[0].applied === true` confirms success. Use `fetch` interception in the
content script (wrap `window.fetch` or use `XMLHttpRequest` override) rather than network request
listeners (which are not available to content scripts).

Check for response: `included[0]["$type"] === "com.linkedin.voyager.dash.jobs.JobSeekerApplicationDetail"` and `applied: true`.

Job metadata for Easy Apply: extract from `document.title` (`"{position} | {company} | LinkedIn"`)
before the drawer opens, so it's available when the submit response arrives.

---

## Notes / TODOs

- [x] Capture request/response for the form load to see what job metadata is available before submission
- [ ] Check what the `referenceId` is — appears to be a session-scoped identifier shared across the apply flow
- [ ] Investigate `jobPostingActivityLog` payload to understand view tracking
- [ ] Confirm whether `trackingId` in the submit body is required or can be omitted
- [ ] Test whether the SDUI RSC-action endpoints (`/flagship-web/rsc-action/...`) carry any useful data or are just UI rendering calls
- [ ] Verify stable job URL `https://www.linkedin.com/jobs/view/{jobId}/` works for archived/expired postings
- [x] Confirm `voyagerJobsDashJobPostings` behavior for external ATS jobs — **not reliably available** on SDUI client (0.2.x). Graphql calls only appeared on older client (1.13.x). DOM is the primary fallback.
- [x] Apply button `href` in DOM confirmed — LinkedIn redirect wrapping ATS URL, decode `url` query param. `document.title` gives `"{title} | {company} | LinkedIn"` reliably.
