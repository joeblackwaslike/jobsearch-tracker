# THRIVE Frontend Iteration — Design Document

**Date:** 2026-02-21
**Branch:** feat/thrive-clone
**Approach:** Frontend-first, then backend/infra

---

## Overview

This iteration delivers five categories of work:

1. User Menu in NavBar
2. Toast Notifications
3. Application Forms Overhaul (new components + field improvements + bugfixes)
4. Remaining frontend items (interviews filter, settings email toggle, documents UI)
5. Backend/infrastructure (email reminders, pre-commit, GitHub Actions)

---

## 1. User Menu in NavBar

Replace the `<Settings>` icon link in `nav-bar.tsx` with a `<UserMenu>` component.

### States
- **Logged out**: Dropdown with "Login" and "Register" options. Each opens a modal using the existing `LoginForm` and `SignupForm` auth components.
- **Logged in**: Circular avatar showing user initials (image fallback) + email address. Dropdown shows "Settings" (links to `/settings?tab=general`) and "Sign Out" (calls `supabase.auth.signOut()` then navigates to `/`).

### Changes
- New file: `frontend/src/components/layout/user-menu.tsx`
- Modify: `frontend/src/components/layout/nav-bar.tsx` — replace Settings icon block with `<UserMenu />`, both in desktop header and mobile Sheet drawer.
- Auth modals: wrap `LoginForm` and `SignupForm` in `<Dialog>` inside `UserMenu` component (local open state, no new routes needed).

---

## 2. Toast Notifications

### Infrastructure
- Mount `<Toaster />` (from `sonner.tsx`) in `RootDocument` in `__root.tsx`, inside the `ThemeProvider`/`TooltipProvider` tree.

### Pattern
Call `toast.success("...")` or `toast.error("...")` in mutation hook callbacks (`onSuccess`/`onError`) in `frontend/src/lib/queries/`.

### Coverage
| Domain | Actions |
|---|---|
| Companies | add, edit, archive |
| Applications | add (easy add + full add), edit, archive |
| Interviews | add, edit, delete |
| Documents | add, edit, archive |
| Contacts | add, edit, delete |
| Settings | save (fires once per successful mutation) |
| Auth | new user signup success |

---

## 3. Application Forms Overhaul

### Architecture: Three Separate Components

| Component | Purpose | File |
|---|---|---|
| `EasyAddForm` | Quick add (Company, Position, URL, Resume) | `easy-add-form.tsx` |
| `FullApplicationForm` | New full-featured add modal | `full-application-form.tsx` |
| `ApplicationForm` | Existing edit-only form (refactored) | `application-form.tsx` |

A shared `useApplicationFormFields` hook (or set of sub-components) provides the grouped field sections used by both `FullApplicationForm` and `ApplicationForm` (edit).

### 3a. Easy Add Form

- Renamed from the current create-mode in `ApplicationForm`.
- Fields: Company (combobox), Position (input), URL (input), Resume (DocumentTypePicker).
- Default status: `applied`.
- Triggered by: new "Easy Add" button on Applications page header + Dashboard quick actions.

### 3b. Full Add Application Form

- New component with all fields, grouped into sections.
- Default status: `applied`.
- Default employment type: `full-time`.
- Triggered by: existing "New Application" button on Applications page + Dashboard "New Application" link.

### 3c. Field Improvements (Full Add + Edit)

**Field Groupings:**
- **Basic Information**: Company, Position, Status, Interest
- **Job Details**: Work Type, Employment Type, Location, URL, Job Description
- **Salary Information**: Period, Currency, Min/Max Slider
- **Additional Information**: Source, Tags, Notes
- **Documents**: Document UI

**Work Type — Hybrid Expansion:**
- Replace `"hybrid"` with four options: `"Hybrid (1 day)"`, `"Hybrid (2 day)"`, `"Hybrid (3 day)"`, `"Hybrid (4 day)"`.
- Update everywhere: `application-form.tsx`, `full-application-form.tsx`, `application-table.tsx`, `application-detail.tsx`, `application-filters.tsx`.

**Source Field — SourceCombobox:**
- New component: `frontend/src/components/applications/source-combobox.tsx`
- Pattern: shadcn `Command` + `Popover` (mirrors `CompanyCombobox`).
- Predefined options: google search, google jobs, theirstack, welcome to the jungle, linkedin, wellfound, glassdoor, builtin, workatastartup, indeed, dice, ziprecruiter, levels, blind, referral.
- Allows free-text override if value not in list.

**Tags Field — TagInput:**
- New component: `frontend/src/components/ui/tag-input.tsx`
- UX: typing text + comma converts current text to a chip badge. Chips are removable with `×`.
- Internal state: `string[]`. Serialized to DB as `string[]` (no change to DB schema).
- Replace the comma-separated `<Input>` in both Full Add and Edit forms.

**Location Field — CityCombobox:**
- New component: `frontend/src/components/applications/city-combobox.tsx`
- Backed by: `frontend/src/data/major-us-cities.json` — ~1,000 `"City, ST"` strings.
- Pattern: same `Command`/`Popover` as `CompanyCombobox` but over static data.

