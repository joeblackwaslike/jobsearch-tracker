# THRIVE Clone — Design Document

**Date**: 2026-02-16
**Status**: Approved
**Scope**: V1 — Dashboard (MVP), Applications, Interviews, Documents, Companies, Settings, Auth

---

## 1. Overview

Build a job search tracker as a clone of the THRIVE reference application. The app helps software engineers track job applications, interviews, company research, and documents through a centralized web dashboard.

### V1 Scope

| In Scope | Out of Scope (future) |
|----------|----------------------|
| Dashboard (MVP — stats, quick actions, activity feed) | Analytics page |
| Applications (full CRUD, table/grid, filters, search) | Interview Prep page |
| Interviews (upcoming/past, schedule, list view) | Export/Reports page |
| Documents (resumes/cover letters, upload, snapshot) | Calendar view for interviews |
| Companies (directory, research, ratings) | Drag-and-drop dashboard widgets |
| Settings (theme, notifications, preferences) | Custom dashboard widgets |
| Auth (email/password, OAuth) | Chrome extension |
| Dark/light mode | AI features |
| | FastAPI backend |

---

## 2. Tech Stack

| Concern | Solution |
|---------|----------|
| Frontend Framework | TanStack Start (deployed to Vercel) |
| UI Components | shadcn/ui (Radix + Tailwind CSS) |
| Routing | TanStack Router (file-based) |
| Server State | TanStack Query |
| Form Handling | React Hook Form |
| Auth | Supabase Auth (`@supabase/ssr`) |
| Database | Supabase Postgres + Row Level Security |
| File Storage | Supabase Storage |
| API Layer | Supabase PostgREST (via JS client) |
| Deployment | Vercel (frontend) + Supabase (backend services) |

### Why No Separate Backend for V1

Supabase provides PostgREST (auto-generated REST API), Auth, Storage, and RPC functions (Postgres functions callable from the client). Combined with RLS for access control, this covers all v1 needs without a separate API server. TanStack Start server functions handle any server-side logic (session management, data transformations).

FastAPI will be introduced in a later phase for: AI/LLM features, complex analytics, background jobs, and integrations.

---

## 3. Project Structure

```
jobsearch-tracker/
├── frontend/
│   ├── app/
│   │   ├── routes/                     # TanStack Start file-based routes
│   │   │   ├── __root.tsx              # Root layout: nav bar, theme, auth
│   │   │   ├── index.tsx               # Redirect to /dashboard
│   │   │   ├── login.tsx               # Auth page
│   │   │   ├── _authenticated.tsx      # Auth guard layout
│   │   │   └── _authenticated/
│   │   │       ├── dashboard.tsx
│   │   │       ├── applications/
│   │   │       │   ├── index.tsx       # List view
│   │   │       │   └── $applicationId.tsx
│   │   │       ├── interviews.tsx
│   │   │       ├── documents.tsx
│   │   │       ├── companies/
│   │   │       │   ├── index.tsx
│   │   │       │   └── $companyId.tsx
│   │   │       └── settings.tsx
│   │   ├── components/
│   │   │   ├── ui/                     # shadcn/ui primitives
│   │   │   ├── layout/
│   │   │   │   ├── nav-bar.tsx         # Top nav + dark/light toggle
│   │   │   │   ├── page-shell.tsx
│   │   │   │   └── theme-provider.tsx
│   │   │   ├── applications/
│   │   │   │   ├── application-table.tsx
│   │   │   │   ├── application-filters.tsx
│   │   │   │   ├── application-form.tsx
│   │   │   │   ├── application-detail.tsx
│   │   │   │   └── archive-dialog.tsx
│   │   │   ├── interviews/
│   │   │   │   ├── interview-list.tsx
│   │   │   │   └── schedule-dialog.tsx
│   │   │   ├── documents/
│   │   │   │   ├── document-sidebar.tsx
│   │   │   │   ├── document-editor.tsx
│   │   │   │   └── upload-dialog.tsx
│   │   │   ├── companies/
│   │   │   │   ├── company-directory.tsx
│   │   │   │   ├── company-card.tsx
│   │   │   │   └── company-form.tsx
│   │   │   ├── dashboard/
│   │   │   │   ├── stats-cards.tsx
│   │   │   │   ├── quick-actions.tsx
│   │   │   │   ├── recent-activity.tsx
│   │   │   │   └── chart-placeholders.tsx
│   │   │   └── settings/
│   │   │       ├── general-tab.tsx
│   │   │       ├── data-tab.tsx
│   │   │       └── about-tab.tsx
│   │   ├── lib/
│   │   │   ├── supabase/
│   │   │   │   ├── client.ts           # Browser client
│   │   │   │   └── server.ts           # Server client (@supabase/ssr)
│   │   │   ├── queries/
│   │   │   │   ├── applications.ts
│   │   │   │   ├── companies.ts
│   │   │   │   ├── events.ts
│   │   │   │   ├── documents.ts
│   │   │   │   ├── contacts.ts
│   │   │   │   ├── dashboard.ts
│   │   │   │   └── settings.ts
│   │   │   └── utils.ts
│   │   └── styles/
│   │       └── globals.css             # Tailwind base + shadcn theme
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   └── app.config.ts                   # TanStack Start config
├── supabase/
│   ├── migrations/                     # SQL migration files
│   ├── functions/                      # Supabase Edge Functions (if needed)
│   └── seed.sql                        # Dev seed data
├── docker-compose.yaml                 # Local Supabase (supabase start)
├── Makefile
├── context/                            # Existing context docs
└── docs/
    └── plans/
```

