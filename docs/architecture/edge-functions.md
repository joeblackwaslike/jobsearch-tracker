# Edge Functions & Serverless

**Last updated:** 2026-03-04

---

## Overview

Supabase Edge Functions are **Deno 2** serverless functions that run in the Supabase edge runtime. They are used for work that cannot or should not run in the browser:

- Operations requiring secret API keys that must never be exposed to the client
- Server-side HTTP requests to third-party services blocked by CORS
- Privileged database operations using the service role key (bypasses RLS)
- Scheduled background jobs (cron)

Functions live in `supabase/functions/<function-name>/index.ts`. Each function is its own directory with a single entry point.

---

## Function Inventory

### `fetch-job-url`

**Path:** `supabase/functions/fetch-job-url/index.ts`

**Purpose:** Server-side proxy that fetches the rendered HTML of a job posting URL via the [Browserless](https://browserless.io) headless Chrome API.

**Why it can't run client-side:**

1. **CORS.** Job boards (LinkedIn, Greenhouse, Lever, etc.) do not include `Access-Control-Allow-Origin` headers for arbitrary origins. A direct browser `fetch()` to these URLs is blocked.
2. **API key exposure.** The Browserless service requires an API key (`BROWSERLESS_API_KEY`). Embedding this in browser-side code would expose it to any user inspecting network requests.

**Trigger:** Called from the browser via `supabase.functions.invoke('fetch-job-url', { body: { url } })` when a user submits a URL in the Import URL dialog.

**Auth:** `verify_jwt = false` (set in `config.toml`). JWT verification is disabled because the Supabase CLI 2.x has a known crash when verifying ES256 JWTs. Security is provided by the Browserless API key — without it the function returns a 500.

**Secrets required:**

| Secret | Description |
| --- | --- |
| `BROWSERLESS_API_KEY` | API key for Browserless headless Chrome service |

**Request:**

```json
POST /functions/v1/fetch-job-url
Content-Type: application/json

{ "url": "https://boards.greenhouse.io/company/jobs/123" }
```

**Response (success):**

```json
{ "html": "<html>...</html>" }
```

**Response (error):**

```json
{ "error": "BROWSERLESS_API_KEY not configured" }   // 500
{ "error": "url is required" }                       // 400
{ "error": "Invalid URL" }                           // 400
{ "error": "Browserless error: 429", "detail": "" }  // 502
```

**CORS:** Permissive (`Access-Control-Allow-Origin: *`). Handles `OPTIONS` preflight.

---

### `send-interview-reminders`

**Path:** `supabase/functions/send-interview-reminders/index.ts`

**Purpose:** Queries all interview events scheduled for tomorrow, checks each user's notification preferences, and sends email reminders via [Resend](https://resend.com).

**Why it can't run client-side:**

1. **Service role required.** Fetching user email addresses requires `supabase.auth.admin.getUserById()`, which is only available with the service role key. Exposing the service role key to the browser would grant any user full admin access to the database.
2. **Not user-initiated.** This is a background cron job. There is no user session to attach to.

**Trigger:** Scheduled via `pg_cron` at **11:00 UTC daily (6am EST)**. The cron job issues an HTTP POST to the function URL using `pg_net`:

```sql
-- supabase/migrations/20260221130000_add_interview_reminder_cron.sql
select cron.schedule(
  'send-interview-reminders',
  '0 11 * * *',
  $$
  select net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/send-interview-reminders',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  )
  $$
);
```

The PostgreSQL settings `app.supabase_url` and `app.service_role_key` must be set in the database for this to work.

**Secrets required:**

| Secret | Description |
| --- | --- |
| `SUPABASE_URL` | Supabase project URL (auto-injected by runtime) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (auto-injected by runtime) |
| `RESEND_API_KEY` | API key for Resend email service |
| `APP_URL` | Base URL for application links in emails (default: `https://thrive.app`) |

**Behavior:**

1. Queries `events` joined to `applications` and `companies` where `scheduled_at` is tomorrow
2. Skips archived applications
3. For each event, reads `user_settings` to check `email_reminders` and `notify_interview` flags — skips users who have either disabled
4. Looks up user email via `auth.admin.getUserById(user_id)`
5. Sends an HTML email via Resend with event details and a link to the application

**Response:**

```json
{ "sent": 3 }    // number of emails sent
```

**CORS:** None — this function is never called from a browser.

---

## Deno Runtime

Supabase Edge Functions run on **Deno 2** (configured in `supabase/config.toml`).

### Key differences from Node.js

| Concern | Deno |
| --- | --- |
| Module system | ES Modules only; no CommonJS |
| Package manager | None — import directly from URLs |
| `node_modules` | Not used |
| npm packages | Import via `https://esm.sh/<package>@<version>` |
| Standard library | Import via `https://deno.land/std@<version>/...` |
| Environment variables | `Deno.env.get("KEY")` |
| HTTP server | `Deno.serve(async (req) => new Response(...))` |
| TypeScript | Supported natively, no compilation step |
| Permissions | Sandboxed by default; explicit permission flags needed for local tools |

### Entry point pattern

Every function must export a default HTTP handler via `Deno.serve`:

```typescript
Deno.serve(async (req) => {
  // Handle OPTIONS preflight (required for browser invocations)
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { someField } = await req.json();
    // ... logic ...
    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
```

### Importing packages

```typescript
// npm packages via esm.sh
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@3";

// Deno standard library
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
```

Always pin to a specific version (`@2`, `@3`, `@0.224.0`) to avoid breaking changes.

### Reading secrets

```typescript
const API_KEY = Deno.env.get("MY_API_KEY");

if (!API_KEY) {
  return new Response(
    JSON.stringify({ error: "MY_API_KEY not configured" }),
    { status: 500, headers: { "Content-Type": "application/json" } },
  );
}
```

Always check for the presence of required secrets at the top of the handler and return an explicit 500 with a clear message if missing.

---

## Secrets Management

### How secrets work

Edge functions read secrets via `Deno.env.get()`. Supabase injects secrets into the function's environment at runtime — they are never embedded in the deployed function code.

### Local secrets

Secrets for local development are stored in `supabase/.env` (gitignored). This file is **not committed**.

```
# supabase/.env
BROWSERLESS_API_KEY=your_key_here
RESEND_API_KEY=your_key_here
```

The Supabase CLI automatically injects these when serving or starting functions locally.

**Template:** `supabase/.env.example` lists all required keys:

```
BROWSERLESS_API_KEY=
RESEND_API_KEY=
```

Copy this to `supabase/.env` and fill in the values before running functions locally.

### Remote (production) secrets

Set secrets on the remote project using the Supabase CLI:

```bash
supabase secrets set BROWSERLESS_API_KEY=your_key_here
supabase secrets set RESEND_API_KEY=your_key_here
```

List current secrets (names only — values are never shown):

```bash
supabase secrets list
```

Remove a secret:

```bash
supabase secrets unset BROWSERLESS_API_KEY
```

Secrets can also be set in the Supabase dashboard under **Project Settings → Edge Functions**.

### Automatically injected secrets

The Supabase runtime automatically injects the following into every function's environment — you do not need to set these manually:

| Variable | Value |
| --- | --- |
| `SUPABASE_URL` | The project's API URL |
| `SUPABASE_ANON_KEY` | The project's anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | The project's service role key |
| `SUPABASE_DB_URL` | The direct database connection URL |

### Config.toml secret references

`supabase/config.toml` uses the `env(KEY_NAME)` syntax to reference secrets (for OAuth provider configuration and other CLI-level settings):

```toml
[auth.external.google]
client_id = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT)"
secret = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET)"
```

These are read from environment variables at CLI startup, not from `supabase/.env` — they must be present in the shell environment or in a `.env` file that is sourced before running `supabase start`.

---

## Authentication

### JWT verification

By default, Supabase verifies the `Authorization: Bearer <token>` header on every function request. The token must be a valid Supabase JWT (anon key or user session token).

Verification is controlled per-function in `config.toml`:

```toml
[functions.fetch-job-url]
verify_jwt = false   # disabled — no user session required
```

When `verify_jwt = true` (the default), an unauthenticated request returns:
```json
{ "message": "JWT must be provided" }
```
with status `401`.

### When to use each auth mode

| Mode | `verify_jwt` | When to use |
| --- | --- | --- |
| User JWT | `true` (default) | Function acts on behalf of a logged-in user; RLS applies normally |
| No JWT | `false` | Function is protected by another mechanism (API key, cron-only) |
| Service role | `true`, but function creates its own client with service role key | Function needs admin DB access regardless of calling user |

### Accessing the user inside a function

When `verify_jwt = true`, extract the user from the token:

```typescript
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const authHeader = req.headers.get("Authorization");

  // Create a client that uses the caller's JWT — RLS applies
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader! } } },
  );

  const { data: { user } } = await supabase.auth.getUser();
  // user.id is now available
});
```

### Service role client

For admin operations (bypasses RLS):

```typescript
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);
// No JWT forwarding — full admin access
const { data: { user } } = await supabase.auth.admin.getUserById(userId);
```

Never forward the service role key to the browser or return it in a response.

---

## Frontend → Function Communication

### `supabase.functions.invoke()`

The browser Supabase client provides `functions.invoke()` which:

1. Constructs the URL: `${VITE_SUPABASE_URL}/functions/v1/<function-name>`
2. Attaches the current user's JWT as `Authorization: Bearer <token>`
3. Sends the body as JSON
4. Returns `{ data, error }`

```typescript
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();
const { data, error } = await supabase.functions.invoke("fetch-job-url", {
  body: { url: "https://example.com/jobs/123" },
});

if (error) throw error;
const html: string = data.html;
```

The client automatically includes these headers:
- `Authorization: Bearer <user-jwt>`
- `apikey: <anon-key>`
- `x-client-info: <sdk-version>`
- `Content-Type: application/json`

### CORS requirements

Any function called from a browser must:

1. Handle `OPTIONS` preflight requests and return `200` with CORS headers
2. Include CORS headers on all responses

Standard CORS header block (copy into every browser-called function):

```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  // ... handler ...
  return new Response(body, {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
```

Functions called only by cron or server-side code do not need CORS headers.

---

## Local Development Environment

### Prerequisites

- **Docker Desktop** running (Supabase local stack runs in containers)
- **Supabase CLI** installed: `brew install supabase/tap/supabase`
- **pnpm** (use `npx pnpm` if not in PATH)
- `supabase/.env` populated from `supabase/.env.example`

### Starting the full local stack

```bash
npx pnpm dev
# Equivalent to: supabase start && pnpm --filter frontend dev
```

This starts:
- Supabase local stack (Postgres, Auth, Storage, Edge Runtime, Studio)
- Vite dev server at `http://localhost:3000`

After `supabase start`, the CLI prints all local service URLs:

```
API URL: http://127.0.0.1:54321
DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
Studio URL: http://127.0.0.1:54323
Inbucket URL: http://127.0.0.1:54324
Edge Runtime: http://127.0.0.1:54321/functions/v1/<name>
```

### Port reference

| Service | Port | URL |
| --- | --- | --- |
| PostgREST API + Edge Runtime | 54321 | `http://127.0.0.1:54321` |
| Postgres | 54322 | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` |
| Supabase Studio | 54323 | `http://127.0.0.1:54323` |
| Inbucket (email capture) | 54324 | `http://127.0.0.1:54324` |
| Analytics | 54327 | — |
| Deno inspector | 8083 | Chrome DevTools |

Edge functions are served at:
```
http://127.0.0.1:54321/functions/v1/<function-name>
```

### Stopping

```bash
npx pnpm db:stop
# or: supabase stop
```

### Resetting the database

```bash
npx pnpm db:reset
# Runs: supabase db reset
# Replays all migrations + runs seed.sql
```

---

## Testing Functions Locally

### Method 1: Via the running local stack (recommended)

With `supabase start` running, functions are served automatically. Test with `curl`:

```bash
# fetch-job-url (no JWT required)
curl -X POST http://127.0.0.1:54321/functions/v1/fetch-job-url \
  -H "Content-Type: application/json" \
  -d '{"url": "https://boards.greenhouse.io/example/jobs/123"}'

# send-interview-reminders (service role bearer token)
curl -X POST http://127.0.0.1:54321/functions/v1/send-interview-reminders \
  -H "Authorization: Bearer $(supabase status -o json | jq -r .SERVICE_ROLE_KEY)" \
  -H "Content-Type: application/json" \
  -d '{}'
```

To get the service role key:
```bash
supabase status -o json | jq -r .SERVICE_ROLE_KEY
```

### Method 2: `supabase functions serve` (hot reload, isolated)

For rapid iteration on a single function without restarting the whole stack:

```bash
supabase functions serve fetch-job-url --env-file supabase/.env
```

This runs only that function with hot reload on file changes. Useful when iterating on function logic without restarting the full stack.

Serve all functions:
```bash
supabase functions serve --env-file supabase/.env
```

### Method 3: Deno directly (no Supabase stack needed)

For pure logic testing without the HTTP layer:

```bash
deno run --allow-net --allow-env supabase/functions/fetch-job-url/index.ts
```

This starts the `Deno.serve` listener directly. Set environment variables inline or via `.env`:

```bash
BROWSERLESS_API_KEY=xxx deno run --allow-net --allow-env supabase/functions/fetch-job-url/index.ts
```

### Debugging with Chrome DevTools

The edge runtime exposes a Deno inspector on port **8083**. Connect from Chrome:

1. Open `chrome://inspect` in Chrome
2. Click "Configure..." and add `127.0.0.1:8083`
3. The function appears as a remote target — click "inspect"

Add `debugger;` statements in your function code to pause execution.

---

## Testing Remotely

### Invoke a deployed function via CLI

```bash
supabase functions invoke fetch-job-url \
  --project-ref <project-ref> \
  --body '{"url": "https://example.com/jobs/123"}'
```

Get your project ref from the Supabase dashboard URL or:
```bash
supabase projects list
```

### Invoke via curl against production

```bash
# Get your project URL and anon key from the Supabase dashboard
curl -X POST https://<project-ref>.supabase.co/functions/v1/fetch-job-url \
  -H "Authorization: Bearer <anon-key-or-user-jwt>" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://boards.greenhouse.io/example/jobs/123"}'
```

### Viewing function logs

```bash
supabase functions logs fetch-job-url --project-ref <project-ref>
```

Or view in the Supabase dashboard under **Edge Functions → <function-name> → Logs**.

---

## Deployment

### Prerequisites

```bash
# Authenticate
supabase login

# Link to your remote project (run once per repo clone)
supabase link --project-ref <project-ref>
```

The project ref is visible in your Supabase dashboard URL: `https://app.supabase.com/project/<project-ref>`.

### Deploy a single function

```bash
supabase functions deploy fetch-job-url
```

### Deploy all functions

```bash
supabase functions deploy
```

### Set production secrets before deploying

Secrets must be set on the remote project before the function can use them. Set them once; they persist across deployments:

```bash
supabase secrets set BROWSERLESS_API_KEY=<value> --project-ref <project-ref>
supabase secrets set RESEND_API_KEY=<value> --project-ref <project-ref>
```

### Verify deployment

```bash
supabase functions list --project-ref <project-ref>
```

---

## Development Workflow

End-to-end workflow for adding or modifying an edge function:

```
1. Write the function
   └── supabase/functions/<name>/index.ts

2. Add any new secrets to supabase/.env (local)
   └── Also update supabase/.env.example

3. Start local stack (if not running)
   └── npx pnpm db:start

4. Test locally
   └── curl http://127.0.0.1:54321/functions/v1/<name>
   └── or: supabase functions serve <name> --env-file supabase/.env

5. If the function needs a cron job trigger,
   write a migration in supabase/migrations/ and run:
   └── npx pnpm db:reset

6. Test the frontend integration
   └── npx pnpm dev
   └── Exercise the UI path that calls the function

7. Set production secrets (once per secret, not per deploy)
   └── supabase secrets set KEY=value

8. Deploy
   └── supabase functions deploy <name>

9. Verify in production
   └── supabase functions logs <name>
   └── or: curl against production URL
```

### What changes require a redeploy

| Change | Action needed |
| --- | --- |
| Function code (`index.ts`) | `supabase functions deploy <name>` |
| New secret added | `supabase secrets set KEY=val`, then redeploy |
| `config.toml` function config | `supabase functions deploy <name>` |
| Cron schedule change | New migration + `supabase db push` |
| Adding a new function | Create directory + `supabase functions deploy <name>` |

### Hot reload during local development

The edge runtime is configured with `policy = "per_worker"` in `config.toml`, which enables hot reload: editing `index.ts` while `supabase start` is running automatically reloads the function. No restart required.

If hot reload causes issues (crashes, stale module cache), switch to `oneshot`:

```toml
[edge_runtime]
policy = "oneshot"
```

---

## Best Practices

### Always handle missing secrets explicitly

```typescript
const API_KEY = Deno.env.get("MY_API_KEY");
if (!API_KEY) {
  return new Response(
    JSON.stringify({ error: "MY_API_KEY not configured" }),
    { status: 500, headers: { "Content-Type": "application/json" } },
  );
}
```

A missing secret should fail loudly with a clear message, not silently produce wrong results.

### Always wrap the handler body in try/catch

```typescript
Deno.serve(async (req) => {
  try {
    // ... handler ...
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
```

Uncaught exceptions in Deno crash the isolate. A top-level try/catch ensures every error returns a proper JSON response.

### Validate all inputs

```typescript
const { url } = await req.json();

if (!url || typeof url !== "string") {
  return new Response(
    JSON.stringify({ error: "url is required" }),
    { status: 400, headers: { "Content-Type": "application/json" } },
  );
}

try {
  new URL(url);
} catch {
  return new Response(
    JSON.stringify({ error: "Invalid URL" }),
    { status: 400, headers: { "Content-Type": "application/json" } },
  );
}
```

Return `400` for bad input, `500` for server errors, `502` for upstream API failures.

### Pin dependency versions

```typescript
// Good — pinned version
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// Risky — will pick up breaking changes
import { createClient } from "https://esm.sh/@supabase/supabase-js@latest";
```

### Keep functions focused

One function, one responsibility. If a function is doing both data fetching and email sending, split it.

### Do not share code between functions (yet)

The Supabase edge runtime supports shared modules via `supabase/functions/_shared/`, but this adds complexity. Until there is clear duplication that would cause real maintenance pain, inline everything in each function's `index.ts`.

### Functions that need CORS must handle OPTIONS

Any function called from a browser needs an OPTIONS preflight handler. Functions called only by cron or server-side code do not.

### Use `verify_jwt = false` sparingly

Disabling JWT verification makes a function publicly accessible by URL. Only do this when:
- The function is protected by another secret mechanism (e.g. `BROWSERLESS_API_KEY`)
- There is a known JWT verification bug that blocks development (document the reason in a comment)

---

## `config.toml` Edge Function Settings

Function-level configuration in `supabase/config.toml`:

```toml
[edge_runtime]
enabled = true
policy = "per_worker"    # hot reload; use "oneshot" if issues arise
inspector_port = 8083    # Chrome DevTools debugging port
deno_version = 2

[functions.fetch-job-url]
verify_jwt = false       # JWT verification disabled — see comment in function
```

Add a `[functions.<name>]` block for each function that needs non-default settings.
