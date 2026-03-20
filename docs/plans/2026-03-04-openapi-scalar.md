# OpenAPI + Scalar UI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add `/api/openapi.json` (OpenAPI 3.1 spec) and `/api/docs` (Scalar browser UI) to the extension API, plus Zod validation in the route handlers.

**Architecture:** Zod schemas in `src/lib/openapi/schemas.ts` serve double duty: request validation in route handlers AND as the source of truth for the hand-written OpenAPI spec in `src/lib/openapi/spec.ts`. The spec is a plain JS object — no codegen library — because the project uses Zod v4 and `@asteasolutions/zod-to-openapi` only supports Zod v3. Two new TanStack Start routes serve the spec and Scalar CDN HTML.

**Tech Stack:** TanStack Start (server handlers), Zod v4, Playwright (e2e tests)

---

## Context: How Routes Work Here

All API routes live in `frontend/src/routes/api/`. Each file exports a `Route` created with `createFileRoute` from `@tanstack/react-router`. Server-side handlers go in the `server.handlers` object:

```ts
export const Route = createFileRoute("/api/some-path")({
  server: {
    handlers: {
      GET: async ({ request }) => new Response(JSON.stringify({ ok: true }), {
        headers: { "Content-Type": "application/json" }
      }),
    },
  },
})
```

TanStack Router's vite plugin auto-discovers these files and adds them to `routeTree.gen.ts` — **you don't touch that file manually**.

All commands run from `frontend/`. Use `npx pnpm <cmd>` since pnpm is not in PATH.

---

## Task 1: Write Failing E2E Tests

**Files:**
- Create: `frontend/tests/e2e/openapi.test.ts`

These tests define success for the whole feature. Run them now so you see them fail.

**Step 1: Create the test file**

```ts
// frontend/tests/e2e/openapi.test.ts
import { expect, test } from "@playwright/test"

test("GET /api/openapi.json returns valid OpenAPI 3.1 spec", async ({ request }) => {
  const res = await request.get("/api/openapi.json")
  expect(res.status()).toBe(200)
  expect(res.headers()["content-type"]).toContain("application/json")

  const spec = await res.json()
  expect(spec.openapi).toMatch(/^3\.1\./)
  expect(spec.info.title).toBe("Job Search Tracker Extension API")
  expect(spec.paths["/extension/signin"]).toBeDefined()
  expect(spec.paths["/extension/refresh"]).toBeDefined()
  expect(spec.paths["/extension/track"]).toBeDefined()
})

test("GET /api/docs returns Scalar HTML", async ({ request }) => {
  const res = await request.get("/api/docs")
  expect(res.status()).toBe(200)
  expect(res.headers()["content-type"]).toContain("text/html")

  const html = await res.text()
  expect(html).toContain("@scalar/api-reference")
  expect(html).toContain("/api/openapi.json")
})
```

**Step 2: Run to confirm failure**

```bash
cd frontend && npx pnpm test:e2e --grep "openapi"
```

