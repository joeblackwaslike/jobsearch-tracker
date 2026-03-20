# Adapter Development Guide

Complete guide for implementing job board adapters.

## Overview

Each job board has an **adapter** that extracts job data and implements one of three tracking strategies:

1. **Auto-submit detection** (`watchForSubmission`)
2. **Intent tracking** (`watchForIntent`)
3. **Manual button injection** (`getInjectTarget`) — avoid if possible

## Adapter Interface

```typescript
export interface Adapter {
  hosts: string[];                    // Exact hostname matches
  source?: string;                    // Human-readable name (for intent attribution)
  extract(): JobData | null;          // Parse job data from DOM
  
  // Pick ONE tracking strategy:
  watchForSubmission?(onSubmit: (jobData: JobData) => void): () => void;
  watchForIntent?(onIntent: (jobData: JobData) => void): () => void;
  getInjectTarget?(): Element | null;  // LAST RESORT - avoid
}
```

## Choosing a Tracking Strategy

### Use `watchForSubmission` when:

- Board hosts the application form itself (ATS platforms)
- You can detect submit success via DOM mutation or network request
- **Examples:** Greenhouse, Ashby, Lever, Workday, LinkedIn Easy Apply

**Pattern:**
```typescript
watchForSubmission(onSubmit: (jobData: JobData) => void): () => void {
  const jobData = this.extract();
  if (!jobData) return () => {};
  
  const observer = new MutationObserver(() => {
    // Watch for success signal (form removal, success message, URL change)
    if (successCondition) {
      observer.disconnect();
      onSubmit(jobData);
    }
  });
  
  observer.observe(document.body, { childList: true, subtree: true });
  return () => observer.disconnect();
}
```

### Use `watchForIntent` when:

- Board is an aggregator that redirects to external ATS
- You need to record source attribution before redirect
- **Examples:** LinkedIn external apply, Wellfound, Google Jobs, Levels.fyi

**Pattern:**
```typescript
watchForIntent(onIntent: (jobData: JobData) => void): () => void {
  const applyButton = document.querySelector<HTMLAnchorElement>('a.apply-button');
  if (!applyButton) return () => {};
  
  const handleClick = () => {
    const jobData = this.extract();
    if (!jobData) return;
    onIntent(jobData);
  };
  
  applyButton.addEventListener("click", handleClick);
  return () => applyButton.removeEventListener("click", handleClick);
}
```

### Use `getInjectTarget` only when:

- Auto-tracking is impossible (anti-scraping, complex SPA)
- Board is low-signal (Indeed, Dice, ZipRecruiter)
- **This is a LAST RESORT**

## Step-by-Step: Adding a New Adapter

### 1. Research the Board

Create `docs/boards/<board-name>.md`:

```markdown
# Board Name

**URL Pattern:** `https://jobs.example.com/job/{id}`

## DOM Selectors

- **Job Title:** `.job-title` or `h1.position-name`
- **Company:** `.company-name` or `[data-company]`

## Submit Detection

**Strategy:** DOM mutation (form removal)

**Success Signal:**
- Form with id `#application-form` is removed from DOM
- OR URL changes to `/application/success`
- OR `<div class="success-message">` appears

**Network Request:**
- POST to `/api/applications`
- Response 200 = success
```

**Capture network traffic:**
- Open DevTools → Network tab
- Fill out application form
- Click Submit
- Look for POST requests with form data
- Check response for success indicators

### 2. Implement the Adapter

Create `src/content/adapters/<board-name>.ts`:

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

    // Query DOM with multiple fallbacks
    const titleEl =
      document.querySelector<HTMLElement>(".job-title") ??
      document.querySelector<HTMLElement>("h1.position-name");
    
    const companyEl =
      document.querySelector<HTMLElement>(".company-name") ??
      document.querySelector<HTMLElement>("[data-company]");

    if (!titleEl || !companyEl) {
      log("example", "extract() → null: missing DOM elements");
      return null;
    }

    const position = titleEl.textContent?.trim() ?? "";
    const company = companyEl.textContent?.trim() ?? "";

    if (!position || !company) {
      log("example", "extract() → null: empty data after trim");
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

    log("example", "watchForSubmission: watching for success signal");

    const observer = new MutationObserver(() => {
      // Success signal: form removed
      const formGone = !document.querySelector("#application-form");
      
      // Or success message appeared
      const successEl = document.querySelector(".success-message");
      
      if (formGone || successEl) {
        log("example", "watchForSubmission: success detected — firing onSubmit");
        observer.disconnect();
        onSubmit(jobData);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  },
};
```

### 3. Register the Adapter

**In `src/content/adapters/index.ts`:**

```typescript
export { exampleAdapter } from "./example";
```

**In `manifest.json`:**

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

### 4. Write Tests

See [Testing Adapters Guide](testing-adapters.md) for complete test structure.

### 5. Manual Test in Chrome

1. Build: `pnpm dev` (watch mode)
2. Load extension: `chrome://extensions/` → Load unpacked → `dist/`
3. Visit job board
4. Open DevTools console
5. Verify:
   - ✅ Extract logs show correct data
   - ✅ Watcher logs show "watching" message
   - ✅ Icon turns green (auto-tracking)
   - ✅ Submit form → "firing onSubmit" log appears
   - ✅ Data syncs to backend (check popup Recent tab)

### 6. Update Documentation

- Add to `README.md` supported boards list
- Update `../../docs/plans/tracking-automation-implementation.md`

