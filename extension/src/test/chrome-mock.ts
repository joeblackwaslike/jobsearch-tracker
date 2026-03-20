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
        return Object.fromEntries(
          Object.keys(keys).map((k) => [k, store[k] ?? (keys as Record<string, unknown>)[k]]),
        );
        // biome-ignore lint/suspicious/noExplicitAny: Chrome storage.get has overloaded signatures not expressible in vi.fn() generics
      }) as any,
      set: vi.fn(async (items: Record<string, unknown>) => {
        Object.assign(store, items);
      }),
      remove: vi.fn(async (keys: string | string[]) => {
        const ks = typeof keys === "string" ? [keys] : keys;
        for (const k of ks) delete store[k];
      }),
      clear: vi.fn(async () => {
        for (const k of Object.keys(store)) delete store[k];
      }),
    },
  },
  runtime: {
    sendMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
      // biome-ignore lint/suspicious/noExplicitAny: partial Chrome API mock
    } as any,
    lastError: undefined as chrome.runtime.LastError | undefined,
  },
  tabs: {
    query: vi.fn(),
    onUpdated: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
      // biome-ignore lint/suspicious/noExplicitAny: partial Chrome API mock
    } as any,
  },
  scripting: {
    executeScript: vi.fn(),
    // biome-ignore lint/suspicious/noExplicitAny: partial Chrome API mock
  } as any,
  action: {
    setBadgeText: vi.fn(async () => {}),
    setBadgeBackgroundColor: vi.fn(async () => {}),
    setTitle: vi.fn(async () => {}),
    setIcon: vi.fn(async () => {}),
    // biome-ignore lint/suspicious/noExplicitAny: partial Chrome API mock
  } as any,
};

export function resetChromeMock() {
  for (const k of Object.keys(store)) delete store[k];
  vi.clearAllMocks();
}
