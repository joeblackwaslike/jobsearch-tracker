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
