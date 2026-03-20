/**
 * Lightweight debug logger for the JST content script.
 * Logs to console with a coloured prefix and stores the last N entries
 * so the popup can retrieve them via the GET_DEBUG_LOG message.
 */

const MAX_ENTRIES = 60;
const entries: string[] = [];

function ts(): string {
  return new Date().toISOString().slice(11, 23); // HH:MM:SS.mmm
}

export function log(tag: string, ...args: unknown[]): void {
  const msg = `[JST:${tag}] ${args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" ")}`;
  console.log(`%c${msg}`, "color:#4f46e5;font-weight:bold");
  entries.push(`${ts()} ${msg}`);
  if (entries.length > MAX_ENTRIES) entries.shift();
}

export function getLog(): string[] {
  return [...entries];
}
