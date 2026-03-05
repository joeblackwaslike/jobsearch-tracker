import type { Adapter } from "./types";

// Adapters are registered here as they are implemented.
// Import each and add to the array.
const adapters: Adapter[] = [
  // adapters added in subsequent tasks
];

/** Look up the adapter for the current hostname. Returns null if unsupported. */
export function findAdapter(hostname: string): Adapter | null {
  return adapters.find((a) => a.hosts.includes(hostname)) ?? null;
}

export { adapters };
export type { Adapter };
