import { describe, expect, it, vi } from "vitest"

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({ isMock: true })),
}))

import { createAnonApiClient, createServiceApiClient } from "../api"

describe("createAnonApiClient", () => {
  it("creates a client", () => {
    expect(createAnonApiClient()).toBeDefined()
  })
})

describe("createServiceApiClient", () => {
  it("creates a client", () => {
    expect(createServiceApiClient()).toBeDefined()
  })
})
