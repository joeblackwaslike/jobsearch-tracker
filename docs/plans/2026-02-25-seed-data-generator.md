# Seed Data Generator Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Write `supabase/generate-seed.ts`, a TypeScript script that reads `seed.ts` and emits a complete `supabase/seed.sql` with all relational assignments resolved.

**Architecture:** Single `tsx`-runnable script. Assigns UUIDs to entities missing them, round-robins applications across companies, defines 6 explicit event tracks with fresh dates, builds 90%/20% document-to-application assignments, and builds event→contact junction rows. All SQL emitted to stdout via `console.log`, piped to `seed.sql`.

**Tech Stack:** Node.js `crypto.randomUUID()`, `tsx`, TypeScript imports from `./seed.ts`.

---

### Task 1: Export seed arrays and add package.json script

The arrays in `seed.ts` are unexported `const` declarations — the generator can't import them without `export`.

**Files:**
- Modify: `supabase/seed.ts`
- Modify: `frontend/package.json`

**Step 1:** Open `supabase/seed.ts`. At the very end of the file (after the last array `sampleDocuments`), add:

```typescript
export {
  sampleApplications,
  sampleCompanies,
  sampleContacts,
  sampleDocuments,
  sampleInterviews,
};
```

**Step 2:** In `frontend/package.json`, add to `"scripts"`:

```json
"seed:generate": "tsx ../supabase/generate-seed.ts > ../supabase/seed.sql"
```

**Step 3:** Verify seed.ts parses cleanly:

```bash
cd /path/to/repo/frontend && npx tsx --check ../supabase/seed.ts 2>&1
```

Expected: No errors.

**Step 4:** Commit

```bash
git add supabase/seed.ts frontend/package.json
git commit -m "chore: export seed arrays and add seed:generate script"
```

---

### Task 2: Generator scaffold and SQL helpers

**Files:**
- Create: `supabase/generate-seed.ts`

**Step 1:** Create `supabase/generate-seed.ts` with helpers:

```typescript
import { randomUUID } from "node:crypto";
import {
  sampleApplications,
  sampleCompanies,
  sampleContacts,
  sampleDocuments,
  sampleInterviews,
} from "./seed.js";

// ---------------------------------------------------------------------------
// SQL helpers
// ---------------------------------------------------------------------------

/** Escape single quotes for SQL string literals */
function esc(s: string): string {
  return s.replace(/'/g, "''");
}

/** Serialize a JS value to a SQL literal */
function val(v: unknown): string {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "number") return String(v);
  if (v instanceof Date) return `'${v.toISOString().split("T")[0]}'`;
  if (typeof v === "object") return `'${esc(JSON.stringify(v))}'`;
  return `'${esc(String(v))}'`;
}

/** Emit a multi-row INSERT block to the output buffer */
function insertBlock(out: string[], table: string, colStr: string, rowValues: string[][]) {
  if (rowValues.length === 0) return;
  out.push(`  INSERT INTO ${table} (${colStr})`);
  out.push(`  VALUES`);
  rowValues.forEach((rv, i) => {
    const suffix = i < rowValues.length - 1 ? "," : ";";
    out.push(`    (${rv.join(", ")})${suffix}`);
  });
  out.push("");
}
```

**Step 2:** Verify it runs:

```bash
npx tsx supabase/generate-seed.ts 2>&1
```

Expected: No output, no errors.

**Step 3:** Commit

```bash
git add supabase/generate-seed.ts
git commit -m "chore(seed-gen): scaffold with SQL helpers"
```

---

### Task 3: Assign IDs and build entity arrays

**Files:**
- Modify: `supabase/generate-seed.ts`

**Step 1:** Add after the helpers:

```typescript
// ---------------------------------------------------------------------------
// Entities with IDs assigned
// ---------------------------------------------------------------------------

// Companies have hardcoded UUIDs in seed.ts — preserve them
const companies = sampleCompanies.map((c) => ({
  ...c,
  id: c.id ?? randomUUID(),
}));

// Applications get fresh UUIDs; round-robin company assignment
const applications = sampleApplications.map((a, i) => ({
  ...a,
  id: randomUUID(),
  company_id: companies[i % companies.length].id!,
}));

// Documents: preserve existing IDs (parent_id refs depend on them)
const documents = sampleDocuments.map((d) => ({
  ...d,
  id: d.id ?? randomUUID(),
}));

// Contacts already have company_id in seed.ts; just add IDs
const contacts = sampleContacts.map((c) => ({
  ...c,
  id: randomUUID(),
}));
```

**Step 2:** Verify no errors:

```bash
npx tsx supabase/generate-seed.ts 2>&1
```

Expected: No output, no errors.

**Step 3:** Commit

```bash
git add supabase/generate-seed.ts
git commit -m "chore(seed-gen): assign IDs and round-robin company→app"
```

