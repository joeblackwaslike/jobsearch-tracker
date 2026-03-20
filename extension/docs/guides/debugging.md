# Debugging Guide

Complete guide for debugging Chrome extension issues.

## Chrome DevTools Overview

### Content Script Debugging

Content scripts run in the context of web pages.

**Open DevTools on page:**
1. Visit job board page
2. Press `F12` or `Cmd+Opt+I` (Mac) / `Ctrl+Shift+I` (Windows)
3. Go to **Console** tab for logs
4. Go to **Sources** tab for breakpoints

**View content script logs:**
```javascript
// In your adapter
log("example", "extract() →", position, "@", company);

// Appears in page console as:
// [example] extract() → Software Engineer @ Acme Corp
```

**Set breakpoints:**
1. Open **Sources** tab
2. Expand **Content scripts** section (left sidebar)
3. Find your adapter file
4. Click line number to set breakpoint
5. Trigger action (e.g., click Apply button)

### Service Worker Debugging

Service worker (background script) handles messaging, storage, and API calls.

**Open service worker console:**
1. Navigate to `chrome://extensions/`
2. Find your extension
3. Click **service worker** link (blue text)
4. DevTools opens with background script console

**View background logs:**
```javascript
// In background/index.ts
console.log("Received TRACK message:", data);

// Appears in service worker console only
```

**Inspect storage:**
```javascript
// In service worker console
await chrome.storage.local.get(null)
// Returns all stored data
```

**Check network requests:**
1. Open service worker console
2. Go to **Network** tab
3. Trigger action (e.g., apply to job)
4. See API requests to backend

### Popup Debugging

**Open popup DevTools:**
1. Click extension icon to open popup
2. Right-click inside popup
3. Select **Inspect**
4. DevTools opens for popup

**Features:**
- React DevTools available
- Console for React errors
- Elements tab for DOM inspection
- Network tab for API calls

## Common Issues

### Icon Not Changing Color

**Symptom:** Icon stays gray when it should turn green

**Debug steps:**

1. **Check extract():**
   ```javascript
   // Open page console
   // Look for extract log
   // If null → adapter not detecting job page
   ```

2. **Check AUTO_TRACK_STATUS message:**
   ```javascript
   // In content/index.ts
   log("content", "AUTO_TRACK_STATUS →", hasAutoTracking);
   // Should show true for auto-tracking adapters
   ```

3. **Check background received message:**
   ```javascript
   // In service worker console
   // Look for "Setting icon to green" log
   ```

4. **Check setIcon call:**
   ```javascript
   // In background/index.ts
   chrome.action.setIcon({ tabId, path: ICON_GREEN });
   // Verify tabId is correct
   ```

### Watcher Not Firing

**Symptom:** Submit form but onSubmit never called

**Debug steps:**

1. **Check extract() returns data:**
   ```javascript
   // In page console, run manually:
   const adapter = { /* your adapter */ };
   adapter.extract();
   // Should return { position, company, url }
   ```

2. **Check watcher registered:**
   ```javascript
   // Look for log in console:
   // "[adapter] watchForSubmission: watching for success signal"
   ```

3. **Check success signal:**
   ```javascript
   // Add debug log to observer
   const observer = new MutationObserver(() => {
     console.log("Mutation detected");
     const formGone = !document.querySelector("#form");
     console.log("Form gone?", formGone);

     if (formGone) {
       onSubmit(jobData);
     }
   });
   ```

4. **Verify observer config:**
   ```javascript
   // Too narrow - won't detect deep changes
   observer.observe(document.body, { childList: true });

   // Better - detects all changes
   observer.observe(document.body, { childList: true, subtree: true });
   ```

### Extract Returns Null

**Symptom:** Adapter can't find DOM elements

**Debug steps:**

1. **Check URL pattern:**
   ```javascript
   // In page console
   console.log(location.pathname);
   // Verify it matches adapter's URL pattern check
   ```

2. **Check selectors:**
   ```javascript
   // In page console, test selectors:
   document.querySelector(".job-title");
   // Should return element, not null
   ```

3. **Check timing:**
   ```javascript
   // Page may not be loaded yet
   // Try adding a delay:
   setTimeout(() => {
     const data = adapter.extract();
     console.log("Delayed extract:", data);
   }, 1000);
   ```

4. **Inspect actual DOM:**
   ```javascript
   // In Elements tab, find job title element
   // Right-click → Copy → Copy selector
   // Use exact selector in adapter
   ```

### Backend Sync Failed

**Symptom:** Job tracked but doesn't appear in popup Recent tab

**Debug steps:**

1. **Check TRACK message sent:**
   ```javascript
   // In page console, look for:
   // "Sending TRACK message:" log
   ```

2. **Check background received message:**
   ```javascript
   // In service worker console, look for:
   // "Received TRACK message:" log
   ```

3. **Check API call:**
   ```javascript
   // In service worker Network tab
   // Look for POST to /api/track
   // Check status code (should be 200)
   ```

4. **Check response:**
   ```javascript
   // In service worker console, look for:
   // "Track response:" log
   // Check for errors
   ```

5. **Check storage updated:**
   ```javascript
   // In service worker console:
   const { recent } = await chrome.storage.local.get("recent");
   console.log("Recent jobs:", recent);
   ```

### Intent Not Matched

**Symptom:** Applied via external ATS but source not attributed

**Debug steps:**

1. **Check intent recorded:**
   ```javascript
   // In page console when clicking Apply:
   // "[adapter] watchForIntent: recording intent"
   ```

2. **Check intent stored:**
   ```javascript
   // In service worker console:
   const { pendingIntents } = await chrome.storage.local.get("pendingIntents");
   console.log("Pending intents:", pendingIntents);
   ```

