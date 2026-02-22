# Next Iteration Design — 2026-02-22

## Goal

Four tasks in two streams: first clean up naming debt (thrive→tracker, interviews→events, interviewer→contact), then ship two UI features (layout fill, applications stat boxes).

## Approach

**Stream 1 — Renames** first, so all subsequent code is written with correct naming.
**Stream 2 — Features** second, building on the clean naming baseline.

---

## Stream 1: Renames

### Task 1 — thrive → tracker

Mechanical localStorage key rename. No data migration — old keys are abandoned (user's theme resets once to dark).

**Files:**
- `frontend/src/components/layout/theme-provider.tsx` — `STORAGE_KEY = "thrive-theme"` → `"tracker-theme"`
- `frontend/src/routes/__root.tsx` — inline `<script>` reads `thrive-theme` → `tracker-theme`
- `frontend/src/components/applications/full-application-form.tsx` — `thrive:default_resume_id` → `tracker:default_resume_id`
- `frontend/src/components/applications/easy-add-form.tsx` — same key rename
- `frontend/src/components/applications/__tests__/full-application-form.test.tsx` — key string updated
- `frontend/src/components/applications/__tests__/application-form.test.tsx` — key string updated

---

### Task 2 — interviews → events + interviewer → contact

**Route & file renames (git mv):**
- `routes/_authenticated/interviews.tsx` → `events.tsx`
- `components/interviews/` directory → `components/events/`
  - `interview-list.tsx` → `event-list.tsx`
  - `interviewer-combobox.tsx` → `contact-combobox.tsx`
  - `schedule-dialog.tsx` — filename stays, contents updated
  - `duration-combobox.tsx` — filename stays, contents updated
  - All `__tests__/` files renamed to match their component

**Code changes:**
- Route ID: `/_authenticated/interviews` → `/_authenticated/events`
- All `to: "/interviews"` navigation calls → `/events`
- `InterviewsPage` → `EventsPage`
- `InterviewList` → `EventList`
- `InterviewerCombobox` → `ContactCombobox`
- `InterviewerSection` → `ContactSection`
- `hasAnyInterviews` → `hasAnyEvents`
- UI text: "Interviews" → "Events", "Schedule Interview" → "Add Event", "No interviews scheduled yet" → "No events scheduled yet", "Interviewer" labels → "Contact"
- Nav bar link: "Interviews" → "Events"
- `routeTree.gen.ts` regenerated automatically by TanStack Router dev server / build

---

## Stream 2: Features

### Task 3 — Layout fill

**Problem:** Tables on list pages size to content width instead of filling available space.

**Fix:** Ensure `w-full` on the table wrapper `<div>` and `<table>` element in each list component.

**Files to check and fix:**
- `frontend/src/components/applications/application-table.tsx`
- `frontend/src/components/companies/company-table.tsx`
- `frontend/src/components/events/event-list.tsx` (post-rename)

---

### Task 4 — Applications stat boxes

**Two rows of 4 stat cards**, inserted between the page header and the filters bar in `ApplicationsPage`.

```
┌──────────┬──────────┬───────────────┬────────────┐
│  Total   │  Active  │ Response Rate │ Interviews │  ← All-time
├──────────┼──────────┼───────────────┼────────────┤
│This week │This week │  This week    │ This week  │  ← Current work week
└──────────┴──────────┴───────────────┴────────────┘
```

**Stat definitions:**
- **Total** — all applications
- **Active** — status in `[applied, interviewing, offer]`
- **Response rate** — applications with ≥1 event ÷ total applied (as %)
- **Interviews** — count of all events linked to user's applications
- **This week** — same 4 stats filtered to `applied_at >= Monday of current ISO week`

**New `useApplicationStats()` hook:**
- Lives in `frontend/src/lib/queries/applications.ts` (or a new `application-stats.ts`)
- Fetches all applications (no pagination) with only `status` and `applied_at` columns
- Separately queries event count (using existing events query layer)
- Returns `{ allTime: Stats, thisWeek: Stats }` where `Stats = { total, active, responseRate, interviews }`

**New `ApplicationStats` component:**
- Lives at `frontend/src/components/applications/application-stats.tsx`
- Two `grid grid-cols-2 gap-4 sm:grid-cols-4` rows with a small "This week" section label dividing them
- Follows the same `Card` / `CardHeader` / `CardContent` pattern as `CompanyDirectory`
- Rendered in `applications.tsx` route between the header and `<ApplicationFilters />`

---

## Task Order

1. `chore: rename thrive → tracker in localStorage keys`
2. `feat: rename interviews → events, interviewer → contact`
3. `fix: expand list page tables to fill available width`
4. `feat: add application stat boxes (all-time + this week)`
