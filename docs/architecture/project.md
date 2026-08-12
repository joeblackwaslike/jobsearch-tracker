# Project Overview

**Last updated:** 2026-03-04

---

## Mission

A privacy-first, AI-assisted job search tracker for software engineers. Fast, focused, and self-hostable. Helps users track applications, manage interview workflows, and automate the tedious parts of a job search — while keeping the user in control of every consequential action.

---

## Problem Statement

Job searching is cognitively expensive. The mechanics — tracking where you applied, when, to whom, and what stage you're in — are just table stakes. The high-value work (cold outreach, interview prep, follow-ups) is where most candidates fall short, not because they don't know better but because it's exhausting and easy to skip when you're also doing interviews, code challenges, and working a day job.

The core gap this product fills:

- **Organization without friction.** Spreadsheets are the default and they're terrible. Existing trackers are either too generic, too manual, or buried behind slow UI. A job search happens across dozens of browser tabs; capturing a new application should take seconds, not a context switch.
- **AI that assists without overstepping.** The same AI that drafts a personalized cold email or generates interview prep research would destroy trust if it sent that email without the user reading it first. The product needs to be genuinely useful for automating tedious work while keeping every consequential action — send this email, add this contact, approve this draft — explicitly in the user's hands.
- **Privacy by design.** Job search data is personal: resumes, interview notes, salary expectations, professional relationships. Existing tools treat this data as a product opportunity. This tool does not.

---

## Target User

**Primary:** Software engineers actively conducting a job search, particularly those with multiple concurrent applications in flight and at least some interest in using AI tooling to reduce manual effort.

**Secondary:** Developers who want to self-host their own job search tooling rather than depend on a SaaS product with unclear data practices.

**Not targeted (this iteration):**

- Non-technical job seekers (UX is built for developers)
- Recruiters or hiring teams (this is a candidate-side tool only)
- Users who need a mobile-first experience (web-first; mobile is not in scope)

---

## Competitive Landscape

| Product | What it does well | Where it falls short |
| --- | --- | --- |
| **Teal** | Polished UI, resume builder, browser extension | SaaS-only, opaque data practices, AI features require subscription |
| **Huntr** | Kanban board for job tracking, good visual pipeline | No document management, no AI features, limited customization |
| **Notion templates** | Flexible, customizable, already in users' workflow | High setup friction, no automations, no browser extension |
| **LinkedIn Jobs** | Where most people find jobs; has an "Easy Apply" flow | No tracking across other job boards, no interview management |
| **Google Sheets** | Universal fallback; everyone has access | No structure, no automations, no reminders, no document storage |
| **Leet Resume** | Resume tailoring, AI suggestions per job description | Narrow scope; no application tracking or interview management |

**Differentiation:**

- **Self-hostable.** The only tracker in this category that can be run entirely on your own infrastructure.
- **Privacy by default.** No data leaves the system to a third party unless the user actively enables it. Feature-level consent before any external API call.
- **AI with human-in-the-loop.** The AI handles research and drafting; the human approves every consequential action. Not autopilot — co-pilot.
- **Developer experience.** Browser extension for one-click capture from any job board. Rich markdown job description storage. Document revision history. All the details a developer cares about.
- **Structured, not flexible.** Deliberately opinionated schema. No blank canvases, no config overhead — the structure is there on day one.

---

## Product Principles

These principles govern every product and UX decision:

1. **Privacy is non-negotiable.** Default to the most protective option. Opt-in for everything that shares data with a third party.
2. **Human in the loop.** AI assists; humans approve. No autonomous consequential actions.
3. **Trust through transparency.** Every action taken on the user's behalf is visible and auditable. Terminations are recorded. "Why not" is as important as "why."
4. **Friction-free capture.** Getting a new application into the system should be one click from any job board.
5. **Warm, direct tone.** AI-generated content sounds human — specific, curious, concise. No buzzwords. No template-speak.
6. **Graceful degradation.** Features that require an integration degrade cleanly if that integration is not configured. The user can always complete an action manually.
7. **Self-hosting as a first-class model.** Every feature that requires an external account must be configurable by a self-hoster in Settings → Integrations with no operator involvement.

---

## User Stories & Acceptance Criteria

### Capture & Tracking

**As a job seeker, I want to add a new application from a job board in one click, so that I don't break my browsing flow.**

- Extension detects job postings and presents a "Track" button
- Clicking "Track" captures company name, position, and job URL
- Application is created with `status: applied`
- If the application already exists (same company + position, created recently), the extension returns the existing `application_id` rather than creating a duplicate
- Confirmation is visible in the extension popup within 2 seconds

**As a job seeker, I want to track the status of every application in one place, so that I always know where I stand.**

- Applications list shows status, company, position, and date
- Status can be updated inline (bookmarked → applied → interviewing → offer → accepted / rejected)
- Archived applications are hidden by default but accessible via a filter toggle
- List is paginated and searchable/filterable by status, interest level, work type, employment type, and company

**As a job seeker, I want to record detailed notes about a company, so that I can make an informed decision if an offer comes.**

