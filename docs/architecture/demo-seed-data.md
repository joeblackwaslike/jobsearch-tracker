# Demo Seed Data

**Date:** 2026-03-03
**Branch:** `feat/extension`
**File:** `supabase/seed.sql`

---

## Problem

The original seed data was insufficient to demonstrate the real value of the product. Specific deficiencies:

- **Companies** had `NULL` for `links`, `culture`, `benefits`, `pros`, and `cons` — the fields that make a company research view meaningful
- **Applications** were mostly missing `job_description`, `source`, and `url` — job descriptions in particular are a major content feature
- **Events** were sparse and disconnected — they did not tell a coherent story per application, and the progression through interview stages was not representative of how real job searches unfold
- **Contacts** had no contact info and minimal notes — insufficient for demonstrating the AI thank-you note feature planned for later
- The overall volume was too low to exercise pagination or make dashboard widgets and stat cards show interesting numbers

---

## Goals

1. All company fields populated with realistic, plausible content
2. Applications with rich markdown job descriptions and realistic source attribution (~70%)
3. Events that tell complete, coherent per-application stories through the interview process
4. Contacts linked to their interview events with emails and/or phone numbers
5. Enough volume across all tables to trigger pagination and populate all dashboard stat cards
6. Dashboard stats that produce interesting, realistic-looking numbers

---

## Solution

Complete rewrite of `supabase/seed.sql` with the following data:

### Volume

| Table | Count |
|---|---|
| Companies | 15 |
| Applications | 20 |
| Events | 28 |
| Contacts | 14 |
| Documents | 5 |
| Application Documents | 12 |
| Event Contacts | 29 |

### Dashboard Stats (at seed time)

| Stat | Value | How |
|---|---|---|
| `total_applications` | 19 | 20 apps minus 1 archived |
| `interviews_upcoming` | 5 | events with `type LIKE '%interview%'` and `scheduled_at > now()` |
| `active_applications` | 11 | 7 applied + 4 interviewing |
| `offers` | 1 | InnovateLabs offer |
| `rejections` | 4 | MediaStream, CyberSecure, GameDev, AI Innovations (early) |
| `contacts` | 14 | all contacts |
| `companies` | 15 | all companies |
| `response_rate` | ~31.6% | 6 with interviews/offer/accepted out of 19 total |

---

## Application Stories

Each application and its associated events tells a coherent narrative. The stories are designed to cover the full range of outcomes a real job seeker would experience.

### Full Journey → Accepted

**BigTech Solutions — React Developer** (`status: accepted`)
Screening → Behavioral → Technical → Onsite (4 rounds) → Offer → Accepted
Applied Jan 2024. The baseline success story with the most complete event chain.

### Current Offer

**InnovateLabs — Senior Frontend Engineer** (`status: offer`)
Screening → Technical → Behavioral → Offer received
Applied Jan 2026. The open-source design systems company with strong mutual fit.

### Active — Upcoming Interviews

**TechCorp Inc — Senior Frontend Developer** (`status: interviewing`)
Screening (done) → Behavioral (done) → **Technical scheduled +7 days from seed**

**StartupXYZ — Full Stack Engineer** (`status: interviewing`)
Screening (done) → Technical (done) → **Behavioral scheduled +12 days from seed**

**CloudScale Systems — Software Engineer** (`status: interviewing`)
Screening (done) → **Behavioral scheduled +17 days from seed**

**GreenTech Solutions — Senior Frontend Engineer** (`status: interviewing`)
Screening (done) → **Technical scheduled +22 days from seed**

### Rejected at Various Stages

**MediaStream Co — Senior Frontend Engineer** (`status: rejected`)
Screening → Technical → Rejected (streaming/HLS knowledge gap)

**CyberSecure Systems — Frontend Security Engineer** (`status: rejected`)
Screening → Behavioral → Technical → Rejected (compensation mismatch)

**GameDev Studios — Web Developer** (`status: rejected`)
Screening → Rejected (compensation + WebGL experience gap)

