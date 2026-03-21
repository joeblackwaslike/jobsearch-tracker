# PRD: AI-Assisted Job Search Workflows

**Status:** Draft
**Date:** 2026-03-03
**Scope:** Epic — multiple implementation phases

---

## Problem Statement

Job searching is a high-stakes, high-effort process where the most impactful actions (cold outreach, interview prep, follow-ups) are also the most cognitively exhausting and easy to skip. This system already tracks applications and events; the opportunity is to use that structured data to drive AI-assisted workflows that handle the tedious groundwork and surface the outputs for human review and approval before anything consequential happens.

Trust is the central design constraint. The system will be sending emails in the user's name and drafting documents that represent them professionally. It must be **transparent** (every action visible), **auditable** (complete history, including terminations), and **permission-first** (nothing consequential happens without explicit approval).

---

## Goals

- Auto-trigger AI workflows when key application events occur
- Track each workflow step (running, awaiting approval, approved, terminated) in a durable way
- Surface pending actions in a single unified inbox so nothing falls through the cracks
- Allow iterative document refinement before approval
- Record all outcomes including terminations with reasons (the "why not" is as important as the "why")
- Keep the human fully in control; AI handles research and drafts, human approves everything

## Non-Goals (this epic)

- Autonomous AI that takes actions without approval
- Mobile push notifications (email reminders are sufficient for now)
- Multi-user / team access
- Integrations beyond Apollo (contact research) and Gmail (send)
- Real-time AI streaming in the UI (batch async is fine)
- Supporting non-Gmail email providers (Outlook, SMTP, etc.)

---

## Privacy & Data Governance

Privacy is a core design constraint, not a compliance checkbox. This system handles resumes, personal notes, interview details, and email content — among the most sensitive data a person produces during a job search. Any feature that sends this data to an external service must be opt-in, fully disclosed, and revocable without friction.

**The rule:** when privacy must be traded for utility, the user decides — with full information, not buried consent. Default is always privacy-preserving.

### Principles

- **Opt-in, never opt-out.** No data leaves the system to a third party unless the user has actively enabled the feature that requires it. Defaults protect privacy.
- **Full prior disclosure.** Before a user enables any feature that shares data externally, they must be shown exactly what data will be sent, to which service, and for what purpose — not in legal boilerplate but in plain language.
- **Revocability without friction.** Any consent can be withdrawn at any time via a single action in Settings. Revoking stops all future data sharing for that feature immediately.
- **Data minimization.** Only the data strictly required for a task is sent. If a task can be completed without a field, that field is not included in the API payload.
- **No silent sharing.** If data sharing fails to be disclosed, that is a bug. The system must never send data to an external service the user hasn't explicitly opted into.

### Data flows by service

| Service                    | Data sent                                                                    | When                                          | Controlled by                                              |
|----------------------------|------------------------------------------------------------------------------|-----------------------------------------------|------------------------------------------------------------|
| **Anthropic**              | Resume content, job description, company info, interview notes, draft history, user feedback | Generating drafts and research   | `ai_email_drafts`, `ai_company_research`, `ai_thank_you_notes` |
| **Apollo**                 | Company name, job title keywords, company size/stage                         | Running `contact_research` tasks              | `ai_contact_research` flag                                 |
| **Gmail**                  | Approved email body, recipient address(es)                                   | User explicitly approves sending a draft      | `ai_email_drafts` flag + Gmail OAuth                       |
| **Google**                 | Account email, display name                                                  | Sign-in / identity only                       | Google OAuth connection                                    |
| **Web search** *(Phase 3)* | Company name, role title                                                     | Company research tasks                        | `ai_company_research` flag                                 |

Apollo receives no resume content. Anthropic receives no contact email addresses (only name/title for personalisation). Gmail receives only content the user has read and approved. These boundaries are enforced at the task execution layer, not by policy alone.

### Consent model

**Feature-level consent (required before first use):**

When a user enables the AI features master toggle for the first time, they must read and accept a disclosure that covers:

- Which external services will receive their data
- What specific data each service receives
- That data sent to third-party APIs is subject to those providers' own privacy policies (with links)
- That consent can be revoked at any time in Settings → Integrations

This disclosure must be versioned. If the disclosure materially changes (new service added, new data type shared), existing users must re-consent before the new data sharing begins.

**Integration-level consent (at connection time):**

When connecting a specific integration (adding an Apollo key, granting Gmail send), show a short, plain-language summary of what that specific service will receive before the connection is saved. Not a modal that blocks the action — a clear notice adjacent to the connect button.

**No per-task consent popups.** Feature-level and integration-level consent covers ongoing task execution. Interrupting users before every API call would undermine the value of automation. The consent is given once, at the feature level, and remains until revoked.

### Data minimization rules

These are implementation requirements, not suggestions:

- **Apollo payloads:** company name, job title keywords, company size/stage only. Never include resume content, user name, or email address.
- **Anthropic payloads:** only the fields listed in the data flows table above. Do not include fields not needed for the specific task type. For `contact_research`-triggered `email_draft`, send the approved contact's name and title — not their email address (that stays in the system).
- **Error logs:** never log full API payloads. Truncate or omit fields that contain resume content, interview notes, or personal identifiers. Log task IDs and error codes, not the data that caused the error.
- **Caching:** do not cache API responses containing personal data beyond what's needed to complete the task. Once a draft is generated and stored in `documents`, the raw Anthropic response is discarded.

### Revocation

| Action                             | Immediate effect                                                          |
|------------------------------------|---------------------------------------------------------------------------|
| Disable AI features master toggle  | No new tasks created; running tasks complete; no further API calls        |
| Disable a per-feature toggle       | No new tasks of that type; running tasks complete                         |
| Remove Apollo API key              | No Apollo calls; `contact_research` tasks move to `blocked`               |
| Remove Anthropic API key           | No Claude calls; all AI generation tasks move to `blocked`                |
| Revoke Gmail send                  | No emails sent; approved drafts remain available for manual sending       |
| Disconnect Google account          | Gmail token deleted; Google identity unlinked                             |

Disabling a flag does not delete data already generated (documents, contact records). That data belongs to the user. It stops future external data sharing, not past outputs.

### Account deletion

When a user deletes their account:

