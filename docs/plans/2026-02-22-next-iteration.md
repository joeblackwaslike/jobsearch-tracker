# Next Iteration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Four tasks in two streams — renames first (thrive→tracker, interviews→events, interviewer→contact), then features (layout fill, applications stat boxes with all-time + this-week rows).

**Architecture:** Stream 1 is pure mechanical renaming (file moves + string replacements). Stream 2 adds a new `useApplicationStats()` Supabase query hook + a new `ApplicationStats` component. No DB migrations. No new routes.

**Tech Stack:** React 18, TanStack Router, TanStack Query, Supabase, Zod, react-hook-form, Tailwind CSS, Radix UI, Vitest, @testing-library/react

---

## Context

All work happens in `frontend/`. Run tests from the `frontend/` directory.

**Run a single test file:**
```bash
npx vitest run --reporter=verbose src/path/to/test.tsx
```

**Run all tests:**
```bash
npm test
```

**Key conventions:**
- Tests live in `__tests__/` dirs sibling to their component
- Supabase queries live in `src/lib/queries/`
- Components live in `src/components/<domain>/`
- TanStack Router regenerates `src/routeTree.gen.ts` automatically on dev server start / build

---

## Stream 1: Renames

### Task 1: thrive → tracker (localStorage keys + logo)

**Files to modify:**
- `src/components/layout/theme-provider.tsx`
- `src/routes/__root.tsx`
- `src/components/applications/full-application-form.tsx`
- `src/components/applications/easy-add-form.tsx`
- `src/components/layout/nav-bar.tsx`
- `src/components/applications/__tests__/full-application-form.test.tsx`
- `src/components/applications/__tests__/application-form.test.tsx`

No new tests needed — this is a string replacement. The existing tests that reference the old key strings must be updated so they don't break.

**Step 1: Update theme-provider.tsx**

In `src/components/layout/theme-provider.tsx`, line 12:
```ts
// Before:
const STORAGE_KEY = "thrive-theme";

// After:
const STORAGE_KEY = "tracker-theme";
```

**Step 2: Update __root.tsx**

In `src/routes/__root.tsx`, line 55, the inline `<script>` reads `thrive-theme`:
```ts
// Before (inside the __html string):
var t=localStorage.getItem('thrive-theme')

// After:
var t=localStorage.getItem('tracker-theme')
```

**Step 3: Update full-application-form.tsx**

In `src/components/applications/full-application-form.tsx`, lines 215 and 217:
```ts
// Before:
localStorage.setItem("thrive:default_resume_id", selectedResumeId);
// ...
localStorage.removeItem("thrive:default_resume_id");

// After:
localStorage.setItem("tracker:default_resume_id", selectedResumeId);
// ...
localStorage.removeItem("tracker:default_resume_id");
```

**Step 4: Update easy-add-form.tsx**

In `src/components/applications/easy-add-form.tsx`, lines 69, 97, 99:
```ts
// Before:
const savedId = localStorage.getItem("thrive:default_resume_id");
// ...
localStorage.setItem("thrive:default_resume_id", selectedResumeId);
// ...
localStorage.removeItem("thrive:default_resume_id");

// After:
const savedId = localStorage.getItem("tracker:default_resume_id");
// ...
localStorage.setItem("tracker:default_resume_id", selectedResumeId);
// ...
localStorage.removeItem("tracker:default_resume_id");
```

**Step 5: Update nav-bar.tsx logo**

In `src/components/layout/nav-bar.tsx`, line 24:
```tsx
// Before:
THRIVE

// After:
TRACKER
```

**Step 6: Update test files**

In `src/components/applications/__tests__/full-application-form.test.tsx`:
```ts
// Before:
localStorage.setItem("thrive:default_resume_id", "some-doc-id");

// After:
localStorage.setItem("tracker:default_resume_id", "some-doc-id");
```

In `src/components/applications/__tests__/application-form.test.tsx`:
```ts
// Before:
localStorage.setItem("thrive:default_resume_id", "doc-resume-1");
// ...
localStorage.removeItem("thrive:default_resume_id");

// After:
localStorage.setItem("tracker:default_resume_id", "doc-resume-1");
// ...
localStorage.removeItem("tracker:default_resume_id");
```

