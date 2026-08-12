# Chrome Extension Backend API Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build three HTTP API endpoints on the TanStack Start frontend app to support Chrome extension sign-in and job application tracking.

**Architecture:** Three `createAPIFileRoute` endpoints under `frontend/src/routes/api/extension/`. Business logic for the track endpoint is extracted to a testable service layer. All routes include CORS headers for `chrome-extension://` origins. Auth uses Supabase's built-in methods; the track endpoint validates JWTs server-side via the service role key.

**Tech Stack:** TanStack Start (`createAPIFileRoute` from `@tanstack/react-start/api`), `@supabase/supabase-js`, vitest

---

## Context

- Design doc: `docs/plans/2026-03-03-extension-backend-design.md`
- Existing Supabase clients in `frontend/src/lib/supabase/` use `@supabase/ssr` with cookie management — not suitable for API routes (extension sends no cookies). We need plain `@supabase/supabase-js` clients.
- `SUPABASE_SERVICE_ROLE_KEY` is already in `frontend/.env.local` (no `VITE_` prefix — server-side only)
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are in `frontend/.env.local`
- Run tests from `frontend/`: `npx pnpm vitest run <path>`
- Start dev server from `frontend/`: `npx pnpm dev`

---

### Task 1: Supabase API client helpers

Two plain Supabase clients for server-side API routes. Different from `createServerSupabaseClient()` (which handles cookies for SSR browser sessions).

**Files:**
- Create: `frontend/src/lib/supabase/api.ts`
- Create: `frontend/src/lib/supabase/__tests__/api.test.ts`

**Step 1: Write the failing tests**

```ts
// frontend/src/lib/supabase/__tests__/api.test.ts
import { describe, expect, it, vi } from "vitest"

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({ isMock: true })),
}))

import { createAnonApiClient, createServiceApiClient } from "../api"

describe("createAnonApiClient", () => {
  it("creates a client", () => {
    expect(createAnonApiClient()).toBeDefined()
  })
})

describe("createServiceApiClient", () => {
  it("creates a client", () => {
    expect(createServiceApiClient()).toBeDefined()
  })
})
```

**Step 2: Run to verify they fail**

```bash
cd frontend && npx pnpm vitest run src/lib/supabase/__tests__/api.test.ts
```

Expected: FAIL — `Cannot find module '../api'`

**Step 3: Implement**

```ts
// frontend/src/lib/supabase/api.ts
import { createClient } from "@supabase/supabase-js"
import type { Database } from "./types"

export function createAnonApiClient() {
  return createClient<Database>(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY,
  )
}

export function createServiceApiClient() {
  return createClient<Database>(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY,
  )
}
```

**Step 4: Run to verify they pass**

```bash
cd frontend && npx pnpm vitest run src/lib/supabase/__tests__/api.test.ts
```

Expected: PASS (2 tests)

**Step 5: Commit**

```bash
git add frontend/src/lib/supabase/api.ts frontend/src/lib/supabase/__tests__/api.test.ts
git commit -m "feat(extension): add API-context Supabase client helpers"
```

---

### Task 2: CORS helper

Shared CORS headers and response factories used by all three extension routes.

**Files:**
- Create: `frontend/src/lib/extension/cors.ts`

**Step 1: Implement**

```ts
// frontend/src/lib/extension/cors.ts
export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

export function corsJson(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: CORS_HEADERS })
}

export function corsOptions(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}
```

**Step 2: Commit**

```bash
git add frontend/src/lib/extension/cors.ts
git commit -m "feat(extension): add CORS helpers for extension API routes"
```

---

### Task 3: Sign-in endpoint

**Files:**
- Create: `frontend/src/routes/api/extension/signin.ts`

**Step 1: Implement**

