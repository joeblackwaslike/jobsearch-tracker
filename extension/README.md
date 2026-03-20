# Job Search Tracker — Browser Extension

A Chrome extension for one-click job application tracking from any job board. Automatically detects application submissions on 20+ job boards and syncs them to your job search tracker.

## Features

- **Auto-tracking** — No manual buttons on 20+ boards (Greenhouse, Ashby, LinkedIn, Workday, etc.)
- **Intent tracking** — Records source attribution for aggregator boards (LinkedIn, Wellfound, Google Jobs)
- **Dynamic icon** — Visual indicator when auto-tracking is active (green) vs. manual (gray)
- **Popup UI** — Quick actions: Track job, view recent applications, open dashboard
- **Background sync** — Seamless integration with the main application API

## Platform Support

### Automatic Application Tracking

**What it is:** The extension watches for signals that you've successfully submitted an application — without you having to click anything. The moment your submission goes through, the job is automatically added to your tracker.

**How it works:** Each supported ATS has an adapter that listens for a board-specific success signal: a network response, a DOM mutation (form disappears, success banner appears), or a URL change. When the signal fires, the adapter extracts the job title and company from the page and sends it to your tracker in the background.

The extension icon turns **green** on pages where auto-tracking is active, so you always know it's watching.

| Platform | Domain | Detection method |
| --- | --- | --- |
| **Ashby** | `*.ashbyhq.com` | GraphQL `ApiSubmitSingleApplicationFormAction` response |
| **Greenhouse** | `boards.greenhouse.io`, `job-boards.greenhouse.io` | Application form removed from DOM |
| **Greenhouse Careers** | Custom domains (`?gh_jid=…`) | Submit success state on hosted ATS |
| **Lever** | `*.lever.co` | Network request + DOM confirmation |
| **LinkedIn Easy Apply** | `linkedin.com` | Voyager API `submitApplication` call |
| **Wellfound** | `wellfound.com` | Submit network request |
| **Work at a Startup** | `workatastartup.com` | Form submission success |
| **Workable** | `apply.workable.com` | `/api/v1/jobs/{id}/apply` 200 response |
| **Workday** | `*.myworkdayjobs.com` | URL pattern + success DOM text |

> To add support for a new ATS, see [docs/guides/adapter-development.md](docs/guides/adapter-development.md).

---

### Automatic Source Detection

**What it is:** Many job seekers discover roles on aggregator sites (LinkedIn, Google Jobs, HackerNews) but actually submit applications on the underlying ATS (Greenhouse, Ashby, Lever). Source detection bridges this gap — it records *where you found the job* and automatically attaches that attribution to the tracked application, even across different tabs and domains.

**How it works:** When you click "Apply" or "Apply on company website" on a supported aggregator, the extension captures a **pending intent**: the job title, company, source board, and a timestamp. When you later submit the application on the ATS, the extension matches the pending intent by company name (using fuzzy normalization) and merges the source field into the tracked record. Intents expire after 2 hours.

The icon turns **green** on aggregator pages where intent recording is active.

| Platform | Domain | Trigger |
| --- | --- | --- |
| **AIJobs** | `aijobs.net` | Clicking apply link |
| **Builtin** | `builtin.com` | Clicking apply link |
| **GitHub Jobs** | `github.com/*/jobs` | Clicking apply link |
| **GitHub Careers** | `github.careers` | Clicking apply link |
| **Google Jobs** | `google.com/search` (jobs panel) | Clicking apply link |
| **HackerNews** | `news.ycombinator.com/jobs` | Clicking apply link |
| **Levels.fyi** | `levels.fyi` | Clicking apply link |
| **LinkedIn** (external apply) | `linkedin.com` | Clicking "Apply on company website" |
| **StartupJobs** | `startup.jobs` | Clicking apply link |
| **TeamBlind** | `teamblind.com` | Clicking apply link |
| **Welcome to the Jungle** | `welcometothejungle.com` | Clicking apply link |
| **YCombinator** | `ycombinator.com/companies/*/jobs` | Clicking apply link |

> To add source detection for a new aggregator board, see [docs/guides/adapter-development.md](docs/guides/adapter-development.md).

---

### Manual Tracking

**What it is:** The popup's Track form lets you record any job application by hand — no adapter required. Manual tracking works on every job board, every ATS, and even jobs you apply to by email.

**Steps to manually track a job:**

1. Navigate to the job listing or application page in Chrome
2. Click the extension icon in the toolbar — the popup opens
3. The **Company**, **Position**, and **URL** fields are pre-filled from the page where possible
4. Correct any fields if needed
5. Click **Track**
6. A "Tracked successfully!" confirmation appears

**When to use manual tracking:**

- The board doesn't have an adapter yet
- You applied via email or a company's custom portal
- Auto-tracking misfired and you want to record it anyway
- You're tracking a referral or inbound opportunity

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 9+
- Chrome browser

## Getting Started