**Step 7: Run all tests to confirm no regressions**

```bash
npm test
```

Expected: all tests PASS.

**Step 8: Commit**

```bash
git add \
  src/components/layout/theme-provider.tsx \
  src/routes/__root.tsx \
  src/components/applications/full-application-form.tsx \
  src/components/applications/easy-add-form.tsx \
  src/components/layout/nav-bar.tsx \
  src/components/applications/__tests__/full-application-form.test.tsx \
  src/components/applications/__tests__/application-form.test.tsx
git commit -m "chore: rename thrive → tracker in localStorage keys and nav logo"
```

---

### Task 2: interviews → events, interviewer → contact

This task involves file renames (git mv) and content updates. Work through it in sub-steps to keep things manageable.

**Files involved:**

Renames (git mv):
- `src/routes/_authenticated/interviews.tsx` → `events.tsx`
- `src/components/interviews/interview-list.tsx` → `src/components/events/event-list.tsx`
- `src/components/interviews/interviewer-combobox.tsx` → `src/components/events/contact-combobox.tsx`
- `src/components/interviews/schedule-dialog.tsx` → `src/components/events/schedule-dialog.tsx`
- `src/components/interviews/duration-combobox.tsx` → `src/components/events/duration-combobox.tsx`
- `src/components/interviews/__tests__/interviewer-combobox.test.tsx` → `src/components/events/__tests__/contact-combobox.test.tsx`
- `src/components/interviews/__tests__/interviewer-section.test.tsx` → `src/components/events/__tests__/contact-section.test.tsx`
- `src/components/interviews/__tests__/schedule-dialog.test.tsx` → `src/components/events/__tests__/schedule-dialog.test.tsx`
- `src/components/interviews/__tests__/duration-combobox.test.tsx` → `src/components/events/__tests__/duration-combobox.test.tsx`

Modify in-place:
- `src/lib/queries/events.ts`
- `src/lib/queries/event-contacts.ts`
- `src/components/applications/add-event-dialog.tsx`
- `src/components/layout/nav-bar.tsx`

**Step 1: Create the events/ component directory and move files**

```bash
mkdir -p src/components/events/__tests__

git mv src/components/interviews/interview-list.tsx src/components/events/event-list.tsx
git mv src/components/interviews/interviewer-combobox.tsx src/components/events/contact-combobox.tsx
git mv src/components/interviews/schedule-dialog.tsx src/components/events/schedule-dialog.tsx
git mv src/components/interviews/duration-combobox.tsx src/components/events/duration-combobox.tsx
git mv src/components/interviews/__tests__/interviewer-combobox.test.tsx src/components/events/__tests__/contact-combobox.test.tsx
git mv src/components/interviews/__tests__/interviewer-section.test.tsx src/components/events/__tests__/contact-section.test.tsx
git mv src/components/interviews/__tests__/schedule-dialog.test.tsx src/components/events/__tests__/schedule-dialog.test.tsx
git mv src/components/interviews/__tests__/duration-combobox.test.tsx src/components/events/__tests__/duration-combobox.test.tsx

git mv src/routes/_authenticated/interviews.tsx src/routes/_authenticated/events.tsx
```

**Step 2: Update `src/lib/queries/events.ts`**

Rename hooks and fix toast messages (DB table names `events` / `event_contacts` are unchanged — only code-level names change):

```ts
// Rename: useUpcomingInterviews → useUpcomingEvents
export function useUpcomingEvents() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["events", "upcoming"],       // was ["interviews", "upcoming"]
    queryFn: async () => {
      // ...same body, unchanged...
    },
  });
}

// Rename: usePastInterviews → usePastEvents
export function usePastEvents() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["events", "past"],           // was ["interviews", "past"]
    queryFn: async () => {
      // ...same body, unchanged...
    },
  });
}
```

