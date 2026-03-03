import { describe, expect, it, vi } from "vitest"
import {
  findOrCreateCompany,
  checkRecentDuplicate,
  createApplication,
} from "../track-service"

// Builds a mock Supabase query builder chain.
function makeChain(resolvedValue: unknown) {
  const terminal = vi.fn().mockResolvedValue(resolvedValue)
  const chain: Record<string, unknown> = {}
  const chainMethods = ["select", "insert", "eq", "ilike", "gte"]
  for (const method of chainMethods) {
    chain[method] = vi.fn().mockReturnValue(chain)
  }
  chain.single = terminal
  chain.maybeSingle = terminal
  return { chain, terminal }
}

describe("findOrCreateCompany", () => {
  it("returns existing company id when found", async () => {
    const { chain } = makeChain({ data: { id: "comp-1" }, error: null })
    const client = { from: vi.fn().mockReturnValue(chain) } as any

    const result = await findOrCreateCompany(client, "user-1", "Acme Corp")
    expect(result).toBe("comp-1")
    expect(client.from).toHaveBeenCalledWith("companies")
  })

  it("creates and returns new company id when not found", async () => {
    const { chain: selectChain } = makeChain({ data: null, error: null })
    const { chain: insertChain } = makeChain({ data: { id: "comp-new" }, error: null })
    const client = {
      from: vi.fn()
        .mockReturnValueOnce(selectChain)
        .mockReturnValueOnce(insertChain),
    } as any

    const result = await findOrCreateCompany(client, "user-1", "New Corp")
    expect(result).toBe("comp-new")
  })
})

describe("checkRecentDuplicate", () => {
  it("returns application_id when duplicate exists within 24h", async () => {
    const { chain } = makeChain({ data: { id: "app-1" }, error: null })
    const client = { from: vi.fn().mockReturnValue(chain) } as any

    const result = await checkRecentDuplicate(client, "user-1", "comp-1", "Engineer")
    expect(result).toBe("app-1")
  })

  it("returns null when no recent duplicate", async () => {
    const { chain } = makeChain({ data: null, error: null })
    const client = { from: vi.fn().mockReturnValue(chain) } as any

    const result = await checkRecentDuplicate(client, "user-1", "comp-1", "Engineer")
    expect(result).toBeNull()
  })
})

describe("createApplication", () => {
  it("returns new application id", async () => {
    const { chain } = makeChain({ data: { id: "app-new" }, error: null })
    const client = { from: vi.fn().mockReturnValue(chain) } as any

    const result = await createApplication(
      client,
      "user-1",
      "comp-1",
      "Engineer",
      "https://example.com",
    )
    expect(result).toBe("app-new")
  })
})
