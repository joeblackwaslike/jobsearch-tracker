import { describe, expect, it } from "vitest";

describe("event-contacts query layer", () => {
  it("exports useEventContacts hook", async () => {
    const mod = await import("../event-contacts");
    expect(mod.useEventContacts).toBeDefined();
    expect(typeof mod.useEventContacts).toBe("function");
  });

  it("exports useAddEventContact hook", async () => {
    const mod = await import("../event-contacts");
    expect(mod.useAddEventContact).toBeDefined();
    expect(typeof mod.useAddEventContact).toBe("function");
  });

  it("exports useRemoveEventContact hook", async () => {
    const mod = await import("../event-contacts");
    expect(mod.useRemoveEventContact).toBeDefined();
    expect(typeof mod.useRemoveEventContact).toBe("function");
  });
});