- All locally stored data is deleted per Supabase cascade rules (applications, events, documents, tasks, contacts, etc.)
- OAuth tokens are revoked with the provider before deletion
- A deletion request is sent to Anthropic via their data deletion API if one exists at time of implementation
- Apollo does not offer a deletion API; the disclosure must note that Apollo may retain any data sent to their API per their own privacy policy — users should be aware of this before enabling contact research

We cannot guarantee deletion from third-party systems once data has been processed by them. This limitation must be stated plainly in the feature-level consent disclosure.

### Consent records schema

Consent events are recorded so there is a durable record of what was agreed to and when:

```sql
CREATE TABLE user_consents (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL,
  -- 'ai_features' | 'anthropic_data' | 'apollo_data' | 'gmail_send'
  granted      BOOLEAN NOT NULL,
  version      TEXT NOT NULL,
  -- identifier of the disclosure text version they agreed to
  created_at   TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own" ON user_consents FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "insert_own" ON user_consents FOR INSERT WITH CHECK (user_id = auth.uid());
```

When consent is revoked, insert a new row with `granted = false` rather than deleting the prior consent record. The audit trail must be append-only.

---

## Core Abstractions

### Events (extended)
Events are already the primary timeline entity. This epic formalizes two events that are currently implicit:

- **`bookmarked`** — created when an application is saved without applying yet
- **`applied`** — created when an application is submitted; the resume used is attached here

Every AI workflow is triggered by a specific event type. The event is the "why" for the task.

### Tasks
The new central entity. A **task** represents a single AI workflow step: it has a type, a lifecycle status, a payload (AI outputs), and produces zero or one documents as output. Tasks are durable — they're created when triggered, survive server restarts, and their complete history (including terminations and feedback iterations) is preserved.

```
pending → running → awaiting_approval → approved → completed
        ↘ blocked                     ↘ terminated
          (auth error on integration)
          ↗ (key fixed)
        ↘ needs_input                 (missing required context)
          ↗ (user provides it)
        ↘ running (retry, backoff)
          ↘ failed (max retries exceeded)
```

| Status              | Meaning                                                                         |
|---------------------|---------------------------------------------------------------------------------|
| `pending`           | Created, waiting to start                                                       |
| `running`           | AI actively working (includes retry attempts in backoff)                        |
| `needs_input`       | Missing required context — surfaced in inbox with a suggested completion action |
| `blocked`           | Integration auth error — will not attempt until key is fixed                   |
| `awaiting_approval` | AI produced output; waiting for human decision                                  |
| `approved`          | Human approved; downstream action triggered (send email, etc.)                  |
| `terminated`        | Human rejected/cancelled; reason recorded                                       |
| `completed`         | All downstream actions finished successfully                                    |
| `failed`            | Exceeded max retries or non-retriable data error                                |

### Documents (extended)
Documents gain two new fields:

- **`source`**: `'user'` (uploaded/written) or `'ai_generated'`
- **`status`**: `'draft'` | `'approved'` | `'sent'` | `'archived'`

The existing `parent_id` already supports revision chains — each refinement iteration creates a new document pointing to its predecessor. The most recent document in the chain is the current draft.

Documents are now linkable to events directly (not just applications), enabling the resume → applied event, company research → interview event relationships.

**Content format convention:**

The existing `mime_type` field is the authoritative content-type contract — never guess, always read it. For AI-generated content, `text/markdown` is the default and preferred format:

- Markdown is token-efficient, which matters when passing document content back into Claude for refinement iterations
- LLMs generate well-structured markdown naturally and extract semantics from it reliably
- `react-markdown` is already installed in the frontend for rendering
- The UI renders `text/markdown` documents; other types are displayed as plain text or via appropriate viewers

**`mime_type` by document type:**

| Document type      | Stored `mime_type` | Notes                                                                     |
|--------------------|--------------------|---------------------------------------------------------------------------|
| `email` (draft)    | `text/markdown`    | Converted to `text/html` at Gmail send time; stored copy stays markdown   |
| `company_research` | `text/markdown`    |                                                                           |
| `thank_you`        | `text/markdown`    | Converted to `text/html` at send time                                     |
| `resume` (user)    | varies             | `application/pdf`, `text/plain`, etc. — read `mime_type` to determine handling |
| `email` (sent)     | `text/html`        | Post-conversion sent copy, stored for audit trail                         |

**Resume input to Claude:** when a task needs to pass resume content to the Claude API, read `mime_type` to decide the approach — Claude accepts PDF bytes directly for supported formats; otherwise extract text first. Never assume format.

---

## Task Types

### 1. `contact_research`

- **Trigger:** `applied` event
- **Purpose:** Find a relevant hiring contact at the company to cold-email
- **Input:** Company name, job description, company size/stage
- **Output stored in `payload`:** Array of contact candidates

```json
{
  "candidates": [
    {
      "name": "Jane Smith",
      "title": "VP Engineering",
      "email": "jane@company.com",
      "linkedin": "https://linkedin.com/in/jsmith",
      "source": "apollo",
      "confidence": "high",
      "rationale": "VP Eng at 50-person Series B, directly manages hiring"
    }
  ],
  "search_query": "...",
  "notes": "Found 3 candidates; 1 high-confidence, 2 possible"
}
```

- **Approval action:** Selected candidates become `contacts` records; linked to the `applied` event via `event_contacts`
- **Termination:** Record why (e.g., "no relevant contacts found", "company too large to target directly")
- **Downstream:** Triggers `email_draft` task upon approval (if user wants to proceed)

**Targeting logic by company stage:**

- Pre-seed / seed: CTO or lead engineer, fallback to any cofounder
- Series A/B: Engineering Manager or Director of relevant team, fallback to VP Eng
- Series C+: Recruiter for the specific product area, fallback to general recruiter or VP Eng
- Enterprise: Specific recruiter if identifiable, fallback to talent acquisition team

**Important edge cases:**

- LinkedIn roles managed by a recruiting firm may not include company name — job description must be scraped for contact info or recruiting firm details
- Apollo search by company name (not domain) risks finding contacts at wrong company — validate domain when possible

### 2. `email_draft`

