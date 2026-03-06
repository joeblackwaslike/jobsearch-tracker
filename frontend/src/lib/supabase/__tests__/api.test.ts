import { beforeEach, describe, expect, it, vi } from "vitest";

const mockCreateClient = vi.hoisted(() => vi.fn(() => ({ isMock: true })));

vi.mock("@supabase/supabase-js", () => ({
  createClient: mockCreateClient,
}));

import { createAnonApiClient, createServiceApiClient } from "../api";

beforeEach(() => {
  mockCreateClient.mockClear();
});

describe("createAnonApiClient", () => {
  it("calls createClient with anon key", () => {
    createAnonApiClient();
    expect(mockCreateClient).toHaveBeenCalledWith(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY,
    );
  });
});

describe("createServiceApiClient", () => {
  it("throws when SUPABASE_SERVICE_ROLE_KEY is not set", () => {
    const original = process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    expect(() => createServiceApiClient()).toThrow("SUPABASE_SERVICE_ROLE_KEY is not set");
    process.env.SUPABASE_SERVICE_ROLE_KEY = original;
  });

  it("calls createClient with service role key when set", () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
    createServiceApiClient();
    expect(mockCreateClient).toHaveBeenCalledWith(
      import.meta.env.VITE_SUPABASE_URL,
      "test-service-key",
    );
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });
});
