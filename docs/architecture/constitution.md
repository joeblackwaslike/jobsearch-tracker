# Job Search Tracker — Project Constitution

> Stable principles that apply to every PRD, feature, and implementation decision in this repository. When something here conflicts with a one-off spec, the constitution wins unless explicitly and intentionally amended.

**Version:** 1.0.0 | **Ratified:** 2026-03-04

---

## Mission

A privacy-first, AI-assisted job search tracker for software engineers. Fast, focused, and self-hostable. Helps users track applications, manage interview workflows, and automate the tedious parts of a job search — while keeping the user in control of every consequential action.

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | TanStack Start + TanStack Router |
| UI | React 19 |
| Language | TypeScript 5.x (strict) |
| Styling | Tailwind CSS 4 (via `@tailwindcss/vite`) |
| Build | Vite 7 |
| Package manager | pnpm (invoke as `npx pnpm` — not in PATH) |
| Backend / Auth / DB | Supabase (Auth, Postgres, Storage, Edge Functions, pg_cron) |
| Job queue | Inngest (user-supplied key via `user_integrations`) |
| Validation | Zod |
| UI components | Untitled UI React (free tier; copy components into `src/components/ui/`) |

These choices are fixed for the current generation. Do not introduce new frameworks or runtimes without a constitution amendment.

---

## Privacy

**Privacy is non-negotiable and always defaults to the most protective option.**

- Every feature that shares user data with an external service is **opt-in, never opt-out**.
- Users receive full disclosure about what data flows where before consenting.
- All consent is revocable at any time with minimal effort and immediate effect.
- Consent records are stored in an append-only audit table (`user_consents`) — never deleted, never mutated.
- Data minimization: send only what an external API requires, nothing more.
- When privacy must be traded for utility, the user decides — with full information, not buried in a settings screen.

---

## Security

- **All schema changes via Supabase migrations.** Never alter tables directly.
- **RLS on every table, always.** No table ships without row-level security policies.
- **API keys never exposed to the client.** Key resolution happens server-side only. The UI learns status via health-check responses, not by reading the key itself.
- **Pre-flight integration health check before every external API call.** If `user_integrations.status != 'ok'`, skip the call — do not attempt and fail.
- **OAuth tokens must be encrypted at rest (Supabase Vault) before any feature ships to real users.** Plain text with RLS is acceptable during development only.
- **Auth failures are hard stops.** On a 401/403 or invalid key: mark integration `status = 'error'`, halt all pending tasks for that provider, notify the user immediately. Never retry an auth error. Never create the appearance of things working when they are not.

---

## Security Guidelines

### Authentication requirements

**UI pages** — session is verified server-side in the `_authenticated` layout route's `beforeLoad` using `createServerSupabaseClient` and `supabase.auth.getUser()`. An unverified or missing session redirects to `/login` before the component renders. Never gate a page on client-side session state alone — the server-side check is the authoritative gate.

**API routes** — every external-facing route validates the `Authorization: Bearer <token>` header using the service-role Supabase client before touching any business logic:

```ts
const { data: { user }, error } = await client.auth.getUser(token)
if (error || !user) return corsJson({ error: "Unauthorized" }, 401)
```

`getUser()` cryptographically verifies the JWT — it does not simply decode it. Never use `decodeJWT` or trust token claims without verification.

**Service-role key** — used server-side only in API routes and Edge Functions. Never referenced in client-side code, never included in environment variables prefixed `VITE_` (which are bundled into the client).

**Session integrity** — use `createServerSupabaseClient` (cookie-based) for server functions and SSR. Use `createClient` (browser client) in React components and query hooks. Never mix them.

### Data validation rules

- **All external input is validated with Zod before use.** This includes: API request bodies, URL search parameters in route loaders, data returned from external APIs (Anthropic, Apollo, Google), and user-supplied URLs.
- **DB-generated types are the source of truth for shape** — use `Tables<"name">` from generated types rather than hand-writing duplicate interfaces. Zod validates at the boundary; TypeScript types enforce it internally.
- **Search params are validated in the route definition** using a Zod schema passed to `validateSearch`. Invalid params are caught and fall back to defaults (`z.catch()`) rather than causing runtime errors.
- **Numeric fields from external sources** are validated as numbers, not coerced from strings unless explicitly intended.

### Input sanitization