**AI Innovations — Frontend Engineer** (`status: rejected`)
Screening → Rejected quickly (Python/ML depth gap)

### Archived — Declined Offer

**Apex Analytics — Data Visualization Engineer** (`status: archived`)
Full journey: Screening → Technical → Onsite → Offer received → Declined
`archived_reason: "Declined offer — accepted BigTech Solutions position"`
Excluded from `total_applications` count (has `archived_at`).

### Fresh Applications (No Events)

GreenTech Solutions (Full Stack Dev), AI Innovations (Frontend, AI Platform), EduTech Platform, HealthTech Innovations, NovaMobile, FinServ Tech (TypeScript Engineer), Apex Analytics (Frontend Architect)

### Bookmarked

TechCorp Inc (Staff Frontend Engineer), FinServ Tech (React Developer)

---

## Upcoming Interview Dates

The 5 upcoming interviews use relative dates so the `interviews_upcoming` stat card always shows a non-zero value regardless of when the seed is run:

| Offset | Application | Type |
|---|---|---|
| `now() + 5 days` | AI Innovations — AI Platform | screening-interview |
| `now() + 7 days` | TechCorp Inc — Senior Frontend | technical-interview |
| `now() + 12 days` | StartupXYZ — Full Stack | behavioral-interview |
| `now() + 17 days` | CloudScale — Software Engineer | behavioral-interview |
| `now() + 22 days` | GreenTech — Senior Frontend | technical-interview |

All past event `scheduled_at` values remain hardcoded — they represent historical backstory and do not affect live stats.

---

## Company Data

All 15 companies have fully populated fields:

- **`links`** — JSON object with `website`, `careers`, `news`, `linkedin`, `glassdoor`, `crunchbase` keys using plausible but fictional URLs
- **`culture`** — 2–3 sentences describing engineering culture and working style
- **`benefits`** — Compensation, PTO, learning budget, parental leave specifics
- **`pros`** — Comma-separated strengths from a candidate perspective
- **`cons`** — Honest tradeoffs and weaknesses
- **`tech_stack`** — Technologies specific to each company
- **`ratings`** — JSON with `overall`, `workLifeBalance`, `compensation`, `careerGrowth`, `culture`, `management` scores
- **`tags`** — JSON array of searchable labels (stage, domain, work-type)
- **`researched`** — `true` for companies with complete research, `false` for those bookmarked but not yet investigated

---

## Contact Design

Contacts are designed with the AI thank-you note feature in mind:

- Every interview event has at least one contact linked via `event_contacts`
- Contacts include either `email` or `phone` (sometimes both), reflecting realistic recruiter/engineer communication patterns
- The `notes` field contains context useful for generating personalized thank-you notes: topics discussed, interviewer personality, specific questions asked, and next steps mentioned

---

## Document Structure

| Document | Type | Used By |
|---|---|---|
| Senior Frontend Engineer Resume | resume (v3, primary) | BigTech, InnovateLabs, TechCorp, MediaStream, CyberSecure, Apex, GreenTech Senior |
| Full Stack Engineer Resume | resume (v2, alternate) | StartupXYZ, CloudScale |
| TechCorp Inc — Cover Letter | cover-letter | TechCorp application |
| BigTech Solutions — Cover Letter | cover-letter | BigTech application |
| InnovateLabs — Cover Letter | cover-letter | InnovateLabs application |

The resume is versioned (`revision: '3'`). The Full Stack resume is a child document of the Senior Frontend resume (`parent_id` set), establishing a document revision relationship.

---

## Seed Script Behavior

The seed script is idempotent — all `INSERT` statements include `ON CONFLICT (id) DO NOTHING`. Running it against a database that already has the data silently skips duplicates.

The script selects the first existing user by `created_at` and seeds all data under that account. If no user exists, it creates `joeblackwaslike@me.com / toor` automatically.

### Running the seed

```bash
# Reset DB and re-seed (full clean slate)
pnpm db:seed

# Re-seed against current DB without resetting (idempotent)
pnpm db:reseed
```
