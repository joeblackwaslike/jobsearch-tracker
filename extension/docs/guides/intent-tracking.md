# Intent Tracking Guide

Complete guide for understanding and implementing intent tracking.

## What is Intent Tracking?

**Intent tracking** records the user's _intent to apply_ before they leave the aggregator site and apply on an external ATS platform.

### Why Intent Tracking?

**Problem:** Aggregator job boards (LinkedIn, Wellfound, Google Jobs) redirect users to external ATS platforms. By the time the application is submitted, the original source is lost.

**Solution:** Record an "intent" before redirect, then match it later when the submission is detected on the ATS.

### Intent Lifecycle

```text
1. User clicks "Apply" on LinkedIn
   → Content script records intent: { company: "Acme", source: "LinkedIn", atsDomain: "ashbyhq.com" }

2. User redirects to Ashby ATS
   → Ashby adapter detects submission

3. Background script matches intent
   → Looks for pending intent matching "Acme" + "ashbyhq.com"
   → Attributes submission to "LinkedIn"

4. Intent is consumed and removed
```

## Recording Intent

### When to Record

**Prefer:** Record on Apply button click (before redirect)

```typescript
watchForIntent(onIntent: (jobData: JobData) => void): () => void {
  const applyBtn = document.querySelector<HTMLAnchorElement>('.apply-button');

  const handleClick = () => {
    const jobData = this.extract();
    if (!jobData) return;

    // Decode ATS domain from href
    const href = applyBtn?.href;
    let atsDomain: string | null = null;

    if (href) {
      try {
        atsDomain = new URL(href).hostname;
      } catch {
        // Invalid URL - atsDomain stays null
      }
    }

    onIntent({ ...jobData, atsDomain });
  };

  applyBtn?.addEventListener("click", handleClick);
  return () => applyBtn?.removeEventListener("click", handleClick);
}
```

**Fallback:** Record on page load (if no click event available)

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

**High-confidence intent** requires knowing the destination ATS domain.

#### Direct href

```typescript
// Example: <a href="https://jobs.ashbyhq.com/acme/...">Apply</a>
const href = applyBtn?.href;
if (href) {
  try {
    const atsDomain = new URL(href).hostname;
    // "jobs.ashbyhq.com"
  } catch {
    const atsDomain = null; // Invalid URL
  }
}
```

#### Redirect wrapper (LinkedIn, Google)

```typescript
// LinkedIn: /redir/redirect/?url=https%3A%2F%2Fjobs.ashbyhq.com%2F...
const href = applyBtn?.href;
const urlMatch = href?.match(/[?&]url=([^&]+)/);

if (urlMatch) {
  const decodedUrl = decodeURIComponent(urlMatch[1]);
  const atsDomain = new URL(decodedUrl).hostname;
  // "jobs.ashbyhq.com"
}
```

#### POST redirect (form submission)

```typescript
// Form submits to /redirect with hidden input containing destination
const form = document.querySelector<HTMLFormElement>('form.apply');
const destinationInput = form?.querySelector<HTMLInputElement>('input[name="destination"]');
const atsDomain = destinationInput?.value ? new URL(destinationInput.value).hostname : null;
```

## Intent Storage

### Storage Schema

```typescript
interface PendingIntent {
  company_name: string;      // Normalized company name (lowercase, trimmed)
  source: string;            // Source board (e.g., "LinkedIn")
  url: string;               // Original job posting URL
  timestamp: number;         // Date.now() when recorded
  atsDomain: string | null;  // Destination ATS domain (e.g., "ashbyhq.com")
}

// Stored as array in chrome.storage.local
{ pendingIntents: PendingIntent[] }
```

### Time-to-Live (TTL)

**High-confidence intents** (atsDomain known): **2 hours** (7,200,000 ms)

**Low-confidence intents** (atsDomain unknown): **30 minutes** (1,800,000 ms)

**Cleanup:** Lazy pruning on read/write (no periodic timers)

### Deduplication

**Rule:** Only one intent per `(source, atsDomain)` pair

```typescript
// New intent with same source + atsDomain replaces existing
const existingIndex = intents.findIndex(
  i => i.source === newIntent.source && i.atsDomain === newIntent.atsDomain
);

if (existingIndex >= 0) {
  intents[existingIndex] = newIntent; // Replace
} else {
  intents.push(newIntent); // Add new
}
```

## Intent Matching

### Matching Criteria

When a submission is detected on an ATS, the background script searches for a matching intent:

