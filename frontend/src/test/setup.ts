import "@testing-library/jest-dom/vitest";

// Pin timezone to UTC so formatter tests are deterministic across environments
process.env.TZ = "UTC";

// Stub localStorage for jsdom (getItem/setItem/removeItem may not be available)
if (
  typeof globalThis.localStorage === "undefined" ||
  typeof globalThis.localStorage.getItem !== "function"
) {
  const store: Record<string, string> = {};
  globalThis.localStorage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      for (const k in store) delete store[k];
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
    get length() {
      return Object.keys(store).length;
    },
  } as Storage;
}

// Stub ResizeObserver for jsdom (used by cmdk / Radix popovers)
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// Stub scrollIntoView for jsdom (used by cmdk)
if (!window.HTMLElement.prototype.scrollIntoView) {
  window.HTMLElement.prototype.scrollIntoView = () => {};
}

// Stub Pointer Events for jsdom (used by Radix UI)
if (!window.HTMLElement.prototype.hasPointerCapture) {
  window.HTMLElement.prototype.hasPointerCapture = () => false;
}
if (!window.HTMLElement.prototype.setPointerCapture) {
  window.HTMLElement.prototype.setPointerCapture = () => {};
}
if (!window.HTMLElement.prototype.releasePointerCapture) {
  window.HTMLElement.prototype.releasePointerCapture = () => {};
}