In `useCreateEvent`:
```ts
// Before:
onSuccess: () => { toast.success("Interview scheduled."); },
onError: () => { toast.error("Failed to schedule interview."); },
// onSettled invalidations:
queryClient.invalidateQueries({ queryKey: ["interviews", "upcoming"] });
queryClient.invalidateQueries({ queryKey: ["interviews", "past"] });

// After:
onSuccess: () => { toast.success("Event scheduled."); },
onError: () => { toast.error("Failed to schedule event."); },
// onSettled invalidations:
queryClient.invalidateQueries({ queryKey: ["events", "upcoming"] });
queryClient.invalidateQueries({ queryKey: ["events", "past"] });
```

Same queryKey invalidation updates in `useUpdateEvent` and `useDeleteEvent`:
```ts
// useUpdateEvent:
onSuccess: () => { toast.success("Event updated."); },
onError: () => { toast.error("Failed to update event."); },
queryClient.invalidateQueries({ queryKey: ["events", "upcoming"] });
queryClient.invalidateQueries({ queryKey: ["events", "past"] });

// useDeleteEvent:
onSuccess: () => { toast.success("Event deleted."); },
onError: () => { toast.error("Failed to delete event."); },
queryClient.invalidateQueries({ queryKey: ["events", "upcoming"] });
queryClient.invalidateQueries({ queryKey: ["events", "past"] });
```

**Step 3: Update `src/lib/queries/event-contacts.ts`**

Rename the two mutation hooks:

```ts
// Before:
export function useAddInterviewer() { ... }
export function useRemoveInterviewer() { ... }

// After:
export function useAddEventContact() { ... }
export function useRemoveEventContact() { ... }
```

(Function bodies are unchanged — only the exported names change.)

**Step 4: Update `src/components/events/contact-combobox.tsx` (was interviewer-combobox.tsx)**

```tsx
// Props interface rename:
// Before: interface InterviewerComboboxProps
// After:  interface ContactComboboxProps

// Component name:
// Before: export function InterviewerCombobox({ ... }: InterviewerComboboxProps)
// After:  export function ContactCombobox({ ... }: ContactComboboxProps)

// UI text:
// Before: Search interviewers...
// After:  Search contacts...
```

**Step 5: Update `src/components/events/event-list.tsx` (was interview-list.tsx)**

```tsx
// Props interface:
// Before: interface InterviewListProps { interviews: EventWithApplication[]; ... }
// After:  interface EventListProps { events: EventWithApplication[]; ... }

// Component:
// Before: export function InterviewList({ interviews, search, hideArchived }: InterviewListProps)
// After:  export function EventList({ events, search, hideArchived }: EventListProps)

// Internally rename parameter:
// Before: const filtered = interviews.filter(...)
// After:  const filtered = events.filter(...)
// Before: filtered.map((interview) => ...)
// After:  filtered.map((event) => ...)
// (update all references to the `interview` loop variable → `event`)

// UI text:
// Before: "No interviews match your search."  →  "No events match your search."
// Before: "No interviews found."              →  "No events found."
// Before: "Showing active interviews only."   →  "Showing active events only."
// Before: title="Edit interview"              →  title="Edit event"
```

**Step 6: Update `src/components/events/schedule-dialog.tsx`**

Update imports and UI text:

```tsx
// Imports:
// Before: import { DurationCombobox } from "@/components/interviews/duration-combobox";
// After:  import { DurationCombobox } from "@/components/events/duration-combobox";

// Before: import { InterviewerCombobox } from "@/components/interviews/interviewer-combobox";
// After:  import { ContactCombobox } from "@/components/events/contact-combobox";

// Before: import { useAddInterviewer } from "@/lib/queries/event-contacts";
// After:  import { useAddEventContact } from "@/lib/queries/event-contacts";

// UI text in JSX:
// DialogTitle: "Schedule Interview"  →  "Add Event"
// DialogDescription: "Schedule a new interview for an existing application."
//                 →  "Add a new event for an existing application."
// Submit button: "Schedule Interview"  →  "Add Event"

// Variable rename inside component:
// const addInterviewer = useAddInterviewer();  →  const addEventContact = useAddEventContact();
// all references to addInterviewer.mutateAsync  →  addEventContact.mutateAsync
```

**Step 7: Update `src/components/applications/add-event-dialog.tsx`**