---

## 4. Database Schema

All tables include `user_id UUID REFERENCES auth.users(id) NOT NULL` and have RLS enabled.

### applications

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK, `gen_random_uuid()` |
| user_id | UUID | FK -> auth.users, RLS |
| company_id | UUID | FK -> companies.id |
| position | VARCHAR(255) | Required |
| status | TEXT | bookmarked, applied, interviewing, offer, accepted, rejected, archived |
| work_type | TEXT | remote, hybrid-1day..4day, onsite |
| employment_type | TEXT | full-time, part-time, contract |
| location | VARCHAR(255) | |
| salary | JSONB | `{min, max, currency, period}` |
| url | TEXT | Job posting / ATS link |
| job_description | TEXT | |
| interest | TEXT | low, medium, high, dream |
| source | VARCHAR(100) | Where they found the listing |
| tags | JSONB | Array of strings |
| applied_at | TIMESTAMPTZ | When they applied |
| archived_at | TIMESTAMPTZ | Nullable, soft delete |
| archived_reason | TEXT | received_rejection, no_response, no_longer_interested |
| created_at | TIMESTAMPTZ | Default now() |
| updated_at | TIMESTAMPTZ | Default now(), trigger-updated |

### companies

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| user_id | UUID | FK -> auth.users, RLS |
| name | VARCHAR(255) | Required |
| description | TEXT | |
| links | JSONB | `{website, careers, linkedin, glassdoor, news}` |
| industry | VARCHAR(100) | |
| size | VARCHAR(50) | e.g. "51-200", "1000+" |
| location | VARCHAR(255) | |
| founded | DATE | Nullable |
| culture | TEXT | |
| benefits | TEXT | |
| pros | TEXT | |
| cons | TEXT | |
| tech_stack | TEXT | |
| ratings | JSONB | `{overall, work_life, compensation, growth, management, culture}` (1-5) |
| tags | JSONB | |
| researched | BOOLEAN | Default false |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |
| archived_at | TIMESTAMPTZ | |

### events

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| user_id | UUID | FK -> auth.users, RLS |
| application_id | UUID | FK -> applications.id |
| type | TEXT | screening_interview, technical_interview, behavioral_interview, online_test, take_home, onsite, offer, rejection, bookmarked, applied |
| status | TEXT | availability_requested, availability_submitted, scheduled, completed, cancelled, rescheduled, no_show |
| title | VARCHAR(255) | |
| description | TEXT | |
| url | TEXT | Meeting link |
| scheduled_at | TIMESTAMPTZ | Nullable (TBD support) |
| duration_minutes | INTEGER | Nullable |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

