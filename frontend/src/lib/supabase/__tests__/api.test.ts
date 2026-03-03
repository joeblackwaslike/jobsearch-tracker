import { describe, expect, it, vi } from "vitest"

const mockCreateClient = vi.hoisted(() => vi.fn(() => ({ isMock: true })))

vi.mock("@supabase/supabase-js", () => ({
  createClient: mockCreateClient,
}))

import { createAnonApiClient, createServiceApiClient } from "../api"

describe("createAnonApiClient", () => {
  it("calls createClient with anon key", () => {
    createAnonApiClient()
    expect(mockCreateClient).toHaveBeenCalledWith(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY,
    )
  })
})

describe("createServiceApiClient", () => {
  it("calls createClient with service role key", () => {
    createServiceApiClient()
    expect(mockCreateClient).toHaveBeenCalledWith(
      import.meta.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    )
  })
})
