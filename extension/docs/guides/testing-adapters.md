# Testing Adapters Guide

Complete guide for testing job board adapters.

## Test-Driven Development

**All adapter development MUST follow TDD:**

1. **Red:** Write failing test for `extract()` or tracking method
2. **Green:** Implement minimum code to pass
3. **Refactor:** Clean up, add fixture-based regression test
4. **Commit:** One commit per cycle

Never implement an adapter without tests.

## Test File Structure

Every adapter needs a test file at `src/content/adapters/__tests__/<adapter>.test.ts`:

```typescript
import { describe, expect, it, vi } from "vitest";
import { exampleAdapter } from "../example";
import type { JobData } from "../types";
import * as fs from "fs";
import * as path from "path";

function setLocation(pathname: string): void {
  Object.defineProperty(window, "location", {
    value: {
      ...window.location,
      pathname,
      href: `https://jobs.example.com${pathname}`,
    },
    writable: true,
    configurable: true,
  });
}

describe("exampleAdapter", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  describe("hosts", () => {
    it("includes jobs.example.com", () => {
      expect(exampleAdapter.hosts).toContain("jobs.example.com");
    });
  });

  describe("source", () => {
    it("is Example Jobs", () => {
      expect(exampleAdapter.source).toBe("Example Jobs");
    });
  });

  describe("extract()", () => {
    it("returns null on non-job pages", () => {
      setLocation("/about");
      document.body.innerHTML = `<div>About page</div>`;
      expect(exampleAdapter.extract()).toBeNull();
    });

    it("extracts position and company from DOM", () => {
      setLocation("/jobs/12345");
      document.body.innerHTML = `
        <h1 class="job-title">Software Engineer</h1>
        <div class="company-name">Acme Corp</div>
      `;
      const data = exampleAdapter.extract();
      expect(data?.position).toBe("Software Engineer");
      expect(data?.company).toBe("Acme Corp");
      expect(data?.url).toBe("https://jobs.example.com/jobs/12345");
    });

    it("handles missing DOM elements", () => {
      setLocation("/jobs/12345");
      document.body.innerHTML = `<div>incomplete page</div>`;
      expect(exampleAdapter.extract()).toBeNull();
    });
  });

  describe("watchForSubmission()", () => {
    it("fires onSubmit when form is removed", async () => {
      setLocation("/jobs/12345");
      document.body.innerHTML = `
        <h1 class="job-title">Software Engineer</h1>
        <div class="company-name">Acme Corp</div>
        <form id="application-form"></form>
      `;

      const received = await new Promise<JobData>((resolve) => {
        const cleanup = exampleAdapter.watchForSubmission!(resolve);

        // Simulate form removal (submit success)
        setTimeout(() => {
          document.querySelector("#application-form")?.remove();
        }, 10);
      });

      expect(received.position).toBe("Software Engineer");
      expect(received.company).toBe("Acme Corp");
    });

    it("does not fire when extract() returns null", () => {
      setLocation("/about");
      document.body.innerHTML = `<div>not a job page</div>`;
      const callback = vi.fn();
      const cleanup = exampleAdapter.watchForSubmission!(callback);
      expect(() => cleanup()).not.toThrow();
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("extract() — fixture-based regression test", () => {
    it("extracts valid data from real captured HTML", () => {
      const fixturePath = path.join(__dirname, "fixtures/example.html");

      // Skip if fixture doesn't exist yet
      if (!fs.existsSync(fixturePath)) {
        console.warn("⚠️  Skipping fixture test: fixtures/example.html not found");
        console.warn("   Run: npm run capture-fixtures example");
        return;
      }

      const fixtureHTML = fs.readFileSync(fixturePath, "utf-8");
      setLocation("/jobs/12345");
      document.documentElement.innerHTML = fixtureHTML;

      const data = exampleAdapter.extract();

      // Assert that extraction succeeds and returns valid data
      expect(data).not.toBeNull();
      expect(data?.position).toBeTruthy();
      expect(data?.company).toBeTruthy();
      expect(data?.url).toBeTruthy();

      // Log the extracted data for visibility
      console.log(`   Extracted from fixture: ${data?.position} at ${data?.company}`);
    });
  });
});
```

## Required Test Cases

### For `extract()`

1. ✅ Returns valid data on job pages
2. ✅ Returns null on non-job pages
3. ✅ Handles missing DOM elements gracefully
4. ✅ Handles empty/whitespace text content
5. ✅ Validates URL pattern matching

### For `watchForSubmission()`

1. ✅ Fires callback when success signal detected
2. ✅ Does not fire when extract() returns null
3. ✅ Only fires once (idempotent)
4. ✅ Cleanup function works without errors

### For `watchForIntent()`

1. ✅ Fires callback when Apply button clicked
2. ✅ Does not fire when extract() returns null
3. ✅ Only fires once (idempotent)
4. ✅ Cleanup function works without errors
5. ✅ Does not fire for non-Apply button clicks

## Fixture Creation

### Why Minimal Fixtures?

Automated HTML captures are often 100KB+ and break frequently. **Hand-crafted minimal fixtures** (~500 bytes) are better because:

- Only include elements your adapter queries
- Stable across board redesigns
- Fast to load in tests
- Easy to understand and maintain

### Creating a Minimal Fixture

1. **Visit the job board**
2. **Open DevTools** → Elements tab
3. **Inspect elements** your adapter queries
4. **Copy selectors** and minimal HTML structure
5. **Hand-craft fixture** with ONLY required elements

**Example minimal fixture** (`__tests__/fixtures/example.html`):

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Software Engineer | Acme Corp | Example Jobs</title>
</head>
<body>
    <div class="job-container">
        <h1 class="job-title">Software Engineer</h1>
        <div class="company-name">Acme Corp</div>
    </div>
</body>
</html>
```

### Fixture-Based Regression Test

**Purpose:** Catch DOM structure changes on real boards.

**Pattern:**

```typescript
describe("extract() — fixture-based regression test", () => {
  it("extracts valid data from real captured HTML", () => {
    const fixturePath = path.join(__dirname, "fixtures/example.html");

    // Skip if fixture doesn't exist yet (don't fail build)
    if (!fs.existsSync(fixturePath)) {
      console.warn("⚠️  Skipping fixture test: fixtures/example.html not found");
      return;
    }

    const fixtureHTML = fs.readFileSync(fixturePath, "utf-8");
    setLocation("/jobs/12345");
    document.documentElement.innerHTML = fixtureHTML; // Load entire page

    const data = exampleAdapter.extract();

    // Assertions
    expect(data).not.toBeNull();
    expect(data?.position).toBeTruthy();
    expect(data?.company).toBeTruthy();
    expect(data?.url).toBeTruthy();

    // Log for visibility
    console.log(`   Extracted from fixture: ${data?.position} at ${data?.company}`);
  });
});
```

## Running Tests

```bash
# Run all tests once
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run specific test file
npx vitest run src/content/adapters/__tests__/example.test.ts

# Run with coverage
npx vitest run --coverage
```

## Manual Testing Checklist

After implementing an adapter, manually test in Chrome:

### 1. Load Extension

```bash
pnpm dev  # Build in watch mode
```

1. Open `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select `dist/` directory

### 2. Test Extraction

1. Visit a job posting on the board
2. Open DevTools → Console
3. Look for extract logs: `extract() → [position] @ [company]`
4. Verify data is correct

### 3. Test Icon State

**Auto-tracking boards** (watchForSubmission or watchForIntent):

- Icon should turn **green** on job pages
- Icon should be **gray** on non-job pages

**Manual boards** (getInjectTarget):

- Icon always **gray**
- Manual "Track" button appears on page

### 4. Test Submit Detection (watchForSubmission)

1. Fill out application form
2. Click Submit button
3. Look for log: `watchForSubmission: success detected — firing onSubmit`
4. Open extension popup → **Recent** tab
5. Verify job appears in list

### 5. Test Intent Tracking (watchForIntent)

1. Click Apply button (external redirect)
2. Look for log: `watchForIntent: recording intent`
3. Apply on external ATS
4. Look for background log: `Matched intent → [source]`
5. Open extension popup → **Recent** tab
6. Verify job has correct `source` attribution

### 6. Test Edge Cases

- Navigate to non-job pages → should not track
- Reload page mid-flow → watchers should re-initialize
- Open multiple tabs → icon state should be per-tab
- Close tab during apply → no errors in console

## Common Test Failures

### "Element not found" in tests

**Cause:** HTML structure in test doesn't match adapter selectors

**Fix:**

```typescript
// Verify selectors match
document.body.innerHTML = `
  <h1 class="job-title">Engineer</h1>  <!-- Must match querySelector -->
`;
```

### "callback was not called" in watcher tests

**Cause:** Success signal never triggered in test

**Fix:**

```typescript
const cleanup = adapter.watchForSubmission!(callback);

// Trigger success signal
setTimeout(() => {
  document.querySelector("#form")?.remove();  // Simulate form removal
}, 10);
```

### Fixture test skipped

**Cause:** Fixture file doesn't exist yet

**Fix:** Create minimal fixture at `__tests__/fixtures/<adapter>.html`

### Timeout in async tests

**Cause:** Watcher never fires or test doesn't wait long enough

**Fix:**

```typescript
// Increase timeout
it("fires callback", async () => {
  const received = await new Promise<JobData>((resolve) => {
    // ...
  });
}, 10000); // 10 second timeout
```

## Test Performance

**Current stats:** 248 tests across 28 files, ~5 seconds total

**Best practices:**

- Use `beforeEach()` to reset DOM state
- Don't use real network requests (mock if needed)
- Keep fixtures minimal (<1KB)
- Avoid long timeouts in async tests

## Debugging Tests

**Run single test file:**

```bash
npx vitest run src/content/adapters/__tests__/example.test.ts
```

**Run single test case:**

```typescript
it.only("extracts position and company", () => {
  // Only this test runs
});
```

**Add console logs:**

```typescript
it("extracts data", () => {
  const data = adapter.extract();
  console.log("Extracted:", data); // Debug output
  expect(data).not.toBeNull();
});
```

**Check DOM state:**

```typescript
it("extracts data", () => {
  console.log("DOM:", document.body.innerHTML);
  const data = adapter.extract();
  expect(data).not.toBeNull();
});
```