**XSS — React JSX:** React escapes interpolated values in JSX by default. Never use `dangerouslySetInnerHTML` with user-supplied or AI-generated content.

**XSS — Markdown rendering:** all markdown is rendered via `react-markdown` with `remark-gfm`. This library does not render raw HTML by default, so inline `<script>` tags and event attributes in markdown content are safely stripped. Do not add `rehype-raw` or any plugin that enables raw HTML rendering for user-supplied content.

**URL inputs:** URLs entered by users or fetched from job boards are validated before use. Accept only `http:` and `https:` schemes. Reject `javascript:`, `data:`, and other non-web schemes. The `url-import` feature fetches external URLs server-side via an Edge Function — treat all fetched content as untrusted and sanitize before storing.

**AI-generated content:** treat all content returned by Anthropic or other AI APIs as untrusted external input. Validate shape with Zod, render markdown safely via `react-markdown`, never inject into the DOM as raw HTML.

**Free-text fields stored in the DB:** Supabase uses parameterized queries — SQL injection through the Supabase client is not possible. No manual escaping of user input for DB operations is required. Do not construct raw SQL strings with string interpolation.

### Vulnerability prevention

| Threat | Mitigation |
| --- | --- |
| **Unauthorized data access (IDOR)** | RLS policies on every table; users can only read/write their own rows. No application-level ownership checks are sufficient on their own — RLS is the enforcement layer. |
| **XSS** | React JSX escaping + `react-markdown` without raw HTML; no `dangerouslySetInnerHTML` for untrusted content |
| **SQL injection** | Supabase parameterized queries; no raw SQL string concatenation |
| **CSRF** | API routes use JWT Bearer tokens (not cookies); not vulnerable to CSRF. UI session uses Supabase SSR cookie handling which includes CSRF protections. |
| **Secret exposure** | API keys in `user_integrations` (server-side only); never in `VITE_` env vars; env vars validated at startup |
| **Insecure redirects** | TanStack Router's `redirect()` only redirects to known internal routes; never redirect to a user-supplied URL |
| **Credential leakage in logs** | Never log API keys, tokens, or user PII. Log error types and sanitized context only. |
| **Prototype pollution** | Use `structuredClone()` or spread for object copying; avoid `Object.assign` on untrusted inputs |

### Secure coding practices

- **RLS is authorization, not a backup.** Write RLS policies assuming the application layer is compromised. Every policy must be correct in isolation.
- **The service-role client bypasses RLS.** Only use it in server-side contexts (API routes, Edge Functions) where user identity has already been verified. Never pass the service-role client into a function that may be called with unverified context.
- **Secrets never touch the client bundle.** Any environment variable that holds a secret must not be prefixed with `VITE_`. Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (which are designed to be public) are acceptable `VITE_` vars.
- **OAuth tokens are write-once from the client's perspective.** The UI can trigger a connect/disconnect flow; it never reads the raw token value. Token reads happen server-side only.
- **Do not trust `user_id` from request bodies.** Always derive `user_id` from the verified session (`user.id` from `getUser()`). Never accept `user_id` as a client-supplied parameter.
- **Validate `redirect_to` parameters.** Any flow that accepts a post-auth redirect URL must validate it against an allowlist of internal paths before redirecting.

---

## Integration Model

- Every external service requiring a credential has a row in `user_integrations` — the single source of truth for status and errors.
- **All API keys are user-supplied.** No operator-funded keys. No shared credentials.
- Environment variable fallbacks (`ANTHROPIC_API_KEY`, `INNGEST_API_KEY`, `APOLLO_API_KEY`, etc.) exist for local development and operator-managed self-hosted deployments. Priority: user key → env var → disabled.
- **Inngest is infrastructure-level** — it is a prerequisite for all AI features. If Inngest is not configured, no AI tasks dispatch regardless of other integrations.
- **Costs are kept as low as possible.** Free tiers are used first. Paid tiers are only adopted when genuinely blocked, not speculatively.
- **Self-hosting is a first-class deployment model.** Features that require external accounts (Inngest, Anthropic, Apollo) must be configurable by a self-hoster in Settings → Integrations. No feature should require operator intervention to set up.

---

## Error Handling

All errors are classified at the point of failure. Classification determines retry behavior:

| Class | Examples | Retry? |
| --- | --- | --- |
| **Transient** | Network timeout, 502, 503 | Yes — exponential backoff (30s → 2m → 8m → 30m, max 5 attempts) |
| **Rate limited** | 429 | Yes — after quota resets (`Retry-After` header or provider docs) |
| **Auth failure** | 401, 403, invalid key | Never — hard stop, notify user immediately |
| **Bad request** | 400 with data error | Never — task-level failure, integration unchanged |

Silent failures are not acceptable. Every error surfaces with a clear message and an actionable CTA. "All systems operational" is the baseline — deviations must be visible.

---

## Task & Document Model

- **One task per document, always.** No task produces more than one document. Fan-out creates multiple tasks.
- **Source independence.** Tasks triggered by the browser extension follow the same code path as tasks triggered by the UI. Trigger logic is agnostic to write path.
- **Task state machine:** `pending → running → awaiting_approval → approved → completed`. Plus: `needs_input` (missing required context), `blocked` (auth failure), `terminated` (user cancelled), `failed` (max retries exceeded).
- **`needs_input` is not an error.** It is a near-complete state. Surface it in the inbox with a one-action resolution, framed as "almost done" rather than "something went wrong."
- **Document format:** `mime_type` is authoritative. Never assume format. AI-generated content defaults to `text/markdown` (token efficient, LLM-native). Convert to `text/html` at send time; stored copy stays markdown.
- **Document revisions** use `parent_id` to form a chain. For company research, each interview round branches from the root base document — not from the previous round's document. Base research is timeless; round documents are stage-specific.

---

## Notifications

- **Auth failure emails:** immediate, never batched. A broken integration is urgent.
- **Pending approval digests:** max one email per day. Tasks must be in `awaiting_approval` for at least 24 hours before inclusion. Use time-limited signed URLs (magic links) so users can act from mobile without re-authenticating.
- **Individual approval required.** No batch-approving documents. Each document is read and approved separately — this is the whole point of human-in-the-loop.

---

## User Experience

- **Opt-in, never opt-out.** Every AI feature, every data-sharing integration, every consent starts disabled.
- **Banners, not modals.** Persistent prompts (e.g., "Set up AI features") are non-blocking banners shown until the user completes the CTA or dismisses them. They do not block navigation.
- **Inbox is the primary re-engagement surface.** Badge count in the main nav. Deep links from email go directly to the relevant item.
- **Warm, direct tone.** AI-generated content must sound human: specific, curious, and concise. No buzzwords ("passionate", "synergy", "leverage"). No template-speak. Flag and regenerate if quality bar isn't met before surfacing to the user.
- **Graceful degradation.** Features that require an integration (Gmail, Anthropic) degrade cleanly if that integration is not configured. The user can always complete the action manually.
- **Behavioral psychology.** Incomplete tasks are presented as near-complete actions — one tap to unblock. The `needs_input` inbox item is the canonical example.

---

## Code Quality

- **DRY and YAGNI.** Don't abstract until there are three real cases. Don't build for hypothetical requirements.
- **No over-engineering.** Simple solutions first. A bug fix doesn't need surrounding code cleaned up. A simple feature doesn't need configurability.
- **TypeScript strict mode.** All new code is fully typed. No `any` without a comment explaining why.
- **Zod at system boundaries.** Validate external input (API requests, user input, external API responses). Trust internal code and framework guarantees.
- **No backwards-compatibility shims** for removed code. Delete unused code completely.

---

## Code Style

### Naming conventions

| Thing | Convention | Example |
| --- | --- | --- |
| Files | kebab-case | `track-service.ts`, `application-form.tsx` |
| React components | PascalCase | `UniversalTable`, `ApplicationForm` |
| Functions and hooks | camelCase | `findOrCreateCompany`, `useApplications` |
| Interfaces and types | PascalCase | `UniversalTableProps`, `ApplicationWithCompany` |
| Props interfaces | `[ComponentName]Props` | `UniversalTableProps` |
| Query option factories | `[resource]QueryOptions` | `applicationsQueryOptions` |
| Query hooks | `use[Resource]` / `use[Resource]By[Key]` | `useApplication`, `useApplicationsByCompany` |
| Mutation hooks | `use[Verb][Resource]` | `useCreateApplication`, `useArchiveApplication` |
| Boolean props/vars | `is` / `has` / `can` prefix | `isLoading`, `hasError`, `canSubmit` |
| Constants | `UPPER_SNAKE_CASE` for module-level literals | `MAX_RETRY_COUNT` |

