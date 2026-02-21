import { describe, expect, it } from "vitest";

describe("event-contacts query layer", () => {
  it("exports useEventContacts hook", async () => {
    const mod = await import("../event-contacts");
    expect(mod.useEventContacts).toBeDefined();
    expect(typeof mod.useEventContacts).toBe("function");
  });

  it("exports useAddInterviewer hook", async () => {
    const mod = await import("../event-contacts");
    expect(mod.useAddInterviewer).toBeDefined();
    expect(typeof mod.useAddInterviewer).toBe("function");
  });

  it("exports useRemoveInterviewer hook", async () => {
    const mod = await import("../event-contacts");
    expect(mod.useRemoveInterviewer).toBeDefined();
    expect(typeof mod.useRemoveInterviewer).toBe("function");
  });
});
