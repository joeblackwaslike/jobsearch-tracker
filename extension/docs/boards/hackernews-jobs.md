# HackerNews Jobs

## domains:

* news.ycombinator.com

---

## Detection

### URL Patterns that identify HN job pages

| Page | URL | Notes |
|------|-----|-------|
| Jobs list | `https://news.ycombinator.com/jobs` | Shows YC startup jobs only |
| More pages | `https://news.ycombinator.com/jobs?next={id}&n={rank}` | Pagination |
| Individual job post | `https://news.ycombinator.com/item?id={id}` | Same format as all HN items |
| Who's Hiring thread | `https://news.ycombinator.com/item?id={id}` | Monthly Ask HN thread |

### How to distinguish a job post from a regular HN story

The `item?id=` URL is shared by all HN content types (stories, jobs, Ask HN, etc). The distinguishing signals are:

**Strongest signal — subtext structure (DOM):**

* Job posts: `<td class="subtext">` contains **only** `<span class="age">` and a hide link. No `<span class="subline">` wrapper, no score, no username "by" link.
* Regular stories: `<td class="subtext">` contains `<span class="subline">` wrapping score, by-user, age, etc.

```html
<!-- Job post subtext (no subline, no score, no by) -->
<td class="subtext">
  <span class="age" title="2026-03-06T17:00:38 ...">
    <a href="item?id=47277679">18 hours ago</a>
  </span> | <a href="hide?id=47277679&goto=...">hide</a>
</td>

<!-- Regular story subtext (has subline, score, by) -->
<td class="subtext">
  <span class="subline">
    <span class="score" id="score_39489920">293 points</span> by
    <a href="user?id=..." class="hnuser">username</a>
    <span class="age">...</span> | hide | ...
  </span>
</td>
```

**HN Firebase API — definitive:**

* `GET https://hacker-news.firebaseio.com/v0/item/{id}.json`
* Job posts have `"type": "job"`
* Regular stories have `"type": "story"`
* The API also gives `"url"` (if external link) or `"text"` (if self-post body)

**Jobs list page context:**

* `<html lang="en" op="jobs">` — the `op` attribute is `"jobs"` on the list page
* Note: individual item pages all have `op="item"` regardless of type

---

## URL Patterns

### Jobs List (`/jobs`)

```text
https://news.ycombinator.com/jobs
https://news.ycombinator.com/jobs?next={lastItemId}&n={startRank}
```

* Contains `<div>` text: "These are jobs at YC startups. See more at ycombinator.com/jobs."
* Each row: `<tr class="athing submission" id="{itemId}">`
* Title link in `<span class="titleline">` — points to apply destination (or `item?id=` for self-posts)
* `<span class="sitebit comhead">` shows the destination domain

### Individual Job Post (`/item?id=`)

```text
https://news.ycombinator.com/item?id={id}
```

Two sub-types:

**Type A — External link job** (the most common form):

* Title `<a href="{externalUrl}">` links directly to YC company page, Ashby, company careers page, etc.
* `<div class="toptext"></div>` is empty
* No comments section populated

**Type B — Self-post (text body) job**:

* Title `<a href="item?id={id}">` links back to itself
* `<div class="toptext" style="margin-top:4px">` contains the job description HTML
* Usually includes a YC or ATS link in the body text
* Example: `Trata (YC W25) Is Hiring Founding Engineers (NYC)` — body text contains YC apply link

### Who's Hiring Thread

```text
https://news.ycombinator.com/item?id={id}
```

* Monthly thread posted by user `whoishiring`
* Type: `"story"` via API (NOT `"job"`)
* Title pattern: `Ask HN: Who is hiring? ({Month} {Year})`
* Each job listing is a top-level comment (`indent="0"`) inside the comment tree
* Job listings in comments are free-form text, not structured
* Typical comment format: `CompanyName | Role | Location | Full time/Part time/Contract`
  followed by description and apply link

---

## Application Method

**Always a redirect to an external destination.** HN job posts do not host application forms.

Observed destination URL patterns (from live `/jobs` page, March 2026):

