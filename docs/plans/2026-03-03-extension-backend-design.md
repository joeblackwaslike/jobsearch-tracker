# Chrome Extension Backend API Design

**Date:** 2026-03-03
**Scope:** Backend API endpoints to support a Chrome extension that tracks job applications

## Overview

Build three HTTP API endpoints inside the TanStack Start frontend app. The extension user enters the app's frontend URL as the "backend URL". All endpoints live at `/api/extension/*` and are server-side only (no client bundle impact).

The extension is out of scope for this iteration — only the backend API is being built.

## Architecture

Three API routes under `frontend/src/routes/api/extension/` using TanStack Start's `createAPIFileRoute`.

The extension stores `{ access_token, refresh_token }` in `chrome.storage.local`. Token refresh is reactive: the extension calls `/track`, and if it receives a 401, it calls `/refresh` to get a new access token, then retries. No proactive expiry checking.

All routes include CORS headers (`Access-Control-Allow-Origin: *`) since `chrome-extension://` origins need to be allowed and the endpoints are already authenticated. Preflight `OPTIONS` handling is required on `/track` due to the custom `Authorization` header.

No new npm packages needed — `@supabase/supabase-js` is already installed.

## Endpoints

### `POST /api/extension/signin`

Authenticates the user and returns tokens for storage in the extension.

**Request body:**
```json
{ "email": "user@example.com", "password": "hunter2" }
```

**Response 200:**
```json
{ "access_token": "eyJ...", "refresh_token": "abc..." }
```

**Response 401:**
```json
{ "error": "Invalid credentials" }
```

**Implementation:** Calls Supabase `auth.signInWithPassword({ email, password })` using the anon client (not service role — we want Supabase to enforce auth).

---

### `POST /api/extension/refresh`

Exchanges a refresh token for a new access token + new refresh token.

**Request body:**
```json
{ "refresh_token": "abc..." }
```

**Response 200:**
```json
{ "access_token": "eyJ...", "refresh_token": "xyz..." }
```

**Response 401:**
```json
{ "error": "Invalid or expired refresh token" }
```

**Implementation:** Calls Supabase `auth.refreshSession({ refresh_token })`.

---

### `POST /api/extension/track`

Creates a job application record. Finds or creates the company by name. Deduplicates within a 24-hour window.

**Request header:** `Authorization: Bearer <access_token>`

**Request body:**
```json
{ "company_name": "Acme Corp", "position": "Senior Engineer", "url": "https://..." }
```

**Response 200:**
```json
{ "application_id": "uuid", "company_id": "uuid" }
```

**Response 401:** Token expired or invalid — extension should call `/refresh` then retry.
```json
{ "error": "Unauthorized" }
```

**Response 409:** Duplicate within 24 hours (same company + position for this user).
```json
{ "error": "Application already tracked", "application_id": "uuid" }
```

**Response 400:** Missing required fields.
```json
{ "error": "company_name, position, and url are required" }
```

**Implementation logic:**

1. Extract `Bearer` token from `Authorization` header
2. Call `supabase.auth.getUser(token)` with service-role client to validate → get `user_id`
3. Look up `companies` where `user_id = auth_user_id AND name = company_name` (case-insensitive)
4. If not found, insert new company row with just `name` set; all other fields default
5. Check for duplicate: `applications` where `company_id = X AND position = Y AND user_id = Z AND applied_at >= now() - interval '24 hours'`
6. If duplicate found → return 409 with existing `application_id`
7. Insert application: `{ user_id, company_id, position, url, status: 'applied', applied_at: now() }`
8. Return `{ application_id, company_id }`

## File Layout

```
frontend/src/routes/api/
  extension/
    signin.ts      ← POST /api/extension/signin
    refresh.ts     ← POST /api/extension/refresh
    track.ts       ← POST /api/extension/track
```

Each file exports an `APIRoute` using `createAPIFileRoute` from `@tanstack/react-start/api`, with `OPTIONS` and `POST` handlers.

## CORS Headers

Applied to every response (including OPTIONS):

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

## Supabase Client Usage

- **signin / refresh:** Use the standard anon Supabase client — Supabase enforces auth natively
- **track:** Use service-role client to validate the JWT via `auth.getUser(token)`, then query/insert using service role (bypasses RLS since we already validated the user ourselves and set `user_id` explicitly)
