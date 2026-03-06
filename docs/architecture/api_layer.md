# API Layer

**Last updated:** 2026-03-04
**Status:** Reflects current implementation on `feat/extension`

---

## Overview

The application has two distinct API layers that serve different clients:

| Layer | Who uses it | Transport | Auth |
| --- | --- | --- | --- |
| **Supabase PostgREST** | Browser (React) | HTTP via `@supabase/ssr` SDK | JWT session cookie |
| **Extension API** | Browser extension | HTTP JSON | Bearer token |

There is no custom REST API for the web frontend. All browser-to-database communication goes through the Supabase client SDK, which translates method calls into PostgREST queries under the hood. Row Level Security (RLS) policies enforce data isolation at the database layer for all PostgREST traffic.

The extension API is a small set of TanStack Start API file routes that expose a minimal surface for the browser extension, which cannot use session cookies.

---

## TanStack Router — Page Routes

Routes live in `frontend/src/routes/`. TanStack Router uses file-based routing; the file path maps directly to the URL.

### Route tree

```text
/                           → index.tsx        (redirect to /dashboard or /login)
/login                      → login.tsx         (unauthenticated; email/password form)
/_authenticated             → _authenticated.tsx (layout; server-side auth gate)
  /dashboard                → _authenticated/dashboard.tsx
  /applications             → _authenticated/applications.tsx
  /applications/$applicationId → _authenticated/applications/$applicationId.tsx
  /companies                → _authenticated/companies.tsx
  /events                   → _authenticated/events.tsx
  /documents                → _authenticated/documents.tsx
  /settings                 → _authenticated/settings.tsx
/api/extension/signin       → api/extension/signin.ts   (Extension API)
/api/extension/refresh      → api/extension/refresh.ts  (Extension API)
/api/extension/track        → api/extension/track.ts    (Extension API)
```

### Auth gate — `_authenticated` layout

All routes nested under `/_authenticated` run a `beforeLoad` guard server-side before rendering:

```ts
// frontend/src/routes/_authenticated.tsx
const getUser = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
})

// In beforeLoad:
const user = await getUser()
if (!user) throw redirect({ to: "/login" })
```

`createServerSupabaseClient` reads the Supabase session from the request cookie via `@tanstack/react-start/server` cookie helpers. The user is never trusted from the client; the server validates the JWT on every navigation.

### Vite route file ignore pattern

API file routes (`src/routes/api/`) are excluded from TanStack Router's file-based route scanning via `vite.config.ts`:

```ts
tanstackStart({
  router: {
    routeFileIgnorePattern: "api/",
  },
})
```

This prevents TanStack Router from treating API routes as page routes. API routes are registered separately via `createAPIFileRoute`.

---

## Supabase Client Helpers

Three client factories exist for different contexts. Never mix them.

### `createClient()` — browser

```ts
// frontend/src/lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  return createBrowserClient<Database>(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY,
  )
}
```

Used in all React query hooks. Reads and manages the session cookie automatically. Never call this from API routes or `createServerFn` handlers.

### `createServerSupabaseClient()` — SSR / server functions

```ts
// frontend/src/lib/supabase/server.ts
import { createServerClient } from "@supabase/ssr"

export function createServerSupabaseClient() {
  return createServerClient<Database>(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY,
    { cookies: { getAll, setAll } }, // TanStack Start cookie helpers
  )
}
```

Used in `createServerFn` handlers (e.g., the `_authenticated` auth gate). Reads the session from request cookies server-side.

### `createAnonApiClient()` / `createServiceApiClient()` — Extension API routes

```ts
// frontend/src/lib/supabase/api.ts
// Server-side only — do not import from client components or route loaders.

export function createAnonApiClient() {
  return createClient<Database>(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
}

export function createServiceApiClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set")
  return createClient<Database>(VITE_SUPABASE_URL, serviceRoleKey)
}
```

