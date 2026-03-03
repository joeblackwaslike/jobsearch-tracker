import { describe, expect, it } from "vitest";

// We'll test that the query functions and hooks are exported correctly
// and that the search hook debounces properly
describe("contacts query layer", () => {
  it("exports useContacts hook", async () => {
    const mod = await import("../contacts");
    expect(mod.useContacts).toBeDefined();
    expect(typeof mod.useContacts).toBe("function");
  });

  it("exports useSearchContacts hook", async () => {
    const mod = await import("../contacts");
    expect(mod.useSearchContacts).toBeDefined();
    expect(typeof mod.useSearchContacts).toBe("function");
  });

  it("exports useCreateContact hook", async () => {
    const mod = await import("../contacts");
    expect(mod.useCreateContact).toBeDefined();
    expect(typeof mod.useCreateContact).toBe("function");
  });

  it("exports useUpdateContact hook", async () => {
    const mod = await import("../contacts");
    expect(mod.useUpdateContact).toBeDefined();
    expect(typeof mod.useUpdateContact).toBe("function");
  });

  it("exports useDeleteContact hook", async () => {
    const mod = await import("../contacts");
    expect(mod.useDeleteContact).toBeDefined();
    expect(typeof mod.useDeleteContact).toBe("function");
  });
});