Expected: both tests FAIL (404 or similar — the routes don't exist yet).

---

## Task 2: Create Zod Schemas

**Files:**
- Create: `frontend/src/lib/openapi/schemas.ts`

These schemas do two things: (1) validate incoming requests in route handlers, (2) serve as the source of truth for the OpenAPI spec object in Task 3.

**Step 1: Create the schemas file**

```ts
// frontend/src/lib/openapi/schemas.ts
import { z } from "zod"

export const SigninRequest = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const SigninResponse = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
})

export const RefreshRequest = z.object({
  refresh_token: z.string().min(1),
})

export const RefreshResponse = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
})

export const TrackRequest = z.object({
  company_name: z.string().min(1),
  position: z.string().min(1),
  url: z.string().url(),
})

export const TrackResponse = z.object({
  application_id: z.string().uuid(),
  company_id: z.string().uuid(),
})

export const ErrorResponse = z.object({
  error: z.string(),
})

export const DuplicateResponse = z.object({
  error: z.string(),
  application_id: z.string().uuid(),
})
```

**Step 2: Verify the file type-checks**

```bash
cd frontend && npx pnpm type
```

Expected: no errors from the new file.

---

## Task 3: Create the OpenAPI Spec Object

**Files:**
- Create: `frontend/src/lib/openapi/spec.ts`

This is a plain JS object — no codegen library — to avoid Zod v4 compatibility issues with `@asteasolutions/zod-to-openapi`. The object is computed once at module load and cached.

**Step 1: Create the spec file**

```ts
// frontend/src/lib/openapi/spec.ts

const errorSchema = {
  type: "object",
  required: ["error"],
  properties: { error: { type: "string" } },
}

const tokenPairSchema = {
  type: "object",
  required: ["access_token", "refresh_token"],
  properties: {
    access_token: { type: "string" },
    refresh_token: { type: "string" },
  },
}

export const openApiSpec = {
  openapi: "3.1.0",
  info: {
    title: "Job Search Tracker Extension API",
    version: "1.0.0",
    description: "API consumed by the Job Search Tracker browser extension.",
  },
  servers: [{ url: "/api" }],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer" },
    },
    schemas: {
      ErrorResponse: errorSchema,
      DuplicateResponse: {
        type: "object",
        required: ["error", "application_id"],
        properties: {
          error: { type: "string" },
          application_id: { type: "string", format: "uuid" },
        },
      },
      SigninRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 1 },
        },
      },
      SigninResponse: tokenPairSchema,
      RefreshRequest: {
        type: "object",
        required: ["refresh_token"],
        properties: { refresh_token: { type: "string", minLength: 1 } },
      },
      RefreshResponse: tokenPairSchema,
      TrackRequest: {
        type: "object",
        required: ["company_name", "position", "url"],
        properties: {
          company_name: { type: "string", minLength: 1 },
          position: { type: "string", minLength: 1 },
          url: { type: "string", format: "uri" },
        },
      },
      TrackResponse: {
        type: "object",
        required: ["application_id", "company_id"],
        properties: {
          application_id: { type: "string", format: "uuid" },
          company_id: { type: "string", format: "uuid" },
        },
      },
    },
  },
  paths: {
    "/extension/signin": {
      post: {
        operationId: "signinExtension",
        summary: "Sign in with email and password",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SigninRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Authentication tokens",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SigninResponse" },
              },
            },
          },
          "400": {
            description: "Missing required fields",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "401": {
            description: "Invalid credentials",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/extension/refresh": {
      post: {
        operationId: "refreshExtension",
        summary: "Refresh access token using a refresh token",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RefreshRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "New authentication tokens",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RefreshResponse" },
              },
            },
          },
          "400": {
            description: "Missing refresh_token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "401": {
            description: "Invalid or expired refresh token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/extension/track": {
      post: {
        operationId: "trackApplication",
        summary: "Track a job application",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/TrackRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Application tracked successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/TrackResponse" },
              },
            },
          },
          "400": {
            description: "Missing required fields",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "401": {
            description: "Missing or invalid Bearer token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "409": {
            description: "Application already tracked within 24 hours",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/DuplicateResponse" },
              },
            },
          },
        },
      },
    },
  },
} as const
```

**Step 2: Verify it type-checks**

```bash
cd frontend && npx pnpm type
```

Expected: no errors.

---

## Task 4: Create GET /api/openapi.json Route

**Files:**
- Create: `frontend/src/routes/api/openapi.ts`

After saving this file, the TanStack Router vite plugin automatically regenerates `routeTree.gen.ts` — you'll see it update when the dev server is running.

**Step 1: Create the route**

```ts
// frontend/src/routes/api/openapi.ts
import { createFileRoute } from "@tanstack/react-router"
import { openApiSpec } from "@/lib/openapi/spec"

export const Route = createFileRoute("/api/openapi")({
  server: {
    handlers: {
      GET: async () =>
        new Response(JSON.stringify(openApiSpec), {
          headers: { "Content-Type": "application/json" },
        }),
    },
  },
})
```

**Step 2: Start dev server and curl to verify**

```bash
# In one terminal:
cd frontend && npx pnpm dev

# In another:
curl -s http://localhost:3000/api/openapi.json | head -c 200
```

Expected: JSON starting with `{"openapi":"3.1.0","info":{"title":"Job Search Tracker Extension API"...`

---

## Task 5: Create GET /api/docs Route

**Files:**
- Create: `frontend/src/routes/api/docs.ts`

**Step 1: Create the route**

```ts
// frontend/src/routes/api/docs.ts
import { createFileRoute } from "@tanstack/react-router"

const HTML = `<!doctype html>
<html>
  <head>
    <title>Extension API Docs</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <script id="api-reference" data-url="/api/openapi.json"></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>`

export const Route = createFileRoute("/api/docs")({
  server: {
    handlers: {
      GET: async () =>
        new Response(HTML, {
          headers: { "Content-Type": "text/html" },
        }),
    },
  },
})
```

**Step 2: Verify in browser**

Open `http://localhost:3000/api/docs` in the browser. You should see the Scalar UI with three endpoints listed (signin, refresh, track).

---

## Task 6: Run E2E Tests

With the dev server running (or letting Playwright start it), run the e2e tests:

```bash
cd frontend && npx pnpm test:e2e --grep "openapi"
```

Expected: both tests PASS.

If either test fails, common issues:
- **Route not discovered**: Check that `routeTree.gen.ts` includes `/api/openapi` and `/api/docs`. If not, restart the dev server.
- **Content-type mismatch**: Playwright may check `content-type: application/json; charset=utf-8` — the `toContain` matcher handles this.
- **Scalar CDN blocked**: The Playwright e2e config uses `baseURL: http://localhost:3000` — the test uses `request` (not a browser page), so CDN loading isn't tested, only the HTML content.

---

## Task 7: Update Route Handlers to Use Zod Validation

**Files:**
- Modify: `frontend/src/routes/api/extension/signin.ts`
- Modify: `frontend/src/routes/api/extension/refresh.ts`
- Modify: `frontend/src/routes/api/extension/track.ts`

Replace the manual `if (!email || !password)` checks with `Schema.safeParse()`. This ensures validation behavior stays in sync with the schema definitions.

**Step 1: Update signin.ts**

Replace the body parsing + manual validation block. Full file after change:

```ts
import { createFileRoute } from "@tanstack/react-router"
import { corsJson, corsOptions } from "@/lib/extension/cors"
import { createAnonApiClient } from "@/lib/supabase/api"
import { SigninRequest } from "@/lib/openapi/schemas"

export const Route = createFileRoute("/api/extension/signin")({
  server: {
    handlers: {
      OPTIONS: async () => corsOptions(),

      POST: async ({ request }) => {
        let body: unknown
        try {
          body = await request.json()
        } catch {
          return corsJson({ error: "Invalid JSON" }, 400)
        }

        const result = SigninRequest.safeParse(body)
        if (!result.success) {
          return corsJson({ error: result.error.issues[0]?.message ?? "Invalid request" }, 400)
        }
        const { email, password } = result.data

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
    },
  },
})
```

**Step 2: Update refresh.ts**

```ts
import { createFileRoute } from "@tanstack/react-router"
import { corsJson, corsOptions } from "@/lib/extension/cors"
import { createAnonApiClient } from "@/lib/supabase/api"
import { RefreshRequest } from "@/lib/openapi/schemas"

export const Route = createFileRoute("/api/extension/refresh")({
  server: {
    handlers: {
      OPTIONS: async () => corsOptions(),

      POST: async ({ request }) => {
        let body: unknown
        try {
          body = await request.json()
        } catch {
          return corsJson({ error: "Invalid JSON" }, 400)
        }

        const result = RefreshRequest.safeParse(body)
        if (!result.success) {
          return corsJson({ error: result.error.issues[0]?.message ?? "Invalid request" }, 400)
        }
        const { refresh_token } = result.data

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
    },
  },
})
```

**Step 3: Update track.ts**

```ts
import { createFileRoute } from "@tanstack/react-router"
import { corsJson, corsOptions } from "@/lib/extension/cors"
import { createServiceApiClient } from "@/lib/supabase/api"
import {
  findOrCreateCompany,
  checkRecentDuplicate,
  createApplication,
} from "@/lib/extension/track-service"
import { TrackRequest } from "@/lib/openapi/schemas"

export const Route = createFileRoute("/api/extension/track")({
  server: {
    handlers: {
      OPTIONS: async () => corsOptions(),

      POST: async ({ request }) => {
        const authHeader = request.headers.get("Authorization")
        const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null
        if (!token) {
          return corsJson({ error: "Unauthorized" }, 401)
        }

        let body: unknown
        try {
          body = await request.json()
        } catch {
          return corsJson({ error: "Invalid JSON" }, 400)
        }

        const result = TrackRequest.safeParse(body)
        if (!result.success) {
          return corsJson({ error: result.error.issues[0]?.message ?? "Invalid request" }, 400)
        }
        const { company_name, position, url } = result.data

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
    },
  },
})
```

**Step 4: Run unit tests to confirm nothing broke**

```bash
cd frontend && npx pnpm test
```

Expected: all unit tests PASS (the track-service tests don't test the route handler directly, so they're unaffected).

**Step 5: Run e2e tests again**

```bash
cd frontend && npx pnpm test:e2e --grep "openapi"
```

Expected: still PASS.

---

## Task 8: Commit

```bash
cd frontend && npx pnpm lint
```

Expected: no lint errors. If Biome complains about anything, fix it before committing.

```bash
git add \
  frontend/src/lib/openapi/schemas.ts \
  frontend/src/lib/openapi/spec.ts \
  frontend/src/routes/api/openapi.ts \
  frontend/src/routes/api/docs.ts \
  frontend/src/routes/api/extension/signin.ts \
  frontend/src/routes/api/extension/refresh.ts \
  frontend/src/routes/api/extension/track.ts \
  frontend/tests/e2e/openapi.test.ts \
  frontend/src/routeTree.gen.ts
git commit -m "feat(extension): add OpenAPI spec, Scalar UI, and Zod validation"
```

---

## Verification Checklist

- [ ] `GET /api/openapi.json` returns JSON with `openapi: "3.1.0"` and all three paths
- [ ] `GET /api/docs` returns HTML containing `@scalar/api-reference` and `/api/openapi.json`
- [ ] `npx pnpm test` passes (unit tests)
- [ ] `npx pnpm test:e2e --grep "openapi"` passes (e2e tests)
- [ ] Scalar UI loads in browser at `http://localhost:3000/api/docs`
- [ ] `npx pnpm type` passes (no TypeScript errors)
