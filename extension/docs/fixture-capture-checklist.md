# Fixture Capture Checklist

## Quick Wins - Manual Capture (7 boards)

### Instructions

For each board:

1. Open the example URL in your browser
2. Wait for page to fully load
3. Right-click → "Save Page As..."
4. Format: "Webpage, HTML Only" (not "Complete" - we don't need images/CSS)
5. Save as: `extension/src/content/adapters/__tests__/fixtures/{adapter-name}.html`
6. Run: `cd extension && npx vitest run src/content/adapters/__tests__/{adapter-name}.test.ts`
7. ✓ Check that extraction works

---

## 🎯 Boards to Capture

### 1. Team Blind

- **Adapter**: `blind.ts`
- **Example URL**: https://www.teamblind.com/post/Software-Engineer-New-York-XYZ-Company-{any-valid-id}
- **Search**: "team blind software engineer jobs"
- **Save as**: `blind.html`
- **Notes**: Simple DOM extraction from job posting page

**Verification**:

```bash
cd extension
npx vitest run src/content/adapters/__tests__/blind.test.ts
```

Expected: Position + Company extracted from DOM

---

### 2. GitHub Jobs

- **Adapter**: `github.ts`
- **Example URL**: https://jobs.github.com/positions/{id}
- **Alternative**: https://github.com/careers (if jobs.github.com is deprecated)
- **Save as**: `github.html`
- **Notes**: GitHub's main job board

**Verification**:

```bash
npx vitest run src/content/adapters/__tests__/github.test.ts
```

---

### 3. GitHub Careers (Variant)

- **Adapter**: `github-careers.ts`
- **Example URL**: Check the adapter's `hosts` array for exact domain
- **Save as**: `github-careers.html`
- **Notes**: Separate from main github jobs board

**Verification**:

```bash
npx vitest run src/content/adapters/__tests__/github-careers.test.ts
```

---

### 4. Lever

- **Adapter**: `lever.ts`
- **Example URL**: https://jobs.lever.co/{any-company}/{job-slug}
  - Try: https://jobs.lever.co/openai/researcher
  - Or: https://jobs.lever.co/stripe/engineer
- **Save as**: `lever.html`
- **Notes**: Very common ATS, simple DOM extraction

**Verification**:

```bash
npx vitest run src/content/adapters/__tests__/lever.test.ts
```

**Look for**:

- Title in `.posting-headline h2` or `h2.posting-title`
- Company from URL subdomain

---

### 5. Wellfound (formerly AngelList)

- **Adapter**: `wellfound.ts`
- **Example URL**: https://wellfound.com/jobs/{job-id}
  - Or with slug: `https://wellfound.com/jobs?job_listing_slug={slug}`
- **Save as**: `wellfound.html`
- **Notes**: Startup-focused job board

**Verification**:

```bash
npx vitest run src/content/adapters/__tests__/wellfound.test.ts
```

**Look for**:

- Title in `h1`
- Company in `a[href*="/company/"]`

---

### 6. Welcome to the Jungle

- **Adapter**: `welcometothejungle.ts`
- **Example URL**: https://www.welcometothejungle.com/en/companies/{company}/jobs/{job-slug}
- **Save as**: `welcometothejungle.html`
- **Notes**: European job board (popular in France)

**Verification**:

```bash
npx vitest run src/content/adapters/__tests__/welcometothejungle.test.ts
```

---

### 7. Y Combinator

- **Adapter**: `ycombinator.ts`
- **Example URL**: https://www.ycombinator.com/companies/{company}/jobs/{job-id}
  - Try: https://www.ycombinator.com/companies/stripe/jobs/
- **Save as**: `ycombinator.html`
- **Notes**: YC company job pages (not Work at a Startup)

**Verification**:

```bash
npx vitest run src/content/adapters/__tests__/ycombinator.test.ts
```

**Look for**:

- Position in `h1`
- Company in `h2` or from URL slug

---

## After Capturing All 7

Run the full test suite to verify everything works:

```bash
cd extension
npx vitest run src/content/adapters/__tests__/
```

Expected results:

- All 15 fixture-based tests should pass (8 existing + 7 new)
- Total coverage: 15/23 adapters (65%)

---

## Next: SPA Fixtures (Playwright Required)

After completing manual capture, we'll set up Playwright for:

1. **workday** - React SPA, wait for `[data-automation-id="jobPostingHeader"]`
2. **google** - Google Jobs panel, MutationObserver for late loading
3. **hackernews** - Two page types (item + jobs list)
4. **indeed** - If no auth required

---

## Troubleshooting

### "Page won't save properly"

- Try "Webpage, HTML Only" instead of "Complete"
- Or use browser DevTools → Elements → Right-click `<html>` → Copy → Copy outerHTML → Paste into .html file

### "Test fails after adding fixture"

- Check that the saved HTML contains the expected selectors
- Look at the test file to see what DOM elements it's looking for
- The test might need minor adjustments if the real HTML structure differs from mocks

### "Can't find a valid example URL"

- Check the adapter's `hosts` array to see valid domains
- Search "{board name} software engineer job" to find a real posting
- The job doesn't need to be active - we just need the HTML structure