---

### Task 4: Define event tracks and build events array

**Files:**
- Modify: `supabase/generate-seed.ts`

6 tracks. `url` and `duration_minutes` are borrowed FIFO from `sampleInterviews` by matching type. All other fields are explicit.

**Step 1:** Add after entity assignment:

```typescript
// ---------------------------------------------------------------------------
// Event tracks
// ---------------------------------------------------------------------------

function appByStatus(status: string, skip = 0) {
  return applications.filter((a) => a.status === status)[skip];
}

// Borrow url/duration from sampleInterviews FIFO by type
const srcQueues = new Map<string, Array<{ url?: string; duration_minutes?: number }>>();
for (const e of sampleInterviews) {
  const q = srcQueues.get(e.type) ?? [];
  q.push(e);
  srcQueues.set(e.type, q);
}
const srcPtrs = new Map<string, number>();
function borrow(type: string) {
  const q = srcQueues.get(type) ?? [];
  const i = srcPtrs.get(type) ?? 0;
  srcPtrs.set(type, i + 1);
  return { url: q[i]?.url ?? null, duration_minutes: q[i]?.duration_minutes ?? null };
}

const tracks = [
  // Track 1 — interviewing[0]: in progress, technical upcoming
  { appId: appByStatus("interviewing", 0)?.id ?? "", events: [
    { type: "screening-interview",  status: "completed", scheduled_at: "2026-01-15T10:00:00Z" },
    { type: "behavioral-interview", status: "completed", scheduled_at: "2026-01-22T14:00:00Z" },
    { type: "technical-interview",  status: "scheduled", scheduled_at: "2026-02-05T15:00:00Z" },
  ]},
  // Track 2 — interviewing[1]: onsite upcoming
  { appId: appByStatus("interviewing", 1)?.id ?? "", events: [
    { type: "screening-interview",  status: "completed", scheduled_at: "2026-01-10T10:00:00Z" },
    { type: "technical-interview",  status: "completed", scheduled_at: "2026-01-18T14:00:00Z" },
    { type: "behavioral-interview", status: "completed", scheduled_at: "2026-01-25T11:00:00Z" },
    { type: "onsite",               status: "scheduled", scheduled_at: "2026-02-12T09:00:00Z" },
  ]},
  // Track 3 — offer[0]: full pipeline completed
  { appId: appByStatus("offer", 0)?.id ?? "", events: [
    { type: "screening-interview",  status: "completed", scheduled_at: "2025-11-01T10:00:00Z" },
    { type: "technical-interview",  status: "completed", scheduled_at: "2025-11-10T14:00:00Z" },
    { type: "behavioral-interview", status: "completed", scheduled_at: "2025-11-18T15:00:00Z" },
    { type: "onsite",               status: "completed", scheduled_at: "2025-11-25T09:00:00Z" },
  ]},
  // Track 4 — accepted[0]: 3-round pipeline, all completed
  { appId: appByStatus("accepted", 0)?.id ?? "", events: [
    { type: "screening-interview",  status: "completed", scheduled_at: "2025-10-01T10:00:00Z" },
    { type: "behavioral-interview", status: "completed", scheduled_at: "2025-10-10T14:00:00Z" },
    { type: "technical-interview",  status: "completed", scheduled_at: "2025-10-18T15:00:00Z" },
  ]},
  // Track 5 — rejected[0]: process ended after technical
  { appId: appByStatus("rejected", 0)?.id ?? "", events: [
    { type: "screening-interview",  status: "completed", scheduled_at: "2025-11-15T10:00:00Z" },
    { type: "technical-interview",  status: "completed", scheduled_at: "2025-11-22T14:00:00Z" },
  ]},
  // Track 6 — interviewing[2]: just started
  { appId: appByStatus("interviewing", 2)?.id ?? "", events: [
    { type: "screening-interview",  status: "completed", scheduled_at: "2026-01-20T10:00:00Z" },
    { type: "behavioral-interview", status: "scheduled", scheduled_at: "2026-02-03T14:00:00Z" },
  ]},
];

const events = tracks.flatMap((track) =>
  track.events.map((e) => {
    const meta = borrow(e.type);
    return {
      id: randomUUID(),
      application_id: track.appId,
      type: e.type,
      status: e.status,
      scheduled_at: e.scheduled_at,
      url: meta.url,
      duration_minutes: meta.duration_minutes,
      title: null as string | null,
      description: null as string | null,
      notes: "",
    };
  })
);
```

**Step 2:** Verify no errors:

```bash
npx tsx supabase/generate-seed.ts 2>&1
```

Expected: No output, no errors.

**Step 3:** Commit

```bash
git add supabase/generate-seed.ts
git commit -m "chore(seed-gen): define 6 event tracks with fresh dates"
```

---

### Task 5: Build application_documents and event_contacts rows

