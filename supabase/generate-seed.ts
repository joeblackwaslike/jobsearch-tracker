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