- Company record stores: culture, benefits, pros, cons, tech stack, ratings, and relevant links
- Links include website, careers page, LinkedIn, Glassdoor, Crunchbase, and news
- `researched` boolean lets me distinguish companies I've actively investigated from ones I've only bookmarked

---

### Interview Management

**As a job seeker, I want to log every interview event with scheduling details, so that I never miss an interview.**

- Events record: type, status, title, scheduled date/time, duration, URL (video call link), and notes
- Event types cover: screening, behavioral, technical, online test, take-home, onsite, offer, rejection
- Creating an interview event automatically transitions the application to `interviewing` status (if currently `applied`)
- Creating an offer event automatically transitions the application to `offer` status (if currently `interviewing`)
- Upcoming events are surfaced on the dashboard

**As a job seeker, I want to log who I interviewed with, so that I can write personalized thank-you notes and keep track of my relationships.**

- Contacts can be linked to specific events (e.g., "Jane Smith interviewed me for the technical round")
- Contact records include: name, title, email, phone, LinkedIn URL, and notes
- Contact notes are a natural place to record what was discussed, the interviewer's personality, and context useful for follow-up

---

### Document Management

**As a job seeker, I want to store my resume versions and cover letters, so that I know which document I sent to each company.**

- Documents support: resume, cover letter, portfolio, certification, and other types
- Documents can be uploaded as files (PDF, etc.) or created as text/markdown content
- Documents can be attached to an application as a snapshot at link time — the snapshot is immutable even if the source document is later revised
- Document revision history is maintained via `parent_id` — each revision points to its predecessor
- `revision` field allows human-readable version labels (e.g., "v3", "senior-fe")

**As a job seeker, I want to see which documents I submitted with each application, so that I can maintain consistency.**

- Application detail shows all attached document snapshots
- Each snapshot records the name, type, revision, and content at the time of attachment

---

### AI-Assisted Workflows *(planned)*

**As a job seeker, I want the system to find a relevant hiring contact at the company after I apply, so that I have someone to cold-email.**

- Triggers automatically when an `applied` event is created (if `ai_contact_research` is enabled)
- Searches Apollo for candidates using company name, role keywords, and company size/stage
- Returns a ranked list of candidates with name, title, email, source, confidence level, and rationale
- I can select one or more candidates to approve — selected contacts become `contacts` records linked to the `applied` event
- I can terminate the task with a reason if no contacts are suitable
- Approving a contact triggers an `email_draft` task

**As a job seeker, I want a personalized cold email drafted for me after I identify a contact, so that I don't have to write it from scratch.**

- Triggers after `contact_research` task is approved
- Uses my resume, the job description, and the approved contact's name and title to draft a personalized outreach email
- Draft is presented for review in the inbox — I can approve, request changes (with feedback), or terminate
- Requesting changes with feedback starts a new revision; the original draft is preserved in the revision chain
- Approving triggers Gmail send (if connected); if Gmail is not connected, the draft remains available to copy-paste

**As a job seeker, I want interview prep research generated before each interview, so that I walk in knowing the company, the role, and the likely questions.**

- Triggers automatically when an interview event is scheduled (if `ai_company_research` is enabled)
- Generates: company overview, recent news, culture fit signals, likely interview questions with suggested response frameworks
- Root base document (timeless company context) is generated once per company
- Each interview round gets its own document that branches from the root — not from prior rounds
- Document is attached to the interview event and available in the application's AI Activity tab

**As a job seeker, I want a personalized thank-you note drafted after each interview, so that I can follow up quickly without the cognitive overhead.**

- Triggers automatically when an interview event is marked `completed` (if `ai_thank_you_notes` is enabled)
- Uses: interviewer's name and title (from event_contacts), interview notes, and any feedback the user added
- Same approve / request changes / terminate flow as email drafts
- Approved draft sends via Gmail to the linked contact's email address

---

### Settings & Integrations

**As a job seeker, I want to control exactly what data is shared with external services, so that I can use AI features without compromising my privacy.**

- AI features are opt-in at two levels: a master toggle and per-feature toggles
- All defaults are `false` — no data leaves the system until I actively enable a feature
- Before enabling the master AI toggle for the first time, I see a plain-language disclosure of what data each service will receive
- I can revoke any consent at any time via a single action in Settings → Integrations, with immediate effect

**As a self-hoster, I want to configure my own API keys for all external services, so that I'm not dependent on a shared operator key.**

- All API keys (Anthropic, Apollo, Inngest) are configured per-user in Settings → Integrations
- Environment variable fallbacks (`ANTHROPIC_API_KEY`, etc.) allow operator-level pre-configuration for managed deployments
- Priority order: user key → env var → disabled

---

## Feature Inventory

### Shipped

| Feature | Status |
| --- | --- |
| Application tracking (CRUD, filters, pagination) | Shipped |
| Company research records | Shipped |
| Interview events with auto-status transitions | Shipped |
| Contacts with event linking | Shipped |
| Document management (upload, create, snapshot, revision chain) | Shipped |
| Dashboard stat cards and recent activity | Shipped |
| User settings (theme, locale, notifications) | Shipped |
| Supabase Auth (email/password) | Shipped |
| Browser extension API (`/signin`, `/refresh`, `/track`) | Shipped |

