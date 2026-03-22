# Deployment Guide

This document covers deploying the Job Search Tracker to production. The system has three independently deployed components:

```text
Browser Extension (Chrome Web Store)
        │
        │  POST /api/extension/{signin,refresh,track}
        ▼
Frontend App (Vercel) ──── Supabase (hosted)
  TanStack Start SSR            PostgreSQL + Auth + Realtime
```

---

## Prerequisites

| Requirement | Notes |
|---|---|
| Vercel account | Free tier sufficient; connect to GitHub |
| Supabase account | Free tier sufficient for personal use |
| Chrome Web Store developer account | One-time $5 registration fee |
| GitHub repository admin access | Required to configure Actions secrets |
| `supabase` CLI | `brew install supabase/tap/supabase` |
| `pnpm` 10.20.0 | `npm install -g pnpm@10.20.0` |

---

## 1. Supabase (Production)

### Create project

1. Go to [app.supabase.com](https://app.supabase.com) → **New project**
2. Choose a region close to your users
3. Note the following from **Project Settings → API**:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon / public key** → `VITE_SUPABASE_ANON_KEY`
   - **service_role / secret key** → `SUPABASE_SERVICE_ROLE_KEY`

### Run migrations

From the repo root, link to your Supabase project and push all 17 migrations:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

### Enable Realtime

In the Supabase dashboard, go to **Database → Replication** and enable Realtime for these tables:

- `applications`
- `companies`
- `contacts`
- `events`
- `documents`

### Configure Google OAuth

1. **Supabase dashboard** → Authentication → Providers → Google → Enable
2. Fill in **Client ID** and **Client Secret** from Google Cloud Console
3. Copy the **Callback URL** shown in Supabase (e.g. `https://<ref>.supabase.co/auth/v1/callback`)
4. Add that callback URL to your Google OAuth app's **Authorized redirect URIs**

After deploying the frontend (see below), also add your Vercel URL to **Authentication → URL Configuration → Redirect URLs**:

```text
https://<your-app>.vercel.app/**
```

### Edge Function secrets (optional integrations)

If using the job-fetch Edge Function or email notifications:

```bash
supabase secrets set BROWSERLESS_API_KEY=<key>
supabase secrets set RESEND_API_KEY=<key>
```

---

## 2. Frontend Deployment (Vercel)

### Connect repo to Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import the GitHub repository
3. Set **Root Directory** to `frontend`
4. Vercel will read `frontend/vercel.json` automatically:

```json
{
  "buildCommand": "pnpm build",
  "outputDirectory": "dist",
  "installCommand": "pnpm install",
  "framework": null
}
```

### Configure environment variables

In Vercel → Project → **Settings → Environment Variables**, add:

| Variable | Value | Scope |
|---|---|---|
| `VITE_SUPABASE_URL` | `https://<ref>.supabase.co` | Production, Preview |
| `VITE_SUPABASE_ANON_KEY` | `<anon key>` | Production, Preview |
| `SUPABASE_SERVICE_ROLE_KEY` | `<service_role key>` | Production, Preview |
| `GOOGLE_CLIENT_ID` | `<client id>` | Production, Preview |
| `GOOGLE_CLIENT_SECRET` | `<client secret>` | Production, Preview |
| `GOOGLE_OAUTH_CALLBACK_URL` | `https://<your-app>.vercel.app/api/auth/callback` | Production |

> `SUPABASE_SERVICE_ROLE_KEY` is used server-side only. It is never sent to the browser.

### Deploy

Trigger a deploy after setting env vars:

```bash
# Via Vercel CLI
npx vercel --prod

# Or just push to main — Vercel auto-deploys on every push to main
git push origin main
```

### Finish Google OAuth setup

Update `GOOGLE_OAUTH_CALLBACK_URL` to your final Vercel domain once assigned (e.g. `https://jobsearch-tracker.vercel.app/api/auth/callback`), then redeploy.

---

## 3. Extension Deployment (Chrome Web Store)

### Point extension at production backend

The extension stores the backend URL in Chrome storage. Users set this once via the extension popup → **Settings** → **Backend URL**. The value should be your Vercel deployment URL:

```text
https://<your-app>.vercel.app
```

### Build

From the repo root:

```bash
pnpm --filter extension build        # outputs to extension/dist/
pnpm --filter extension build:zip    # outputs extension/extension.zip
```

### Upload to Chrome Web Store

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. **Add new item** → upload `extension/extension.zip`
3. Fill in the store listing (description, screenshots, privacy policy URL)
4. Submit for review (typically 1–3 business days)

### Sideloading (staging / beta testing)

To test a production-targeted build without going through the Web Store:

1. Build: `pnpm --filter extension build`
2. In Chrome, go to `chrome://extensions`
3. Enable **Developer mode** (top right)
4. Click **Load unpacked** → select `extension/dist/`

---

## 4. CI/CD Pipeline (GitHub Actions)

The workflow at [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) runs on every push and pull request to `main`.

### Job graph

```text
┌────────────────┐  ┌──────────────────┐  ┌────────────┐  ┌──────────────┐
│ markdown-lint  │  │  lint (Biome)    │  │ type-check │  │ unit tests   │
└───────┬────────┘  └────────┬─────────┘  └─────┬──────┘  └──────┬───────┘
        │                    │                   │                 │
        └────────────────────┴───────────────────┴────────────────┘
                                        │
                                        ▼
                                  ┌───────────┐     ┌──────────────────────┐
                                  │ E2E tests │     │ dependency-review     │
                                  │ (Chromium)│     │ (PRs only)           │
                                  └───────────┘     └──────────────────────┘

build job runs in parallel with all above (not a gate for E2E)
```

- All jobs except E2E run in parallel
- E2E requires all four quality gates to pass first
- Concurrent runs on the same ref are cancelled automatically

### GitHub Actions secrets

The `build` job uses placeholder Supabase values (build does not contact Supabase). No secrets are required in GitHub Actions for the current CI setup.

If you add a staging Supabase instance for E2E in CI, add these under **Repository Settings → Secrets and variables → Actions**:

| Secret | Used by |
|---|---|
| `VITE_SUPABASE_URL` | E2E job |
| `VITE_SUPABASE_ANON_KEY` | E2E job |

Vercel deployment is triggered automatically by the GitHub integration on merge to `main` — no separate deploy step needed in CI.

---

## 5. Extension ↔ Frontend API Reference

The extension communicates with the frontend via three server-side API routes. All routes allow CORS from any origin (`Access-Control-Allow-Origin: *`) so the extension can call them regardless of the current tab's origin.

### `POST /api/extension/signin`

Exchange email/password for JWT tokens.

```http
POST /api/extension/signin
Content-Type: application/json

{ "email": "user@example.com", "password": "..." }
```

**Response:**

```json
{ "ok": true, "access_token": "...", "refresh_token": "..." }
{ "ok": false, "error": "Invalid credentials" }
```

### `POST /api/extension/refresh`

Rotate an expired access token using a refresh token.

```http
POST /api/extension/refresh
Content-Type: application/json

{ "refresh_token": "..." }
```

**Response:**

```json
{ "ok": true, "access_token": "...", "refresh_token": "..." }
{ "ok": false, "error": "session_expired" }
```

### `POST /api/extension/track`

Log a job application. Requires a valid JWT in the Authorization header.

```http
POST /api/extension/track
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "company_name": "Acme Corp",
  "position": "Senior Engineer",
  "url": "https://jobs.example.com/sr-eng",
  "source": "linkedin"
}
```

**Response:**

```json
{ "ok": true, "application_id": "uuid", "company_id": "uuid" }
{ "ok": false, "error": "duplicate", "application_id": "uuid" }  // 409
{ "ok": false, "error": "Unauthorized" }                          // 401
```

Duplicate detection looks back 24 hours for the same position at the same company for the authenticated user.

---

## 6. Post-Deployment Verification

After deploying, verify the system end-to-end:

### Frontend

- [ ] Visit `https://<your-app>.vercel.app` → page loads without errors
- [ ] Sign in with email/password
- [ ] Sign in with Google OAuth
- [ ] Applications table loads and is editable

### Extension

- [ ] Install the extension (Web Store or sideloaded)
- [ ] Open popup → Settings → set Backend URL to your Vercel domain
- [ ] Sign in via the extension popup
- [ ] Navigate to a supported job board (e.g. LinkedIn, Greenhouse, Lever)
- [ ] Click the extension icon → track a job
- [ ] Confirm the application appears in the frontend app

### Realtime sync

- [ ] Open the frontend app in two browser tabs
- [ ] Track a job from the extension
- [ ] The new application row should appear in both tabs without a page refresh
