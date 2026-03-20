# Greenhouse Hosted Career Sites (Whitelabel)

Greenhouse offers a hosted career site CMS product where companies serve applications on their own domain. This is a **different product** from `boards.greenhouse.io` — different URL structure, different submit endpoint, different field naming.

## Identification

* Domain: company-owned (e.g., `careers.withwaymo.com`, `jobs.stripe.com`)
* `gh_jid` query param present in URL — this is the stable numeric Greenhouse job ID
* Form action pattern: `{company-domain}/call_to_actions/{ctaId}/form_submissions`

## URL Pattern

```
https://{company-domain}/jobs/{job-slug}?gh_jid={numericJobId}
```

Example: `https://careers.withwaymo.com/jobs/software-engineer-multiverse-...?gh_jid=7531397`

The `gh_jid` is the Greenhouse job ID (same ID that appears on `boards.greenhouse.io`). The slug is human-readable but not canonical.

## Internal IDs

Two separate IDs are in play:

| ID | Example | Source | Purpose |
|----|---------|--------|---------|
| `gh_jid` (numeric) | `7531397` | URL query param | Public Greenhouse job ID |
| `job_uid` (UUID) | `d3232476b71f2798937544a9b17e0504` | Form hidden field / API | Internal CMS job ID |

The `gh_jid` is more useful for cross-referencing. The `job_uid` appears in the form's `job_id` query param on submit.

## Page Structure

The career site page contains **two embedded forms**:

1. **Job Alert form** (`postfix=1_3`) — email + department + location for alerts. NOT the application.
2. **Application form** (`postfix=7_0`) — the actual apply form. Identified by having `phone_value`, `job_questions`, and resume file upload fields.

Both are loaded via:
```
GET /pages/{pageId}/blocks/{blockUuid}?job_uid={jobUuid}&postfix={n}
```

## Submit Application ⭐

```
POST https://{company-domain}/call_to_actions/{ctaId}/form_submissions?job_id={jobUuid}&page_id={pageId}
```

**Anti-bot:** AWS WAF JavaScript SDK (`*.edge.sdk.awswaf.com/*/mp_verify` + `/telemetry`). Fires on page load.

**Form encoding:** `multipart/form-data` (Rails-style nested params)

**Key fields:**
```
authenticity_token={railsCsrfToken}
container_id=call_to_action_container_{blockUuid}
pass_through={}
form_submission[fields_attributes][0][string_value]=Joe          ← first name
form_submission[fields_attributes][0][kind]=first_name
form_submission[fields_attributes][1][string_value]=Black        ← last name
form_submission[fields_attributes][1][kind]=last_name
form_submission[fields_attributes][2][email_value]=user@email.com ← email
form_submission[fields_attributes][2][kind]=email
form_submission[fields_attributes][3][phone_value]=+16469247718  ← phone
form_submission[fields_attributes][3][kind]=phone_number
form_submission[fields_attributes][4][job_questions][{questionUuid}]=...  ← resume (file), custom questions
form_submission[fields_attributes][4][kind]=greenhouse_job_questions
form_submission[fields_attributes][5][agreement]=1              ← job alert consent checkbox
form_submission[fields_attributes][6][boolean_value]=1          ← declaration checkbox
```

Fields are indexed by position (0, 1, 2...). The `kind` hidden field identifies the field type. Job questions (resume upload, custom fields) are nested under a single index with `job_questions[{uuid}]` keys.

**`gh_jid` is NOT sent in the POST body** — only the internal `job_id` UUID appears in the query string.

## Extension Interception Strategy

Intercept `POST /call_to_actions/{ctaId}/form_submissions`.

* **Detect this variant**: `gh_jid` in URL query params + domain is NOT `greenhouse.io`
* **Greenhouse job ID**: `gh_jid` from URL query param (e.g., `7531397`)
* **Company**: parse from domain (`careers.withwaymo.com` → "Waymo")
* **Job title**: `document.title` — format is `"{Job Title} - {Locations}"` (trim from first ` - `)
* **Applicant fields**: parse `form_submission[fields_attributes]` by `kind` value:
  * `kind=first_name` → `string_value`
  * `kind=last_name` → `string_value`
  * `kind=email` → `email_value`
  * `kind=phone_number` → `phone_value`
  * `kind=greenhouse_job_questions` → resume + custom questions
* **Confirmation**: HTTP 200 (or 302 redirect to a thank-you page)
* **CSRF**: `authenticity_token` Rails CSRF token — readable from the form DOM

## Notes

* `document.title` example: `"Software Engineer, Multiverse - Mountain View, California, United States - San Francisco, California, United States - New York City, New York, United States"` — job title is everything before the first ` - `.
* AWS WAF fires many telemetry POSTs on page load — ignore these, they're anti-bot signals.
* The `pass_through` field is `{}` (empty) — attribution data from the referring source is not forwarded.
* LinkedIn attribution: if the user arrived from LinkedIn, check `document.referrer` or look for `utm_source` in the URL before the `#apply` fragment is added.
