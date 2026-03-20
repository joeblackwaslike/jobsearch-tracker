# Extension Testing Plan

**Created:** 2026-03-08

---

## Context

The extension has 21+ vitest tests covering adapter logic against hand-written mock DOM. The testing gaps are:

1. Adapter logic is tested against fake HTML, not real site HTML — selectors can silently break
2. The background script pipeline (content script → RECORD_INTENT/TRACK → intent matching → API) has zero test coverage
3. Live site drift (sites changing their DOM over time) has no automated detection
4. The frontend has no tests against mocked API data

Implement the following four phases in order. Do not start a later phase until the earlier one is complete.

---

## Auth Wall Caveat — Address Before Starting Phase 1

The following boards require a logged-in session to view job detail pages. The Playwright capture script and any live-site tests **cannot run against these boards without a valid session**:

| Board | Why gated |
|---|---|
| LinkedIn | Job detail pages redirect unauthenticated users after 1–2 views |
| Wellfound | Most job listings require an account |
| TeamBlind | Requires login to view job posts |

**Action required before Phase 1:** Use Playwright's persistent profile (`--user-data-dir`) pointed at a real Chrome profile that is already logged into LinkedIn, Wellfound, and TeamBlind. Confirm the session is active before running the capture script.

All other boards (Greenhouse, Ashby, Lever, Workday, Workable, Builtin, Levels, GitHub Careers, Google Jobs, Welcome to the Jungle, Work at a Startup, HackerNews Jobs, YCombinator, aijobs.net, startup.jobs, and all Greenhouse-whitelabeled domains) are publicly accessible without login.

---

## Phase 1 — HTML Snapshot Regression Suite

**Goal:** Replace hand-written mock DOM in existing vitest tests with real captured HTML. This is the foundation for all adapter regression testing.

### Step 1: Write a Playwright capture script

Create `extension/scripts/capture-fixtures.ts`. For each supported board, the script should:

1. Navigate to a real job detail page (parameterize the test with a yaml config file containing one stable URL per board — pick a job at a large company that is unlikely to be deleted).  Write a pretest that fails with a clear error message prior to testing.  Print clear directions to stdout to help the user fix the issue.
2. Wait for the job title, company name, and any other fields to appear in the DOM before capturing — do not snapshot too early, as Workday, LinkedIn, and Wellfound render content via React after initial load
3. Save the full `document.documentElement.outerHTML` to `extension/src/content/adapters/__tests__/fixtures/{board-name}.html`

Board-specific wait conditions to keep in mind:

| Board | Wait for |
|---|---|
| Workday | `[data-automation-id="jobPostingHeader"]` |
| LinkedIn | `.jobs-unified-top-card` or `document.title` containing `\| LinkedIn` |
| Greenhouse / Ashby / Lever | Application form heading to appear |

For login-gated boards (LinkedIn, Wellfound, TeamBlind), the script must use `--user-data-dir` pointing to the pre-authenticated Chrome profile. For all public boards, standard Playwright launch is sufficient.

### Step 2: Update vitest tests to use fixtures

For each adapter test file in `extension/src/content/adapters/__tests__/`, add a test block that:

1. Reads the corresponding fixture file from `__tests__/fixtures/{board-name}.html`
2. Sets `document.body.innerHTML` (or `document.documentElement.innerHTML`) to the fixture content
3. Calls `adapter.extract()` and asserts the result is non-null with a non-empty `position`, `company`, and `url`

Keep all existing hand-written DOM tests — they cover specific edge cases (SDUI fallback, null returns on non-job pages, URL pattern guards). The fixture tests complement them by verifying against real HTML.

### Step 3: Document the recapture workflow

Add a comment block at the top of `capture-fixtures.ts` explaining: when a board changes its DOM and a fixture-based test fails, re-run the capture script for that board, commit the updated fixture file, and update the adapter selector if needed. The fixture diff in git is the signal that the site changed.

### Definition of done

All 21+ existing tests still pass. Each adapter additionally has a fixture-based test that passes against real captured HTML.

---

## Phase 2 — Full Pipeline Tests (Extension Loaded in Playwright)

**Goal:** Test the complete message path: content script → background service worker → intent matching → mocked API. This is the only way to test the background script's `RECORD_INTENT` handling, intent TTL/pruning logic, Levenshtein company-name matching, and `source` merge into `TrackData`.

### Step 1: Set up Playwright with extension loading and DNS remapping

Add a Playwright config at `extension/playwright.config.ts` with a custom browser launch that passes:

```
--load-extension=dist/
--disable-extensions-except=dist/
--host-rules=MAP boards.greenhouse.io 127.0.0.1,MAP jobs.ashbyhq.com 127.0.0.1,MAP jobs.lever.co 127.0.0.1,...
```

The `--host-rules` flag is critical: it tells Chrome to resolve each job board's real hostname to `127.0.0.1`, where a local fixture server is running. This ensures:

1. The browser believes it's navigating to `https://boards.greenhouse.io/acme/jobs/123`
2. Adapters dispatch correctly (they match on `window.location.hostname`)
3. No URL rot (the HTML is served locally)
4. No network dependency (no requests leave the machine)

**Why this is necessary:** Adapters match on hostname patterns (e.g., `boards.greenhouse.io`, `jobs.ashbyhq.com`). If fixtures are served on `localhost:3002/fixtures/greenhouse.html`, the adapter dispatch logic returns `null` because no adapter matches `localhost`. The `--host-rules` remapping makes the browser think it's on the real domain while actually serving local HTML.

Use `channel: 'chromium'`. Do not use `headless: true` — use `headless: false` or `--headless=new`, since MV3 service workers do not initialize reliably in classic headless mode.

Add a script to `extension/package.json`:

```json
"test:pipeline": "pnpm build && playwright test"
```

This ensures the extension is always rebuilt before pipeline tests run.

### Step 2: Stand up a mock API server

The background service worker POSTs to `/api/extension/track` and `/api/extension/refresh`. Run a lightweight MSW (Mock Service Worker) instance in Node mode, or a simple Express stub, on `localhost:3001` during tests. The mock should handle:

- `POST /api/extension/track` → `{ ok: true, application_id: "test-id-123" }`
- `POST /api/extension/refresh` → `{ access_token: "mock-token", refresh_token: "mock-refresh" }`

Before each test, pre-populate `chrome.storage.local` with a mock session by opening the extension's background service worker page and calling `chrome.storage.local.set(...)` via Playwright's `page.evaluate()`:

```typescript
await extensionBackgroundPage.evaluate(() =>
  chrome.storage.local.set({
    access_token: "mock-token",
    refresh_token: "mock-refresh",
    backend_url: "http://localhost:3001",
  })
);
```

### Step 3: Serve fixture HTML with DNS remapping

Create a local HTTP server that maps URL paths to fixture files. For example:

- Request to `https://boards.greenhouse.io/acme/jobs/123` (remapped to `127.0.0.1` via `--host-rules`) → serves `fixtures/greenhouse.html`
- Request to `https://jobs.ashbyhq.com/acme/123` → serves `fixtures/ashby.html`

The server should:
1. Listen on `127.0.0.1:80` (or `:443` with self-signed cert if testing HTTPS-only features)
2. Route incoming requests based on the `Host` header to the correct fixture file
3. Set `Content-Type: text/html` and optionally match the real site's CSP headers

Implementation options:
- **Simple Express app** with a hostname → fixture mapping table
- **Static file server** (e.g., `http-server`) with a routing layer

Example routing logic:

```typescript
const fixtureMap = {
  'boards.greenhouse.io': 'fixtures/greenhouse.html',
  'jobs.ashbyhq.com': 'fixtures/ashby.html',
  'jobs.lever.co': 'fixtures/lever.html',
  // ...
};

app.get('*', (req, res) => {
  const fixture = fixtureMap[req.hostname];
  if (fixture) {
    res.sendFile(path.resolve(fixture));
  } else {
    res.status(404).send('No fixture for this hostname');
  }
});
```

This removes all network dependency and auth requirements from pipeline tests while maintaining correct adapter dispatch.

### Step 4: Write pipeline test cases

Focus exclusively on logic that has no coverage elsewhere. Write these tests in `extension/src/content/adapters/__tests__/pipeline/`:

**TRACK pipeline (happy path)**
Navigate to `https://boards.greenhouse.io/acme/jobs/123` (which resolves to the local fixture server via `--host-rules`). Trigger the form submission signal. Verify:
- `chrome.storage.local` is updated with a `recent_jobs` entry
- The mock API server received a `POST /api/extension/track` with the correct `company_name` and `position`

**Intent matching — high confidence**
Navigate to `https://www.linkedin.com/jobs/view/123` (remapped to local fixture). Trigger the `watchForIntent()` apply-click signal. Then navigate to `https://boards.greenhouse.io/acme/jobs/456` and trigger submission. Verify the `POST /api/extension/track` body contains `source: "LinkedIn"`.

