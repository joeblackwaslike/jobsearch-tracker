# OpenAPI + Scalar UI Design

## Overview

Add automatic OpenAPI 3.1 spec generation and Scalar UI to the extension API, enabling easy testing via Postman, browser, or any OpenAPI-compatible tool.

## Architecture

**Approach:** Zod-to-OpenAPI (`@asteasolutions/zod-to-openapi`) generates the spec from the same Zod schemas used for request validation. Scalar UI is served via CDN from a simple HTML response.

**New files:**
- `src/lib/openapi/schemas.ts` — Zod schemas with `.openapi()` metadata
- `src/lib/openapi/spec.ts` — OpenAPI 3.1 document builder
- `src/routes/api/openapi.ts` — `GET /api/openapi.json`
- `src/routes/api/docs.ts` — `GET /api/docs` (Scalar HTML)
- `tests/e2e/openapi.test.ts` — e2e tests for both endpoints

**Updated files:**
- `src/routes/api/extension/signin.ts` — add Zod validation using shared schemas
- `src/routes/api/extension/refresh.ts` — add Zod validation using shared schemas
- `src/routes/api/extension/track.ts` — add Zod validation using shared schemas

**New dependency:** `@asteasolutions/zod-to-openapi`

**Risk:** Zod v4 compatibility — `@asteasolutions/zod-to-openapi` v7+ supports Zod v3; v4 support may require `@zod-to-openapi/zod-to-openapi@next` or a manual workaround. Check version compatibility during implementation and fall back to a hand-written spec object if needed.

## Schemas (`src/lib/openapi/schemas.ts`)

All schemas registered with `extendZodWithOpenApi(z)`. Each registered with `.openapi({ refId: "..." })`.

| Schema | Fields |
|--------|--------|
| `SigninRequest` | `email: string`, `password: string` |
| `SigninResponse` | `access_token: string`, `refresh_token: string` |
| `RefreshRequest` | `refresh_token: string` |
| `RefreshResponse` | `access_token: string`, `refresh_token: string` |
| `TrackRequest` | `company_name: string`, `position: string`, `url: string` |
| `TrackResponse` | `application_id: string`, `company_id: string` |
| `ErrorResponse` | `error: string` |
| `DuplicateResponse` | `error: string`, `application_id: string` |

## Spec (`src/lib/openapi/spec.ts`)

Builds the OpenAPI 3.1 document using `OpenApiGeneratorV31`:

```
openapi: 3.1.0
info:
  title: Job Search Tracker Extension API
  version: 1.0.0
  description: API for the browser extension to track job applications
servers:
  - url: /api
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
paths:
  /extension/signin:   POST (200 SigninResponse, 400/401 ErrorResponse)
  /extension/refresh:  POST (200 RefreshResponse, 400/401 ErrorResponse)
  /extension/track:    POST + OPTIONS (200 TrackResponse, 400/401/409 DuplicateResponse/ErrorResponse)
```

The spec is generated once and cached as a module-level constant.

## Route Handlers

**`GET /api/openapi.json`** (`src/routes/api/openapi.ts`):
- Returns `Response` with `Content-Type: application/json`
- Serves the cached spec object as JSON

**`GET /api/docs`** (`src/routes/api/docs.ts`):
- Returns `Response` with `Content-Type: text/html`
- Returns minimal HTML that loads Scalar from CDN:
  ```html
  <!doctype html>
  <html>
    <head><title>Extension API Docs</title></head>
    <body>
      <script id="api-reference" data-url="/api/openapi.json"></script>
      <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
    </body>
  </html>
  ```

## Request Validation in Route Handlers

Each existing extension route gains Zod parse at the top of the POST handler:

```ts
const result = SigninRequest.safeParse(body)
if (!result.success) {
  return corsJson({ error: result.error.issues[0].message }, 400)
}
const { email, password } = result.data
```

This replaces the manual field checks and keeps validation consistent with the schema definitions.

## E2E Tests (`tests/e2e/openapi.test.ts`)

Uses Playwright's `request` fixture (no browser needed — pure HTTP):

```ts
test("GET /api/openapi.json returns valid spec", async ({ request }) => {
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
})
```

## Out of Scope

- Authentication on the `/api/docs` endpoint (public read-only)
- Versioning the spec URL
- Generating TypeScript client SDKs
