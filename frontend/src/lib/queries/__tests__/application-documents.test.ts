import { describe, it, expect } from "vitest";

describe("application-documents query layer", () => {
  it("exports useApplicationDocuments hook", async () => {
    const mod = await import("../application-documents");
    expect(mod.useApplicationDocuments).toBeDefined();
    expect(typeof mod.useApplicationDocuments).toBe("function");
  });

  it("exports useDetachDocument hook", async () => {
    const mod = await import("../application-documents");
    expect(mod.useDetachDocument).toBeDefined();
    expect(typeof mod.useDetachDocument).toBe("function");
  });
});
