# Chrome Extension Design

**Date:** 2026-03-04
**Scope:** Chrome extension that tracks job applications against the existing `/api/extension/*` backend

---

## Overview

A Chrome MV3 extension with two interaction modes:

1. **Content script button** — injected directly into supported job board pages; one-click Track without leaving the page
2. **Popup fallback** — for any unsupported page; auto-fills the current URL, user enters company + position

The extension stores auth tokens in `chrome.storage.local` and communicates with the self-hosted backend API already built at `/api/extension/{signin,refresh,track}`.

---

## Architecture

### Adapter Registry Pattern

One content script is injected across all supported job board URLs. A central adapter registry maps hostnames to adapter objects. Each adapter implements:

```typescript
interface JobData {
  company: string;
  position: string;
  url: string;
}

interface Adapter {
  hosts: string[];            // hostnames this adapter handles
  extract(): JobData | null;  // parse DOM → job data; null if not a job detail page
  getInjectTarget(): Element | null; // where to inject the Track button
}
```

Content script flow:
1. Look up adapter from registry by `location.hostname`
2. Call `extract()` — if null, exit (e.g., LinkedIn feed vs. job detail page)
3. Call `getInjectTarget()` — if null, set up `MutationObserver` to retry (handles SPA navigation)
4. Inject Track button; on click, send `TRACK` message to background service worker

All API calls are routed through the background service worker — content scripts and popup both use `chrome.runtime.sendMessage`. This centralizes token management and auto-refresh logic in one place.

### Whitelabeled Greenhouse

Whitelabeled Greenhouse instances run on arbitrary domains (e.g., `jobs.acme.com`). The only reliable detection signal is the `gh_jid` query parameter in the URL.

Because Chrome's `content_scripts.matches` patterns don't support query string matching, whitelabeled Greenhouse is handled by the **background service worker**:

- `chrome.tabs.onUpdated` listener checks every URL change for `gh_jid=` in the query string
- If found, injects the Greenhouse adapter into that tab via `chrome.scripting.executeScript`
- Same adapter code used for `boards.greenhouse.io` — no duplication

Ashby is also commonly whitelabeled; a similar `ashby_jid` / DOM fingerprint check can be added to the same `onUpdated` handler.

### Google Jobs

Google's job search vertical (`google.com/search?udm=8`) is matched via `*://www.google.com/search*`. The Google adapter checks for `udm=8` in the URL or the presence of the jobs panel in the DOM before attempting extraction. Google's DOM changes frequently, making this adapter among the most fragile — treated as best-effort.

---

## File Structure

```
extension/
  src/
    background/
      index.ts              ← service worker: message routing, token refresh,
                               tabs.onUpdated for whitelabeled board detection
    content/
      index.ts              ← entry point: adapter lookup + button injection
      inject.ts             ← DOM injection + MutationObserver retry logic
      adapters/
        types.ts            ← JobData + Adapter interfaces
        index.ts            ← adapter registry (hostname → adapter)
        linkedin.ts
        indeed.ts
        greenhouse.ts       ← handles boards.greenhouse.io
        ashby.ts
        lever.ts
        workday.ts
        wellfound.ts
        builtin.ts
        dice.ts
        levels.ts
        ziprecruiter.ts
        github.ts           ← github.com/*/jobs
        google.ts           ← google.com/search?udm=8
        blind.ts
        welcometothejungle.ts
        workatastartup.ts
    popup/
      index.html
      main.tsx              ← React root
      App.tsx               ← screen router (auth | main | settings)
      screens/
        AuthScreen.tsx      ← backend URL + email/password sign-in
        MainScreen.tsx      ← track form + recent jobs list
        SettingsScreen.tsx  ← backend URL config + sign out
      hooks/
        useStorage.ts       ← typed chrome.storage.local wrapper
        useAuth.ts          ← token read/write + sign-out
        useTrack.ts         ← track() call + response state
    shared/
      api.ts                ← typed fetch wrapper for all 3 endpoints
      storage.ts            ← storage keys + StorageSchema type
  manifest.json
  vite.config.ts
  tsconfig.json
  package.json
```

---

## Manifest (MV3)

```json
{
  "manifest_version": 3,
  "name": "Job Search Tracker",
  "version": "0.1.0",
  "permissions": ["storage", "activeTab", "scripting", "tabs"],
  "host_permissions": ["<all_urls>"],
  "background": {
    "service_worker": "background/index.js",
    "type": "module"
  },
  "action": {
    "default_popup": "popup/index.html"
  },
  "content_scripts": [{
    "matches": [
      "*://*.linkedin.com/jobs/*",
      "*://*.indeed.com/*",
      "*://boards.greenhouse.io/*",
      "*://*.ashbyhq.com/*",
      "*://*.lever.co/*",
      "*://*.myworkdayjobs.com/*",
      "*://*.wellfound.com/*",
      "*://*.builtin.com/*",
      "*://*.dice.com/*",
      "*://*.levels.fyi/*",
      "*://*.ziprecruiter.com/*",
      "*://github.com/*/jobs*",
      "*://www.google.com/search*",
      "*://www.teamblind.com/*",
      "*://*.welcometothejungle.com/*",
      "*://www.workatastartup.com/*"
    ],
    "js": ["content/index.js"],
    "run_at": "document_idle"
  }]
}
```

