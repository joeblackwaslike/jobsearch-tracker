# Extension Development Guide for AI Agents

A Chrome extension (Manifest V3) for one-click job application tracking from 23+ job boards. Automatically detects submissions and syncs to backend.

## Quick Start

**Build:** `pnpm dev` (watch mode) or `pnpm build` (production)
**Load:** `chrome://extensions/` → Developer mode → Load unpacked → `dist/`
**Test:** `pnpm test` (run once) or `pnpm test:watch` (watch mode)
**e2e Tests:** `pnpm test:e2e`
**Type Check:** `pnpm type`

## Tech Stack

- **Framework:** Vanilla TypeScript + Vite 7 + vite-plugin-web-extension
- **UI:** React 19 for popup
- **Testing:** Vitest + jsdom + Testing Library (248 tests)
- **Chrome APIs:** storage.local, runtime messaging, tabs, action
- **Build:** Vite bundles to `dist/` (ESM for service worker + content scripts)
- **Icons:** Sharp for generation (gray/green variants × 4 sizes)

## Project Structure

```text
extension/
├── manifest.json                  # Extension manifest v3
├── src/
│   ├── background/index.ts        # Service worker (intent matching, icon, API)
│   ├── content/
│   │   ├── adapters/              # 23 board-specific adapters
│   │   │   ├── types.ts           # Adapter interface
│   │   │   ├── index.ts           # Adapter registry
│   │   │   └── *.ts               # Board adapters
│   │   ├── index.ts               # Content script orchestration
│   │   └── debug.ts               # Logging utility
│   ├── popup/                     # React UI
│   ├── shared/                    # API client, storage helpers
│   ├── assets/icons/              # Gray/green icon variants
│   └── test/                      # Test setup, mocks
├── scripts/
│   ├── gen-icons.mjs              # Icon generation
│   └── capture-fixtures.mjs       # Playwright fixture capture
├── docs/
│   ├── boards/                    # 19 board research docs
│   └── guides/                    # Development guides
└── vitest.config.ts
```

## Development Rules

### 1. Test-Driven Development is Required

Follow TDD for all adapter work:

1. **Red:** Write failing test
2. **Green:** Implement minimum code
3. **Refactor:** Clean up, add fixture
4. **Commit:** One commit per cycle

Never implement an adapter without tests. See [Testing Adapters Guide](docs/guides/testing-adapters.md).

### 2. Adapter Interface

Every adapter MUST implement:

```typescript
export interface Adapter {
  hosts: string[];                    // Exact hostname matches
  source?: string;                    // Human-readable name
  extract(): JobData | null;          // Parse job data from DOM

  // Choose ONE tracking strategy:
  watchForSubmission?(onSubmit: (jobData: JobData) => void): () => void;
  watchForIntent?(onIntent: (jobData: JobData) => void): () => void;
  getInjectTarget?(): Element | null;  // LAST RESORT - manual button
}
```

**Choosing a strategy:**

- Use `watchForSubmission` for boards that host the application form
- Use `watchForIntent` for aggregators that redirect to external ATS
- Use `getInjectTarget` only as last resort (manual tracking)

See [Adapter Development Guide](docs/guides/adapter-development.md) for complete patterns.

### 3. Intent Tracking

Record user intent before redirect to external ATS:

```typescript
watchForIntent(onIntent: (jobData: JobData) => void): () => void {
  const applyBtn = document.querySelector<HTMLAnchorElement>('.apply');

  const handleClick = () => {
    const jobData = this.extract();
    if (!jobData) return;

    const atsDomain = applyBtn?.href ? new URL(applyBtn.href).hostname : null;
    onIntent({ ...jobData, atsDomain });
  };

  applyBtn?.addEventListener("click", handleClick);
  return () => applyBtn?.removeEventListener("click", handleClick);
}
```

**Intent TTL:**

- High-confidence (atsDomain known): 2 hours
- Low-confidence (atsDomain null): 30 minutes

See [Intent Tracking Guide](docs/guides/intent-tracking.md) for matching rules and edge cases.

## Common Workflows

### Adding a New Board Adapter