### documents

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| user_id | UUID | FK -> auth.users, RLS |
| name | VARCHAR(255) | Required |
| type | TEXT | resume, cover_letter, portfolio, certification, other |
| content | TEXT | Document text content |
| uri | TEXT | Supabase Storage path |
| mime_type | VARCHAR(100) | |
| revision | VARCHAR(50) | Version label |
| parent_id | UUID | FK -> documents.id, nullable (versioning) |
| tags | JSONB | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |
| archived_at | TIMESTAMPTZ | |

### application_documents (snapshot / line-item)

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| application_id | UUID | FK -> applications.id |
| document_id | UUID | FK -> documents.id (source) |
| name | VARCHAR(255) | Copied from document at link time |
| type | TEXT | Copied |
| content | TEXT | Copied |
| uri | TEXT | Copied |
| mime_type | VARCHAR(100) | Copied |
| revision | VARCHAR(50) | Copied |
| linked_at | TIMESTAMPTZ | When the snapshot was taken |

### contacts

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| user_id | UUID | FK -> auth.users, RLS |
| name | VARCHAR(255) | Required |
| title | VARCHAR(255) | Job title |
| company_id | UUID | FK -> companies.id, nullable |
| email | VARCHAR(255) | |
| phone | VARCHAR(50) | |
| linkedin_url | TEXT | |
| notes | TEXT | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

### user_settings

| Column | Type | Notes |
|--------|------|-------|
| user_id | UUID | PK, FK -> auth.users |
| theme | TEXT | "light" or "dark", default "dark" |
| language | TEXT | Default "en" |
| calendar_type | TEXT | Default "gregorian" |
| date_format | TEXT | Default "MM/DD/YYYY" |
| time_format | TEXT | Default "12h" |
| compact_mode | BOOLEAN | Default false |
| show_avatars | BOOLEAN | Default true |
| notify_backup | BOOLEAN | Default true |
| notify_status | BOOLEAN | Default true |
| notify_deadline | BOOLEAN | Default true |
| notify_interview | BOOLEAN | Default true |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

### Supabase RPC Functions

```sql
-- Dashboard stats in a single round trip
CREATE FUNCTION get_dashboard_stats()
RETURNS JSON AS $$
  SELECT json_build_object(
    'total_applications', (SELECT count(*) FROM applications WHERE user_id = auth.uid() AND archived_at IS NULL),
    'interviews_upcoming', (SELECT count(*) FROM events WHERE user_id = auth.uid() AND type LIKE '%interview%' AND scheduled_at > now()),
    'active_applications', (SELECT count(*) FROM applications WHERE user_id = auth.uid() AND status IN ('applied', 'interviewing') AND archived_at IS NULL),
    'offers', (SELECT count(*) FROM applications WHERE user_id = auth.uid() AND status = 'offer'),
    'rejections', (SELECT count(*) FROM applications WHERE user_id = auth.uid() AND status = 'rejected'),
    'contacts', (SELECT count(*) FROM contacts WHERE user_id = auth.uid()),
    'companies', (SELECT count(*) FROM companies WHERE user_id = auth.uid()),
    'response_rate', (
      SELECT CASE WHEN total = 0 THEN 0 ELSE (with_interviews::float / total * 100)::int END
      FROM (
        SELECT count(*) as total,
               count(*) FILTER (WHERE status IN ('interviewing', 'offer', 'accepted')) as with_interviews
        FROM applications WHERE user_id = auth.uid() AND archived_at IS NULL
      ) s
    )
  );
$$ LANGUAGE sql SECURITY DEFINER;
```

---

## 5. Auth & Security

### Supabase Auth

- **Methods**: Email/password (primary), Google OAuth, GitHub OAuth
- **Session**: Cookie-based via `@supabase/ssr`, managed in TanStack Start server functions
- **Route protection**: `_authenticated.tsx` layout calls `supabase.auth.getUser()` in `beforeLoad`, redirects to `/login` if unauthenticated