`host_permissions: <all_urls>` is required because whitelabeled Greenhouse boards run on arbitrary domains that cannot be enumerated at build time.

---

## Storage Schema

```typescript
interface StorageSchema {
  access_token: string | null;
  refresh_token: string | null;
  backend_url: string | null;      // e.g. "https://myapp.com"
  recent_jobs: RecentJob[];        // last 5, appended on successful track
}

interface RecentJob {
  application_id: string;
  company: string;
  position: string;
  tracked_at: string;              // ISO 8601
}
```

---

## Auth + Token Flow

All API calls are routed through the background service worker.

**Track flow:**
```
content script / popup
  → sendMessage({ type: 'TRACK', data: { company, position, url } })
  → background: POST /api/extension/track (Bearer access_token)
    → 200: append to recent_jobs in storage, respond { ok: true, application_id }
    → 401: POST /api/extension/refresh
            → 200: update tokens in storage, retry track once
            → 401: respond { ok: false, error: 'session_expired' }
    → 409: respond { ok: false, error: 'duplicate', application_id }
    → 4xx/5xx: respond { ok: false, error: message }
```

No proactive token refresh — reactive on 401. Supabase access tokens are 1-hour JWTs; refresh tokens are long-lived. This matches the pattern already defined in the backend design doc.

**Popup auth flow:**
```
GET_JOB_DATA message to active tab content script
  → content script responds with { company, position } or null
  → popup pre-fills fields if data available
  → user clicks Track → TRACK message to background
```

---

## Popup UI

**Three screens:**

**AuthScreen** (no tokens in storage)
- Backend URL field (required before sign-in)
- Email + password
- Sign in → `/signin` → store tokens → MainScreen
- Inline error on invalid credentials

**MainScreen** (authenticated)
- On open: sends `GET_JOB_DATA` to active tab → pre-fills Company + Position
- Fields: Company (text), Position (text), URL (pre-filled from activeTab, editable)
- Track button → TRACK message → success / duplicate / error state
- Recent jobs: last 5 from `chrome.storage.local` (no API call on popup open)
- Gear icon → SettingsScreen

**SettingsScreen**
- Backend URL field + Save
- Sign out (clears all tokens → AuthScreen)

Popup fixed at 360×500px. Dark-mode aware via `prefers-color-scheme`. Plain CSS modules — no Tailwind.

---

## Content Script Button States

```
idle
  → click
loading (spinner, button disabled)
  → success:   "Tracked ✓"        (persists until page navigates)
  → duplicate: "Already tracked"  (no retry)
  → expired:   "Sign in again"    (links to popup)
  → error:     "Failed — retry?"  (click to retry)
```

---

## Build Setup

**Tool:** `vite-plugin-web-extension`

**Entry points** (each bundled separately):
- `popup/main.tsx` → `dist/popup/main.js` + `dist/popup/index.html`
- `content/index.ts` → `dist/content/index.js` (IIFE format — required for content scripts)
- `background/index.ts` → `dist/background/index.js` (ES module — MV3 supports this)

**Scripts:**
```json
{
  "dev": "vite build --watch",
  "build": "vite build",
  "build:zip": "vite build && zip -r extension.zip dist/"
}
```

**Dev workflow:** `npm run dev` watches for changes and rebuilds to `dist/`. Reload the unpacked extension in `chrome://extensions` after each build (no live reload for MV3 service workers).

**Workspace:** `extension/` added as a workspace package in the root `pnpm-workspace.yaml`.

**TypeScript:** Root `tsconfig.json` in `extension/`. Content script config excludes `ServiceWorker` globals; background config excludes `DOM` globals beyond `fetch`.

---

## Supported Boards Summary

| Board | Domain | Adapter | Notes |
|-------|--------|---------|-------|
| LinkedIn Jobs | linkedin.com | `linkedin.ts` | SPA — MutationObserver needed |
| Indeed | indeed.com | `indeed.ts` | |
| Greenhouse (native) | boards.greenhouse.io | `greenhouse.ts` | |
| Greenhouse (whitelabeled) | any domain | `greenhouse.ts` | Detected via `gh_jid` query param in background worker |
| Ashby | ashbyhq.com | `ashby.ts` | Also commonly whitelabeled |
| Lever | lever.co | `lever.ts` | |
| Workday | myworkdayjobs.com | `workday.ts` | Complex SPA, may need aggressive retry |
| Wellfound | wellfound.com | `wellfound.ts` | Formerly AngelList Talent |
| Built In | builtin.com | `builtin.ts` | |
| Dice | dice.com | `dice.ts` | |
| Levels.fyi | levels.fyi | `levels.ts` | |
| ZipRecruiter | ziprecruiter.com | `ziprecruiter.ts` | |
| GitHub Jobs | github.com | `github.ts` | |
| Google Jobs | google.com/search?udm=8 | `google.ts` | Best-effort; fragile DOM |
| Blind | teamblind.com | `blind.ts` | |
| Welcome to the Jungle | welcometothejungle.com | `welcometothejungle.ts` | |
| Work at a Startup | workatastartup.com | `workatastartup.ts` | |

---

## Out of Scope

- Firefox support (MV3 differences deferred)
- Chrome Web Store publishing (load unpacked for now)
- Automated DOM tests for adapters (manual verification per board)
- Proactive token expiry checking
- Right-click context menu as alternative Track trigger
