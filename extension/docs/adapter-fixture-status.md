# Adapter Fixture Status Report

Generated: 2026-03-10

## Summary

- **Total adapters**: 23
- **With regression test fixtures**: 8 (35%)
- **Without fixtures**: 15 (65%)
- **No test file at all**: 3 (dice, workday, ziprecruiter)

---

## ✓ Adapters WITH Fixtures (8)

| Adapter | Fixture Size | Test Status | Notes |
|---------|--------------|-------------|-------|
| aijobs | 36 KB | ✓ Passing | - |
| ashby | 107 KB | ✓ Passing | GraphQL-based, S3 uploads |
| builtin | 818 KB | ✓ Passing | Large fixture, 15s timeout |
| greenhouse | 146 KB | ✓ Passing | Standard Greenhouse boards |
| greenhouse-careers | 239 KB | ✓ Passing | Custom domain variant |
| levels | 254 KB | ✓ Passing | - |
| startupjobs | 143 KB | ✓ Passing | - |
| workable | 82 KB | ✓ Passing | Cloudflare Turnstile |

---

## ✗ Adapters WITHOUT Fixtures (15)

### 🔒 Authentication Required

| Adapter | Status | Blocker | Options |
|---------|--------|---------|---------|
| **linkedin** | Has tests (no fixture) | Requires auth + GraphQL SDUI | • Playwright with session cookies<br>• Manual fixture capture from authenticated session<br>• Mock GraphQL responses |
| **workatastartup** | Has tests (no fixture) | Y Combinator auth required | • Playwright with YC login<br>• Manual capture after login |

### 🚧 Technical Challenges

| Adapter | Status | Challenge | Options |
|---------|--------|-----------|---------|
| **workday** | NO TEST FILE | Full SPA (React), client-side rendering only | • Playwright to capture fully-rendered DOM<br>• Wait for `[data-automation-id="jobPostingHeader"]`<br>• Extract from subdomain for company |
| **dice** | NO TEST FILE | Unknown (needs investigation) | • Research board structure<br>• Determine if worth supporting |
| **ziprecruiter** | NO TEST FILE | Unknown (needs investigation) | • Research board structure<br>• Determine if worth supporting |
| **google** | Has tests (no fixture) | Google Jobs SPA with dynamic panels | • Playwright with MutationObserver timing<br>• Capture late-loading job panel |
| **hackernews** | Has tests (no fixture) | Multiple page types (/item vs /jobs list) | • Need 2 fixtures (item page + jobs list)<br>• External link detection |
| **indeed** | Has tests (no fixture) | Large job board, possible auth walls | • Research if auth needed<br>• Capture job detail page |

### 📝 Simple DOM Extraction (Low-Hanging Fruit)

| Adapter | Status | Why No Fixture Yet | Options |
|---------|--------|-------------------|---------|
| **blind** | Has tests (no fixture) | Simple DOM, just needs capture | • Manual save-as from Team Blind job page<br>• Should be straightforward |
| **github** | Has tests (no fixture) | Simple DOM, just needs capture | • Save from github.com/jobs<br>• Public job board |
| **github-careers** | Has tests + doc (no fixture) | Simple DOM, just needs capture | • Different from main github jobs<br>• Career site variant |
| **lever** | Has tests + doc (no fixture) | Simple DOM, just needs capture | • Save from jobs.lever.co/{company}<br>• Confirmation page needs testing |
| **wellfound** | Has tests + doc (no fixture) | Simple DOM, just needs capture | • Save from wellfound.com/jobs<br>• Used to be AngelList |
| **welcometothejungle** | Has tests + doc (no fixture) | Simple DOM, just needs capture | • Save from welcometothejungle.com<br>• European job board |
| **ycombinator** | Has tests + doc (no fixture) | Simple DOM, just needs capture | • Save from ycombinator.com/companies/*/jobs/*<br>• Public job board |

---

## Recommended Approach

### Phase 1: Quick Wins (Estimated: 1-2 hours)

Capture fixtures for simple DOM-based boards (no auth, no SPA complications):

1. **blind** - Team Blind job posting
2. **github** - github.com/jobs
3. **github-careers** - Career site variant
4. **lever** - jobs.lever.co
5. **wellfound** - wellfound.com/jobs
6. **welcometothejungle** - European board
7. **ycombinator** - YC company job pages

**Method**: Manual browser "Save Page As" → HTML, place in fixtures/

### Phase 2: SPA Challenges (Estimated: 3-4 hours)

Use Playwright to capture fully-rendered pages:

1. **workday** - Wait for React SPA to render
2. **google** - Wait for job panel to load
3. **hackernews** - Capture both page types
4. **indeed** - If no auth required

**Method**: Playwright script with proper wait conditions

### Phase 3: Authentication Required (Estimated: 4-6 hours)

Handle auth flows with Playwright:

1. **linkedin** - Most complex (GraphQL + SDUI)
2. **workatastartup** - YC auth

**Method**: Playwright with saved session cookies OR manual capture

### Phase 4: Research Needed

Investigate whether these are worth supporting:

1. **dice** - Check if commonly used
2. **ziprecruiter** - Check if commonly used

---

## Next Steps

**Immediate action** (if you want to continue Phase 1):
Run the fixture capture script for the 7 low-hanging fruit adapters listed above. This would bring fixture coverage from 35% → 65%.

**Alternative**: Jump to Phase 2 and set up Playwright infrastructure for SPA testing.