- **Trigger:** `contact_research` task approved (or manually triggered)
- **Purpose:** Draft a personalized cold outreach email to approved contacts
- **Input:** Job description, resume (from `applied` event documents), one approved contact, company info
- **Fan-out:** If multiple contacts are approved from `contact_research`, one `email_draft` task is created per contact — one task per document, always.
- **Output:** Creates a `documents` row with `type='email'`, `source='ai_generated'`, `status='draft'`
- **Refinement:** User submits feedback → new document created with `parent_id` pointing to previous draft; `iteration` counter increments
- **Approval action:** Email sent via Gmail API; document status set to `'sent'`; sent email stored
- **Termination:** Record reason; document archived

**Missing resume handling:**

Before creating the task in `running`, check whether a resume document is linked to the `applied` event. If one is found, proceed normally. If not, create the task in `needs_input` status rather than failing silently or producing a worse draft without one.

The inbox item for a `needs_input` email_draft task should not feel like an error — it should feel like a near-complete action. Suggested framing: "Ready to draft your cold email to [Company] — just confirm which resume you used."

The suggested resume is determined by:

1. Most recently linked document with `type = 'resume'` across all of the user's `application_documents`
2. If none exists, prompt to upload one

The inbox item presents the suggestion with two actions: **"Use [Resume Name]"** (one tap — links it to the applied event and transitions the task to `pending`) and **"Choose a different resume"** (opens a picker). Once linked, the task proceeds automatically without requiring the user to return to the app.

This pattern — task exists, progress visible, one action to unblock — applies whenever a task needs user input. The `needs_input` status is the general mechanism; the resume case is the first instance of it.

**Email requirements:**

- Tone: warm, direct, genuinely interested — not buzzword-laden or robotic
- Content: references the specific role, highlights relevant experience from resume, shows knowledge of the company
- CTA: brief, suggests a short chat to discuss qualifications
- Attachment: resume PDF (the one used to apply)
- Length: short — hiring managers don't read essays from strangers

**Quality bar:** Each draft must be screened before returning to user. Flag and regenerate if: uses buzzwords ("passionate", "synergy", "leverage"), sounds like a template, doesn't reference something specific about the company or role, or exceeds ~200 words.

### 3. `company_research`

- **Trigger:** First `interview_scheduled` event for an application (screening or phone screen)
- **Purpose:** Prepare comprehensive company research to inform interview preparation
- **Input:** Company info, job description, user's resume, public sources (Glassdoor, news, blog, Crunchbase, tech stack signals)
- **Output:** Creates a `documents` row with `type='company_research'`, `source='ai_generated'`, `status='draft'`
- **Timing:** Should be ready at least 3 days before `scheduled_at`
- **Refinement:** Same iterative cycle as email_draft
- **Approval action:** Document status set to `'approved'`; no external action

**Layered revision model:**

Company research uses a two-tier document structure built on `parent_id`:

- **Root document (base research):** Created on the first `interview_scheduled` event. Contains only timeless company context — sections 1–6 below. No interview-round-specific content. `parent_id = null`.
- **Round document (interview prep):** Created for each subsequent interview event (screening, onsite, final, etc.). `parent_id` points to the root base document — always the root, not the previous round. Inherits the base research and layers on round-specific context: stage-appropriate interview questions (section 7), relevant interviewer profiles, and any new company signals since the base was written.

This keeps each round's prep document clean and self-contained. The AI reads the base document as shared context and adds only what is specific to that round. Approved base research is never duplicated — it is referenced.

**Research sections:**

Base document (root, generated once per application):

1. Company overview: mission, values, culture, products, funding history, growth trajectory
2. Recent signals: news, blog posts, initiatives, layoffs, leadership changes (last 6 months)
3. Technical: tech stack, engineering blog, open source presence, engineering org size
4. Compensation: bands, benefits, equity structure (from Levels.fyi, Glassdoor, etc.)
5. Reputation: Glassdoor reviews, what engineers say on social/blind, red flags
6. Fit analysis: cross-reference with candidate's background; alignment, gaps, talking points

Round document (generated per interview event, branches from root):

7. Likely interview questions for this stage with suggested answer frameworks
   - Answers must sound human and show genuine curiosity
   - No pre-packaged "I'm passionate about…" openers
   - Templates are fine where authentic detail isn't available, clearly marked as such
8. Interviewer profiles: LinkedIn summary, public writing, areas of likely focus (from `event_contacts`)
9. Stage-specific signals: any new company news since base was written

### 4. `thank_you_draft`

- **Trigger:** Interview event status changes to `'completed'`
- **Purpose:** Draft personalized thank-you notes to each interviewer
- **Input:** Interview notes (from event `notes` field), interviewer contacts (from `event_contacts`), company research doc
- **Output:** One `documents` row per interviewer, `type='thank_you'`, `source='ai_generated'`, `status='draft'`
- **Timing:** Should surface in inbox same day as interview completion
- **Approval action:** Each note approved and sent individually via Gmail API
- **Priority:** Increases with interview round — onsite thank-yous are critical

Each note is approved individually — not as a batch. Each one is personalized to the specific interviewer, so the user should read and approve each before it goes out. This is still far less effort than writing them from scratch, which is the bar: even approving four separate notes after an onsite is easier than writing four from scratch when you're exhausted.

---

## Integration Health Model

Every external service that requires a credential — whether an API key (Anthropic, Apollo, Inngest) or OAuth (Google/Gmail) — is represented as a row in `user_integrations`. This table is the single source of truth for what's configured, what's working, and what's broken.

**Inngest is a prerequisite integration.** It is the job queue that executes all AI tasks. If Inngest is not configured (`status != 'ok'`), no AI tasks will be dispatched regardless of other integrations. The Settings → Integrations UI should surface this clearly — Inngest is shown first, marked as "Required for AI features".

### Schema

```sql
CREATE TABLE user_integrations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider        TEXT NOT NULL,
  -- 'inngest' | 'anthropic' | 'apollo' | 'google'
  api_key         TEXT,
  -- for key-based providers; null for OAuth providers
  status          TEXT NOT NULL DEFAULT 'unconfigured',
  -- 'unconfigured' | 'ok' | 'error'
  last_error      TEXT,
  -- human-readable error from the most recent health check or failed operation
  last_checked_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, provider)
);

ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own" ON user_integrations FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "insert_own" ON user_integrations FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "update_own" ON user_integrations FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "delete_own" ON user_integrations FOR DELETE USING (user_id = auth.uid());

CREATE INDEX idx_user_integrations_user ON user_integrations(user_id);
```