```ts
// frontend/src/routes/api/extension/signin.ts
import { createAPIFileRoute } from "@tanstack/react-start/api"
import { corsJson, corsOptions } from "@/lib/extension/cors"
import { createAnonApiClient } from "@/lib/supabase/api"

export const APIRoute = createAPIFileRoute("/api/extension/signin")({
  OPTIONS: async () => corsOptions(),

  POST: async ({ request }) => {
    let body: { email?: string; password?: string }
    try {
      body = await request.json()
    } catch {
      return corsJson({ error: "Invalid JSON" }, 400)
    }

    const { email, password } = body
    if (!email || !password) {
      return corsJson({ error: "email and password are required" }, 400)
    }

    const supabase = createAnonApiClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error || !data.session) {
      return corsJson({ error: "Invalid credentials" }, 401)
    }

    return corsJson({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    })
  },
})
```

**Step 2: Manual smoke test**

Start the dev server (`npx pnpm dev` from `frontend/`), then in a separate terminal:

```bash
# Missing fields → 400
curl -X POST http://localhost:3000/api/extension/signin \
  -H "Content-Type: application/json" \
  -d '{}' -i

# Bad credentials → 401
curl -X POST http://localhost:3000/api/extension/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrongpassword"}' -i

# Valid credentials → 200 with tokens
curl -X POST http://localhost:3000/api/extension/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"YOUR_TEST_EMAIL","password":"YOUR_TEST_PASSWORD"}' -i
```

Expected: `200 {"access_token":"eyJ...","refresh_token":"..."}`

**Step 3: Commit**

```bash
git add frontend/src/routes/api/extension/signin.ts
git commit -m "feat(extension): add POST /api/extension/signin endpoint"
```

---

### Task 4: Refresh endpoint

**Files:**
- Create: `frontend/src/routes/api/extension/refresh.ts`

**Step 1: Implement**

```ts
// frontend/src/routes/api/extension/refresh.ts
import { createAPIFileRoute } from "@tanstack/react-start/api"
import { corsJson, corsOptions } from "@/lib/extension/cors"
import { createAnonApiClient } from "@/lib/supabase/api"

export const APIRoute = createAPIFileRoute("/api/extension/refresh")({
  OPTIONS: async () => corsOptions(),

  POST: async ({ request }) => {
    let body: { refresh_token?: string }
    try {
      body = await request.json()
    } catch {
      return corsJson({ error: "Invalid JSON" }, 400)
    }

    const { refresh_token } = body
    if (!refresh_token) {
      return corsJson({ error: "refresh_token is required" }, 400)
    }

    const supabase = createAnonApiClient()
    const { data, error } = await supabase.auth.refreshSession({ refresh_token })

    if (error || !data.session) {
      return corsJson({ error: "Invalid or expired refresh token" }, 401)
    }

    return corsJson({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    })
  },
})
```

**Step 2: Manual smoke test**

Use the `refresh_token` from the signin test above:

```bash
# Valid refresh token → 200 with new tokens
curl -X POST http://localhost:3000/api/extension/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token":"PASTE_REFRESH_TOKEN_HERE"}' -i

# Bad token → 401
curl -X POST http://localhost:3000/api/extension/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token":"badtoken"}' -i
```

Expected: `200 {"access_token":"...","refresh_token":"..."}`

**Step 3: Commit**

```bash
git add frontend/src/routes/api/extension/refresh.ts
git commit -m "feat(extension): add POST /api/extension/refresh endpoint"
```

---

### Task 5: Track service layer

Extracted business logic: find-or-create company, duplicate check, create application. Accepting a `client` parameter makes these unit-testable without a real DB.

**Files:**
- Create: `frontend/src/lib/extension/track-service.ts`
- Create: `frontend/src/lib/extension/__tests__/track-service.test.ts`

**Step 1: Write the failing tests**

