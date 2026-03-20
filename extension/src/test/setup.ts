import { beforeEach } from "vitest";
import { chromeMock, resetChromeMock } from "./chrome-mock";

// Set up global chrome mock for all tests
// biome-ignore lint/suspicious/noExplicitAny: partial chrome mock, globalThis.chrome typed as full API
(globalThis as any).chrome = chromeMock;

// Reset chrome mock before each test
beforeEach(() => {
  resetChromeMock();
});