### Row Level Security

All tables: `ENABLE ROW LEVEL SECURITY` with four policies per table:

```sql
CREATE POLICY "select_own" ON <table> FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "insert_own" ON <table> FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "update_own" ON <table> FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "delete_own" ON <table> FOR DELETE USING (user_id = auth.uid());
```

### Storage

- Bucket: `documents`, RLS scoped to `auth.uid()`
- Path: `{user_id}/{document_id}/{filename}`
- Access via signed URLs

---

## 6. Data Access Layer

### Pattern

```
Browser -> TanStack Start (Vercel serverless) -> Supabase
```

Server-side loaders/actions use `createServerClient()` from `@supabase/ssr` (reads session from cookies). Client-side uses `createBrowserClient()` only where needed (e.g. realtime, storage uploads).

### TanStack Query Organization

```
frontend/app/lib/queries/
├── applications.ts    # list (paginated, filtered, sorted), get, create, update, archive
├── companies.ts       # list, get, create, update, search (for combobox autocomplete)
├── events.ts          # list by application, create, update, delete
├── documents.ts       # list, get, create, update, upload, snapshot
├── contacts.ts        # list, get, create, update
├── dashboard.ts       # get_dashboard_stats RPC
└── settings.ts        # get, update
```

### Key Query Patterns

**Applications list**: Server-side pagination via `.range()`, sorting via `.order()`, text search via `.ilike()` on position/location + joined company name. Filter params stored in URL search params.

**Company combobox autocomplete**: Debounced query with `.ilike('name', '%term%')`, returns top 10 matches. "Create new" option appended client-side when no exact match.

**Document snapshots**: Server action reads document, copies fields into `application_documents` row alongside the foreign keys.

---

## 7. Core User Workflows

### Workflow 1: Quick Add Application (95% use case)

1. User clicks "+ New Application" (dashboard or applications page)
2. Dialog opens with three fields:
   - **Company**: Combobox with autocomplete against existing companies. Typing queries via debounced `.ilike()`. If no match, bottom option shows "Create [typed name]" which inline-creates a minimal company record (name only).
   - **Position**: Text input
   - **URL**: Text input (job posting / ATS link)
3. User submits. Application created with `status: bookmarked`, defaults for everything else.
4. Dialog closes, table refreshes via query invalidation.

**Future extension point**: Chrome extension can pre-fill this form by navigating to `/applications/new?company=Name&position=Title&url=https://...`. URL params seed form state only — no mutation on GET.

### Workflow 2: Recruiter Screen Response

1. User receives email from recruiter about scheduling a screen.
2. Opens applications page, searches by company name.
3. Clicks application row to open **detail view**.
4. Detail view provides:
   - **Edit Application** — update work_type, location, salary, job_description, interest, source, tags
   - **Edit Company** — modal to fill in remaining company fields (industry, size, culture, benefits, tech_stack, ratings, links) during research/prep
   - **Add Event** — create new timeline event
5. User clicks "Add Event":
   - Type: `screening_interview`
   - Status: `availability_requested`, `availability_submitted`, or `scheduled`
   - Date: TBD (null) or specific date/time
6. **Auto-transition**: Creating an interview-type event on an application with `status: applied` automatically updates `status` to `interviewing` (server-side logic in the create-event action).

### Workflow 3: Archive on Rejection

1. User receives rejection email.
2. On applications list, clicks **archive button** on the relevant row (inline, always visible).
3. Small dialog/popover appears: "Reason for archiving?"
   - Received rejection
   - No response
   - No longer interested
4. User selects reason. Application immediately archived (`archived_at = now()`, `archived_reason = selection`, `status = archived`).

### Status Transition Rules

| Trigger | From | To |
|---------|------|----|
| Create interview-type event | applied | interviewing |
| Create offer event | interviewing | offer |
| Archive with reason | any | archived |

Enforced server-side in the event creation and archive actions.

---

## 8. Page Specifications