```tsx
// Imports:
// Before: import { DurationCombobox } from "@/components/interviews/duration-combobox";
// After:  import { DurationCombobox } from "@/components/events/duration-combobox";

// Before: import { InterviewerCombobox } from "@/components/interviews/interviewer-combobox";
// After:  import { ContactCombobox } from "@/components/events/contact-combobox";

// Before: import { useAddInterviewer, useRemoveInterviewer } from "@/lib/queries/event-contacts";
// After:  import { useAddEventContact, useRemoveEventContact } from "@/lib/queries/event-contacts";

// Variables inside component:
// const addInterviewer = useAddInterviewer();         → const addEventContact = useAddEventContact();
// const removeInterviewer = useRemoveInterviewer();   → const removeEventContact = useRemoveEventContact();
// selectedInterviewers state                          → selectedContacts
// handleAddInterviewer                                → handleAddContact
// handleRemoveInterviewer                             → handleRemoveContact

// JSX:
// <Label>Interviewers</Label>               → <Label>Contacts</Label>
// <InterviewerCombobox ... />               → <ContactCombobox ... />
// onAdd={handleAddInterviewer}              → onAdd={handleAddContact}
// onRemove={handleRemoveInterviewer}        → onRemove={handleRemoveContact}

// Where addInterviewer.mutateAsync is called → addEventContact.mutateAsync
// Where removeInterviewer.mutateAsync is called → removeEventContact.mutateAsync
```

**Step 8: Update `src/routes/_authenticated/events.tsx` (was interviews.tsx)**

```tsx
// Imports:
// Before: import { InterviewList } from "@/components/interviews/interview-list";
// After:  import { EventList } from "@/components/events/event-list";

// Before: import { ScheduleDialog } from "@/components/interviews/schedule-dialog";
// After:  import { ScheduleDialog } from "@/components/events/schedule-dialog";

// Before: import { usePastInterviews, useUpcomingInterviews } from "@/lib/queries/events";
// After:  import { usePastEvents, useUpcomingEvents } from "@/lib/queries/events";

// Route:
// Before: export const Route = createFileRoute("/_authenticated/interviews")({ ... });
// After:  export const Route = createFileRoute("/_authenticated/events")({ ... });

// Before: function InterviewsPage() { ... }
// After:  function EventsPage() { ... }

// Inside component:
// const { data: upcoming = [] } = useUpcomingInterviews();  → useUpcomingEvents()
// const { data: past = [] } = usePastInterviews();          → usePastEvents()
// const hasAnyInterviews = ...                              → hasAnyEvents

// Navigation:
// to: "/interviews"  →  to: "/events"

// UI text:
// <h1>Interviews</h1>                         → <h1>Events</h1>
// "Schedule Interview" button                 → "Add Event"
// "No interviews scheduled yet"               → "No events scheduled yet"
// "Schedule your first interview..."          → "Schedule your first event..."
// "Schedule Your First Interview" button      → "Add Your First Event"
// useSearch({ from: "/_authenticated/interviews" }) → from: "/_authenticated/events"

// Component usages:
// <InterviewList interviews={upcoming} .../>  → <EventList events={upcoming} .../>
// <InterviewList interviews={past} .../>      → <EventList events={past} .../>
```

**Step 9: Update `src/components/layout/nav-bar.tsx`**

In the `navLinks` array:
```tsx
// Before:
{ to: "/interviews", label: "Interviews" },

// After:
{ to: "/events", label: "Events" },
```

**Step 10: Update test files**

`src/components/events/__tests__/contact-combobox.test.tsx` (was interviewer-combobox.test.tsx):
```tsx
// Before: import { InterviewerCombobox } from "../interviewer-combobox";
// After:  import { ContactCombobox } from "../contact-combobox";

// Before: describe("InterviewerCombobox", () => {
// After:  describe("ContactCombobox", () => {

// Before: render(<InterviewerCombobox ... />)
// After:  render(<ContactCombobox ... />)

// UI text in assertions:
// Before: screen.getByText("Search interviewers...")
// After:  screen.getByText("Search contacts...")
```