```ts
// frontend/src/lib/extension/__tests__/track-service.test.ts
import { describe, expect, it, vi } from "vitest"
import {
  findOrCreateCompany,
  checkRecentDuplicate,
  createApplication,
} from "../track-service"

// Builds a mock Supabase query builder chain.
// `terminal` is the final async call (single / maybeSingle).
function makeChain(resolvedValue: unknown) {
  const terminal = vi.fn().mockResolvedValue(resolvedValue)
  const chain: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    single: terminal,
    maybeSingle: terminal,
  }
  // make all chain methods return chain (for chaining)
  for (const key of ["select", "insert", "eq", "ilike", "gte"]) {
    ;(chain[key] as ReturnType<typeof vi.fn>).mockReturnValue(chain)
  }
  return { chain, terminal }
}

describe("findOrCreateCompany", () => {
  it("returns existing company id when found", async () => {
    const { chain } = makeChain({ data: { id: "comp-1" }, error: null })
    const client = { from: vi.fn().mockReturnValue(chain) } as any

    const result = await findOrCreateCompany(client, "user-1", "Acme Corp")
    expect(result).toBe("comp-1")
    expect(client.from).toHaveBeenCalledWith("companies")
  })

  it("creates and returns new company id when not found", async () => {
    const { chain: selectChain } = makeChain({ data: null, error: null })
    const { chain: insertChain } = makeChain({ data: { id: "comp-new" }, error: null })
    const client = {
      from: vi.fn()
        .mockReturnValueOnce(selectChain)
        .mockReturnValueOnce(insertChain),
    } as any

    const result = await findOrCreateCompany(client, "user-1", "New Corp")
    expect(result).toBe("comp-new")
  })
})

describe("checkRecentDuplicate", () => {
  it("returns application_id when duplicate exists within 24h", async () => {
    const { chain } = makeChain({ data: { id: "app-1" }, error: null })
    const client = { from: vi.fn().mockReturnValue(chain) } as any

    const result = await checkRecentDuplicate(client, "user-1", "comp-1", "Engineer")
    expect(result).toBe("app-1")
  })

  it("returns null when no recent duplicate", async () => {
    const { chain } = makeChain({ data: null, error: null })
    const client = { from: vi.fn().mockReturnValue(chain) } as any

    const result = await checkRecentDuplicate(client, "user-1", "comp-1", "Engineer")
    expect(result).toBeNull()
  })
})

describe("createApplication", () => {
  it("returns new application id", async () => {
    const { chain } = makeChain({ data: { id: "app-new" }, error: null })
    const client = { from: vi.fn().mockReturnValue(chain) } as any

    const result = await createApplication(
      client,
      "user-1",
      "comp-1",
      "Engineer",
      "https://example.com",
    )
    expect(result).toBe("app-new")
  })
})
```

**Step 2: Run to verify they fail**

```bash
cd frontend && npx pnpm vitest run src/lib/extension/__tests__/track-service.test.ts
```

Expected: FAIL — `Cannot find module '../track-service'`

**Step 3: Implement the service**

```ts
// frontend/src/lib/extension/track-service.ts
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/types"

type Client = SupabaseClient<Database>

export async function findOrCreateCompany(
  client: Client,
  userId: string,
  companyName: string,
): Promise<string> {
  const { data } = await client
    .from("companies")
    .select("id")
    .eq("user_id", userId)
    .ilike("name", companyName)
    .maybeSingle()

  if (data?.id) return data.id

  const { data: created, error } = await client
    .from("companies")
    .insert({ user_id: userId, name: companyName })
    .select("id")
    .single()

  if (error || !created?.id) {
    throw new Error(`Failed to create company: ${error?.message}`)
  }
  return created.id
}

export async function checkRecentDuplicate(
  client: Client,
  userId: string,
  companyId: string,
  position: string,
): Promise<string | null> {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { data } = await client
    .from("applications")
    .select("id")
    .eq("user_id", userId)
    .eq("company_id", companyId)
    .eq("position", position)
    .gte("applied_at", cutoff)
    .maybeSingle()

  return data?.id ?? null
}

export async function createApplication(
  client: Client,
  userId: string,
  companyId: string,
  position: string,
  url: string,
): Promise<string> {
  const { data, error } = await client
    .from("applications")
    .insert({
      user_id: userId,
      company_id: companyId,
      position,
      url,
      status: "applied",
      applied_at: new Date().toISOString(),
    })
    .select("id")
    .single()

  if (error || !data?.id) {
    throw new Error(`Failed to create application: ${error?.message}`)
  }
  return data.id
}
```