### 1. Install dependencies

```bash
cd extension
pnpm install
```

### 2. Build the extension

**Development build (watch mode):**

```bash
pnpm dev
```

This rebuilds on file changes. Keep it running during development.

**Production build:**

```bash
pnpm build
```

Output: `dist/` directory containing the bundled extension.

### 3. Load into Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked**
4. Select the `dist/` directory

The extension icon should appear in your toolbar.

### 4. Configure the extension

1. Click the extension icon
2. Click **Settings** (gear icon)
3. Enter your backend URL (default: `http://localhost:3000`)
4. Log in with your job tracker credentials

## Manual Testing

### Test Auto-Tracking (Submit Detection)

1. Visit a Greenhouse job: `https://boards.greenhouse.io/anthropic/jobs/4552942008`
2. Fill out the application form
3. Click **Submit**
4. Extension should auto-detect submission and sync to your tracker
5. Verify in popup **Recent** tab or main dashboard

### Test Intent Tracking

1. Visit a LinkedIn job: `https://www.linkedin.com/jobs/view/...`
2. Click **Apply on company website** (external apply)
3. Extension records your intent
4. You're redirected to an ATS (e.g., Greenhouse, Ashby)
5. Fill out and submit the application
6. Extension matches the intent and adds `source: "LinkedIn"` to the tracked job
7. Verify source attribution in your tracker

### Test Dynamic Icon

1. Visit an auto-tracking board (e.g., Greenhouse)
   - Icon should turn **green** ✅
2. Visit a manual board (e.g., Indeed)
   - Icon should turn **gray** 🔘
3. Navigate between tabs
   - Each tab should have its own icon state

## Development Commands

| Command | Description |
| --- | --- |
| `pnpm dev` | Build in watch mode (rebuilds on changes) |
| `pnpm build` | Production build to `dist/` |
| `pnpm build:zip` | Build + create `extension.zip` for distribution |
| `pnpm test` | Run tests once |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm type` | TypeScript type check |
| `pnpm gen-icons` | Generate extension icons (gray + green variants) |

**Note:** There is no linting configured. Code style is enforced via code review.

### TypeScript Type Check

```bash
pnpm exec tsc --noEmit
```

Or add to `package.json`:

```json
{
  "scripts": {
    "type": "tsc --noEmit"
  }
}
```

## Project Structure

```text
extension/
├── manifest.json              # Extension manifest (v3)
├── src/
│   ├── background/           # Service worker
│   │   └── index.ts          # Message handling, intent matching, icon management
│   ├── content/              # Content scripts (injected into job boards)
│   │   ├── adapters/         # Board-specific adapters (23 boards)
│   │   │   ├── types.ts      # Adapter interface
│   │   │   ├── index.ts      # Adapter registry
│   │   │   └── *.ts          # Individual board adapters
│   │   └── index.ts          # Content script entry (orchestrates adapters)
│   ├── popup/                # Extension popup UI
│   │   ├── index.html
│   │   └── screens/          # Popup screens (main, settings, recent)
│   ├── shared/               # Shared utilities
│   │   ├── api.ts            # API client for backend
│   │   └── storage.ts        # Chrome storage helpers
│   └── assets/
│       └── icons/            # Extension icons (8 files: gray + green × 4 sizes)
├── scripts/
│   ├── gen-icons.mjs         # Icon generation script (sharp)
│   └── capture-fixtures.mjs  # Test fixture capture (Playwright)
├── docs/
│   ├── boards/               # Board research docs (19 files)
│   ├── testing-plan.md
│   └── ...
└── vitest.config.ts
```

## Architecture

### Adapter System

Each job board has an **adapter** that implements one or more tracking strategies:

```typescript
export interface Adapter {
  hosts: string[];                    // Hostnames this adapter handles
  source?: string;                    // Human-readable board name
  extract(): JobData | null;          // Extract job data from DOM
  
  // Optional: auto-submit detection
  watchForSubmission?(onSubmit: (jobData: JobData) => void): () => void;
  
  // Optional: intent tracking (aggregators)
  watchForIntent?(onIntent: (jobData: JobData) => void): () => void;
  
  // Optional: legacy manual button injection
  getInjectTarget?(): Element | null;
}
```

### Message Flow

**Auto-submit detection:**

```text
Content script (Greenhouse)
  → detects form submission
  → sends TRACK message to background
  → background sends to API
  → success → updates storage + icon
```

**Intent tracking:**

```text
Content script (LinkedIn)
  → user clicks Apply
  → sends RECORD_INTENT to background
  → background stores PendingIntent
  
Content script (Greenhouse - new tab)
  → user submits form
  → sends TRACK message
  → background matches PendingIntent
  → merges source: "LinkedIn"
  → sends enriched data to API