1. **Research:** Create `docs/boards/<board>.md` with URL patterns, DOM selectors, submit signals
2. **Implement:** Create `src/content/adapters/<board>.ts` with `extract()` and tracking method
3. **Register:** Export from `adapters/index.ts`, add URL pattern to `manifest.json`
4. **Test:** Create `__tests__/<board>.test.ts` with unit tests and fixture regression test
5. **Manual test:** Load in Chrome, verify extraction, tracking, icon state
6. **Document:** Update `README.md` and implementation plan

Full walkthrough: [Adapter Development Guide](docs/guides/adapter-development.md)

### Debugging an Adapter

**Check extract():**

- Open DevTools on job page → Console
- Look for `[adapter] extract() →` logs
- Verify selectors match DOM

**Check watcher:**

- Look for `[adapter] watching` log
- Trigger submit/intent action
- Verify `firing` log appears

**Check background:**

- `chrome://extensions/` → service worker link
- Verify message received
- Check API call succeeded

**Check icon:**

- Green = auto-tracking enabled
- Gray = manual tracking or non-job page

Full debugging guide: [Debugging Guide](docs/guides/debugging.md)

## Code Conventions

**File naming:** `lowercase-with-hyphens.ts`
**Exports:** `camelCaseAdapter` suffix
**Logging:** `log("adapter", "action →", data)`
**TypeScript:** Strict mode, avoid `any`, optional chaining for DOM
**Error handling:** Return `null` on errors, never throw

**Commit style:**

```text
feat(extension): add Greenhouse Careers adapter
fix(linkedin): handle missing company element in SDUI
test(workday): add fixture-based regression test
```

## Chrome Extension API

**Storage:**

- Use `chrome.storage.local` (NOT sync - 100KB limit)
- Always await: `await chrome.storage.local.get(keys)`
- Batch reads/writes

**Messaging:**

- Background → content: `chrome.tabs.sendMessage(tabId, message)`
- Content → background: `chrome.runtime.sendMessage(message)`
- Return `true` from listener if using `sendResponse` async

**Icons:**

- `chrome.action.setIcon({ tabId, path: ICON_GREEN })` for per-tab state
- Reset on navigation: `tabs.onUpdated` with `changeInfo.status === "loading"`

## Performance

- **MutationObserver:** Use `subtree: true` sparingly (high overhead)
- **Debounce:** Debounce expensive operations triggered by mutations
- **Cleanup:** Always disconnect observers in cleanup function
- **Selectors:** Specific selectors faster than broad queries

## Security

- **CSP:** No inline scripts, eval, or new Function
- **HTTPS:** Only inject on HTTPS pages (except localhost)
- **Storage:** Never store passwords or tokens
- **Messages:** Validate all messages from content scripts

## Architecture Reference

**Design docs:** `../../docs/plans/`

- `tracking-automation-design.md` — Intent tracking architecture, adapter interface, message flow
- `tracking-automation-implementation.md` — Implementation status, metrics, testing

**Development guides:** `docs/guides/`

- `adapter-development.md` — Complete adapter implementation guide
- `testing-adapters.md` — TDD workflow, test patterns, fixture creation
- `intent-tracking.md` — Intent lifecycle, matching rules, edge cases
- `debugging.md` — Chrome DevTools tips, common issues, troubleshooting

**Board research:** `docs/boards/` — 19 board-specific docs with URL patterns, DOM selectors, network requests

## Deployment Checklist

Before publishing to Chrome Web Store:

- [ ] All tests passing (`pnpm test`)
- [ ] TypeScript clean (`pnpm type`)
- [ ] Version bumped in `manifest.json` and `package.json`
- [ ] Icons regenerated (`pnpm gen-icons`)
- [ ] Manual smoke test on 5+ boards
- [ ] Extension builds successfully (`pnpm build:zip`)
- [ ] Changelog updated
- [ ] README updated with new boards
- [ ] Implementation doc updated

## Quick Reference

**Test a selector:** `document.querySelector(".selector")` in page console
**Inspect storage:** `await chrome.storage.local.get(null)` in service worker console
**View service worker logs:** `chrome://extensions/` → service worker link
**Set breakpoint:** DevTools Sources → Content scripts → adapter file
**Check icon state:** Auto-tracking boards show green icon on job pages
**Verify intent:** `await chrome.storage.local.get("pendingIntents")` in service worker

---

For detailed guidance, see the development guides in `docs/guides/`.
