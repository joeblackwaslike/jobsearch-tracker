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