**Salary Field — SalaryRangeSlider:**
- New component: `frontend/src/components/ui/salary-range-slider.tsx`
- Uses `@radix-ui/react-slider` (new dependency).
- Layout: Period select → Currency select → dual range slider.
- Annual period: 0–1,000,000 in $1,000 steps; display as "$Xk – $Yk".
- Hourly period: 0–500 in $1 steps; display as "$X/hr – $Y/hr".
- Changing period resets slider to [0, max].
- Remove `monthly` as a period option.

**Employment Type:** Default to `"full-time"` in both Easy Add and Full Add forms.

### 3d. Bugfixes

- **Edit Application modal overflow**: Increase `ScrollArea` from `max-h-[60vh]` to `max-h-[70vh]`; ensure `DialogContent` has `max-h-[90vh] overflow-hidden`.
- **Edit Company modal overflow**: Apply same `ScrollArea` + `max-h` pattern to `CompanyForm` in edit mode.
- **Default status**: Both Easy Add and Full Add default to `"applied"`.

---

## 4. Remaining Frontend Items

### 4a. Interviews Page Filter

- Default: hide interviews whose associated application is `status = "archived"`.
- UI: Show a subtle filter chip "Active interviews only" with an `×` to clear.
- Implementation: filter in the component after fetching; no query change needed.

### 4b. Settings — Email Reminders

- DB migration: `ALTER TABLE settings ADD COLUMN email_reminders boolean NOT NULL DEFAULT true;`
- UI: Replace the disabled "Email Notifications — Coming Soon" toggle in `general-tab.tsx` with a functional `email_reminders` switch wired to `useUpdateSettings`.

### 4c. Documents UI on Application Forms

- Update the Documents fieldset in both `FullApplicationForm` and `ApplicationForm` (edit mode).
- Show attached documents as a list with file type icon, document name, and detach button.
- Resume picker (`DocumentTypePicker`) remains at the top of the section.

---

## 5. Backend / Infrastructure

### 5a. Email — react-email + Resend + Supabase Cron

**Dependencies:**
- `react-email` — runtime dependency (not devDependency) for rendering email templates.

**New Supabase Edge Function:** `supabase/functions/send-interview-reminders/index.ts`

Logic:
1. Query interviews where `scheduled_at` is tomorrow (date range check).
2. Join to applications → exclude any with `status = "archived"`.
3. Join to user settings → exclude if `notify_interview = false` OR `email_reminders = false`.
4. For each qualifying interview: render the `InterviewReminderEmail` template and send via Resend API.

**Email Template:** `frontend/src/emails/interview-reminder.tsx`
- Fields: role/position, company name, interview date/time, duration, type, interviewer names, direct link to application.

**Supabase Cron:** Schedule via `pg_cron` at `0 11 * * *` UTC (= 6:00 AM EST).
```sql
select cron.schedule(
  'send-interview-reminders',
  '0 11 * * *',
  $$select net.http_post(...)$$
);
```

### 5b. Pre-commit Hooks

File: `.pre-commit-config.yaml` (already exists as untracked — will populate).

Hooks (run in order):
1. `bun run tsc --noEmit` — TypeScript type check
2. `bun run biome check .` — lint + format check
3. `bun run test --run` — unit tests
4. `bun run build` — production build check

### 5c. GitHub Actions CI

File: `.github/workflows/ci.yml`

Triggers: push to `main`, pull_request targeting `main`.

Jobs:
- `lint`: biome check + tsc
- `test`: vitest run
- `build`: vite build

---

## New Files Summary

| File | Purpose |
|---|---|
| `frontend/src/components/layout/user-menu.tsx` | User avatar dropdown for NavBar |
| `frontend/src/components/applications/easy-add-form.tsx` | Renamed quick-add form |
| `frontend/src/components/applications/full-application-form.tsx` | New full add form |
| `frontend/src/components/applications/source-combobox.tsx` | Source field with predefined list |
| `frontend/src/components/applications/city-combobox.tsx` | Location autocomplete |
| `frontend/src/components/ui/tag-input.tsx` | Tag chip input |
| `frontend/src/components/ui/salary-range-slider.tsx` | Dual range slider for salary |
| `frontend/src/data/major-us-cities.json` | ~1,000 US city, ST strings |
| `frontend/src/emails/interview-reminder.tsx` | react-email template |
| `supabase/functions/send-interview-reminders/index.ts` | Edge function for email cron |
| `.github/workflows/ci.yml` | CI pipeline |

---

## Modified Files Summary (key changes)

| File | Change |
|---|---|
| `frontend/src/routes/__root.tsx` | Mount `<Toaster />` |
| `frontend/src/components/layout/nav-bar.tsx` | Replace Settings with UserMenu |
| `frontend/src/components/applications/application-form.tsx` | Edit-only, field improvements |
| `frontend/src/components/applications/application-table.tsx` | Hybrid work type labels |
| `frontend/src/components/applications/application-filters.tsx` | Hybrid work type options |
| `frontend/src/components/applications/application-detail.tsx` | Hybrid work type display |
| `frontend/src/components/companies/company-form.tsx` | ScrollArea overflow fix |
| `frontend/src/components/interviews/interview-list.tsx` | Archived filter |
| `frontend/src/components/settings/general-tab.tsx` | Email reminders toggle |
| `frontend/src/lib/queries/*.ts` | Add toast calls to all mutations |
| `.pre-commit-config.yaml` | Populate with hooks |
| `supabase/migrations/*.sql` | Add email_reminders column |