| Destination | Example | Notes |
|-------------|---------|-------|
| `ycombinator.com/companies/{slug}/jobs/{jobId}` | Majority of YC startups | Lands on YC job detail page |
| `ycombinator.com/companies/{slug}/jobs` | Broader listing page | |
| `jobs.ashbyhq.com/{company}` | Verge Genomics, Legion Health, 9 Mothers, Weave | Ashby ATS |
| `workatastartup.com/jobs/{id}` | Bild AI | Work at a Startup (YC's job board) |
| `company.com/careers` | Roboflow, Flexport, Hightouch | Direct careers page |
| `app.dover.com/apply/{company}/{uuid}` | Activeloop | Dover ATS |
| `bitmovin.com/careers/{jobId}/` | Bitmovin | Greenhouse embedded |
| `padlet.jobs` | Padlet | Custom domain |
| `item?id={id}` (self-post) | Trata | No external link; apply URL buried in body |

---

## Intent Tracking

### Company Name

**From the post title** — HN job titles follow a consistent pattern:

```text
{CompanyName} ({YC batch}) Is Hiring {Role}
```

or

```text
{CompanyName} ({YC batch}): {Role} – {salary/location}
```

DOM selector for title text on the list page:

```css
tr.athing.submission .titleline > a
```

DOM selector for title text on the item page:

```css
table.fatitem tr.athing.submission .titleline > a
```

**Regex to extract company name from title:**

```js
// Handles: "Multifactor (YC F25) Is Hiring..."
// Handles: "Ubicloud (YC W24): Software Engineer..."
// Handles: "Flexport Is Hiring Engineers..."
const titleText = document.querySelector('table.fatitem .titleline > a')?.textContent ?? '';
const companyMatch = titleText.match(/^([^(|:]+?)(?:\s*\(YC [^)]+\))?(?:\s+Is Hiring|\s*:|\s*–)/i);
const companyName = companyMatch?.[1]?.trim() ?? '';
```

### Job Title

Extracted from the HN post title after the company prefix. The title is free-form but often structured:

* "Is Hiring a/an {Role}" → extract the role
* "Is Hiring {Plural Role}" → e.g. "Software Engineers"
* "{CompanyName}: {Role} – {details}" → extract after colon

```js
// After extracting companyName, the remainder of the title is the role context
const roleMatch = titleText.match(/Is Hiring\s+(?:a\s+|an\s+)?(.+?)(?:\s+(?:in|for|at|–|\|).*)?$/i);
const jobTitle = roleMatch?.[1]?.trim() ?? titleText;
```

Note: For self-post jobs (Type B), the title is vague ("Trata (YC W25) Is Hiring Founding Engineers (NYC)") and the actual specific role is in the body text or the linked YC/ATS page.

### Apply / Destination URL

**Type A (external link):** Read directly from the title `<a>` href:

```js
const applyUrl = document.querySelector('table.fatitem .titleline > a')?.href ?? '';
```

**Type B (self-post):** No href on title (it links to `item?id=...` itself). Scan `<div class="toptext">` for the first external link:

```js
const toptext = document.querySelector('table.fatitem div.toptext');
const firstLink = toptext?.querySelector('a[href^="http"]');
const applyUrl = firstLink?.href ?? '';
```

**On the jobs list page** (before navigating to item): the title link href is already the destination URL for Type A, or `item?id=...` for Type B.

---

## Extension Interception Strategy

### Approach: `watchForIntent` on the HN jobs list and job item pages

Since all HN jobs redirect to external sites, there is no on-page application form. The strategy is to record intent when the user clicks through to apply.

**Step 1 — Detect HN job context**

Match on `news.ycombinator.com/jobs` (list) or `news.ycombinator.com/item?id=*` (item page).

For item pages, confirm it is a job (not a regular story) via:

```js
// Quick DOM check: job posts lack <span class="subline"> in subtext
const isJobPost = !!document.querySelector('table.fatitem .subtext')
  && !document.querySelector('table.fatitem .subtext .subline');
```

Alternatively, call the HN API (async, but reliable):

```js
const itemId = new URLSearchParams(location.search).get('id');
const data = await fetch(`https://hacker-news.firebaseio.com/v0/item/${itemId}.json`).then(r => r.json());
const isJob = data.type === 'job';
```

**Step 2 — Extract company and job title from the page title**

```js
const titleEl = document.querySelector('table.fatitem .titleline > a');
const fullTitle = titleEl?.textContent?.trim() ?? document.title.replace(' | Hacker News', '');

// Extract company name
const companyMatch = fullTitle.match(/^([^(]+?)(?:\s*\(YC [^)]+\))?(?:\s+Is Hiring|\s*:)/i);
const company = companyMatch?.[1]?.trim() ?? '';

// Extract job title
const roleMatch = fullTitle.match(/Is Hiring\s+(?:a\s+|an\s+)?(.+?)(?:\s+(?:in\s|for\s|–|\().*)?$/i);
const jobTitle = roleMatch?.[1]?.trim() ?? '';
```

**Step 3 — Identify the apply destination URL**

* **Type A** (external link): `titleEl.href` is already the destination
* **Type B** (self-post, href = `item?id=...`): scan `div.toptext` for first `<a href="http...">` link
* **Jobs list**: each `.titleline > a` href (some are `item?id=` for self-posts)

**Step 4 — Trigger `watchForIntent` when user clicks the apply link**

On the jobs list page:

```js
document.querySelectorAll('tr.athing.submission .titleline > a').forEach(link => {
  link.addEventListener('click', () => {
    const href = link.href;
    if (href.includes('item?id=')) return; // self-post, wait for item page load
    const title = link.closest('tr').querySelector('.titleline').textContent.trim();
    watchForIntent({ source: 'hackernews-jobs', destinationUrl: href, rawTitle: title });
  });
});
```

On the item page (job type confirmed):

```js
const applyLink = document.querySelector('table.fatitem .titleline > a');
const destHref = applyLink?.href ?? '';
if (!destHref.includes('item?id=')) {
  applyLink?.addEventListener('click', () => {
    watchForIntent({ source: 'hackernews-jobs', company, jobTitle, destinationUrl: destHref });
  });
} else {
  // Self-post: find apply link in body
  document.querySelector('div.toptext a[href^="http"]')?.addEventListener('click', e => {
    watchForIntent({ source: 'hackernews-jobs', company, jobTitle, destinationUrl: e.target.href });
  });
}
```

**Step 5 — On page load of a job item page**, record intent immediately (passive signal that user is viewing this job):

```js
// Trigger on page load for any confirmed job item page
if (isJobPost) {
  recordPageView({ source: 'hackernews-jobs', company, jobTitle, url: location.href });
}
```

---

## Who's Hiring Thread Handling

The monthly "Ask HN: Who is hiring?" thread (`type: "story"`, posted by `whoishiring`) is a separate case:

* Thread URL: `news.ycombinator.com/item?id={id}` — NOT flagged as type `"job"` by HN API
* Job listings appear as top-level comments (`indent="0"` in the comment tree)
* Each comment is free-form text; no structured DOM for company/role

**Detection of Who's Hiring thread:**

```js
// Check <title> tag for pattern
const title = document.title;
const isWhoIsHiring = /Ask HN: Who is hiring/i.test(title);
// Also: posted by whoishiring user
const poster = document.querySelector('.subline .hnuser')?.textContent;
const isWhoIsHiring2 = poster === 'whoishiring';
```

**Comment-level job extraction** (harder — free form):

* Each comment div: `div.commtext` inside `tr.athing.comtr[indent="0"]`
* First line of text usually: `CompanyName | Role | Location | ...`
* Apply links are `<a href>` tags within the comment body

**Strategy for Who's Hiring:**
Treat each top-level comment as a potential job. When user clicks an external link from within a `div.commtext`, extract:

* Company: first segment before `|` in first line of comment text
* Role: second segment before `|`
* Destination: clicked link href

This is best-effort parsing — free-form text makes it inherently imprecise.

---

## Notes

### Difficulty: Free-form titles and self-posts

HN job titles are written by humans and are not schema-constrained. Observed formats include:

* `{Company} (YC {batch}) Is Hiring {a/an} {Role}` — most common YC pattern
* `{Company} (YC {batch}): {Role} – {salary/location}` — with colon
* `{Company} (YC {batch}) Is Hiring {RolePlural} ({Location})` — location in parens
* `{Company} Is Hiring` — minimal (no batch, no role detail)
* `{Company} needs a {Role}` — conversational

Regex must be tolerant. Fall back to the full title text when parsing fails.

### HN Jobs vs. Who's Hiring — two different surfaces

| Feature | `/jobs` list + item posts | Who's Hiring comments |
|---------|--------------------------|----------------------|
| HN API type | `job` | `comment` (child of `story`) |
| Structured title | Yes (post title) | No (first line of comment text) |
| Apply link location | Title href or toptext body | Inside comment body |
| DOM detection | Subtext lacks `subline`/score | `div.commtext` in `tr.comtr[indent=0]` |
| Reliability | High | Medium — free-form parsing |

### YC Relationship

`news.ycombinator.com/jobs` exclusively lists jobs from YC-funded companies. It is distinct from:

* `ycombinator.com/jobs` — YC's own job board (fully-featured, filterable)
* `workatastartup.com` — YC's startup hiring platform
* `ycombinator.com/companies/{slug}/jobs/{jobId}` — the most common destination URL for HN job post clicks

The YC job detail page at `ycombinator.com/companies/...` may itself have an application flow worth tracking separately.

### No HN-native application form

HN does not host any application flow. The extension's role here is purely intent tracking (detecting that a user is exploring a job and clicking through), not intercepting an actual submission.