### Import ordering

Imports are grouped in two blocks separated by a blank line:

1. **External packages** — third-party libraries in alphabetical order by package name
2. **Internal modules** — `@/` path aliases, ordered: `components` → `lib` → `schemas`

Within each group, type-only imports (`import type`) come before value imports from the same package.

```ts
import type { ColumnDef } from "@tanstack/react-table"
import { useReactTable } from "@tanstack/react-table"
import { ArrowDown } from "lucide-react"
import { useMemo } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { TableSchema } from "@/schemas/table-schema"
```

### Component structure

Components follow this top-to-bottom order within the file:

1. Imports
2. Types and interfaces (props interface directly above the component that uses it)
3. Component function (named export, not default export)
4. Sub-components or helpers used only within this file (below the main export)

```tsx
// 1. imports
import { useState } from "react"
import { Button } from "@/components/ui/button"

// 2. props interface — directly above the component
interface MyComponentProps {
  value: string
  onChange: (value: string) => void
}

// 3. named export
export function MyComponent({ value, onChange }: MyComponentProps) {
  const [local, setLocal] = useState(value)
  return <Button onClick={() => onChange(local)}>{value}</Button>
}
```

**No default exports.** Every module uses named exports. This makes refactoring and imports consistent across the codebase.

### Query file structure

Larger query files use section comment dividers to aid navigation:

```ts
// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Filters / params
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Query-option factories
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Hooks — queries
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Hooks — mutations
// ---------------------------------------------------------------------------
```

### TypeScript patterns

- Prefer `interface` for object shapes that may be extended; prefer `type` for unions, intersections, and mapped types.
- Use `import type` for type-only imports — reduces bundle size and makes intent explicit.
- Derive types from the DB schema (`Tables<"name">`, `TablesInsert<"name">`, `TablesUpdate<"name">`) rather than duplicating type definitions.
- Use `Omit`, `Pick`, and intersection types to build variant types from base DB types rather than redefining them from scratch.

```ts
// Preferred — derived from generated DB types
type Application = Tables<"applications">
type ApplicationWithCompany = Application & { company: Company }

// Avoid — duplicates what the DB schema already defines
interface Application {
  id: string
  position: string
  // ...
}
```

### Anti-patterns to avoid

| Anti-pattern | Why | Preferred |
| --- | --- | --- |
| Default exports | Inconsistent import names, harder to refactor | Named exports always |
| Calling Supabase directly in a component | Bypasses the query layer, untestable | Use a query hook from `lib/queries/` |
| Business logic in route files | Routes are for routing, not logic | Move to `lib/[domain]/[domain]-service.ts` |
| `any` without a comment | Defeats TypeScript strict mode | Use proper types or `unknown` with narrowing |
| Inline Zod schemas in components | Schema reuse is impossible | Define in `src/schemas/` and import |
| `toast` in a service function | Services have no UI context | Call `toast` in mutation `onSuccess`/`onError` only |
| `console.log` left in committed code | Noise in production logs | Remove before commit; use `console.error` for real errors only |
| Nested ternaries in JSX | Unreadable | Extract to a variable or sub-component |

---

## Database

- All schema changes via migration files in `supabase/migrations/`. Never edit tables directly.
- RLS on every table. Policies must be explicit — no implicit access.
- Prefer `event_id` scoping on documents (`application_events_documents`) where a natural event exists. `event_id` is nullable for documents without a natural event scope.
- Append-only tables (e.g., `user_consents`) are never updated or deleted — they are audit trails.
- Seed data is idempotent (`ON CONFLICT DO NOTHING`). Running the seed twice is safe.

---

## Data Modeling