Used only in extension API routes. `createAnonApiClient` is used for auth operations (sign-in, refresh). `createServiceApiClient` is used for privileged operations that bypass RLS (e.g., finding or creating a company on behalf of a user, when the user's identity has been validated via JWT).

---

## Supabase PostgREST — Query Layer

All browser data access flows through the `src/lib/queries/` layer. Each file owns one domain. The pattern is consistent across all files.

### Query file structure

```ts
// --- Types ---
type Foo = Tables<"foos">
type FooInsert = TablesInsert<"foos">
type FooUpdate = TablesUpdate<"foos">

// --- Filters (if applicable) ---
export interface FoosFilters { ... }

// --- Query-option factories ---
export function foosQueryOptions(filters: FoosFilters = {}) { ... }
export function fooQueryOptions(id: string) { ... }

// --- Hooks — queries ---
export function useFoos(filters) { return useQuery(foosQueryOptions(filters)) }
export function useFoo(id) { return useQuery(fooQueryOptions(id)) }

// --- Hooks — mutations ---
export function useCreateFoo() { return useMutation({ ... }) }
export function useUpdateFoo() { return useMutation({ ... }) }
```

Types are derived from the generated schema (`Tables<"name">`, `TablesInsert`, `TablesUpdate`). Query-option factories are separate from hooks so they can be used in `loader` functions without hooks.

### Query keys

All query keys follow a consistent hierarchy:

| Pattern | Example |
| --- | --- |
| `["resource"]` | `["applications"]` — used for broad invalidation |
| `["resource", filters]` | `["applications", { status: "applied", page: 1 }]` |
| `["resource", id]` | `["applications", "uuid-here"]` |
| `["resource", "scope"]` | `["events", "upcoming"]`, `["dashboard", "stats"]` |

Mutations always call `queryClient.invalidateQueries` in `onSettled` (not `onSuccess`) to ensure stale data is cleared even on error.

---

## PostgREST Operations by Domain

### `companies`

**File:** `src/lib/queries/companies.ts`

| Hook / Factory | Operation | PostgREST |
| --- | --- | --- |
| `companiesQueryOptions(filters)` | List companies | `SELECT * WHERE archived_at IS NULL` + optional `ilike(name)`, `eq(researched)`, `range` |
| `companyQueryOptions(id)` | Single company | `SELECT * WHERE id = ?` |
| `useSearchCompanies(term)` | Name autocomplete | `SELECT id, name WHERE name ILIKE ? LIMIT 10` |
| `useCreateCompany()` | Create | `INSERT` with `user_id` from auth |
| `useUpdateCompany()` | Update | `UPDATE WHERE id = ? AND user_id = ?` |
| `useArchiveCompany()` | Soft-delete | `UPDATE SET archived_at = now()` |

Filters: `search` (ilike on `name`), `researched` (boolean), `page`, `pageSize` (default 20).

---

### `applications`

**File:** `src/lib/queries/applications.ts`

| Hook / Factory | Operation | PostgREST |
| --- | --- | --- |
| `applicationsQueryOptions(filters)` | List with join | `SELECT *, company:companies(name)` + filters + pagination |
| `applicationQueryOptions(id)` | Single with join | `SELECT *, company:companies(*)` |
| `useApplicationsByCompany(companyId)` | By company | `companiesQueryOptions({ companyId, pageSize: 100 })` |
| `useCreateApplication()` | Create | `INSERT` + default `status: 'bookmarked'` |
| `useUpdateApplication()` | Update | `UPDATE WHERE id = ? AND user_id = ?` |
| `useArchiveApplication()` | Soft-delete | `UPDATE SET archived_at, archived_reason, status = 'archived'` |

**Filters:** `search` (ilike on `position`), `status`, `interest`, `workType`, `employmentType`, `companyId`, `includeArchived` (default false), `page` (default 1), `pageSize` (default 25), `sort` (column + direction, default `created_at desc`).

**PostgREST join syntax:** `company:companies(name)` — the alias before the colon becomes the key in the response object. `ApplicationListItem` uses `Pick<Company, "name">` for list views; `ApplicationWithCompany` uses full `Company` for detail views.

---

### `events`

**File:** `src/lib/queries/events.ts`

| Hook / Factory | Operation | PostgREST |
| --- | --- | --- |
| `eventsQueryOptions(applicationId)` | Events for one application | `SELECT * WHERE application_id = ?` ordered by `created_at desc` |
| `useUpcomingEvents()` | Future interview events | `SELECT *, application(…company(…)) WHERE type IN (interview types) AND scheduled_at > now()` |
| `usePastEvents()` | Past interview events | Same join, `scheduled_at <= now()` |
| `useCreateEvent()` | Create | `INSERT` + auto-transitions application `status` |
| `useUpdateEvent()` | Update | `UPDATE WHERE id = ? AND user_id = ?` |
| `useDeleteEvent()` | Delete | `DELETE WHERE id = ? AND user_id = ?` |

**Application status auto-transition (client-side):** `useCreateEvent` reads the current application status and upgrades it automatically:

- Any interview type + application `status = 'applied'` → transitions to `'interviewing'`
- `offer` event + application `status = 'interviewing'` → transitions to `'offer'`

This logic lives in the mutation function, not the database. It will eventually move to a database trigger.

---

### `contacts`

**File:** `src/lib/queries/contacts.ts`

| Hook / Factory | Operation | PostgREST |
| --- | --- | --- |
| `contactsQueryOptions(companyId?)` | All contacts, optionally filtered by company | `SELECT * ORDER BY name` |
| `searchContactsQueryOptions(term, companyId?)` | Name search | `SELECT * WHERE name ILIKE ? LIMIT 20` |
| `useCreateContact()` | Create | `INSERT` with `user_id` |
| `useUpdateContact()` | Update | `UPDATE WHERE id = ? AND user_id = ?` |
| `useDeleteContact()` | Hard delete | `DELETE WHERE id = ? AND user_id = ?` |

---

### `event_contacts`

**File:** `src/lib/queries/event-contacts.ts`

| Hook / Factory | Operation | PostgREST |
| --- | --- | --- |
| `eventContactsQueryOptions(eventId)` | Contacts for one event (with join) | `SELECT *, contact:contacts(*)` |
| `useAddEventContact()` | Link contact to event | `INSERT { event_id, contact_id }` |
| `useRemoveEventContact()` | Unlink | `DELETE WHERE event_id = ? AND contact_id = ?` |

---

### `documents`

**File:** `src/lib/queries/documents.ts`

| Hook / Factory | Operation | PostgREST / Storage |
| --- | --- | --- |
| `documentsQueryOptions(type?)` | List active documents | `SELECT * WHERE archived_at IS NULL` + optional `eq(type)` |
| `documentQueryOptions(id)` | Single document | `SELECT * WHERE id = ?` |
| `useCreateDocument()` | Create (text content) | `INSERT` |
| `useUpdateDocument()` | Update | `UPDATE WHERE id = ? AND user_id = ?` |
| `useUploadDocument()` | Upload file + create record | Storage `upload({user_id}/{docId}/{filename})` then `INSERT` |
| `useDeleteDocument()` | Delete record + storage file | Fetch `uri`, then Storage `remove([uri])`, then `DELETE` |
| `useSnapshotDocument()` | Snapshot into application_documents | Fetch doc, then `INSERT` into `application_documents` |

**Storage path:** `{user_id}/{docId}/{originalFilename}` — enforced by client code, compatible with the storage RLS policy that scopes by first path segment.

---

### `application_documents`

**File:** `src/lib/queries/application-documents.ts`

| Hook / Factory | Operation | PostgREST |
| --- | --- | --- |
| `applicationDocumentsQueryOptions(applicationId)` | Snapshots for one application | `SELECT * WHERE application_id = ? ORDER BY linked_at desc` |
| `useDetachDocument()` | Remove snapshot | `DELETE WHERE id = ?` |

---

### `dashboard`

**File:** `src/lib/queries/dashboard.ts`

| Hook | Operation | PostgREST |
| --- | --- | --- |
| `useDashboardStats()` | Aggregate stat card values | `supabase.rpc('get_dashboard_stats')` |
| `useRecentActivity()` | Last 15 events with joins | `SELECT *, application(…company(…)) ORDER BY created_at desc LIMIT 15` |

`get_dashboard_stats` is a `SECURITY DEFINER` SQL function that computes all stat card values in a single round trip. See `data_model.md` → Database Infrastructure → Functions for the implementation.

---

### `user_settings`

**File:** `src/lib/queries/settings.ts`

| Hook / Factory | Operation | PostgREST |
| --- | --- | --- |
| `settingsQueryOptions()` | Load settings | `SELECT * .single()` (one row per user) |
| `useUpdateSettings()` | Save settings | `UPDATE WHERE user_id = ?` with optimistic update |

`useUpdateSettings` uses optimistic updates: it pre-patches the cache in `onMutate`, then rolls back in `onError` if the server call fails.

---

### `application-stats`

**File:** `src/lib/queries/application-stats.ts`

Client-side computed stats used in the settings page. Fetches application and event data and computes stats locally rather than via an RPC.

| Query key | What it fetches |
| --- | --- |
| `["applications", "stats", "allTime"]` | All non-archived applications (`id, status, created_at, applied_at`) |
| `["applications", "stats", "thisWeek"]` | Same, filtered `created_at >= Monday 00:00:00` |
| `["events", "stats", "allTime"]` | All events (`id, created_at`) |
| `["events", "stats", "thisWeek"]` | Same, filtered by this week |

Stats computed locally: `total`, `active` (applied + interviewing + offer), `responseRate` (non-bookmarked with response / total non-bookmarked), `interviews` (event count).

---

## Extension API Routes

The browser extension cannot use session cookies. It authenticates with a Bearer token (Supabase JWT) instead. The extension API is a minimal set of three routes that support authentication and job tracking.

All routes:

- Accept CORS preflight (`OPTIONS`) from any origin
- Return `application/json` via the `corsJson` helper
- Handle JSON parse errors explicitly (400)

**CORS policy (`src/lib/extension/cors.ts`):**

```ts
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}
```

---

### `POST /api/extension/signin`

Authenticates the extension user with email + password and returns a session token pair.

**Auth:** None (uses anon Supabase client)

**Request:**

```json
{ "email": "user@example.com", "password": "secret" }
```

**Response 200:**

```json
{ "access_token": "...", "refresh_token": "..." }
```

**Errors:**

| Status | Body | Condition |
| --- | --- | --- |
| 400 | `{ "error": "Invalid JSON" }` | Body cannot be parsed |
| 400 | `{ "error": "email and password are required" }` | Missing field |
| 401 | `{ "error": "Invalid credentials" }` | Supabase auth failed |

**Implementation:** `supabase.auth.signInWithPassword({ email, password })` using `createAnonApiClient()`.

---

### `POST /api/extension/refresh`

Exchanges a refresh token for a new access + refresh token pair.

**Auth:** None (uses anon Supabase client)

**Request:**

```json
{ "refresh_token": "..." }
```

**Response 200:**

```json
{ "access_token": "...", "refresh_token": "..." }
```

**Errors:**

| Status | Body | Condition |
| --- | --- | --- |
| 400 | `{ "error": "Invalid JSON" }` | |
| 400 | `{ "error": "refresh_token is required" }` | |
| 401 | `{ "error": "Invalid or expired refresh token" }` | |

**Implementation:** `supabase.auth.refreshSession({ refresh_token })` using `createAnonApiClient()`.

---

### `POST /api/extension/track`

Creates an application (and company if needed) from a job posting detected by the extension. Deduplicates against recent applications.

**Auth:** `Authorization: Bearer <access_token>` (required)

**Request:**

```json
{
  "company_name": "Acme Corp",
  "position": "Senior Frontend Engineer",
  "url": "https://jobs.acme.com/123"
}
```

**Response 200:**

```json
{ "application_id": "uuid", "company_id": "uuid" }
```

**Errors:**

| Status | Body | Condition |
| --- | --- | --- |
| 400 | `{ "error": "Invalid JSON" }` | |
| 400 | `{ "error": "company_name, position, and url are required" }` | |
| 401 | `{ "error": "Unauthorized" }` | Missing or invalid token |
| 409 | `{ "error": "Application already tracked", "application_id": "uuid" }` | Recent duplicate detected |
| 500 | `{ "error": "Internal server error" }` | Service layer threw |

**Implementation flow:**

1. Extract Bearer token from `Authorization` header
2. Parse and validate body
3. Call `createServiceApiClient().auth.getUser(token)` to validate JWT and resolve `user.id`
4. `findOrCreateCompany(client, userId, companyName)` — upsert on `(user_id, name)` unique constraint
5. `checkRecentDuplicate(client, userId, companyId, position)` — returns existing `application_id` if a matching application exists within a recent window
6. If no duplicate: `createApplication(client, userId, companyId, position, url)` — inserts with `status: 'bookmarked'`

**Service layer:** `src/lib/extension/track-service.ts`. Service functions throw on error (never return `{ error }`). The route handler wraps service calls in `try/catch` → 500.

**Why `createServiceApiClient`?** The service role key bypasses RLS, allowing the route to write on behalf of the user after the JWT has been independently validated. RLS cannot be used with a Bearer token in a custom API route — Supabase PostgREST handles that automatically, but `createClient` in an API route does not have access to the session cookie.

---

## Error Response Format

All API responses (both PostgREST errors surfaced to the client and Extension API errors) follow a consistent shape:

```json
{ "error": "Human-readable message" }
```

Extension API routes never include stack traces or internal detail in the error body. Server-side errors are logged via `console.error` before returning a generic 500.

PostgREST errors are thrown by the Supabase SDK (`if (error) throw error`) and caught at the TanStack Query layer, where they surface via `isError` and `error` on query/mutation results.

---

## Authentication Flows

### Web app (browser)

1. User submits email + password on `/login`
2. Client calls `supabase.auth.signInWithPassword()`
3. Supabase sets a session cookie (httpOnly, scoped to domain)
4. On every subsequent page navigation, `_authenticated` layout calls `getUser()` via `createServerFn` — validates the cookie server-side
5. All PostgREST queries use the browser client, which reads the session cookie automatically; RLS enforces data isolation

### Extension

1. User signs in via `POST /api/extension/signin` → receives `access_token` + `refresh_token`
2. Extension stores tokens in `chrome.storage.local`
3. Requests to `/api/extension/track` include `Authorization: Bearer <access_token>`
4. When `access_token` expires, extension calls `POST /api/extension/refresh` to get a new pair
5. The API route validates the token with `client.auth.getUser(token)` — there is no cookie involved

---

## Planned Extension: PostgREST for AI Tables

When the AI integration PRD is implemented, the `tasks` and `user_integrations` tables will be accessed via the same PostgREST query pattern. New query files will be added:

| File | Domain |
| --- | --- |
| `src/lib/queries/tasks.ts` | AI task lifecycle — list, get, update status, provide feedback |
| `src/lib/queries/integrations.ts` | `user_integrations` — list, upsert, delete |
| `src/lib/queries/oauth-tokens.ts` | `user_oauth_tokens` — read granted scopes, delete |
| `src/lib/queries/consents.ts` | `user_consents` — read consent history, insert consent event |

No new custom API routes are anticipated for the AI features — all AI task operations are user-initiated and go through PostgREST with normal session auth. Inngest webhook handlers (if needed) will be added as new API file routes under `/api/inngest/`.