### Global Layout

- **Nav bar** (top): THRIVE logo/home link, page links (Applications, Interviews, Documents, Companies), Settings icon (right), **Dark/light mode toggle** (top-right, always visible, sun/moon icon)
- **Dark theme** default, matching THRIVE's dark UI
- All pages wrapped in consistent page shell with proper heading hierarchy

### Dashboard

- **Stats cards row**: 8 cards in responsive grid (4 cols desktop, 2 mobile). Single RPC call for all values.
- **Quick Actions widget**: Add New Application, Schedule Interview, View All Applications. (View Analytics hidden until analytics page built.)
- **Recent Activity widget**: Last 10-15 events across all applications, chronological.
- **Chart placeholders**: Application Funnel, Trends, Distribution, Success Metrics — render empty states for v1, activate when analytics is implemented.
- Fixed layout (no drag-and-drop for v1).

### Applications

- **Header**: Table/grid view toggle, "+ New Application" button
- **Filter bar**: Search input, Filters dialog, Help, Import/Export dropdown, Columns toggle
- **Data table** (TanStack Table): Checkbox, Position, Company, Status, Interest, Location, Salary, Applied, Updated, Documents. Server-side pagination/sort/filter. **Archive button inline on each row.**
- **Pagination**: Row count, first/prev/next/last, page indicator, rows-per-page (10/25/50/100)
- **Detail view** (`$applicationId`): Full application info, Edit Application button, Edit Company button, Add Event button, event timeline

### Interviews

- **Header**: Search, Filters, List view (calendar stubbed), "+ Schedule Interview"
- **Tabs**: Upcoming (count) | Past (count)
- **List items**: Company, position, interview type, date/time, status badge, meeting link, edit/delete
- **Empty state**: CTA to schedule first interview

### Documents

- **Sidebar** (~30%): Search, filter, Upload/New buttons, collapsible Resumes + Cover Letters sections
- **Detail area** (~70%): Document viewer/editor or empty state with Create New / Upload File CTAs

### Companies

- **Header**: Search, Filters, Table/Cards/List view toggle, Export, "+ New Company"
- **Stats row**: Total Companies, Researched %, With Applications, Avg Rating
- **Directory**: Search, category filter, Add Company button
- **Empty state**: CTA to research first company

### Settings

- **Tabs**: General | Data | Integrations | About
- **General**: Theme toggle, Language, Calendar Type, Date/Time Format, Compact Mode, Show Avatars, Notification switches
- **Data**: Clear all data (with confirmation), Export all as JSON
- **Integrations**: Placeholder
- **About**: Version, repo/docs links
- **"Reset to Defaults"** button in header

---

## 9. Deployment

### Vercel

- TanStack Start app deployed as Vercel serverless functions
- Environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- Automatic deployments from main branch

### Supabase

- Postgres database with RLS
- Auth with email/password + OAuth providers
- Storage bucket for documents
- Migrations managed via `supabase/migrations/` directory
- Local dev via `supabase start` (Docker-based)

### Local Development

```bash
supabase start              # Local Supabase (Postgres, Auth, Storage)
cd frontend && pnpm dev     # TanStack Start dev server
```

---

## 10. Future Considerations

Items explicitly deferred but architecturally accounted for:

- **FastAPI backend**: Introduced when AI/LLM features, complex analytics, or background jobs are needed. Frontend switches from direct Supabase calls to API calls for those features.
- **Chrome extension**: Pre-fills application form via URL params. Later: `window.postMessage` or direct Supabase inserts.
- **Analytics page**: Dashboard chart widgets already have placeholder slots. RPC functions will power the charts.
- **Interview Prep page**: Separate feature with its own data model (questions, practice sessions, challenges).
- **Export/Reports page**: Per-entity CSV/JSON export with filters.
- **Calendar view**: Interview page already has list/calendar toggle; calendar component added later.
- **Drag-and-drop dashboard**: Widget system deferred; fixed layout for v1.
- **Email notifications**: Settings toggle exists but disabled ("Coming Soon").