- **UUID primary keys everywhere.** All tables use `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`.
- **Every user-owned table has a `user_id` FK** to `auth.users(id) ON DELETE CASCADE`. No orphaned rows.
- **Timestamps on all tables.** `created_at TIMESTAMPTZ DEFAULT now() NOT NULL` always. Add `updated_at` on any table that supports mutation.
- **Always `timestamptz`, never `timestamp`.** All timestamps are timezone-aware. Never store naive datetimes.
- **Text fields over Postgres enums.** Status and type fields are `TEXT` with application-level validation, not Postgres `ENUM` types. Easier to extend without a migration that requires a table rewrite.
- **JSONB for flexible or evolving structured data.** Use `JSONB` when the shape is expected to grow (e.g., task `payload`, company `links`, `ratings`). Use typed columns when the shape is stable.
- **Index all foreign keys.** Every FK column gets an index. Never rely on Postgres to do this automatically.
- **Soft deletes for user data.** User-visible records use `archived_at TIMESTAMPTZ` for soft deletion, not `DELETE`. Hard deletes are reserved for records the user explicitly purges (account deletion, revoked consent).
- **Unique constraints on junction tables.** Many-to-many join tables always have a `UNIQUE(a_id, b_id)` constraint to prevent silent duplicates.
- **Nullable FKs with `ON DELETE SET NULL`** for optional relationships where the child record should survive the parent being deleted (e.g., `tasks.trigger_event_id`).

---

## API Design

- **Resource-oriented paths.** Routes follow `/api/[domain]/[action]` — flat, readable, no deep nesting.
- **Auth first, everything else second.** Validate the `Authorization: Bearer <token>` header before parsing the request body. An unauthenticated request never touches business logic.
- **Validate input at the boundary with Zod.** All external input (request body, query params) is validated before being passed to the service layer. Invalid input returns 400 with a descriptive error message.
- **Never leak internal error details.** Unexpected errors log server-side and return a generic `{ error: "Internal server error" }` 500 to the client. Supabase error messages, stack traces, and internal IDs never reach the response body.
- **Use HTTP semantics correctly.**
  - `200` — success with body
  - `400` — malformed request or validation failure
  - `401` — missing or invalid auth
  - `409` — conflict (duplicate, state mismatch)
  - `500` — unexpected server error
- **Idempotent where possible.** Before creating a record, check whether a semantically equivalent one already exists. Return the existing record with `409` rather than creating a duplicate.
- **CORS on all external-facing routes.** Any route consumed by the browser extension or a future external client must include CORS headers via the shared `corsOptions()` / `corsJson()` helpers.
- **Server functions for internal data loading; API routes for external clients.** TanStack Start server functions handle SSR data fetching for UI pages. `routes/api/**` routes are for the extension, webhooks, and any future external integration.

---

## API Standards

### Endpoint naming

- Paths are lowercase and hyphenated: `/api/extension/track`, not `/api/extension/trackApplication`.
- **Collections** are plural nouns: `/api/applications`, `/api/companies`.
- **Actions** that don't map to CRUD are verb phrases on a resource: `/api/extension/signin`, `/api/extension/refresh`, `/api/extension/track`.
- No deep nesting. Maximum two path segments after `/api/`: `/api/[domain]/[action-or-id]`.

### HTTP verbs

| Verb | Use |
| --- | --- |
| `GET` | Read — no side effects |
| `POST` | Create a resource or trigger an action |
| `PATCH` | Partial update of an existing resource |
| `PUT` | Full replacement of an existing resource |
| `DELETE` | Remove a resource |
| `OPTIONS` | CORS preflight — every external-facing route must handle this |

### HTTP status codes

| Code | When to use |
| --- | --- |
| `200 OK` | Success with a response body |
| `201 Created` | New resource successfully created |
| `204 No Content` | Success with no response body (e.g., DELETE) |
| `400 Bad Request` | Missing fields, failed Zod validation, malformed JSON |
| `401 Unauthorized` | Missing or invalid auth token |
| `403 Forbidden` | Authenticated but not permitted to access this resource |
| `404 Not Found` | Resource does not exist |
| `409 Conflict` | Duplicate detected; resource already exists in this state |
| `500 Internal Server Error` | Unexpected server-side failure |

### Error response format

All error responses use a consistent JSON envelope:

```json
{ "error": "Human-readable description of what went wrong" }
```

For errors where a related resource ID is useful to the caller (e.g., a duplicate), include it alongside the error:

```json
{ "error": "Application already tracked", "application_id": "uuid" }
```

Never include stack traces, Supabase internals, or raw database error messages in the response body.

### Success response format

Single-resource responses return the resource directly (no wrapper):

```json
{ "application_id": "uuid", "company_id": "uuid" }
```

Collection responses return an array directly — no pagination envelope for now; add one when pagination is implemented:

```json
[{ "id": "uuid", "name": "Acme Corp" }, ...]
```

### Authentication flows

**UI (browser session):** Supabase Auth manages sessions via cookies. TanStack Start reads the session server-side using `createServerClient`. No manual token handling required in UI routes.

