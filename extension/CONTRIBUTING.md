# Contributing to Job Search Tracker Extension

Contributions are welcome! Whether you're fixing bugs, adding new job board adapters, or improving documentation, every bit helps.

## Ways to Contribute

- **Add job board support** — implement adapters for new ATS platforms
- **Fix bugs** — look for issues tagged `extension` + `bug`
- **Improve auto-tracking** — enhance detection logic for existing boards
- **Write tests** — add test coverage for adapters
- **Improve documentation** — board research docs, testing guides, README improvements

## Detailed Guides

For in-depth guidance, see:

- **[Adapter Development Guide](docs/guides/adapter-development.md)** — Complete patterns, DOM best practices, troubleshooting
- **[Testing Adapters Guide](docs/guides/testing-adapters.md)** — TDD workflow, fixture creation, manual testing
- **[Intent Tracking Guide](docs/guides/intent-tracking.md)** — How intent tracking works, matching rules, edge cases
- **[Debugging Guide](docs/guides/debugging.md)** — Chrome DevTools tips, common issues, performance debugging

These guides complement the quick-start instructions below.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 9+
- Chrome browser
- Main application running (for integration testing)

### Setup

1. Fork the repo and clone your fork:

   ```bash
   git clone git@github.com:YOUR_NAME/jobsearch-tracker.git
   cd jobsearch-tracker/extension
   ```

1. Install dependencies:

   ```bash
   pnpm install
   ```

1. Build in watch mode:

   ```bash
   pnpm dev
   ```

1. Load the extension into Chrome:

   - Navigate to `chrome://extensions/`
   - Enable **Developer mode**
   - Click **Load unpacked**
   - Select the `dist/` directory

1. Start the main application (in another terminal):

   ```bash
   cd ../frontend
   pnpm dev
   ```

### Running Tests

```bash
pnpm test          # run tests once
pnpm test:watch    # run tests in watch mode
pnpm exec tsc --noEmit   # TypeScript type check
```

Each adapter has both inline logic tests and fixture-based regression tests. If a fixture test fails but the logic tests pass, the board's HTML changed and the fixture needs recapturing:

```bash
pnpm capture-fixtures            # recapture all public boards
pnpm capture-fixtures:all        # include auth-gated boards (LinkedIn, Wellfound, TeamBlind)
node scripts/capture-fixtures.mjs greenhouse   # recapture one board
```