API keys are stored in `api_key` (plain text for MVP, encrypted via Supabase Vault before any real users). For OAuth providers (Google), `api_key` is null — the credential lives in `user_oauth_tokens`; the `user_integrations` row exists solely to track status and surface errors.

### Environment variable fallback

For local development velocity, API keys can be set as environment variables. When a user has no key configured in `user_integrations`, the system checks for an env var fallback before treating the integration as disabled.

**Priority order:** user key (`user_integrations.api_key`) → env var → disabled

| Provider  | Env var              |
|-----------|----------------------|
| Inngest   | `INNGEST_API_KEY`    |
| Anthropic | `ANTHROPIC_API_KEY`  |
| Apollo    | `APOLLO_API_KEY`     |

This also supports self-hosted production deployments where an operator wants to pre-fund a shared key without requiring every user to supply their own.

**Settings UI behavior when env var is active but no user key set:**

- Status badge: green "Connected (system key)"
- Muted note below: "Using a system-provided key. Add your own key to use your quota."
- "Add my own key" expander shows the input — saving a user key overrides the system key immediately

**Env vars are never exposed to the client.** Key resolution happens server-side only (API routes / Edge Functions). The settings UI learns the status via the health-check response, not by reading the key itself.

### Status lifecycle

| Status | Meaning | UI treatment |
| --- | --- | --- |
| `unconfigured` | No key/token provided | Grey — "Not connected" + primary CTA to connect |
| `ok` | Last health check passed | Green — "Connected" or "All systems operational" with last-checked timestamp |
| `error` | Last check failed or operation returned an error | Red — error message + "Update key" or "Reconnect" CTA |

### Error classification & retry policy

Not all failures are equal. The system must distinguish between errors that are worth retrying and errors where retrying wastes resources and creates a false impression that things are working.

**Error classes:**

| Class | Examples | Retry? | Behaviour |
| --- | --- | --- | --- |
| **Transient** | Network timeout, 502, 503, 500 | Yes — exponential backoff | Retry with jitter: 30s → 2m → 8m → 30m → give up after 5 attempts; set task `status = 'failed'` |
| **Rate limited** | 429 Too Many Requests | Yes — after quota resets | Use `Retry-After` header if present; otherwise retry at next quota window (hourly/daily per provider docs); task stays `running` or moves to a `rate_limited` sub-state |
| **Auth failure** | 401 Unauthorized, 403 Forbidden, invalid API key | No — never | Immediately mark integration `status = 'error'`; set `last_error` to a clear message; halt all pending tasks for that provider; notify user by email |
| **Bad request** | 400 with data error, malformed prompt | No | Mark task `failed` with reason; integration status unchanged — this is a task-level problem, not a credential problem |

**Auth failure gating — the key rule:**
Before dispatching any API call, check `user_integrations.status` for the relevant provider. If status is `error` and `last_error` indicates an auth failure, **skip the call entirely** — do not attempt it, do not create a new failure. Tasks that would use this integration stay `pending` but are flagged as blocked by an integration error. This prevents a cascade of failures and avoids the appearance of the system working when it isn't.

When the user updates their API key, integration status resets to `unconfigured`, the validation call runs, and if it passes, all blocked `pending` tasks are eligible to run again.

**Rate limit gating:**
Store the earliest retry time in `user_integrations` when a 429 is received. Before dispatching, check this timestamp. If `now() < retry_after`, defer the task rather than attempting and failing.

```sql
-- Additional columns on user_integrations for retry state
ALTER TABLE user_integrations
  ADD COLUMN error_class TEXT,
  -- 'auth' | 'rate_limit' | 'transient' | null
  ADD COLUMN retry_after TIMESTAMPTZ;
  -- set on rate_limit errors; cleared when quota restores
```

**Notification on auth failure:**
An auth failure is the one error class that warrants a proactive out-of-band notification. The user may not visit the app for days; tasks silently piling up as blocked while nothing executes is exactly the "appearance of things working when they are not" problem to avoid.

When integration status transitions to `error` with class `auth`:

1. Send an email: "Your [Anthropic / Apollo] API key stopped working — AI features are paused until it's updated" with a direct link to the Integrations settings page
2. Show a persistent banner in the app (not just a badge) until the key is fixed
3. The inbox should surface a system-level notice above task items: "Action required: Anthropic API key invalid — tasks are paused"

The email is sent once per auth failure event, not repeatedly. If the user fixes the key and it breaks again, send again.

### What triggers a status update

1. **Key saved:** immediately run a lightweight validation call (e.g., list models for Anthropic, a minimal search for Apollo, token introspect for Google) and update `status`, `error_class`, `last_checked_at`
2. **OAuth token refreshed:** update status to `ok` and `last_checked_at`; if refresh fails with auth error, set `error` with class `auth`
3. **Task fails with an API error:** classify the error, update integration accordingly — auth failure halts all tasks; rate limit sets `retry_after`; transient increments retry counter on the task
4. **`retry_after` timestamp passes:** cron clears the `retry_after` field and re-queues rate-limited tasks
5. **Periodic health check (Phase 2+):** cron re-validates all `ok` integrations; catches externally-revoked tokens before the user hits a mid-workflow failure

### Settings → Integrations UI

One card per integration provider. Each card shows:

- Provider name + icon
- **Status badge:** green "Connected" / red "Error" / grey "Not connected"
- For `ok`: "Last checked [relative time]" in muted text — e.g. "Last checked 2 hours ago"
- For `error`: the `last_error` message in red, below the badge — e.g. "Invalid API key — check your Anthropic console" or "Gmail access was revoked — reconnect to continue"
- For `unconfigured`: brief one-liner on what this integration unlocks

**Anthropic card:**

- API key input (masked after save, shows last 4 chars)
- "Save" / "Remove" buttons
- Links to Anthropic console

**Apollo card:**

- API key input (masked after save)
- "Save" / "Remove" buttons
- Link to Apollo.io API settings

**Google / Gmail card:**

- Shows connected Google account email if signed in with Google
- Gmail send permission status separately (can have Google account but not gmail.send scope)
- "Connect Gmail" / "Revoke Gmail access" button
- "Disconnect Google" link (separate, with confirmation)

### Usage & cost visibility (post-MVP, non-blocking)