```typescript
function resolveIntent(company_name: string, atsDomain?: string): PendingIntent | null {
  const intents = await getPendingIntents(); // Auto-prunes expired
  const normalized = company_name.toLowerCase().trim();

  // 1. Try high-confidence match (atsDomain + company)
  if (atsDomain) {
    const match = intents.find(
      i => i.atsDomain === atsDomain && i.company_name === normalized
    );
    if (match) return match;
  }

  // 2. Fallback to low-confidence match (company only, within 30 min)
  const match = intents.find(i => i.company_name === normalized);
  if (match) return match;

  return null;
}
```

### Matching Examples

**High-confidence match:**

```text
Intent: { company_name: "acme corp", source: "LinkedIn", atsDomain: "ashbyhq.com", timestamp: T }
Submit: { company_name: "Acme Corp", atsDomain: "ashbyhq.com", timestamp: T+1h }
→ MATCH ✅ (normalized company + atsDomain match)
```

**Low-confidence match:**

```text
Intent: { company_name: "stripe", source: "Wellfound", atsDomain: null, timestamp: T }
Submit: { company_name: "Stripe", atsDomain: "greenhouse.io", timestamp: T+10min }
→ MATCH ✅ (normalized company match, within 30 min)
```

**No match (expired):**

```text
Intent: { company_name: "openai", source: "LinkedIn", atsDomain: null, timestamp: T }
Submit: { company_name: "OpenAI", timestamp: T+45min }
→ NO MATCH ❌ (low-confidence intent expired after 30 min)
```

**No match (different company):**

```text
Intent: { company_name: "anthropic", source: "LinkedIn", atsDomain: "ashbyhq.com", timestamp: T }
Submit: { company_name: "Stripe", atsDomain: "ashbyhq.com", timestamp: T+10min }
→ NO MATCH ❌ (company names don't match)
```

## Message Flow

### 1. Content Script Records Intent

```typescript
// In content/index.ts
function setupIntentWatcher(): void {
  const adapter = findAdapter(location.hostname);
  if (!adapter?.watchForIntent) return;

  adapter.watchForIntent((jobData) => {
    chrome.runtime.sendMessage({
      type: "RECORD_INTENT",
      data: {
        ...jobData,
        source: adapter.source ?? adapter.hosts[0] ?? "unknown"
      }
    });
  });
}
```

### 2. Background Script Stores Intent

```typescript
// In background/index.ts
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.type === "RECORD_INTENT") {
    const intent: PendingIntent = {
      company_name: message.data.company_name.toLowerCase().trim(),
      source: message.data.source,
      url: message.data.url,
      timestamp: Date.now(),
      atsDomain: message.data.atsDomain ?? null
    };

    await storePendingIntent(intent);
  }
});
```

### 3. Content Script Detects Submission

```typescript
// In content/index.ts (ATS adapter)
function setupSubmitWatcher(): void {
  const adapter = findAdapter(location.hostname);
  if (!adapter?.watchForSubmission) return;

  adapter.watchForSubmission((jobData) => {
    chrome.runtime.sendMessage({
      type: "TRACK",
      data: jobData // May not have source yet
    });
  });
}
```

### 4. Background Script Matches Intent

```typescript
// In background/index.ts
chrome.runtime.onMessage.addListener(async (message, sender) => {
  if (message.type === "TRACK") {
    let data = message.data;

    // If source missing, try to match intent
    if (!data.source) {
      const atsDomain = sender.url ? new URL(sender.url).hostname : undefined;
      const intent = await resolveIntent(data.company_name, atsDomain);

      if (intent) {
        data = {
          ...data,
          source: intent.source,
          url: data.url || intent.url
        };

        await removePendingIntent(intent); // Consume intent
      }
    }

    // Track to backend
    await trackJob(data);
  }
});
```

## Edge Cases

### Multiple Intents for Same Company

**Scenario:** User clicks Apply on LinkedIn and Wellfound for the same company

**Behavior:**

- Both intents stored (different source)
- First submission consumes first matching intent
- Second submission finds no intent (already consumed)

**Workaround:** If both redirects go to same ATS domain, high-confidence match ensures correct attribution

### Intent Expires Before Submission

**Scenario:** User clicks Apply, gets distracted, submits 3 hours later

**Behavior:**

- Low-confidence intent (no atsDomain): expires after 30 min ❌
- High-confidence intent (atsDomain): expires after 2 hours ❌
- Submission has no source attribution

**Workaround:** Increase TTL for high-confidence intents if needed (currently 2 hours)

### ATS Domain Changes

**Scenario:** LinkedIn shows `lever.co` but redirects to `jobs.lever.co`

**Behavior:**

