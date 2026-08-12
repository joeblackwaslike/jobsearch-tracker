# Tracking Automation — Design & Architecture

> **Status:** ✅ Complete
> **Created:** 2026-03-07
> **Completed:** 2026-03-16

---

## Overview

The extension uses three tracking strategies to eliminate manual button clicks:

1. **Auto-submit tracking** (`watchForSubmission`) — Adapters detect when the user submits an application form on an ATS (Greenhouse, Ashby, Workable, etc.) and automatically track it.

2. **Intent tracking** (`watchForIntent`) — For aggregator boards that redirect to external ATSs (LinkedIn, Wellfound, Google Jobs), the adapter records the user's *intent* before they leave. When they submit on the destination ATS, the background script matches the intent and adds the source board to the tracked application.

3. **Manual button injection** (`getInjectTarget`) — Legacy fallback for low-signal boards (Indeed, Dice, ZipRecruiter). User clicks an injected "Track" button.

---

## Intent Tracking Architecture

### Problem Statement

Job boards like LinkedIn, Wellfound, and Google Jobs don't host application forms—they redirect users to external ATSs (Greenhouse, Ashby, Lever, etc.). Without intent tracking, we lose attribution: we know the user applied via Greenhouse, but not that they found the job on LinkedIn.

### Solution

**Intent tracking** records what job the user is viewing on an aggregator board before they navigate away. When the ATS adapter fires `TRACK`, the background script matches the pending intent and merges the source board into the application record.

---

## Storage Schema

**Interface:** `PendingIntent`

```ts
export interface PendingIntent {
  company: string;           // from adapter.extract()
  position: string;
  url: string;               // source page URL (e.g. linkedin.com/jobs/view/...)
  source: string;            // e.g. "LinkedIn", "Wellfound", "Google Jobs"
  atsDomain: string | null;  // hostname of destination ATS (e.g. "jobs.ashbyhq.com"),
                             // or null if destination wasn't decodable
  recordedAt: number;        // Date.now()
  expiresAt: number;         // recordedAt + TTL_MS
}
```

**Storage key:** `pending_intents: PendingIntent[]`

**TTL:** 2 hours (7,200,000 ms) — covers any realistic multi-step application form.
- If `atsDomain` is null, tighter 30-minute window during matching reduces false positives.

---

## Message Types

### `RECORD_INTENT`

Sent from content script → background when user signals intent to apply:

```ts
{
  type: "RECORD_INTENT";
  data: {
    company: string;
    position: string;
    url: string;
    source: string;
    atsDomain: string | null;
  };
}
```

**Background handler:**
1. Load `pending_intents`
2. Prune expired entries (`expiresAt < now`)
3. Deduplicate: if existing intent has same `(source, atsDomain)`, replace it
4. Append new intent
5. Persist

### `TRACK` (enhanced)

```ts
export type TrackData = {
  company_name: string;
  position: string;
  url: string;
  source?: string;   // enriched by background via intent matching
};
```

Content scripts **never** set `source` themselves—only the background script merges it after matching.

---

## Adapter Interface

### `watchForIntent`

```ts
/**
 * Optional: for redirect aggregators — watch for intent signal.
 * Returns cleanup function.
 */
watchForIntent?(onIntent: (jobData: JobData) => void): () => void;
```

**Adapter responsibilities:**
- Decide when to record (page load vs. Apply button click)
- Decode destination ATS URL from Apply button `href` to extract `atsDomain`
- Call `onIntent(jobData)` at the right moment

**Example (LinkedIn):**
```ts
watchForIntent(onIntent: (jobData: JobData) => void): () => void {
  const applyAnchor = document.querySelector<HTMLAnchorElement>(
    'a[href*="/redir/redirect/"]'
  );
  
  const handleClick = () => {
    const jobData = linkedInAdapter.extract();
    if (!jobData) return;
    onIntent(jobData);
  };
  
  applyAnchor?.addEventListener("click", handleClick);
  return () => applyAnchor?.removeEventListener("click", handleClick);
}
```

---

## Content Script Orchestration

**Function:** `setupIntentWatcher()`

Called at startup and on SPA navigation:

```ts
function setupIntentWatcher(): void {
  const adapter = findAdapter(location.hostname) ?? findAdapterByUrlParams();
  if (!adapter?.watchForIntent) return;

  adapter.watchForIntent((jobData) => {
    chrome.runtime.sendMessage({
      type: "RECORD_INTENT",
      data: {
        company: jobData.company,
        position: jobData.position,
        url: jobData.url,
        source: adapter.source ?? adapter.hosts[0] ?? "unknown",
      },
    });
  });
}
```

---

## Background Script — Intent Matching

**When `TRACK` message received:**