**Browser extension:** The extension obtains a Supabase JWT at sign-in and includes it as a `Bearer` token on all subsequent requests:

```text
Authorization: Bearer <supabase_jwt>
```

The API route validates the JWT by calling `supabase.auth.getUser(token)` using the service-role client. A valid user object is required before any business logic runs.

**Service-to-service (Edge Functions, Inngest workers):** Use the Supabase service-role key, server-side only. Never expose the service-role key to the client or include it in any response.

### Versioning strategy

Routes are currently unversioned (`/api/[domain]/[action]`). When a breaking change to an external-facing route is required:

- Add a versioned route: `/api/v2/[domain]/[action]`
- Keep the v1 route alive until all known clients (extension versions in the wild) have migrated
- Document the deprecation timeline in the relevant PRD

The extension API (`/api/extension/**`) is the most likely surface to require versioning first, since extension updates lag behind web deploys.

### Request/response examples

**POST /api/extension/track** — track a job application from the extension

Request:

```json
{
  "company_name": "Acme Corp",
  "position": "Senior Frontend Engineer",
  "url": "https://jobs.acmecorp.com/12345"
}
```

Success `200`:

```json
{ "application_id": "a1b2c3d4-...", "company_id": "e5f6g7h8-..." }
```

Duplicate `409`:

```json
{ "error": "Application already tracked", "application_id": "a1b2c3d4-..." }
```

Validation failure `400`:

```json
{ "error": "company_name, position, and url are required" }
```

Unauthenticated `401`:

```json
{ "error": "Unauthorized" }
```

---

## Development Workflow

- **Conventional commits.** Format: `type(scope): description` — e.g., `feat(extension): add POST /api/extension/track endpoint`.
- **Small, focused PRs.** One concern per PR where possible.
- **Feature branches off `main`.** Branch naming: `feat/`, `fix/`, `chore/`, `docs/`.
- **WIP PRs are not only acceptable they're expected** open a WIP PR for all in-progress work, even if it's not ready for review.
- **Migrations must ship with the feature** that requires them — never deferred to a follow-up.
- **No `--no-verify`** on commits. If a hook fails, fix the underlying issue.

---

## Scope Discipline

- **Onboarding flows, analytics dashboards, and multi-tenancy are post-launch concerns.** Do not design for them now.
- **Post-MVP features are explicitly labelled** in PRDs and not implemented until the feature they depend on is released.
- **Encryption at rest (Supabase Vault) is a pre-release gate**, not post-MVP. It must exist before any AI feature ships to real users.
- **Deferred decisions are documented** in the relevant PRD's Open Questions section with a clear resolution path. They are not silently skipped.

---

## Architecture Patterns

### Data flow for UI pages

```text
Route loader (TanStack Router)
  → useQuery / useMutation (TanStack Query)
    → queryFn in lib/queries/
      → Supabase client
```

Loaders prefetch on navigation; components suspend or use `isPending` states — they do not implement their own loading logic.

---

## Testing Approach

### Libraries

| Library | Role |
| --- | --- |
| **Vitest** | Test runner, assertions, mocking (`vi`) |
| **@testing-library/react** | Component rendering and user interaction |
| **@testing-library/jest-dom** | DOM matchers (`toBeInTheDocument`, `toHaveValue`, etc.) |
| **@testing-library/user-event** | Realistic user interactions (prefer over `fireEvent` for inputs) |

All component tests import `render` from `src/test/test-utils.tsx`, which wraps the component under test in `QueryClientProvider` with retries disabled. Never import `render` directly from `@testing-library/react` — it lacks the necessary providers.

### Test file organization

| What | Location | Extension |
| --- | --- | --- |
| UI components | `src/components/[domain]/__tests__/[component].test.tsx` | `.test.tsx` |
| Service functions | `src/lib/[domain]/__tests__/[service].test.ts` | `.test.ts` |
| Utilities / formatters | Co-located: `src/lib/[module].test.ts` | `.test.ts` |
| Schema validation | Co-located: `src/schemas/[schema].test.ts` | `.test.ts` |
| Smoke / integration | `src/test/smoke.test.ts` | `.test.ts` |

Test files live as close to the code they test as possible. The `__tests__/` subdirectory is used for components and services to avoid cluttering the source directory. Flat co-location is fine for utilities and schemas.