Each integration card should eventually surface usage data to help users understand whether they're within a provider's free tier and predict costs when they're not. This is not blocking for initial release but should be added before the feature is broadly used.

- **Apollo:** free tier has a monthly credit limit; show credits used / credits remaining when the API provides this in response headers or a usage endpoint
- **Anthropic:** no free API tier; show token count for the current billing period when available via the usage API; note current pricing tier

When usage data is available, surface it on the integration card below the status badge: "X of Y credits used this month" or "~$Z estimated this month based on recent usage." When a user exceeds their free tier for the first time, send a one-time notification so it isn't a surprise on their next bill.

If a provider doesn't expose usage data via API, omit this section for that card — don't approximate or guess.

### Dependency surfacing in AI Features settings

Each AI feature toggle shows a dependency hint when its required integration is not `ok`:

- Contact Research toggle: "Requires Apollo API key" link → jumps to Integrations page at Apollo card
- Cold Email Drafts toggle: "Requires Anthropic API key" + "Requires Gmail" links
- Company Research toggle: "Requires Anthropic API key" link
- Thank-You Notes toggle: "Requires Anthropic API key" + "Requires Gmail" links

The toggle itself is not disabled — users can enable it speculatively. The missing integration becomes a blocker only when a task actually tries to run, at which point the task fails gracefully with a pointer to Settings.

---

## UI Component Strategy

### Untitled UI React

This epic requires several complex UI components that would be expensive to build from scratch: inbox-style notification lists, document editors with approval flows, settings pages with toggle groups, multi-select tables with checkboxes, feedback forms, and modal approval dialogs.

