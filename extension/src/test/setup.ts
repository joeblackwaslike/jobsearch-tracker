import { chromeMock } from "./chrome-mock";

// Inject chrome mock into global scope for all tests
Object.defineProperty(globalThis, "chrome", {
  value: chromeMock,
  writable: true,
  configurable: true,
});