`src/components/events/__tests__/contact-section.test.tsx` (was interviewer-section.test.tsx):
```tsx
// Before: import { useAddInterviewer, useRemoveInterviewer } from "@/lib/queries/event-contacts";
// After:  import { useAddEventContact, useRemoveEventContact } from "@/lib/queries/event-contacts";

// Mock update:
// Before: useAddInterviewer: vi.fn(...), useRemoveInterviewer: vi.fn(...)
// After:  useAddEventContact: vi.fn(...), useRemoveEventContact: vi.fn(...)

// describe block:
// Before: describe("AddEventDialog with interviewers", () => {
// After:  describe("AddEventDialog with contacts", () => {

// UI text assertions:
// Before: screen.getByText("Interviewers")     → screen.getByText("Contacts")
// Before: screen.queryByText("Interviewers")   → screen.queryByText("Contacts")
// Before: screen.getByText("Search interviewers...") → screen.getByText("Search contacts...")
```

`src/components/events/__tests__/schedule-dialog.test.tsx`:
```tsx
// Before: import { ScheduleDialog } from "../schedule-dialog";  (path unchanged)

// Mock update:
// Before: useAddInterviewer: () => ({ mutateAsync: vi.fn() })
// After:  useAddEventContact: () => ({ mutateAsync: vi.fn() })

// UI text assertions throughout file:
// "Schedule Interview" heading  →  "Add Event"
// "Schedule a new interview..." →  "Add a new event..."
// button name "Schedule Interview"  →  "Add Event"
```

**Step 11: Delete the now-empty interviews directory**

```bash
rmdir src/components/interviews/__tests__
rmdir src/components/interviews
```

**Step 12: Run all tests**

```bash
npm test
```

Expected: all tests PASS.

**Step 13: Commit**

```bash
git add -A
git commit -m "feat: rename interviews → events, interviewer → contact throughout codebase"
```

---

## Stream 2: Features

### Task 3: Layout fill — tables expand to fill available width

The `Table` UI component (`src/components/ui/table.tsx`) already applies `w-full` on both the container div and the `<table>` element. However, the outer wrapper divs in `ApplicationTable` and `CompanyTable` lack an explicit `w-full`, which can cause them to shrink in some flex/grid contexts. The `EventList` card container similarly lacks `w-full`.

No new tests needed — this is a pure CSS class addition with no logic change.

**Files to modify:**
- `src/components/applications/application-table.tsx`
- `src/components/companies/company-table.tsx`
- `src/components/events/event-list.tsx` (post-rename)

**Step 1: Fix ApplicationTable**

In `src/components/applications/application-table.tsx`, the return div (line 328):
```tsx
// Before:
<div className="overflow-x-auto rounded-md border">

// After:
<div className="w-full overflow-x-auto rounded-md border">
```

**Step 2: Fix CompanyTable**

In `src/components/companies/company-table.tsx`, the return div (line 24):
```tsx
// Before:
<div className="overflow-x-auto rounded-md border">

// After:
<div className="w-full overflow-x-auto rounded-md border">
```

**Step 3: Fix EventList card container**

In `src/components/events/event-list.tsx`, the cards wrapper div:
```tsx
// Before:
<div className="space-y-3">

// After:
<div className="w-full space-y-3">
```

**Step 4: Run all tests**

```bash
npm test
```

Expected: all tests PASS (no logic changed).

**Step 5: Commit**

```bash
git add \
  src/components/applications/application-table.tsx \
  src/components/companies/company-table.tsx \
  src/components/events/event-list.tsx
git commit -m "fix: expand list page tables and event cards to fill available width"
```

---

### Task 4: Application stat boxes (all-time + this week)

Two rows of 4 stat cards inserted between the page header and filters in the Applications page.

```
┌──────────┬──────────┬───────────────┬────────────┐
│  Total   │  Active  │ Response Rate │ Interviews │  ← All-time
├──────────┼──────────┼───────────────┼────────────┤
│This week │This week │  This week    │ This week  │  ← Current work week
└──────────┴──────────┴───────────────┴────────────┘
```