### Unit test patterns

**Service functions** are the highest-priority test target. Every exported service function must have tests covering the happy path, the not-found / empty case, and any branching logic. Pass a mocked Supabase client — never hit a real database.

```ts
describe("findOrCreateCompany", () => {
  it("returns existing company id when found", async () => { ... })
  it("creates and returns new company id when not found", async () => { ... })
})
```

**UI components** test what the user sees and does — not internal state, refs, or implementation details.

```ts
describe("StarRating", () => {
  it("renders 5 star buttons", () => { ... })
  it("calls onChange with the clicked star value", () => { ... })
  it("clears rating when the active star is clicked again", () => { ... })
  it("is accessible via aria-label", () => { ... })
})
```

**Utility and schema functions** test with representative inputs, edge cases, and invalid inputs. No mocking required.

### Assertion style

- Prefer **semantic matchers** over raw equality checks: `toBeInTheDocument()`, `toHaveValue()`, `toBeDisabled()` over `toBe(true)`.
- Prefer **role queries** over test IDs: `getByRole("button", { name: "Submit" })` over `getByTestId("submit-btn")`. Role queries double as accessibility assertions.
- Every component test must include **at least one accessibility assertion** — a role query, `aria-label` check, or `toBeVisible()` on a labelled element.
- Use `expect.objectContaining()` for partial object matching rather than duplicating large fixture objects.
- Group related assertions in the same `it` block. Separate concerns into separate `it` blocks — one logical behaviour per test.

### Mocking approach

**Supabase client:** mock with a `makeChain` builder that returns a fluent chain of `vi.fn()` methods resolving to a controlled value. This mirrors the Supabase query builder API without requiring a live database.

```ts
function makeChain(resolvedValue: unknown) {
  const terminal = vi.fn().mockResolvedValue(resolvedValue)
  const chain: Record<string, unknown> = {}
  for (const method of ["select", "insert", "update", "delete", "eq", "ilike", "gte", "lt"]) {
    chain[method] = vi.fn().mockReturnValue(chain)
  }
  chain.single = terminal
  chain.maybeSingle = terminal
  return { chain, terminal }
}
```

**External modules:** use `vi.mock("module-path")` at the top of the file. Prefer mocking at the narrowest scope — mock the specific function called, not the entire module, where possible.

**Time:** use `vi.setSystemTime()` for tests that depend on `Date.now()` or `new Date()`. Always restore with `vi.useRealTimers()` in `afterEach`.

**What not to mock:** internal utility functions, Zod schemas, pure functions with no side effects. Only mock at external boundaries (DB, APIs, browser APIs).

### Integration test strategy

True integration tests (hitting a real Supabase instance) are not part of the standard test suite — they require environment setup that is impractical in CI without a dedicated test project. Instead:

- **Service layer tests with mocked Supabase** cover the integration between business logic and the DB layer without a live connection.
- **Smoke tests** (`src/test/smoke.test.ts`) verify that critical modules import without error and core constants are defined — a fast sanity check for build integrity.
- **Manual testing against a local Supabase instance** (`npx pnpm db:seed` + dev server) is the integration test for flows that span multiple layers.

When a real integration test is genuinely needed (e.g., verifying a complex RLS policy), write it as a standalone script in `scripts/` with clear instructions — not as part of the Vitest suite.

### Coverage expectations

No mandatory coverage percentage. Coverage is a signal, not a goal. The required targets by layer are:

| Layer | Requirement |
| --- | --- |
| Service functions | All exported functions must have tests |
| UI components with interaction logic | Must have tests (controlled inputs, multi-step flows, conditional rendering) |
| Utility / formatter functions | Must have tests |
| Schema validation | Happy path + at least two invalid input cases |
| Presentational wrappers / layout | No tests required |
| TanStack Query hook wiring | No tests required |
| Supabase client config | No tests required |

### Running tests

```bash
npx pnpm test           # run all tests once
npx pnpm test:watch     # watch mode during development
npx pnpm typecheck      # tsc --noEmit — run before every commit
```

---

## Error Handling Patterns

### API routes

```text
auth failure     → return corsJson({ error: "Unauthorized" }, 401)
invalid body     → return corsJson({ error: "..." }, 400)
conflict         → return corsJson({ error: "...", [id] }, 409)
service throws   → console.error + return corsJson({ error: "Internal server error" }, 500)
```