### In Progress / Planned

| Feature | Epic | Phase |
| --- | --- | --- |
| Google OAuth sign-in + identity linking | AI Integration | Phase 1 |
| `user_integrations` table + Settings UI | AI Integration | Phase 1 |
| Inngest job queue setup | AI Integration | Phase 1 |
| AI feature flags on `user_settings` | AI Integration | Phase 1 |
| `tasks` table + task lifecycle | AI Integration | Phase 1 |
| Contact research via Apollo | AI Integration | Phase 2 |
| Cold email drafting via Claude | AI Integration | Phase 2 |
| Gmail send (incremental OAuth consent) | AI Integration | Phase 2 |
| Company research via Claude | AI Integration | Phase 3 |
| Thank-you note drafting via Claude | AI Integration | Phase 3 |
| Inbox view (`/inbox`) | AI Integration | Phase 2 |
| AI Activity tab on application detail | AI Integration | Phase 2 |
| Document editor with revision history sidebar | AI Integration | Phase 2 |
| Pending approval digest email | AI Integration | Phase 2 |
| Auth failure notifications | AI Integration | Phase 2 |

---

## Goals

### Product goals

- Reduce the per-application time cost of cold outreach, interview prep, and follow-up to near zero for users who opt into AI features
- Make every consequential AI action visible, auditable, and revocable before it takes effect
- Be the best job tracker for software engineers — not the broadest, but the most useful for this specific user

### Technical goals

- Zero-knowledge default: no user data ever leaves the system without an explicit opt-in
- Sub-2-second response on all common operations (application list, event creation, document view)
- Self-hosting works out of the box: clone, configure env vars, run
- All schema changes are migration-based; database is always reproducible from zero
- Full test coverage for service layer logic; component tests for non-trivial UI

---

## Non-Goals

### Product non-goals

- **No autonomous AI actions.** The AI never sends an email, adds a contact, or takes any consequential action without explicit human approval
- **No operator-funded AI keys.** All API keys are user-supplied. The product does not subsidize API costs
- **No mobile app.** The web experience is responsive but mobile is not a primary target
- **No multi-user / team features.** Single-user only — data isolation is absolute
- **No non-Gmail email providers.** Outlook, SMTP, and other email providers are not in scope for the send feature
- **No onboarding flow (this iteration).** A guided AI setup walkthrough is a post-launch fast follow
- **No real-time AI streaming.** Batch async task execution is sufficient; streaming responses are not needed

### Technical non-goals

- **No operator-managed infrastructure.** Self-hosters run standard Supabase + Node.js. No Kubernetes, no custom infrastructure
- **No feature flags service.** AI feature flags are stored in `user_settings` — no third-party flag management overhead
- **No analytics SDK.** No Mixpanel, Amplitude, or similar. Privacy-first means not instrumenting user behavior by default

---

## Roadmap

### Phase 0 — Core tracker ✅

Foundation: application tracking, events, contacts, documents, dashboard, browser extension API.

### Phase 1 — AI infrastructure

- Google OAuth sign-in and identity linking
- `user_integrations` table and Settings → Integrations UI
- Inngest queue setup + `tasks` table
- AI feature flags
- Consent model and `user_consents` table

### Phase 2 — Contact research + email outreach

- Apollo integration: `contact_research` task type
- Claude integration: `email_draft` task type
- Gmail send (incremental OAuth consent)
- Inbox view with task approval flow
- Pending approval digest email
- AI Activity tab on application detail

### Phase 3 — Interview prep + thank-you notes

- Claude: `company_research` task type (root + per-round documents)
- Claude: `thank_you_draft` task type
- Document editor with revision history

### Phase 4 (exploratory)

- Guided onboarding for AI features
- Web search integration for company research (Phase 3 enhancement)
- Mobile-optimized views
- Export / backup functionality

---

## Success Metrics

Success for this product is measured by whether it makes job searching materially less exhausting. Proxies:

| Metric | What it indicates |
| --- | --- |
| Applications tracked per user session | Tool is being used actively during a job search |
| Time from `applied` event → `email_draft` task approved | AI outreach is useful and not creating more work |
| Task termination rate | AI quality — high terminations may indicate poor output quality or targeting |
| `ai_setup_banner_dismissed` vs. first integration saved | Discovery and conversion through the setup prompt |
| Response rate (interviews / applications) | Downstream signal — does AI-assisted outreach improve response rates? |

---

## Constraints

- **Costs kept minimal.** Free tiers used first. No paid infrastructure or APIs without being genuinely blocked. All AI costs are user-borne (user supplies their own API keys).
- **Supabase as the only backend.** Auth, database, storage, realtime, and edge functions all run through Supabase. No separate backend service.
- **No shared credentials.** No secrets are pre-populated. Self-hosters configure everything in Settings → Integrations.
- **Privacy is a hard constraint, not a trade-off.** It cannot be relaxed to ship faster or add a feature. If a feature requires sharing data without explicit user consent, the feature does not ship.
