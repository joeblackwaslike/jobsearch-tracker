import "@testing-library/jest-dom/vitest";

// Stub ResizeObserver for jsdom (used by cmdk / Radix popovers)
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
