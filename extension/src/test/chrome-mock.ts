import { vi } from "vitest";

const store: Record<string, unknown> = {};

export const chromeMock = {
  storage: {
    local: {
      get: vi.fn(async (keys?: string | string[] | Record<string, unknown>) => {
        if (!keys) return { ...store };
        if (typeof keys === "string") return { [keys]: store[keys] };
        if (Array.isArray(keys)) {
          return Object.fromEntries(keys.map((k) => [k, store[k]]));
        }
        return Object.fromEntries(Object.keys(keys).map((k) => [k, store[k] ?? (keys as Record<string, unknown>)[k]]));
      }),
      set: vi.fn(async (items: Record<string, unknown>) => {
        Object.assign(store, items);
      }),
      remove: vi.fn(async (keys: string | string[]) => {
        const ks = typeof keys === "string" ? [keys] : keys;
        ks.forEach((k) => delete store[k]);
      }),
      clear: vi.fn(async () => {
        Object.keys(store).forEach((k) => delete store[k]);
      }),
    },
  },
  runtime: {
    sendMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    lastError: undefined as chrome.runtime.LastError | undefined,
  },
  tabs: {
    query: vi.fn(),
    onUpdated: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
  scripting: {
    executeScript: vi.fn(),
  },
} satisfies Partial<typeof chrome>;

export function resetChromeMock() {
  Object.keys(store).forEach((k) => delete store[k]);
  vi.clearAllMocks();
}
