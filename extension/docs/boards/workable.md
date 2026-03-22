# Workable ATS

## Domains

* apply.workable.com

## URL Pattern

```text
https://apply.workable.com/{companySlug}/j/{jobId}/
https://apply.workable.com/{companySlug}/j/{jobId}/apply/
```

Example: `https://apply.workable.com/code-metal/j/3E07B0C252/`

* `companySlug` — kebab-case company name (`code-metal`)
* `jobId` — 10-char alphanumeric shortcode (`3E07B0C252`)

## Detection

* Domain: `apply.workable.com`
* URL path: `/{companySlug}/j/{jobId}/`
* Submit signal: `POST /api/v1/jobs/{jobId}/apply`
* Success: HTTP 200. Captcha failure returns **412 Precondition Failed** (not a real submit).
* Captcha: **Cloudflare Turnstile** — `x-turnstile-token` header on the POST

## Key Endpoints

### 1. Job Metadata ⭐

```text
GET /api/v2/accounts/{companySlug}/jobs/{jobId}
```

Fires on page load. Returns the richest job data:

```json
{
  "id": 5459955,
  "shortcode": "3E07B0C252",
  "title": "Senior Backend Engineer",
  "remote": true,
  "location": { "country": "United States", "countryCode": "US", "city": "", "region": null },
  "workplace": "remote",
  "published": "2026-01-21T00:00:00.000Z",
  "department": [],
  "description": "<h3>...</h3>"
}
```

### 2. Form Fields

```text
GET /api/v1/jobs/{jobId}/form
```

Returns form sections and field definitions (name, type, required, maxLength). Standard sections: Personal information, Profile, Details. Field IDs match the `candidate` array names in the submit body.

### 3. Submit Application ⭐

```text
POST /api/v1/jobs/{jobId}/apply
```

**Required headers:**

* `content-type: application/json`
* `x-turnstile-token: <cloudflare-turnstile-token>` (412 if missing/invalid)

**Request body:**

```json
{
  "candidate": [
    { "name": "firstname", "value": "Joe" },
    { "name": "lastname", "value": "Black" },
    { "name": "email", "value": "user@email.com" },
    { "name": "headline", "value": "Senior Software Engineer" },
    { "name": "phone", "value": "+16469247718" },
    { "name": "address", "value": "New York, NY" },
    {
      "name": "experience",
      "value": [
        {
          "title": "Senior Software Engineer",
          "company": "Acme Corp",
          "summary": "...",
          "start_date": "2020-12-01T00:00:00.000000Z",
          "end_date": "2024-03-31T00:00:00.000000Z",
          "current": false
        }
      ]
    },
    { "name": "summary", "value": "Senior Backend Engineer with 10+ years..." },
    {
      "name": "resume",
      "value": {
        "url": "https://workable-application-form.s3.us-east-1.amazonaws.com/tmp/...",
        "name": "Joe_Black_v3.5.pdf"
      }
    }
  ]
}
```

Resume is uploaded to Workable's S3 bucket first (separate upload flow), then referenced by pre-signed URL in this payload.

**Response (200 — success):** Presumed JSON with application ID (not captured — captcha blocked actual submission).

**Response (412 — captcha fail):**

```text
Precondition Failed
```

## Extension Interception Strategy

1. Cache job metadata from `GET /api/v2/accounts/{companySlug}/jobs/{jobId}` on page load:
   * `title`, `workplace`, `remote`, `location`, `published`
2. Intercept `POST /api/v1/jobs/{jobId}/apply`:
   * **Company slug**: from URL path segment 1
   * **Job ID**: `shortcode` from URL path / job metadata
   * **Applicant**: `candidate` array — find entries by `name` key
   * **Resume**: `candidate[name=resume].value.name`
3. Confirm on HTTP 200 (skip 412 = captcha fail)

## Notes

* Cloudflare Turnstile is used for anti-bot protection on submission. A real browser session can pass it; DevTools/CDP sessions fail (error_code_600010 = invalid token). The extension running in the real browser context will pass Turnstile naturally since it's not modifying the page — just observing.
* The `?autofill` query param on the apply URL triggers Workable's resume autofill flow.
* Google Analytics fires `en=Submit&ep.event_category=ApplicationForm` when the submit button is clicked — fires before captcha validates, so not reliable as a sole confirmation signal.