**Step 4: Run to verify tests pass**

```bash
cd frontend && npx pnpm vitest run src/lib/extension/__tests__/track-service.test.ts
```

Expected: PASS (5 tests across 3 describe blocks)

**Step 5: Commit**

```bash
git add frontend/src/lib/extension/track-service.ts frontend/src/lib/extension/__tests__/track-service.test.ts
git commit -m "feat(extension): add track service layer with tests"
```

---

### Task 6: Track route handler

**Files:**
- Create: `frontend/src/routes/api/extension/track.ts`

**Step 1: Implement**

```ts
// frontend/src/routes/api/extension/track.ts
import { createAPIFileRoute } from "@tanstack/react-start/api"
import { corsJson, corsOptions } from "@/lib/extension/cors"
import { createServiceApiClient } from "@/lib/supabase/api"
import {
  findOrCreateCompany,
  checkRecentDuplicate,
  createApplication,
} from "@/lib/extension/track-service"

export const APIRoute = createAPIFileRoute("/api/extension/track")({
  OPTIONS: async () => corsOptions(),

  POST: async ({ request }) => {
    // Validate Authorization header
    const authHeader = request.headers.get("Authorization")
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null
    if (!token) {
      return corsJson({ error: "Unauthorized" }, 401)
    }

    // Parse body
    let body: { company_name?: string; position?: string; url?: string }
    try {
      body = await request.json()
    } catch {
      return corsJson({ error: "Invalid JSON" }, 400)
    }

    const { company_name, position, url } = body
    if (!company_name || !position || !url) {
      return corsJson({ error: "company_name, position, and url are required" }, 400)
    }

    // Validate JWT
    const client = createServiceApiClient()
    const {
      data: { user },
      error: authError,
    } = await client.auth.getUser(token)

    if (authError || !user) {
      return corsJson({ error: "Unauthorized" }, 401)
    }

    try {
      const companyId = await findOrCreateCompany(client, user.id, company_name)

      const existingId = await checkRecentDuplicate(client, user.id, companyId, position)
      if (existingId) {
        return corsJson(
          { error: "Application already tracked", application_id: existingId },
          409,
        )
      }

      const applicationId = await createApplication(client, user.id, companyId, position, url)
      return corsJson({ application_id: applicationId, company_id: companyId })
    } catch (err) {
      console.error("Track error:", err)
      return corsJson({ error: "Internal server error" }, 500)
    }
  },
})
```

**Step 2: Manual smoke test**

Use the `access_token` from the signin test above:

```bash
# No auth header → 401
curl -X POST http://localhost:3000/api/extension/track \
  -H "Content-Type: application/json" \
  -d '{"company_name":"Acme","position":"Engineer","url":"https://example.com"}' -i

# Missing fields → 400
curl -X POST http://localhost:3000/api/extension/track \
  -H "Authorization: Bearer PASTE_ACCESS_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"company_name":"Acme"}' -i

# Valid request → 200
curl -X POST http://localhost:3000/api/extension/track \
  -H "Authorization: Bearer PASTE_ACCESS_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"company_name":"Acme Corp","position":"Senior Engineer","url":"https://jobs.acme.com/123"}' -i

# Same request again within 24h → 409
curl -X POST http://localhost:3000/api/extension/track \
  -H "Authorization: Bearer PASTE_ACCESS_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"company_name":"Acme Corp","position":"Senior Engineer","url":"https://jobs.acme.com/123"}' -i
```

Check Supabase Studio at `http://127.0.0.1:54323` → Table Editor → companies and applications to verify records were created.

**Step 3: Commit**

```bash
git add frontend/src/routes/api/extension/track.ts
git commit -m "feat(extension): add POST /api/extension/track endpoint"
```

---

### Task 7: Full test suite

**Step 1: Run all frontend tests**

```bash
cd frontend && npx pnpm vitest run
```

Expected: All tests pass — existing suite plus the 5 new track-service tests.

**Step 2: If any test fails**

Fix the failure before proceeding. Do not skip or silence tests.