- Intent stored with `lever.co`
- Submission on `jobs.lever.co`
- No high-confidence match (different domains)
- Falls back to low-confidence match (company name only)

**Workaround:** Normalize ATS domains (strip `jobs.` prefix, etc.)

### Company Name Mismatch

**Scenario:** LinkedIn shows "Anthropic PBC" but ATS shows "Anthropic"

**Behavior:**

- Intent: `{ company_name: "anthropic pbc", ... }`
- Submit: `{ company_name: "anthropic", ... }`
- No match (different normalized names)

**Workaround:** Fuzzy matching (Levenshtein distance, common suffix removal)

## Implementation Patterns

### Pattern 1: Click with ATS Domain

**Best for:** Aggregators with direct links to ATS

```typescript
watchForIntent(onIntent: (jobData: JobData) => void): () => void {
  const applyBtn = document.querySelector<HTMLAnchorElement>('.apply');
  if (!applyBtn) return () => {};

  const handleClick = () => {
    const jobData = this.extract();
    if (!jobData) return;

    const href = applyBtn.href;
    const atsDomain = href ? new URL(href).hostname : null;

    onIntent({ ...jobData, atsDomain });
  };

  applyBtn.addEventListener("click", handleClick);
  return () => applyBtn.removeEventListener("click", handleClick);
}
```

### Pattern 2: Click with Redirect Decoding

**Best for:** Aggregators that wrap redirect URLs

```typescript
watchForIntent(onIntent: (jobData: JobData) => void): () => void {
  const applyBtn = document.querySelector<HTMLAnchorElement>('.apply');
  if (!applyBtn) return () => {};

  const handleClick = () => {
    const jobData = this.extract();
    if (!jobData) return;

    // Decode wrapped URL
    const href = applyBtn.href;
    const urlMatch = href?.match(/[?&]url=([^&]+)/);
    let atsDomain: string | null = null;

    if (urlMatch) {
      try {
        const decodedUrl = decodeURIComponent(urlMatch[1]);
        atsDomain = new URL(decodedUrl).hostname;
      } catch {
        atsDomain = null;
      }
    }

    onIntent({ ...jobData, atsDomain });
  };

  applyBtn.addEventListener("click", handleClick);
  return () => applyBtn.removeEventListener("click", handleClick);
}
```

### Pattern 3: Page Load (No Click Available)

**Best for:** Aggregators that auto-redirect or use JavaScript navigation

```typescript
watchForIntent(onIntent: (jobData: JobData) => void): () => void {
  const jobData = this.extract();
  if (!jobData) return () => {};

  // Cannot determine atsDomain from page load
  log("adapter", "watchForIntent: recording low-confidence intent on page load");
  onIntent({ ...jobData, atsDomain: null });

  return () => {};
}
```

## Debugging Intent Tracking

### Check Intent Recorded

```javascript
// In page console after clicking Apply
// Look for log:
// "[adapter] watchForIntent: recording intent"

// In service worker console
const { pendingIntents } = await chrome.storage.local.get("pendingIntents");
console.log("Pending intents:", pendingIntents);
```

### Check Intent Matched

```javascript
// In service worker console during submission
// Look for log:
// "Matching intent for: Acme Corp"
// "Found matching intent → LinkedIn"

// Or no match:
// "Matching intent for: Acme Corp"
// "No matching intent found"
```

### Check TTL

```javascript
const { pendingIntents } = await chrome.storage.local.get("pendingIntents");
const now = Date.now();

pendingIntents.forEach(intent => {
  const ttl = intent.atsDomain ? 7_200_000 : 1_800_000;
  const age = now - intent.timestamp;
  const remaining = ttl - age;
  const expired = remaining <= 0;

  console.log({
    company: intent.company_name,
    source: intent.source,
    atsDomain: intent.atsDomain,
    age: `${Math.floor(age / 60000)} min`,
    remaining: `${Math.floor(remaining / 60000)} min`,
    expired
  });
});
```

### Manually Remove Intent

```javascript
// In service worker console
const { pendingIntents } = await chrome.storage.local.get("pendingIntents");
const filtered = pendingIntents.filter(i => i.company_name !== "acme corp");
await chrome.storage.local.set({ pendingIntents: filtered });
```

## Best Practices

1. **Always decode atsDomain when possible** - Enables high-confidence matching
2. **Normalize company names** - Lowercase + trim before storing
3. **Log intent lifecycle** - Record, match, consume
4. **Handle edge cases gracefully** - Missing atsDomain, invalid URLs, expired intents
5. **Test cross-board flows** - Apply on aggregator → submit on ATS