1. Load `pending_intents`
2. Prune expired entries
3. Extract submitting tab's hostname from `sender.tab.url`
4. Run matching (see criteria below)
5. If match found: merge `intent.source` into `TrackData`, remove consumed intent
6. Call API with enriched data

### Matching Criteria

```
For each non-expired intent:

  High confidence:
    intent.atsDomain === tabHostname
    AND normalize(intent.company) ≈ normalize(company_name)

  Low confidence (atsDomain unknown):
    intent.atsDomain === null
    AND normalize(intent.company) === normalize(company_name)
    AND (now - intent.recordedAt) < 30 * 60 * 1000   // 30-minute window

Pick most recently recorded candidate.
If none → proceed without source.
```

**Normalization:**
- Lowercase
- Strip leading/trailing whitespace
- Collapse `&`, `,`, `.`, `'`, `-`
- Collapse multiple spaces
- Trim

**Similarity (high confidence):**
- Exact normalized match, OR
- Levenshtein distance ≤ 2 (handles "Stripe, Inc." vs. "Stripe")

---

## Intent Lifecycle Example

```
LinkedIn job detail page
  → adapter.watchForIntent() registered
  → user clicks Apply button
  → adapter extracts atsDomain from href
  → onIntent() called → RECORD_INTENT sent to background
  → background stores PendingIntent {
      source: "LinkedIn",
      atsDomain: "jobs.ashbyhq.com",
      company: "Acme",
      position: "Engineer"
    }

ATS page (jobs.ashbyhq.com/acme/engineer)
  → Ashby adapter registers watchForSubmission
  → user submits form → onSubmit fired
  → content script sends TRACK {
      company_name: "Acme",
      position: "Engineer",
      url: "..."
    }

Background receives TRACK
  → tabHostname = "jobs.ashbyhq.com"
  → finds PendingIntent where atsDomain matches + company matches
  → merges source: "LinkedIn"
  → deletes consumed intent
  → calls API with {
      company_name: "Acme",
      position: "Engineer",
      url: "...",
      source: "LinkedIn"
    }
```

---

## Cleanup Strategy

- **On `RECORD_INTENT`:** Prune expired before appending
- **On `TRACK`:** Prune expired before matching
- **On service worker activation:** Prune all expired
- No periodic timer needed—lazy cleanup on read/write

---

## Per-Tab vs. Global

**Intents are global** (stored in `chrome.storage.local`, not scoped to tab).

**Rationale:**
- Intent recorded on tab A (board)
- `TRACK` fires on tab B (ATS, opened in new tab)
- Cross-tab matching by `tabId` impossible
- ATS domain + company name matching provides sufficient precision

**False-positive risk:**
User views Job A on LinkedIn (records intent for `jobs.ashbyhq.com`), then independently applies to different company on `jobs.ashbyhq.com`.

**Mitigation:** Require company name similarity in all cases, not just ATS domain.

---

## Dynamic Icon Design

### Goal

Provide visual feedback when auto-tracking is active vs. manual button required.

### Implementation

**Icon variants (8 files):**
- Gray (default): Tailwind gray-400 — unsupported sites or button-injection sites
- Green (active): Tailwind green-500 — `watchForSubmission` or `watchForIntent` active

**Sizes:** 16, 32, 48, 128 px

**Generation:** `scripts/gen-icons.mjs` using sharp to tint source PNG

### Message Flow

```
Content script (page load)
  → determines adapter type
  → sends AUTO_TRACK_STATUS { active: boolean }

Background script
  → receives AUTO_TRACK_STATUS
  → calls chrome.action.setIcon({ tabId, path: active ? ICON_GREEN : ICON_GRAY })
  
tabs.onUpdated (navigation)
  → resets icon to gray
  → content script re-sends AUTO_TRACK_STATUS after new page loads
```

**Per-tab state:** Different tabs can show different icons simultaneously.

---

## Files Modified

| File | Change |
|------|--------|
| `extension/src/shared/storage.ts` | Add `PendingIntent` interface; `pending_intents: PendingIntent[]` key |
| `extension/src/shared/api.ts` | Add `source?: string` to `TrackData` |
| `extension/src/content/adapters/types.ts` | Add `watchForIntent?()` to `Adapter` |
| `extension/src/background/index.ts` | Handle `RECORD_INTENT`; enrich `TRACK` with matched intent; handle `AUTO_TRACK_STATUS`; manage dynamic icons |
| `extension/src/content/index.ts` | Add `setupIntentWatcher()` at startup and SPA navigation; send `AUTO_TRACK_STATUS` |
| `extension/manifest.json` | Default icons to gray variants |
| `extension/scripts/gen-icons.mjs` | Icon generation script |
| `extension/src/assets/icons/` | 8 icon files (gray + green × 4 sizes) |