**Intent matching — TTL expiry**
Same as above, but after recording the intent, overwrite the stored intent's `recordedAt` to be 3 hours ago. Navigate to the Greenhouse fixture and trigger submission. Verify the subsequent TRACK POST does **not** contain `source`.

**Intent matching — null atsDomain tight window**
Record an intent with `atsDomain: null` from a job aggregator. Trigger a matching TRACK within 30 minutes (mocked time) by navigating to the Greenhouse fixture. Verify `source` is merged. Then repeat with the intent timestamped 31 minutes ago and verify `source` is absent.

**Intent deduplication**
Record two intents for the same `(source, atsDomain)` pair in sequence. Verify `chrome.storage.local` contains only one intent (the second replaced the first).

**Token refresh on 401**
Configure the mock API to return 401 on the first TRACK call, then 200 on retry. Verify the background script called `POST /api/extension/refresh`, updated storage with the new token, and the job was ultimately tracked.

**Duplicate detection (409)**
Configure the mock API to return 409. Verify the background script responds to the content script with `{ ok: false, error: "duplicate" }` and does not append to `recent_jobs`.

### Definition of done

Pipeline tests cover intent matching (with and without TTL expiry, with and without `atsDomain`), the TRACK → storage → API path, token refresh on 401, and duplicate 409 handling. All tests use `--host-rules` DNS remapping to ensure adapters dispatch correctly while serving local HTML with no network dependency.

---

## Phase 3 — Live Site Drift Detection

**Goal:** A scheduled CI job (weekly or on-demand) that navigates to real live job pages and verifies adapters still return non-null data. This detects site DOM changes between snapshot recaptures.

### Implementation

Write a separate Playwright test file: `extension/src/content/adapters/__tests__/live/drift-detection.test.ts`. Exclude it from the default test run; include it only in a `--project=live` Playwright config.

For each **public** board (all except LinkedIn, Wellfound, TeamBlind), each test:

1. Navigates to the hardcoded job URL from Phase 1
2. Injects the adapter via `page.evaluate()` with Chrome API stubs (`chrome.runtime.sendMessage` mocked as a no-op, `chrome.storage` mocked with empty data)
3. Calls `adapter.extract()`
4. Asserts the result is non-null and both `position` and `company` are non-empty strings

For the three login-gated boards (LinkedIn, Wellfound, TeamBlind), the drift test must use `--user-data-dir` with a valid session. Tag these tests with a `@gated` annotation and document that they cannot run in CI without a pre-authenticated profile.

Add a script to `extension/package.json`:

```json
"test:live": "playwright test --project=live"
```

Add a GitHub Actions workflow (`.github/workflows/extension-drift.yml`) with a weekly schedule:

```yaml
on:
  schedule:
    - cron: '0 9 * * 1'   # Monday 09:00 UTC
  workflow_dispatch:        # also triggerable manually
```

When the job fails, the Playwright report will identify exactly which board's `extract()` returned null, pointing directly to the adapter that needs updating.

### Definition of done

`pnpm test:live` runs live drift verification for all public boards. A GitHub Actions workflow runs it weekly and sends a notification on failure.

---

## Phase 4 — Frontend with Mocked API

**Goal:** Verify the TanStack Start frontend renders tracked jobs correctly, independent of the extension.

This phase is independent of all three phases above and can be implemented at any time. It does not block or depend on extension QA.

### Implementation

Use MSW to mock `GET /api/applications` with 5–10 seeded job records covering edge cases:

- Jobs with and without salary ranges
- Jobs with `source` populated ("LinkedIn", "google-jobs") vs. null
- Archived jobs (`archived_at` set)
- Jobs with single vs. multiple locations

Write Playwright component tests (or React Testing Library tests) that verify:

- Job cards render with correct company, position, and applied date
- Filtering by status (applied, interviewing, archived) works
- The source badge appears when `source` is present and is absent when null
- Sorting by date works

No database, no extension, and no Chrome are required for these tests. They run in standard Node/jsdom.

### Definition of done

Frontend tests run in CI and cover the main list view, status filtering, source badge rendering, and sorting.

---

## Summary

| Phase | What it tests | Auth required | Blocks |
|---|---|---|---|
| 1 — Snapshots | Adapter `extract()` against real HTML | LinkedIn, Wellfound, TeamBlind sessions | Phase 2 |
| 2 — Full pipeline | Background script, intent matching, token refresh. Uses `--host-rules` to serve local fixtures on real domains. | None (uses local fixture server with DNS remapping, no network) | Phase 3 |
| 3 — Live drift | Real site DOM changes over time | Sessions for gated boards in `@gated` tests | — |
| 4 — Frontend | React app renders API data correctly | None | — |
