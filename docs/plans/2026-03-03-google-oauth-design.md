# Google OAuth Sign-In Design

**Date:** 2026-03-03
**Scope:** Enable Google OAuth sign-in for both local development and production

## Status

The frontend is already complete. The "Continue with Google" button on the login page calls `supabase.auth.signInWithOAuth({ provider: 'google' })` with `redirectTo: ${window.location.origin}/dashboard`. No frontend changes are needed.

The gap is entirely on the backend (Supabase) configuration side.

## What's Missing

- `supabase/config.toml` has no `[auth.external.google]` section (only a disabled Apple block)
- No `supabase/.env` file exists to supply credentials to the local Supabase instance
- `additional_redirect_urls` in config.toml doesn't cover all local dev URL variants
- Production Supabase dashboard needs Google provider enabled manually

## Design

### 1. `supabase/config.toml` — Add Google provider

Add after `[auth.external.apple]`:

```toml
[auth.external.google]
enabled = true
client_id = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT)"
secret = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET)"
```

Update `additional_redirect_urls` to cover local dev:

```toml
additional_redirect_urls = ["https://127.0.0.1:3000", "http://localhost:3000", "http://127.0.0.1:3000"]
```

### 2. `supabase/.env` — Credential file (gitignored)

Create `supabase/.env` with the Google OAuth credentials from `frontend/.env.local`:

```
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT=<google_client_id>
SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=<google_client_secret>
```

The Supabase CLI automatically reads `supabase/.env` when running `supabase start`.

### 3. `.gitignore` — Add `supabase/.env`

Ensure `supabase/.env` is not committed to source control.

### 4. Google Cloud Console — Manual step

In the OAuth 2.0 Client ID settings, add the local dev callback URL as an authorized redirect URI:

```
http://127.0.0.1:54321/auth/v1/callback
```

The production callback URL (`https://flcasuohzogtwxsqhett.supabase.co/auth/v1/callback`) should already be registered.

### 5. Production Supabase Dashboard — Manual step

Navigate to Authentication → Providers → Google → Enable.
Enter the client ID and client secret from Google Cloud Console.

## Restart Required

After changes to `supabase/config.toml` and `supabase/.env`, run:

```bash
supabase stop && supabase start
```

to apply the new provider configuration to the local instance.