- Always validate auth before parsing body.
- Always validate body with Zod before passing to the service layer.
- Wrap service calls in `try/catch`; log the raw error server-side; return a generic 500 to the client (never leak internal error details).

### Service layer

- Service functions **throw** on failure — they do not return `{ error }` objects.
- Supabase errors are checked after every call: `if (error) throw error`.
- Do not catch and re-wrap unless you are adding meaningful context.

### Client-side (React)

- Mutation errors surface via TanStack Query's `onError` / `isError` — handle at the call site, not inside the query function.
- Show errors inline near the action that caused them, not only in a toast. Toasts (Sonner) are for confirmations and non-critical notices; blocking errors belong in-context.
- Never swallow errors silently. If an error can't be handled, at minimum log it.

### Integration / external API errors

Follow the classification table in the **Error Handling** section above. All integration errors update `user_integrations.status` and `last_error` — never only log them.

---

## Deployment Process

### Build procedure

```bash
pnpm build
# runs: pnpm --filter frontend build
# output: frontend/.output/server/index.mjs  (Node.js HTTP server)
# start:  node .output/server/index.mjs
```

TanStack Start compiles the app to a self-contained Node.js server. There is no static export — the server must run to serve SSR responses.

Two public env vars must be present **at build time** (Vite inlines them into the bundle):

| Variable | Where it comes from |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key |

Additional server-side vars required **at runtime** (not inlined):

| Variable | Purpose |
| --- | --- |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role operations on the server |
| `INNGEST_API_KEY` | Operator-level fallback if not in `user_integrations` |

### Environment configurations

| Environment | Supabase | Vars |
| --- | --- | --- |
| Local dev | Local Supabase via Docker (`supabase start`) | `.env.local` — never committed |
| CI | Placeholder credentials (`https://placeholder.supabase.co`) | GitHub Actions secrets (build-time only) |
| Production | Hosted Supabase project | Platform env vars / secrets manager |

Never commit real credentials. Never use production Supabase during CI test runs.

### CI pipeline (GitHub Actions)

Five jobs run on every push; `e2e` depends on the first three passing:

```text
lint ──────┐
type-check ──┤──► e2e
test ──────┘
build ──────────► (artifact available if all pass)
dependency-review ── (PRs only)
```

| Job | Tool | Notes |
| --- | --- | --- |
| `lint` | Biome | Enforces code style and format |
| `type-check` | `tsc --noEmit` | Strict TypeScript; no type errors allowed |
| `test` | Vitest | Unit + service tests |
| `build` | Vite | Uses placeholder Supabase creds; confirms build is not broken |
| `e2e` | Playwright (Chromium) | Runs against the built output with a local Supabase |
| `dependency-review` | GitHub Action | Flags new vulnerable deps on PRs |

All jobs run on Node 24 + pnpm 10.20.0. A job failure blocks merge.

### Deployment steps

No CD pipeline exists yet — deployment is manual until one is configured.

**App deployment (any Node-capable host: Railway, Fly, Render, etc.):**

1. Set all required env vars on the platform.
2. Trigger build (`pnpm build`) with the correct `VITE_*` vars available.
3. Start the server: `node .output/server/index.mjs`.
4. Health-check the `/api/extension/health` endpoint (or equivalent).

**Supabase migrations (production):**

```bash
supabase db push --linked
```

Always run migrations **before** deploying the new app version — the app must be compatible with the new schema, not the old one.

### Rollback strategies

**App rollback:**
Redeploy the previous build artifact or git tag. The build is fully reproducible from any tagged commit given the same env vars.

**Migration rollback:**
There is no auto-rollback. Write a new forward migration that reverses the change. Never use destructive rollbacks against production data without an explicit data-backup step first. If a migration could lose data, write and test the rollback migration in a staging environment before applying the forward migration to production.

### Environment-specific requirements

| Requirement | Version |
| --- | --- |
| Node.js | 24.x |
| pnpm | 10.20.0 (invoke as `npx pnpm` — not in PATH locally) |
| Supabase CLI | Match the version pinned in `.devcontainer/` |
| OS | Any POSIX-compatible; devcontainer provides a reproducible baseline |

---

## Amendments

Propose changes to this document in a PR. Include rationale and which PRD or implementation experience prompted the change. Any principle here can be changed — but the change must be intentional, documented, and approved before it takes effect.