Fixture URLs are in `scripts/capture-config.yaml` — update the `url` field when a job listing expires. See the [README Testing section](README.md#testing) for the full fixture workflow.

## Development Workflow

### Adding a New Job Board Adapter

> 📖 **See the [Adapter Development Guide](docs/guides/adapter-development.md) for complete patterns, DOM best practices, and troubleshooting.**

1. **Research the board** — capture network traffic and DOM structure:
   - Create `docs/boards/<board-name>.md`
   - Document: URL patterns, DOM selectors, submit detection strategy
   - Use browser DevTools Network tab to identify submission requests
   - See existing board docs for template

2. **Create the adapter** — implement `Adapter` interface:
   - Create `src/content/adapters/<board-name>.ts`
   - Implement `extract()` to parse job data from DOM
   - Implement tracking strategy:
     - `watchForSubmission()` for ATS platforms (Greenhouse, Ashby, etc.)
     - `watchForIntent()` for aggregators (LinkedIn, Wellfound, etc.) — see [Intent Tracking Guide](docs/guides/intent-tracking.md)
     - `getInjectTarget()` for manual button (last resort)

3. **Register the adapter**:
   - Add to `src/content/adapters/index.ts` exports
   - Add URL patterns to `manifest.json` content_scripts matches

4. **Write tests**:
   - Create `src/content/adapters/__tests__/<board-name>.test.ts`
   - Test `extract()` with various DOM structures
   - Test tracking method (`watchForSubmission` or `watchForIntent`)
   - Create minimal HTML fixture in `__tests__/fixtures/<board-name>.html`
   - Add fixture-based regression test

5. **Manual testing**:
   - Visit the job board with extension loaded
   - Verify `extract()` returns correct data (check console logs)
   - Test submission detection or intent recording
   - Verify data syncs to main application
   - Check dynamic icon turns green (auto-tracking) or stays gray (manual)

6. **Update documentation**:
   - Add board to README.md supported boards list
   - Update implementation status in `../../docs/plans/tracking-automation-implementation.md`

### Example: Adding a New Adapter

**File:** `src/content/adapters/example.ts`

```typescript
import type { Adapter, JobData } from "./types";
import { log } from "../debug";

export const exampleAdapter: Adapter = {
  hosts: ["jobs.example.com"],
  source: "Example Jobs",

  extract(): JobData | null {
    // Only run on job detail pages
    if (!location.pathname.includes("/job/")) {
      log("example", "extract() → null: not a job page");
      return null;
    }

    const titleEl = document.querySelector<HTMLElement>(".job-title");
    const companyEl = document.querySelector<HTMLElement>(".company-name");

    if (!titleEl || !companyEl) {
      log("example", "extract() → null: missing DOM elements");
      return null;
    }

    const position = titleEl.textContent?.trim() ?? "";
    const company = companyEl.textContent?.trim() ?? "";

    if (!position || !company) {
      log("example", "extract() → null: empty data");
      return null;
    }

    log("example", "extract() →", position, "@", company);
    return { position, company, url: location.href };
  },

  watchForSubmission(onSubmit: (jobData: JobData) => void): () => void {
    const jobData = this.extract();
    if (!jobData) {
      log("example", "watchForSubmission: extract() → null — no-op");
      return () => {};
    }

    const observer = new MutationObserver(() => {
      // Watch for success state (e.g., form removal, success message)
      const successEl = document.querySelector(".application-success");
      if (successEl) {
        log("example", "watchForSubmission: success detected — firing onSubmit");
        observer.disconnect();
        onSubmit(jobData);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    log("example", "watchForSubmission: watching for success signal");

    return () => observer.disconnect();
  },
};
```

**Register in `index.ts`:**

```typescript
export { exampleAdapter } from "./example";
```

**Add to `manifest.json`:**

```json
{
  "content_scripts": [{
    "matches": [
      "*://jobs.example.com/*",
      // ... other patterns
    ]
  }]
}
```

### Testing Guidelines

> 📖 **See the [Testing Adapters Guide](docs/guides/testing-adapters.md) for complete TDD workflow, fixture creation, and manual testing checklist.**

**Write tests for:**

- ✅ `extract()` returns valid data on job pages
- ✅ `extract()` returns null on non-job pages
- ✅ `extract()` handles missing/malformed DOM gracefully
- ✅ Tracking method (`watchForSubmission` or `watchForIntent`) fires correctly
- ✅ Fixture-based regression test using real captured HTML

**Test structure:**

```typescript
import { describe, expect, it, beforeEach } from "vitest";
import { exampleAdapter } from "../example";

function setLocation(pathname: string): void {
  Object.defineProperty(window, "location", {
    value: { ...window.location, pathname, href: `https://jobs.example.com${pathname}` },
    writable: true,
    configurable: true,
  });
}