3. **Check matching criteria:**
   ```javascript
   // In service worker console when tracking:
   // "Matching intent for: Acme Corp"
   // "Found matching intent → LinkedIn"
   ```

4. **Check TTL not expired:**
   ```javascript
   // High-confidence: 2 hours (7,200,000 ms)
   // Low-confidence: 30 minutes (1,800,000 ms)
   const now = Date.now();
   const { timestamp, atsDomain } = intent;
   const ttl = atsDomain ? 7_200_000 : 1_800_000;
   const expired = now > timestamp + ttl;
   console.log("Expired?", expired);
   ```

## Performance Debugging

### Slow Content Script

**Symptom:** Page load slow when extension enabled

**Debug steps:**

1. **Check observer scope:**
   ```javascript
   // Bad - observes entire page
   observer.observe(document.body, { childList: true, subtree: true });

   // Better - observes specific container
   const container = document.querySelector("#job-container");
   observer.observe(container, { childList: true, subtree: true });
   ```

2. **Profile mutations:**
   ```javascript
   // In page Performance tab
   // Start recording
   // Trigger mutations
   // Stop recording
   // Look for long tasks in observer callback
   ```

3. **Debounce expensive operations:**
   ```javascript
   let debounceTimer: number | undefined;

   const observer = new MutationObserver(() => {
     clearTimeout(debounceTimer);
     debounceTimer = setTimeout(() => {
       // Expensive check
     }, 100);
   });
   ```

### Memory Leaks

**Symptom:** Memory usage grows over time

**Debug steps:**

1. **Check observer cleanup:**
   ```javascript
   // BAD - observer never disconnected
   watchForSubmission(onSubmit) {
     const observer = new MutationObserver(() => { /* ... */ });
     observer.observe(document.body, { childList: true, subtree: true });
     return () => {}; // LEAK!
   }

   // GOOD - observer disconnected
   watchForSubmission(onSubmit) {
     const observer = new MutationObserver(() => { /* ... */ });
     observer.observe(document.body, { childList: true, subtree: true });
     return () => observer.disconnect(); // ✅
   }
   ```

2. **Check event listener cleanup:**
   ```javascript
   // BAD - listener never removed
   watchForIntent(onIntent) {
     const btn = document.querySelector("button");
     btn?.addEventListener("click", () => onIntent(data));
     return () => {}; // LEAK!
   }

   // GOOD - listener removed
   watchForIntent(onIntent) {
     const btn = document.querySelector("button");
     const handler = () => onIntent(data);
     btn?.addEventListener("click", handler);
     return () => btn?.removeEventListener("click", handler); // ✅
   }
   ```

3. **Profile memory:**
   ```javascript
   // In page Memory tab
   // Take heap snapshot before action
   // Perform action multiple times
   // Take heap snapshot after
   // Compare for retained objects
   ```

## Advanced Debugging

### Network Request Interception

**Capture form submission:**

```javascript
// Override fetch to log requests
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  console.log("Fetch:", args[0], args[1]);
  const response = await originalFetch(...args);
  console.log("Response:", response.status, await response.clone().text());
  return response;
};
```

**Capture XHR:**

```javascript
// Override XMLHttpRequest to log requests
const originalOpen = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function(...args) {
  console.log("XHR:", args[0], args[1]);
  return originalOpen.apply(this, args);
};
```

### DOM Mutation Logging

**Log all mutations:**

```javascript
const observer = new MutationObserver((mutations) => {
  mutations.forEach(mutation => {
    console.log("Mutation type:", mutation.type);
    console.log("Added nodes:", mutation.addedNodes);
    console.log("Removed nodes:", mutation.removedNodes);
  });
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
  attributes: true,
  characterData: true
});
```

### Message Flow Tracing

**Trace message flow:**

```javascript
// In content script
chrome.runtime.sendMessage({ type: "TRACK", data });
console.log("→ Sent TRACK message");

// In background script
chrome.runtime.onMessage.addListener((message, sender) => {
  console.log("← Received message:", message.type, "from tab", sender.tab?.id);
  // Process message
  console.log("→ Sending response");
});
```

## Logging Best Practices

### Use Consistent Prefixes

```javascript
// Good - easy to filter
log("linkedin", "extract() →", data);
log("linkedin", "watchForIntent: clicked Apply");

// Bad - hard to search
console.log("Got data:", data);
console.log("Clicked button");
```

### Log Important State Changes

```javascript
// Always log:
log("adapter", "extract() → null: reason");
log("adapter", "watchForSubmission: watching");
log("adapter", "watchForSubmission: fired");
log("adapter", "cleanup: disconnecting observer");

// Don't log on every mutation:
const observer = new MutationObserver(() => {
  // console.log("mutation"); // TOO NOISY
  if (successCondition) {
    log("adapter", "success detected"); // ✅
  }
});
```

### Use Structured Logs

```javascript
// Good - parseable
log("adapter", "extract() →", { position, company, url });

// Bad - hard to parse
log("adapter", `Extracted ${position} at ${company} (${url})`);
```

## Tools

### Recommended DevTools Extensions

- **React Developer Tools** - Debug React components in popup
- **Redux DevTools** - If using Redux for state management
- **JSON Formatter** - Pretty-print JSON in console

### External Tools

- **Playwright** - Automated testing for adapters
- **Vitest** - Unit testing framework
- **Chrome DevTools Protocol** - Programmatic debugging

## Debugging Checklist

Before reporting a bug, verify:

- [ ] Extension reloaded after code changes
- [ ] Browser cache cleared
- [ ] DevTools open in correct context (page vs. service worker vs. popup)
- [ ] Logs visible in console
- [ ] Network tab shows expected requests
- [ ] Storage contains expected data
- [ ] No errors in console
- [ ] Tested on fresh browser profile