**Files:**
- Modify: `supabase/generate-seed.ts`

**Step 1:** Add after the events array:

```typescript
// ---------------------------------------------------------------------------
// application_documents  (90% resume, ~20% cover letter)
// ---------------------------------------------------------------------------

const activeResumes = documents.filter((d) => d.type === "resume" && !d.archived_at);
const activeCoverLetters = documents.filter((d) => d.type === "cover-letter" && !d.archived_at);

const appDocRows: Array<{
  id: string; application_id: string; document_id: string;
  name: string; type: string;
  content: string | null | undefined;
  uri: string | null | undefined;
  mime_type: string | null | undefined;
  revision: string | null;
}> = [];

applications.forEach((app, i) => {
  // 90 % get a resume
  if (i < Math.floor(applications.length * 0.9) && activeResumes.length > 0) {
    const doc = activeResumes[i % activeResumes.length];
    appDocRows.push({
      id: randomUUID(), application_id: app.id, document_id: doc.id,
      name: doc.name, type: doc.type,
      content: doc.content ?? null, uri: doc.uri ?? null, mime_type: doc.mime_type ?? null,
      revision: doc.revision != null ? String(doc.revision) : null,
    });
  }
  // Every 5th app (~20 %) gets a cover letter
  if (i % 5 === 0 && activeCoverLetters.length > 0) {
    const doc = activeCoverLetters[Math.floor(i / 5) % activeCoverLetters.length];
    appDocRows.push({
      id: randomUUID(), application_id: app.id, document_id: doc.id,
      name: doc.name, type: doc.type,
      content: doc.content ?? null, uri: doc.uri ?? null, mime_type: doc.mime_type ?? null,
      revision: doc.revision != null ? String(doc.revision) : null,
    });
  }
});

// ---------------------------------------------------------------------------
// event_contacts  (1–3 contacts per event from the event's application's company)
// ---------------------------------------------------------------------------

const contactsByCompany = new Map<string, typeof contacts>();
for (const c of contacts) {
  if (!c.company_id) continue;
  const list = contactsByCompany.get(c.company_id) ?? [];
  list.push(c);
  contactsByCompany.set(c.company_id, list);
}

const appToCompany = new Map(applications.map((a) => [a.id, a.company_id]));

const eventContactRows: Array<{ id: string; event_id: string; contact_id: string }> = [];

events.forEach((event, idx) => {
  const companyId = appToCompany.get(event.application_id);
  if (!companyId) return;
  const compContacts = contactsByCompany.get(companyId);
  if (!compContacts?.length) return;
  const count = (idx % 3) + 1; // cycles 1, 2, 3
  for (let j = 0; j < count && j < compContacts.length; j++) {
    eventContactRows.push({
      id: randomUUID(),
      event_id: event.id,
      contact_id: compContacts[j].id,
    });
  }
});
```

**Step 2:** Verify no errors:

```bash
npx tsx supabase/generate-seed.ts 2>&1
```

Expected: No output, no errors.

**Step 3:** Commit

```bash
git add supabase/generate-seed.ts
git commit -m "chore(seed-gen): build application_documents and event_contacts"
```

---

### Task 6: Emit the full SQL to stdout

**Files:**
- Modify: `supabase/generate-seed.ts`

**Step 1:** Add the SQL emitter at the bottom of the file:

```typescript
// ---------------------------------------------------------------------------
// Emit SQL
// ---------------------------------------------------------------------------

const out: string[] = [];

out.push("-- ===========================================================");
out.push("-- Seed data for local development");
out.push("-- ===========================================================");
out.push("-- Prerequisites:");
out.push("--   1. Run `supabase start`");
out.push("--   2. Sign up at least one user via the app (http://localhost:3000)");
out.push("--   3. Run `supabase db reset` (this file runs automatically)");
out.push("-- ===========================================================");
out.push("");
out.push("DO $$");
out.push("DECLARE");
out.push("  v_user_id UUID;");
out.push("BEGIN");
out.push("  SELECT id INTO v_user_id FROM auth.users ORDER BY created_at ASC LIMIT 1;");
out.push("  IF v_user_id IS NULL THEN");
out.push("    RAISE EXCEPTION 'No users found in auth.users. Sign up at http://localhost:3000 then run supabase db reset.';");
out.push("  END IF;");
out.push("  RAISE NOTICE 'Seeding data for user %', v_user_id;");
out.push("");

insertBlock(out, "companies",
  "id, user_id, name, description, links, industry, size, location, founded, culture, benefits, pros, cons, tech_stack, ratings, tags, researched",
  companies.map((c) => [
    val(c.id), "v_user_id",
    val(c.name), val(c.description ?? null), val(c.links ?? null),
    val(c.industry ?? null), val(c.size ?? null), val(c.location ?? null),
    c.founded instanceof Date ? `'${c.founded.toISOString().split("T")[0]}'` : "NULL",
    val(c.culture ?? null), val(c.benefits ?? null),
    val(c.pros ?? null), val(c.cons ?? null),
    val(c.techStack ?? null), val(c.ratings ?? null),
    val(c.tags ?? null), c.researched ? "true" : "false",
  ])
);

insertBlock(out, "applications",
  "id, user_id, company_id, position, status, work_type, employment_type, location, salary, url, job_description, interest, source, tags, applied_at",
  applications.map((a) => [
    val(a.id), "v_user_id", val(a.company_id),
    val(a.position), val(a.status),
    val(a.work_type ?? null), val(a.employment_type ?? null),
    val(a.location ?? null), val(a.salary ?? null),
    val(a.url ?? null), val(a.job_description ?? null),
    val(a.interest ?? null), val(a.source ?? null),
    val(a.tags ?? null),
    a.applied_at instanceof Date ? `'${a.applied_at.toISOString()}'` : "NULL",
  ])
);

insertBlock(out, "documents",
  "id, user_id, name, type, content, uri, mime_type, revision, parent_id, tags, archived_at",
  documents.map((d) => [
    val(d.id), "v_user_id",
    val(d.name), val(d.type),
    val(d.content ?? null), val(d.uri ?? null), val(d.mime_type ?? null),
    val(d.revision ?? null), val(d.parent_id ?? null),
    val(d.tags ?? null),
    d.archived_at instanceof Date ? `'${d.archived_at.toISOString()}'` : "NULL",
  ])
);

insertBlock(out, "contacts",
  "id, user_id, company_id, name, title, email, phone, linkedin_url, notes",
  contacts.map((c) => [
    val(c.id), "v_user_id",
    val(c.company_id ?? null), val(c.name),
    val(c.title ?? null), val(c.email ?? null),
    val(c.phone ?? null), val(c.linkedin_url ?? null),
    val(c.notes ?? null),
  ])
);

insertBlock(out, "events",
  "id, user_id, application_id, type, status, url, title, description, duration_minutes, scheduled_at, notes",
  events.map((e) => [
    val(e.id), "v_user_id", val(e.application_id),
    val(e.type), val(e.status),
    val(e.url), val(e.title), val(e.description),
    val(e.duration_minutes), val(e.scheduled_at),
    val(e.notes),
  ])
);

insertBlock(out, "application_documents",
  "id, application_id, document_id, name, type, content, uri, mime_type, revision",
  appDocRows.map((r) => [
    val(r.id), val(r.application_id), val(r.document_id),
    val(r.name), val(r.type),
    val(r.content ?? null), val(r.uri ?? null), val(r.mime_type ?? null),
    val(r.revision),
  ])
);

insertBlock(out, "event_contacts",
  "id, event_id, contact_id",
  eventContactRows.map((r) => [val(r.id), val(r.event_id), val(r.contact_id)])
);

out.push("END $$;");

console.log(out.join("\n"));
```

**Step 2:** Run and spot-check output:

```bash
npx tsx supabase/generate-seed.ts 2>&1 | head -40
```

Expected: SQL header + `DO $$` block visible, no TypeScript errors.

```bash
npx tsx supabase/generate-seed.ts 2>&1 | grep "INSERT INTO"
```

Expected: 7 lines, one per table.

**Step 3:** Generate the file:

```bash
cd frontend && npx pnpm run seed:generate
```

Expected: `supabase/seed.sql` created/replaced.

**Step 4:** Spot-check the file:

```bash
head -10 ../supabase/seed.sql          # header present
grep "INSERT INTO" ../supabase/seed.sql # 7 INSERT statements
grep -c "v_user_id" ../supabase/seed.sql # many rows (should be > 100)
```

**Step 5:** Commit

```bash
git add supabase/generate-seed.ts supabase/seed.sql
git commit -m "feat: add seed data generator and regenerate seed.sql with relations"
```

---

### Task 7 (Optional): Verify against local Supabase

Only if local Supabase is running (`supabase status` shows a DB URL).

**Step 1:**

```bash
supabase db reset
```

Expected: `NOTICE:  Seeding data for user <uuid>`. No errors.

**Step 2:** Spot-check row counts:

```bash
supabase db execute --sql "
  SELECT 'companies' as t, COUNT(*) FROM companies
  UNION ALL SELECT 'applications', COUNT(*) FROM applications
  UNION ALL SELECT 'events', COUNT(*) FROM events
  UNION ALL SELECT 'application_documents', COUNT(*) FROM application_documents
  UNION ALL SELECT 'event_contacts', COUNT(*) FROM event_contacts;
"
```

Expected:
- `companies`: 13
- `applications`: 54
- `events`: 18
- `application_documents`: ~60 (49 resumes + ~11 cover letters)
- `event_contacts`: 18–54 (1–3 per event)