## DOM Query Best Practices

### Prefer Specific Selectors

```typescript
// ✅ Good - specific
document.querySelector(".job-details .title")
document.querySelector('[data-automation-id="jobTitle"]')

// ❌ Bad - generic
document.querySelector("h1")
document.querySelector("div")
```

### Use Multiple Fallbacks

```typescript
// ✅ Good - gracefully handles DOM changes
const titleEl =
  document.querySelector<HTMLElement>(".primary-title") ??
  document.querySelector<HTMLElement>(".job-title") ??
  document.querySelector<HTMLElement>("h1[class*='title']");
```

### Always Validate

```typescript
// ✅ Good - validates at every step
const titleEl = document.querySelector<HTMLElement>(".title");
if (!titleEl) {
  log("adapter", "extract() → null: missing title element");
  return null;
}

const position = titleEl.textContent?.trim();
if (!position) {
  log("adapter", "extract() → null: empty title text");
  return null;
}
```

### Use Optional Chaining

```typescript
// ✅ Good - safe navigation
const company = companyEl?.textContent?.trim() ?? "";

// ❌ Bad - will crash if null
const company = companyEl.textContent.trim();
```

## Intent Tracking Details

### When to Record Intent

**Prefer Apply button click:**
```typescript
watchForIntent(onIntent: (jobData: JobData) => void): () => void {
  const applyBtn = document.querySelector<HTMLAnchorElement>('.apply-button');
  
  const handleClick = () => {
    const jobData = this.extract();
    if (!jobData) return;
    onIntent(jobData);
  };
  
  applyBtn?.addEventListener("click", handleClick);
  return () => applyBtn?.removeEventListener("click", handleClick);
}
```

**Fallback to page load** (if no click event available):
```typescript
watchForIntent(onIntent: (jobData: JobData) => void): () => void {
  const jobData = this.extract();
  if (!jobData) return () => {};
  
  log("adapter", "watchForIntent: recording intent on page load");
  onIntent(jobData);
  return () => {};
}
```

### Decoding ATS Domain

**If destination is in href:**
```typescript
const applyBtn = document.querySelector<HTMLAnchorElement>('.apply-button');
const href = applyBtn?.href;

if (href) {
  try {
    const atsDomain = new URL(href).hostname;
    // Pass domain for high-confidence matching (2-hour TTL)
  } catch {
    // Invalid URL - pass null (30-minute TTL)
  }
}
```

**If href is a redirect wrapper** (LinkedIn, Google):
```typescript
// LinkedIn: /redir/redirect/?url=https%3A%2F%2Fjobs.ashbyhq.com%2F...
const href = applyBtn?.href;
const urlMatch = href?.match(/[?&]url=([^&]+)/);
if (urlMatch) {
  const decodedUrl = decodeURIComponent(urlMatch[1]);
  const atsDomain = new URL(decodedUrl).hostname;
}
```

## Common Patterns

### SPA Navigation Detection

```typescript
watchForSubmission(onSubmit: (jobData: JobData) => void): () => void {
  const jobData = this.extract();
  if (!jobData) return () => {};
  
  let lastUrl = location.href;
  
  const observer = new MutationObserver(() => {
    // Detect SPA navigation
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      
      // Check if navigated to success page
      if (location.pathname.includes("/success")) {
        observer.disconnect();
        onSubmit(jobData);
      }
    }
  });
  
  observer.observe(document.body, { childList: true, subtree: true });
  return () => observer.disconnect();
}
```

### Network Request Detection

```typescript
// Intercept fetch requests
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  const response = await originalFetch(...args);
  
  if (args[0].includes("/api/submit") && response.ok) {
    // Submit detected
    onSubmit(jobData);
  }
  
  return response;
};
```

**Note:** This is fragile. Prefer DOM mutation detection.

### Multi-Step Form Detection

```typescript
watchForSubmission(onSubmit: (jobData: JobData) => void): () => void {
  // Only fire on FINAL step, not intermediate steps
  const observer = new MutationObserver(() => {
    const finalStep = document.querySelector('[data-step="confirmation"]');
    const successText = document.body.textContent?.includes("Application submitted");
    
    if (finalStep && successText) {
      observer.disconnect();
      onSubmit(jobData);
    }
  });
  
  observer.observe(document.body, { childList: true, subtree: true });
  return () => observer.disconnect();
}
```

## Troubleshooting

### Extract Returns Null

1. **Check selectors:** Inspect page, verify DOM structure matches
2. **Check URL pattern:** Log `location.pathname` to verify
3. **Check timing:** Page may not be loaded yet (add retry logic)

### Watcher Not Firing

1. **Check extract():** Must return valid data for watcher to register
2. **Check observer config:** May be too narrow (`childList` only vs. `subtree: true`)
3. **Check success signal:** DOM/URL pattern may be different than expected
4. **Check logs:** Look for "watching" message in console

### Performance Issues

1. **Debounce mutations:** Don't run expensive logic on every mutation
2. **Disconnect observer:** Always disconnect when done
3. **Narrow observer scope:** Watch specific element instead of `document.body` if possible

## Examples to Study

**Simple submit detection:** `src/content/adapters/greenhouse.ts`  
**Intent tracking with click:** `src/content/adapters/linkedin.ts`  
**SPA navigation detection:** `src/content/adapters/workday.ts`  
**Multi-step form:** `src/content/adapters/workable.ts`