```

### Storage Schema

**Chrome storage keys:**

- `access_token` — JWT access token
- `refresh_token` — JWT refresh token  
- `backend_url` — API base URL
- `pending_intents` — Array of pending intents (TTL: 2 hours)
- `recent_jobs` — Recently tracked jobs (for popup)

## Testing

### Unit Tests

All adapters have unit tests. Run the full suite with:

```bash
pnpm test
```

### Test Structure

Each adapter test file has two groups of tests:

1. **Logic tests** — inject minimal inline HTML and assert `extract()`, `watchForSubmission()`, or `watchForIntent()` behavior
2. **Fixture-based regression tests** — load a real captured HTML snapshot and assert the adapter still extracts valid data from it

```typescript
describe("greenhouseAdapter", () => {
  describe("extract()", () => {
    it("returns null when not on a job page", () => { ... });
    it("extracts job title and company from DOM", () => { ... });
  });

  describe("watchForSubmission()", () => {
    it("fires when application form is removed from DOM", () => { ... });
  });

  describe("extract() — fixture-based regression test", () => {
    it("extracts valid data from real captured HTML", () => { ... });
  });
});
```

### Fixture-Based Tests

**What they are:** Each adapter has a real HTML snapshot captured from a live job board, stored in `src/content/adapters/__tests__/fixtures/<board>.html`. The fixture test loads that HTML into jsdom and runs `extract()` against it — catching regressions when a board changes its DOM structure.

**Recognising a fixture-related failure:** If a fixture test fails but the inline logic tests still pass, the board's HTML structure has changed and the fixture (and possibly the adapter selector) needs updating. The failure will look like:

```text
AssertionError: expected null to not equal null
  at extract() — fixture-based regression test
```

Compare this to a logic-test failure, which usually points to an incorrect selector in the adapter itself.

**Recapturing fixtures:**

```bash
# Capture all public boards (no login required)
pnpm capture-fixtures

# Capture all boards including auth-gated ones
# (LinkedIn, Wellfound, TeamBlind — requires active Chrome login)
pnpm capture-fixtures:all

# Capture a single board
node scripts/capture-fixtures.mjs greenhouse

# Capture several boards at once
node scripts/capture-fixtures.mjs greenhouse ashby lever
```

After recapturing, run `git diff src/content/adapters/__tests__/fixtures/` to review what changed. If the adapter selector no longer matches the new HTML, update it and commit both the fixture and the adapter change together.

**Updating expired job URLs:** Fixture capture uses specific job posting URLs defined in `scripts/capture-config.yaml`. Job listings expire. When a capture fails with a 404 or redirect, find a new live posting on the same board and update its `url` field:

```yaml
# scripts/capture-config.yaml
boards:
  greenhouse:
    url: "https://job-boards.greenhouse.io/reddit/jobs/7624311"  # ← update this
    wait_for: "h1.section-header"
```

Pick postings at large, stable companies (the existing config uses Reddit, OpenAI, NVIDIA, etc.) — they tend to keep listings up longer than startups. Commit the config update alongside the recaptured fixture.

## Debugging

### Chrome DevTools

1. Right-click extension icon → **Inspect popup** (popup debugging)
2. Visit `chrome://extensions/` → Click **background page** link (service worker debugging)
3. Open DevTools on any job board page → **Sources** tab → Content scripts (content script debugging)

### Debug Logging

Content scripts log to the console with prefixes:

```javascript
log("linkedin", "extract() →", position, "@", company);
log("intent", "recording:", jobData.position);
log("greenhouse", "watchForSubmission: form removed — firing onSubmit");
```

Background script logs are in the service worker console.

### Common Issues

**Extension icon not changing:**

- Check content script loaded: DevTools → Sources → Content scripts
- Check AUTO_TRACK_STATUS message sent: Background page console
- Verify adapter has `watchForSubmission` or `watchForIntent`

**Auto-tracking not working:**

- Check adapter's `extract()` returns valid data
- Check watcher registered: Content script console logs
- Check form submission detection fired: Console logs
- Verify backend URL and auth token in storage

**Intent matching failing:**

- Check `RECORD_INTENT` fired: Background console
- Check pending intents in storage: `chrome.storage.local.get('pending_intents')`
- Verify company name normalization matches
- Check TTL hasn't expired (2 hours for high-confidence, 30 min for low-confidence)

## Building for Production

```bash
pnpm build:zip
```

This creates `extension.zip` ready for Chrome Web Store upload.

**Pre-flight checklist:**

- [ ] All tests passing (`pnpm test`)
- [ ] TypeScript check passing (`pnpm exec tsc --noEmit`)
- [ ] Version bumped in `manifest.json` and `package.json`
- [ ] Icons generated (`pnpm gen-icons`)
- [ ] Changelog updated
- [ ] Manual smoke test on 3+ boards

## Documentation

- **Design:** `../../docs/plans/tracking-automation-design.md`
- **Implementation:** `../../docs/plans/tracking-automation-implementation.md`
- **Board Research:** `docs/boards/*.md` (19 files)
- **Testing:** `docs/testing-plan.md`

## License

MIT