**Stat definitions:**
- **Total** — count of all non-archived applications
- **Active** — count where `status IN ('applied', 'interviewing', 'offer')`
- **Response rate** — `(count where status NOT IN ('bookmarked', 'applied')) / (count where status != 'bookmarked')` as a %
- **Interviews** — count of all events in the events table belonging to the current user
- **This week** — same 4 stats but filtered to `applied_at >= Monday 00:00:00 of the current ISO week`

**Files:**
- Create: `src/lib/queries/application-stats.ts`
- Create: `src/components/applications/application-stats.tsx`
- Create: `src/components/applications/__tests__/application-stats.test.tsx`
- Modify: `src/routes/_authenticated/applications.tsx`

---

**Step 1: Write the failing tests**

Create `src/components/applications/__tests__/application-stats.test.tsx`:

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/test-utils";
import { ApplicationStats } from "../application-stats";

const defaultStats = {
  total: 42,
  active: 18,
  responseRate: 65,
  interviews: 11,
};

vi.mock("@/lib/queries/application-stats", () => ({
  useApplicationStats: vi.fn(() => ({
    allTime: defaultStats,
    thisWeek: { total: 5, active: 3, responseRate: 40, interviews: 2 },
    isLoading: false,
  })),
}));

describe("ApplicationStats", () => {
  it("renders all-time stat cards", () => {
    render(<ApplicationStats />);
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("18")).toBeInTheDocument();
    expect(screen.getByText("65%")).toBeInTheDocument();
    expect(screen.getByText("11")).toBeInTheDocument();
  });

  it("renders this-week stat cards", () => {
    render(<ApplicationStats />);
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("40%")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("renders section labels", () => {
    render(<ApplicationStats />);
    expect(screen.getByText("All time")).toBeInTheDocument();
    expect(screen.getByText("This week")).toBeInTheDocument();
  });

  it("renders stat category labels", () => {
    render(<ApplicationStats />);
    // All-time row labels
    const totalLabels = screen.getAllByText("Total");
    expect(totalLabels.length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Active").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Response Rate").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Interviews").length).toBeGreaterThanOrEqual(1);
  });

  it("shows loading state when data is not yet available", () => {
    vi.mocked(
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require("@/lib/queries/application-stats").useApplicationStats
    ).mockReturnValueOnce({
      allTime: null,
      thisWeek: null,
      isLoading: true,
    });
    render(<ApplicationStats />);
    // Should render placeholders (--) rather than real values
    const dashes = screen.getAllByText("--");
    expect(dashes.length).toBeGreaterThan(0);
  });
});
```

**Step 2: Run the tests to confirm they fail**

```bash
npx vitest run --reporter=verbose src/components/applications/__tests__/application-stats.test.tsx
```

Expected: FAIL — module `@/lib/queries/application-stats` and component `ApplicationStats` don't exist yet.

**Step 3: Create `src/lib/queries/application-stats.ts`**

```ts
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ApplicationStatsData {
  total: number;
  active: number;
  responseRate: number;  // 0-100 integer percentage
  interviews: number;
}

export interface ApplicationStatsResult {
  allTime: ApplicationStatsData | null;
  thisWeek: ApplicationStatsData | null;
  isLoading: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns ISO string for Monday 00:00:00 of the current week (Mon-Sun). */
function getMondayOfCurrentWeek(): string {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const diff = day === 0 ? -6 : 1 - day; // days to subtract to get to Monday
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString();
}

function computeStats(
  rows: { status: string; applied_at: string | null }[],
  eventCount: number,
): ApplicationStatsData {
  const total = rows.length;
  const active = rows.filter((r) =>
    ["applied", "interviewing", "offer"].includes(r.status),
  ).length;

  const appliedRows = rows.filter((r) => r.status !== "bookmarked");
  const respondedRows = appliedRows.filter(
    (r) => !["applied"].includes(r.status),
  );
  const responseRate =
    appliedRows.length > 0
      ? Math.round((respondedRows.length / appliedRows.length) * 100)
      : 0;

  return { total, active, responseRate, interviews: eventCount };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useApplicationStats(): ApplicationStatsResult {
  const supabase = createClient();

  const { data, isLoading } = useQuery({
    queryKey: ["application-stats"],
    queryFn: async () => {
      // Fetch all non-archived applications (status + applied_at only)
      const { data: apps, error: appsError } = await supabase
        .from("applications")
        .select("status, applied_at")
        .is("archived_at", null);
      if (appsError) throw appsError;

      // Fetch total event count
      const { count: eventCount, error: eventsError } = await supabase
        .from("events")
        .select("id", { count: "exact", head: true });
      if (eventsError) throw eventsError;

      // Fetch this-week event count
      const monday = getMondayOfCurrentWeek();
      const { count: weekEventCount, error: weekEventsError } = await supabase
        .from("events")
        .select("id", { count: "exact", head: true })
        .gte("created_at", monday);
      if (weekEventsError) throw weekEventsError;

      const allRows = apps as { status: string; applied_at: string | null }[];
      const weekRows = allRows.filter(
        (r) => r.applied_at !== null && r.applied_at >= monday,
      );

      return {
        allTime: computeStats(allRows, eventCount ?? 0),
        thisWeek: computeStats(weekRows, weekEventCount ?? 0),
      };
    },
    staleTime: 30_000, // 30s cache — stats don't need real-time updates
  });

  return {
    allTime: data?.allTime ?? null,
    thisWeek: data?.thisWeek ?? null,
    isLoading,
  };
}
```

**Step 4: Create `src/components/applications/application-stats.tsx`**

```tsx
import {
  BriefcaseIcon,
  CalendarIcon,
  PercentIcon,
  TrendingUpIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApplicationStats, type ApplicationStatsData } from "@/lib/queries/application-stats";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function StatCard({
  icon: Icon,
  label,
  value,
  suffix = "",
}: {
  icon: React.ElementType;
  label: string;
  value: number | null;
  suffix?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Icon className="size-4" />
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">
          {value === null ? "--" : `${value}${suffix}`}
        </p>
      </CardContent>
    </Card>
  );
}

function StatRow({ data }: { data: ApplicationStatsData | null }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <StatCard icon={BriefcaseIcon} label="Total" value={data?.total ?? null} />
      <StatCard icon={TrendingUpIcon} label="Active" value={data?.active ?? null} />
      <StatCard icon={PercentIcon} label="Response Rate" value={data?.responseRate ?? null} suffix="%" />
      <StatCard icon={CalendarIcon} label="Interviews" value={data?.interviews ?? null} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ApplicationStats() {
  const { allTime, thisWeek } = useApplicationStats();

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          All time
        </p>
        <StatRow data={allTime} />
      </div>
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          This week
        </p>
        <StatRow data={thisWeek} />
      </div>
    </div>
  );
}
```

**Step 5: Run tests to verify they pass**

```bash
npx vitest run --reporter=verbose src/components/applications/__tests__/application-stats.test.tsx
```

Expected: all tests PASS.

**Step 6: Wire up ApplicationStats in the applications route**

In `src/routes/_authenticated/applications.tsx`:

Add the import at the top:
```tsx
import { ApplicationStats } from "@/components/applications/application-stats";
```

In the JSX, insert `<ApplicationStats />` between the header div and `<ApplicationFilters .../>`:

```tsx
return (
  <div className="space-y-4">
    {/* Header */}
    <div className="flex items-center justify-between">
      ...
    </div>

    {/* Stats */}
    <ApplicationStats />

    {/* Filters */}
    <ApplicationFilters ... />

    {/* Table */}
    <ApplicationTable ... />
    ...
  </div>
);
```

**Step 7: Run all tests**

```bash
npm test
```

Expected: all tests PASS.

**Step 8: Commit**

```bash
git add \
  src/lib/queries/application-stats.ts \
  src/components/applications/application-stats.tsx \
  src/components/applications/__tests__/application-stats.test.tsx \
  src/routes/_authenticated/applications.tsx
git commit -m "feat: add application stat boxes with all-time and this-week rows"
```

---

## Final check

After all 4 tasks are committed:

```bash
npm test
```

Expected: all tests PASS, no regressions.
