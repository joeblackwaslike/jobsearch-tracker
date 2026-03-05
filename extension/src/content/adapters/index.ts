import { ashbyAdapter } from "./ashby";
import { greenhouseAdapter } from "./greenhouse";
import { indeedAdapter } from "./indeed";
import { leverAdapter } from "./lever";
import { linkedInAdapter } from "./linkedin";
import type { Adapter } from "./types";

// Adapters are registered here as they are implemented.
const adapters: Adapter[] = [
  linkedInAdapter,
  indeedAdapter,
  greenhouseAdapter,
  leverAdapter,
  ashbyAdapter,
  // more adapters added in subsequent tasks
];

/** Look up the adapter for the current hostname. Returns null if unsupported. */
export function findAdapter(hostname: string): Adapter | null {
  return adapters.find((a) => a.hosts.includes(hostname)) ?? null;
}

export { adapters };
export type { Adapter };
