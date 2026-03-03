# Google OAuth Sign-In Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable Google OAuth sign-in by wiring credentials into the local Supabase configuration.

**Architecture:** The login page already has a working "Continue with Google" button that calls `supabase.auth.signInWithOAuth`. The only missing pieces are Supabase config entries and the credential file the Supabase CLI reads at startup.

**Tech Stack:** Supabase CLI, `supabase/config.toml` (TOML), `supabase/.env` (shell env file)

---

## Context

- **Frontend:** Complete — `src/routes/login.tsx:37-45` calls `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: '${window.location.origin}/dashboard' } })`
- **Gap:** `supabase/config.toml` has no `[auth.external.google]` section; Supabase local doesn't know to handle Google OAuth
- **Credentials source:** `frontend/.env.local` already has `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- **Root `.gitignore`** already covers `supabase/.env` via the `.env` pattern — no `.gitignore` change needed

---

### Task 1: Add Google provider to `supabase/config.toml`

**Files:**
- Modify: `supabase/config.toml:152` (additional_redirect_urls)
- Modify: `supabase/config.toml:315` (after `[auth.external.apple]` block ends)

**Step 1: Update `additional_redirect_urls` on line 152**

Change:
```toml
additional_redirect_urls = ["https://127.0.0.1:3000"]
```

To:
```toml
additional_redirect_urls = ["https://127.0.0.1:3000", "http://localhost:3000", "http://127.0.0.1:3000"]
```

**Step 2: Add Google provider block after line 315**

Append after the closing line of `[auth.external.apple]` (after `email_optional = false`):

```toml
[auth.external.google]
enabled = true
client_id = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT)"
secret = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET)"
redirect_uri = ""
skip_nonce_check = true
```

> `skip_nonce_check = true` is required for local development with Google auth (the config.toml comment on line 311 notes this explicitly).

**Step 3: Commit**

```bash
git add supabase/config.toml
git commit -m "feat(auth): add Google OAuth provider to Supabase local config"
```

---

### Task 2: Create `supabase/.env` with Google credentials

**Files:**
- Create: `supabase/.env`

**Step 1: Create the file**

Create `supabase/.env` with:

```
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT=<value of GOOGLE_CLIENT_ID from frontend/.env.local>
SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=<value of GOOGLE_CLIENT_SECRET from frontend/.env.local>
```

Copy the actual values from `frontend/.env.local`. Do NOT commit this file — it is already covered by `.env` in the root `.gitignore`.

**Step 2: Verify it is gitignored**

```bash
git check-ignore -v supabase/.env
```

Expected output: something like `.gitignore:N:.env  supabase/.env`

If the file is NOT ignored, stop and add `supabase/.env` to the root `.gitignore` before continuing.

---

### Task 3: Restart local Supabase and verify

**Step 1: Stop and start Supabase**

```bash
npx supabase stop && npx supabase start
```

Watch startup output for any errors loading env vars. Expected: clean start with no errors.

**Step 2: Check auth config via Supabase Studio**

Open `http://127.0.0.1:54323` (Supabase Studio local). Navigate to Authentication → Providers. Google should appear as enabled.

**Step 3: Smoke-test the Google button**

1. Open the app at `http://localhost:3000/login`
2. Click "Continue with Google"
3. Expected: browser redirects to Google's OAuth consent screen
4. Complete the OAuth flow with a Google account
5. Expected: redirected back to `http://localhost:3000/dashboard` and logged in

> If the OAuth flow errors with "redirect_uri_mismatch", the local callback URL is not registered in Google Cloud Console — see the manual step below.

---

### Task 4: (Manual) Register local callback URL in Google Cloud Console

This is a manual step that cannot be scripted. It must be done once in the browser.

**Step 1:** Go to [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials

**Step 2:** Find the OAuth 2.0 Client ID being used (matching `GOOGLE_CLIENT_ID` from `frontend/.env.local`)

**Step 3:** Under "Authorized redirect URIs", add:

```
http://127.0.0.1:54321/auth/v1/callback
```

**Step 4:** Save. Changes take a few minutes to propagate.

**Step 5:** Retry the smoke-test from Task 3, Step 3.

---

### Task 5: (Manual) Enable Google in production Supabase dashboard

This applies to the production Supabase project (`flcasuohzogtwxsqhett.supabase.co`).

**Step 1:** Open the Supabase dashboard for the production project

**Step 2:** Navigate to Authentication → Providers → Google

**Step 3:** Toggle "Enable sign in with Google"

**Step 4:** Paste in:
- Client ID: the value of `GOOGLE_CLIENT_ID` from `frontend/.env.local`
- Client Secret: the value of `GOOGLE_CLIENT_SECRET` from `frontend/.env.local`

**Step 5:** Save

**Step 6:** Verify the authorized redirect URI in Google Cloud Console also includes:
```
https://flcasuohzogtwxsqhett.supabase.co/auth/v1/callback
```
(This should already be present since `GOOGLE_OAUTH_CALLBACK_URL` in `frontend/.env.local` points to this URL.)

**Step 7:** Smoke-test by clicking "Continue with Google" on the production app URL.