**[Untitled UI React](https://www.untitledui.com/react/docs/introduction)** covers all of these. It is the component model for the entire epic's UI layer.

**Why it fits:**

- Copy-into-project model — no npm dependency, full code ownership, no vendor lock-in
- MIT licensed, free tier is comprehensive
- Stack is already aligned: React 19, TypeScript 5.8+, Tailwind CSS 4.1 — all already in this project
- Built on React Aria for accessibility primitives (the only new dependency: `react-aria`)
- Component categories directly relevant to this epic: notification/inbox lists, settings pages, data tables with selection, modals, document viewers, form inputs with validation states, toggle switches, badge/status indicators

**Current project context:**

- One Radix UI component in use (`@radix-ui/react-slider`) — trivial to replace with Untitled UI equivalent when encountered
- `lucide-react` icons already installed and used by Untitled UI components
- `tailwind-merge` and `class-variance-authority` already installed

**Approach:** When building any new component for this epic, check Untitled UI React first. Copy the relevant component into `src/components/ui/` and adapt to project conventions. Build custom only where no suitable Untitled UI component exists.

**New dependency to add:**

```bash
pnpm add react-aria
```

---

## Schema Changes

### New: `tasks` table

```sql
CREATE TABLE tasks (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  application_id    UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  trigger_event_id  UUID REFERENCES events(id) ON DELETE SET NULL,
  type              TEXT NOT NULL,
  -- contact_research | email_draft | company_research | thank_you_draft
  status            TEXT NOT NULL DEFAULT 'pending',
  -- pending | running | awaiting_approval | approved | terminated | completed | failed
  title             TEXT,
  payload           JSONB DEFAULT '{}',
  -- AI outputs (contact candidates, metadata, search context, etc.)
  feedback          TEXT,
  -- User's latest feedback for refinement iteration
  terminated_reason TEXT,
  iteration         INTEGER DEFAULT 0,
  -- Number of refinement rounds completed
  error             TEXT,
  -- Technical error message if status = 'failed' or 'blocked'
  error_class       TEXT,
  -- 'auth' | 'rate_limit' | 'transient' | 'bad_request' — drives retry behaviour
  retry_count       INTEGER NOT NULL DEFAULT 0,
  next_retry_at     TIMESTAMPTZ,
  -- set during backoff; worker skips task until now() >= next_retry_at
  created_at        TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at        TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_application_id ON tasks(application_id);
CREATE INDEX idx_tasks_status ON tasks(user_id, status);
CREATE INDEX idx_tasks_trigger_event ON tasks(trigger_event_id);
```

### Modify: `documents` table

```sql
ALTER TABLE documents
  ADD COLUMN source TEXT NOT NULL DEFAULT 'user',
  -- 'user' | 'ai_generated'
  ADD COLUMN status TEXT NOT NULL DEFAULT 'active',
  -- 'draft' | 'active' | 'approved' | 'sent' | 'archived'
  ADD COLUMN task_id UUID REFERENCES tasks(id) ON DELETE SET NULL;

CREATE INDEX idx_documents_task_id ON documents(task_id);
```

### Rename and modify: `application_documents` → `application_events_documents`

Renamed to reflect that documents can be scoped to both an application and an optional event. Event scoping is preferred where it applies (e.g., a resume linked to an `applied` event, a draft linked to the triggering event), but not required — the `event_id` is nullable for documents that belong to an application generally without belonging to a specific event.

```sql
ALTER TABLE application_documents RENAME TO application_events_documents;

ALTER TABLE application_events_documents
  ADD COLUMN event_id UUID REFERENCES events(id) ON DELETE SET NULL;

CREATE INDEX idx_application_events_documents_event ON application_events_documents(event_id);
```

### New: Explicit initial events via trigger

When an application is created, auto-insert the appropriate initial event:

```sql
CREATE OR REPLACE FUNCTION create_initial_application_event()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO events (
    user_id,
    application_id,
    type,
    status,
    title,
    created_at,
    updated_at
  ) VALUES (
    NEW.user_id,
    NEW.id,
    CASE WHEN NEW.status = 'applied' THEN 'applied' ELSE 'bookmarked' END,
    'completed',
    CASE WHEN NEW.status = 'applied' THEN 'Applied' ELSE 'Bookmarked' END,
    COALESCE(NEW.applied_at, NEW.created_at),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_application_created
  AFTER INSERT ON applications
  FOR EACH ROW EXECUTE FUNCTION create_initial_application_event();
```

When status changes from `bookmarked` → `applied`, insert an `applied` event:

```sql
CREATE OR REPLACE FUNCTION create_applied_event_on_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'bookmarked' AND NEW.status = 'applied' THEN
    INSERT INTO events (
      user_id, application_id, type, status, title, created_at, updated_at
    ) VALUES (
      NEW.user_id, NEW.id, 'applied', 'completed', 'Applied',
      COALESCE(NEW.applied_at, NOW()), NOW()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_application_status_applied
  AFTER UPDATE OF status ON applications
  FOR EACH ROW EXECUTE FUNCTION create_applied_event_on_status_change();
```

### New: `user_integrations` table

See "Integration Health Model" section above for the full DDL. This replaces the idea of per-column API keys on `user_settings`.

### No changes needed to `events`, `contacts`, `event_contacts`, `companies`

These tables already support the required relationships. New event types (`bookmarked`, `applied`, `thank_you_sent`, `email_sent`) are just new values for the existing `type` text field.

---

## UI/UX Requirements

### New View: Inbox (`/inbox`)

The most important new view. Surfaces all tasks that need attention.

**Layout:** Three sections

1. **Needs Your Attention** — tasks with `status = 'awaiting_approval'`
2. **In Progress** — tasks with `status = 'running'`
3. **Recently Completed / Terminated** — last 30 days, collapsed by default

**Each inbox item shows:**

- Task type icon + label (e.g., "Contact Research", "Draft Email")
- Company name + role
- Time since created / time until interview (for time-sensitive tasks)
- Primary CTA button ("Review", "Approve", "View")

**Contact research item (expanded):**

- Table of candidates with name, title, source, confidence
- Checkbox to select one or more
- "Approve Selected" button → triggers email_draft task
- "Terminate — No suitable contacts" with optional note field

**Document item (expanded):**

- Inline document preview (scrollable)
- "Approve" button
- "Request Changes" expander → text field for feedback → "Submit" → triggers new iteration
- "Terminate" with reason

### Modified View: Application Detail

Add an **"AI Activity"** tab alongside existing tabs. Shows:

- Chronological list of all tasks for this application
- Each task: type, status badge, created date, link to output document (if any)
- Terminated tasks shown with reason (transparency)
- Manual trigger buttons: "Find Contacts", "Draft Cold Email" (disabled with tooltip if prerequisites not met, e.g., no contacts approved yet)

### New View: Document Editor (`/documents/:id`)

For reviewing and refining AI-generated documents.

- Full document content display (markdown rendered)
- "Revision history" sidebar: linked list via `parent_id`, click to compare
- Action bar at top: **Approve** | **Request Changes** | **Terminate**
- "Request Changes" → inline feedback textarea → "Submit Feedback"
- When `status = 'approved'` or `'sent'`: read-only, shows outcome timestamp

### Navigation

Add **"Inbox"** to the main sidebar nav with a badge count for pending approvals. Badge should be prominent — this is the primary driver for return visits during an active job search.

### AI features discovery banner

New users see a persistent banner on the dashboard prompting them to set up AI features. The banner is shown on every visit until the user either:

- Completes the CTA (navigates to Settings → Integrations and saves at least one integration), or
- Explicitly dismisses it via an "×" or "Dismiss" action

Dismissed state is stored in `user_settings` (e.g., `ai_setup_banner_dismissed BOOLEAN DEFAULT false`). The banner is not a modal and does not block navigation. It should feel like an invitation, not a nag.

A full onboarding flow (guided walkthrough of integration setup) is a post-launch fast follow, not in scope for this iteration.

### Pending task digest email

Notification fatigue is a real risk. A job search is already stressful — spamming the user with an email per task would quickly teach them to ignore all emails from the system, including important ones like auth failures.

**Policy:** at most one digest email per day, sent only when there are tasks eligible for inclusion.

**Eligibility rule:** a task must have been in `awaiting_approval` for at least 24 hours before it's included in a digest. This gives users a natural window to handle things themselves through the app before any email is sent.

**Digest contents:**

- Subject: "You have [N] items waiting for your review"
- Brief list of pending tasks: task type, company name, role, time waiting
- Each item has a direct deep link to that specific task in the app
- Deep links use time-limited signed URLs (magic link pattern via Supabase) so the user can open and act on a task directly from mobile without needing to log in separately
- A single "View all pending" link to `/inbox` at the bottom

**Timing:** send once per day in the morning (around 8am user local time if determinable, otherwise a fixed UTC time). Don't send if there are no eligible tasks. Don't send more than one per day regardless of how many tasks accumulate.

**Distinct from auth failure emails:** auth failure notifications are immediate and not batched — a broken API key is urgent. The daily digest covers routine pending approvals only.

**Schema addition:**

```sql
ALTER TABLE user_settings
  ADD COLUMN notify_ai_tasks BOOLEAN NOT NULL DEFAULT true;
  -- included in daily digest when ai_features_enabled is true
```

Defaults to `true` since users who've opted into AI features will want to know when tasks need their attention. Surfaced in **Settings → Notifications** alongside existing notification toggles.

---

## Google OAuth & Permission Model

### Sign-in strategy

Both email/password and Google OAuth are supported as sign-in methods. Either can be used at signup.

Sign-in scopes at signup (Google path): `openid email profile` only. No Gmail scopes at signup — most users will not consent to email send permissions before they trust the application, and asking upfront will hurt conversion and trust. Google also reviews apps that request broad scopes aggressively.

### Identity linking

Users who signed up with email/password can connect a Google account later via **Settings → Integrations** using Supabase's `linkIdentity()` API. This adds Google as an additional sign-in option — they can then sign in with either email or Google. It does not force a change and does not replace their existing login method. The linked identity also provides the OAuth token needed for Gmail send via incremental consent.

### Incremental consent for Gmail send

Gmail send permission (`gmail.send`) is requested **at the moment the user first tries to send an approved document**, not at signup. The flow:

1. User approves an email draft in the inbox
2. If `gmail.send` not yet granted: show a modal explaining what permission is being requested and why ("To send this email, we need permission to send on your behalf. We only send emails you explicitly approve.")
3. User clicks "Connect Gmail" → OAuth redirect requesting `gmail.send` scope
4. On return: token stored, email send proceeds
5. If user declines the OAuth: document stays `approved`, UI shows "Gmail not connected — send manually or connect Gmail in Settings"

This means email send is never blocked — users without Gmail connected can still use the drafts and send manually.

### Settings: Google connection management

Under **Settings → Integrations** (new settings section):

- **Google Account:** shows connected email address, "Disconnect" button
- **Gmail Send Permission:**
  - If not granted: "Not connected" + "Connect Gmail" button with explanation
  - If granted: "Connected as your-account at gmail.com" + "Revoke Access" button
  - Revoking calls Google's token revocation endpoint AND deletes the stored token
- On disconnect of the Google Account entirely: revoke all Gmail tokens and clear stored tokens; user must reconnect to restore

### Token storage

OAuth tokens are stored in a dedicated table (not mixed into `user_settings`):

```sql
CREATE TABLE user_oauth_tokens (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider      TEXT NOT NULL,           -- 'google'
  access_token  TEXT NOT NULL,
  refresh_token TEXT,
  token_expiry  TIMESTAMPTZ,
  granted_scopes TEXT[] DEFAULT '{}',   -- tracks which scopes have been granted
  created_at    TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at    TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, provider)
);

ALTER TABLE user_oauth_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own" ON user_oauth_tokens FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "insert_own" ON user_oauth_tokens FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "update_own" ON user_oauth_tokens FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "delete_own" ON user_oauth_tokens FOR DELETE USING (user_id = auth.uid());
```

`granted_scopes` is the source of truth for what a user has authorized. Before any Gmail send, check `'gmail.send' = ANY(granted_scopes)`. When a new scope is granted via incremental consent, append it to this array and refresh the access token.

**Security — pre-release gate:** Access tokens are stored plain text with RLS during development. Encryption at rest via Supabase Vault is required before this feature ships to any real user. This is not optional and not deferred beyond release.

Integration health for Google (connected account, gmail.send scope status) is surfaced through the `user_integrations` table — see "Integration Health Model" section below.

### Graceful degradation when Gmail not connected

Any UI that would trigger a send must check for Gmail permission first:

- If not connected: show the action as available but display "Connect Gmail to send" as the CTA instead of "Send"
- Never silently fail — always make the permission state visible
- Draft documents remain accessible and useful even without send permission (user can copy-paste)

---

## AI Feature Flags

Not every user will want AI features, and some will be comfortable with research tasks but not automated email send. Feature flags let users opt in selectively and revoke at any time.

### Feature flag design

A single master switch plus per-feature toggles. All default to `false` (opt-out by default).

| Flag                    | Controls                                                                   |
|-------------------------|----------------------------------------------------------------------------|
| `ai_features_enabled`   | Master switch — if false, no AI tasks are triggered or displayed           |
| `ai_contact_research`   | Auto-trigger `contact_research` tasks when applications are submitted      |
| `ai_email_drafts`       | Enable `email_draft` tasks and Gmail send                                  |
| `ai_company_research`   | Auto-trigger `company_research` tasks when interviews are scheduled        |
| `ai_thank_you_notes`    | Auto-trigger `thank_you_draft` tasks when interviews are completed         |

Per-feature flags only take effect when the master switch is on. Turning off a per-feature flag does not cancel in-progress tasks — tasks already running complete normally; only future triggers are suppressed.

### AI Feature Flags Schema

New columns on `user_settings`:

```sql
ALTER TABLE user_settings
  ADD COLUMN ai_features_enabled        BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN ai_contact_research        BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN ai_email_drafts            BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN ai_company_research        BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN ai_thank_you_notes         BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN ai_setup_banner_dismissed  BOOLEAN NOT NULL DEFAULT false;
```

### Anthropic API Key

Stored and managed via the `user_integrations` table (provider `'anthropic'`). See "Integration Health Model" section for the full schema and status lifecycle. The AI Features settings section links to the Integrations page for key setup and shows the current health status inline ("API key required" / "Connected" / error state).

### Settings UI

**Settings → AI Features** (new tab/section):

1. **Master toggle:** "Enable AI-powered features" — prominent, with a brief description of what this unlocks. Off by default with a clear "opt in" framing, not "opt out."

2. When master is on, show individual feature toggles:

   - "Contact Research" — "Automatically search for hiring contacts when you apply to a role"
   - "Cold Email Drafts" — "Draft personalized outreach emails for approved contacts" — note: requires Gmail connection
   - "Company Research" — "Generate interview prep research when interviews are scheduled"
   - "Thank-You Notes" — "Draft personalized thank-you notes after interviews"

3. Each feature toggle shows its dependency status inline:

   - `ai_email_drafts`: if Gmail not connected, show "Requires Gmail — Connect Gmail" link inline
   - No hard blocking — user can enable the toggle but the send step will prompt for Gmail when reached

4. Below the toggles, a "What does this mean?" expandable explaining data usage, what the AI has access to, and that nothing is sent without explicit approval.

### Task trigger gating

Before creating any AI task, check both flags:

```ts
// Pseudocode — check before inserting any task row
async function shouldTriggerTask(userId: string, taskType: TaskType): Promise<boolean> {
  const settings = await getUserSettings(userId)
  if (!settings.ai_features_enabled) return false
  const flagMap = {
    contact_research: settings.ai_contact_research,
    email_draft: settings.ai_email_drafts,
    company_research: settings.ai_company_research,
    thank_you_draft: settings.ai_thank_you_notes,
  }
  return flagMap[taskType] ?? false
}
```

Manual triggers (user clicks "Find Contacts" on application detail) bypass the auto-trigger flags but still respect the master `ai_features_enabled` switch.

---

## Integration Points

### All phases: Inngest (task queue)

- Durable step-function execution for all AI tasks
- User supplies key via `user_integrations` (provider `'inngest'`); `INNGEST_API_KEY` env var as fallback for operator-managed deployments
- Each task type maps to an Inngest function with steps matching the task lifecycle (fetch context → call API → store result → notify)
- Built-in exponential backoff handles transient errors; `sleep()` until `retry_after` handles rate limits; auth failures halt via Inngest's cancellation API
- Free tier: 50k executions/month, 5 concurrent steps — sufficient for personal/small-group use
- Self-hosters configure their own Inngest account key in Settings → Integrations

### Phase 2: Apollo.io (contact research)

- REST API; user supplies key via `user_integrations` (provider `'apollo'`)
- Search by company name + title keywords
- Must validate company domain to avoid wrong-company matches
- Rate limits: handled per error classification policy above

### Phase 2: Gmail API (send emails)

- See "Google OAuth & Permission Model" section above for auth details
- Scopes: `gmail.send` (incremental consent at send time)
- Attachments: resume PDF from Supabase Storage, streamed to Gmail API
- Sent email stored as `documents` row with `status='sent'`

### Phase 3: Web research (company research)

- Claude API with web search tool (Perplexity or Tavily as search provider)
- Sources: Glassdoor, Crunchbase, company blog, LinkedIn company page, news
- Store sources array in document metadata for auditability

### Phase 3: Gmail API (send thank-you notes)

- Same OAuth scope + token as cold emails
- One send per interviewer contact

---

## Task Triggering Rules

| Event type                                     | Event status change    | Tasks auto-triggered                        |
|------------------------------------------------|------------------------|---------------------------------------------|
| `applied`                                      | created                | `contact_research`                          |
| `contact_research` task                        | `approved`             | `email_draft` (if user proceeds)            |
| `interview_scheduled` (first for application)  | created                | `company_research`                          |
| interview event                                | status → `completed`   | `thank_you_draft` (one per interviewer)     |

All auto-triggers create tasks in `pending` status. They transition to `running` when the AI worker picks them up. This means triggers are visible in the Activity tab immediately, even if the AI hasn't run yet — the user can see "Contact research queued" right after applying.

All auto-triggers are gated by the user's AI feature flags. If the master switch or the relevant per-feature flag is off, no task is created and no activity is shown. Manual triggers (from the application detail page) respect only the master switch.

**Source independence:** trigger logic does not distinguish between how an application or event was created. An application tracked via the browser extension follows the exact same trigger path as one created through the UI. The extension is just another write path to the same data model.

---

## MVP Scope (Phase 1)

**Goal:** Build the data model and UI shell without any real AI. Use this phase to validate the UX flows with manually-seeded task data.

**Deliverables:**

1. Database migrations: `tasks` table, `documents` additions, `application_documents.event_id`, `user_oauth_tokens` table, `user_integrations` table, AI feature flag columns on `user_settings`, initial event triggers
2. Update seed data to include tasks in all states + AI-generated documents + feature flags varied across test users
3. Settings → AI Features section (master toggle + per-feature toggles)
4. Settings → Integrations section (Google account status, Gmail permission status + grant/revoke)
5. Inbox view (`/inbox`) — reads from DB, all task type UIs, approve/terminate flows work end-to-end
6. Application detail AI Activity tab
7. Document editor with revision history and feedback submission
8. Inbox badge count in sidebar nav
9. Manual "Find Contacts" and "Draft Email" triggers on application detail (creates task in `pending`, shows immediately)
10. Graceful "Connect Gmail" CTA shown wherever send would occur but permission not granted

**Explicitly deferred to Phase 2:**

- Actual AI calls (Apollo, Claude API)
- Real Gmail OAuth flow (settings UI shows the UI but the actual token exchange is wired in Phase 2)
- Gmail send
- Background job infrastructure (task runner / queue)

This lets us ship and use the UI before wiring up any external APIs.

---

## Phase 2: AI Worker + Contact Research

Deliverables:

- Background job infrastructure (Supabase Edge Function on cron, or a queue)
- Apollo integration for `contact_research` tasks
- Claude API integration for `email_draft` tasks
- Document refinement loop (user submits feedback → new draft generated)
- Real Gmail OAuth token exchange wired up

## Phase 3: Interview Prep + Thank-You Notes

Deliverables:

- Company research generation (`company_research` tasks)
- Thank-you note generation (`thank_you_draft` tasks)
- Gmail send for approved documents

---

## Open Questions

1. ~~**Background job infrastructure**~~ — **Resolved:** Use Inngest. Each AI task type maps to a durable Inngest step function. User supplies their own Inngest API key via `user_integrations` (provider `'inngest'`); `INNGEST_API_KEY` env var as operator fallback. Self-hosters configure their own Inngest account. Free tier (50k executions/month, 5 concurrent steps) is sufficient for personal use. Inngest is a prerequisite — no AI tasks dispatch unless Inngest integration status is `ok`.

2. ~~**Apollo API access**~~ — **Resolved:** user-supplied key via `user_integrations`, no operator key. Feature is gated on `status = 'ok'` for the Apollo integration.

3. ~~**Task fan-out for thank-you notes**~~ — **Resolved:** One task per document, always. After an interview with N contacts, N separate `thank_you_draft` tasks are created, each producing one document and one inbox item. This is the universal rule — no task ever produces more than one document.

4. ~~**`application_documents` long-term**~~ — **Resolved:** Renamed to `application_events_documents`. Event scoping via `event_id` is preferred wherever a document belongs to a specific event, but `event_id` is nullable — documents without a natural event scope (e.g., a generic resume attachment) remain application-scoped only.

5. ~~**Company research reuse across interviews**~~ — **Resolved:** Two-tier layered model. Root document holds base company research (sections 1–6, timeless, generated once). Each interview round gets its own document with `parent_id` pointing to the root — not the previous round — layering on stage-specific prep (questions, interviewer profiles, fresh signals). Context stays clean per round; base research is never duplicated.

6. ~~**Google sign-in vs. email sign-in coexistence**~~ — **Resolved:** Both email/password and Google OAuth are supported at signup. Email users can connect Google later via `linkIdentity()` in Settings → Integrations — adds Google as an additional login option without replacing their existing method. Linked identity also provides the OAuth token for Gmail send.

7. ~~**Token security**~~ — **Resolved:** OAuth tokens stored plain text with RLS during development. Encrypting at rest via Supabase Vault is a **hard pre-release gate** — must be completed before the AI features ship to any real user. Not deferred indefinitely; deferred only until release.

8. ~~**Feature flag defaults**~~ — **Resolved:** Persistent dashboard banner shown until user completes the CTA (saves at least one integration) or explicitly dismisses it. Dismissed state stored in `user_settings.ai_setup_banner_dismissed`. A full onboarding flow is a post-launch fast follow, not in scope for this iteration.

9. ~~**Operator Anthropic key**~~ — **Resolved:** no operator key. All API keys are user-supplied via `user_integrations`. Tasks fail gracefully with a Settings pointer when integration status is not `ok`.

10. ~~**Untitled UI React PRO**~~ — **Resolved:** Use free tier only. Build custom where free components fall short. Revisit PRO only if genuinely blocked during implementation.