describe("exampleAdapter", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  describe("extract()", () => {
    it("extracts job data from DOM", () => {
      setLocation("/job/12345");
      document.body.innerHTML = `
        <div class="job-title">Software Engineer</div>
        <div class="company-name">Acme Corp</div>
      `;
      
      const data = exampleAdapter.extract();
      
      expect(data).not.toBeNull();
      expect(data?.position).toBe("Software Engineer");
      expect(data?.company).toBe("Acme Corp");
    });

    it("returns null when not on job page", () => {
      setLocation("/jobs");
      const data = exampleAdapter.extract();
      expect(data).toBeNull();
    });
  });

  describe("watchForSubmission()", () => {
    it("fires when success element appears", () => {
      setLocation("/job/12345");
      document.body.innerHTML = `
        <div class="job-title">Software Engineer</div>
        <div class="company-name">Acme Corp</div>
      `;

      let submitted = false;
      exampleAdapter.watchForSubmission?.(() => {
        submitted = true;
      });

      // Simulate success state
      document.body.innerHTML += '<div class="application-success">Success!</div>';

      expect(submitted).toBe(true);
    });
  });
});
```

## Code Style

### Adapter Conventions

- **File naming:** Lowercase with hyphens (`greenhouse-careers.ts`, not `GreenhouseCareers.ts`)
- **Export naming:** camelCase with "Adapter" suffix (`greenhouseAdapter`)
- **Logging:** Use `log()` helper with adapter name prefix: `log("greenhouse", "extract() →", data)`
- **DOM queries:** Prefer specific selectors over generic ones
- **Error handling:** Return `null` on errors, log reason
- **Cleanup:** Always return cleanup function from watchers

### TypeScript

- Use strict mode (`tsconfig.json` has `strict: true`)
- Avoid `any` — use proper types or `unknown`
- Prefer explicit return types on public functions
- Use optional chaining (`?.`) for DOM access

### Commit Messages

```text
feat(extension): add Example.com adapter
fix(linkedin): handle missing company element
test(greenhouse): add fixture-based regression test
docs(boards): add Example.com research doc
```

Prefixes: `feat`, `fix`, `test`, `refactor`, `docs`, `chore`
Scope: `extension`, adapter name, or file area

## Submitting a Pull Request

1. **Create a branch:**

   ```bash
   git checkout -b feat/example-adapter
   ```

1. **Make your changes:**

   - Follow the development workflow above
   - Write tests for new functionality
   - Update documentation

1. **Verify everything works:**

   ```bash
   pnpm test              # all tests passing
   pnpm exec tsc --noEmit # no type errors
   pnpm build             # builds successfully
   ```

1. **Manual test in Chrome:**

   - Load unpacked extension
   - Test on actual job board
   - Verify auto-tracking or intent recording
   - Check data syncs to main app

1. **Push and open PR:**

   ```bash
   git push origin feat/example-adapter
   ```

   - Open PR against `main` branch
   - Include description of changes
   - Reference any related issues
   - Add screenshots/GIFs for UI changes

## Pull Request Checklist

- [ ] Tests written and passing
- [ ] TypeScript check passing
- [ ] Manual testing completed in Chrome
- [ ] Documentation updated (README, board docs, implementation status)
- [ ] Commit messages follow convention
- [ ] PR description explains the change
- [ ] Fixtures included for new adapters (if applicable)

## Common Pitfalls

> 📖 **See the [Debugging Guide](docs/guides/debugging.md) for comprehensive troubleshooting, Chrome DevTools tips, and performance debugging.**

**Adapter not loading:**

- Verify URL pattern in `manifest.json` matches
- Check adapter exported from `index.ts`
- Reload extension after code changes

**Extract returns null:**

- DOM selectors may be incorrect (inspect page structure)
- Page may not have loaded yet (retry logic needed)
- Wrong URL pattern (check `location.pathname`)

**Watcher not firing:**

- MutationObserver config may be too narrow
- Success signal may use different DOM/URL pattern
- Check console logs for error messages

**Tests failing:**

- jsdom environment may differ from real browser
- Missing `beforeEach()` cleanup
- Location mock not set
- Missing test fixture

## Getting Help

- **Documentation:** See `README.md` and `docs/` directory
- **Examples:** Look at existing adapters (`greenhouse.ts`, `linkedin.ts`, `workday.ts`)
- **Issues:** Open an issue with `question` label
- **Slack:** #extension-dev channel (if applicable)

## AI Agent Development

**If you're an AI agent** (Claude Code, Gemini CLI, etc.), see [AGENTS.md](AGENTS.md) for:

- Concise project overview and development rules
- TDD workflow requirements
- Chrome extension API patterns
- Links to detailed development guides in `docs/guides/`:
  - [Adapter Development](docs/guides/adapter-development.md)
  - [Testing Adapters](docs/guides/testing-adapters.md)
  - [Intent Tracking](docs/guides/intent-tracking.md)
  - [Debugging](docs/guides/debugging.md)

AGENTS.md is optimized for AI context windows with progressive disclosure.

## Code of Conduct

Be respectful, inclusive, and constructive. We're all here to build something useful together.
