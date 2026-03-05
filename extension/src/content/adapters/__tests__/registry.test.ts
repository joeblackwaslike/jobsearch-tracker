import { describe, expect, it } from "vitest";
import { findAdapter } from "../index";

describe("findAdapter", () => {
  it("returns null for an unknown host", () => {
    expect(findAdapter("randomsite.com")).toBeNull();
  });

  it("finds the LinkedIn adapter by hostname", () => {
    const adapter = findAdapter("www.linkedin.com");
    expect(adapter).not.toBeNull();
    expect(adapter!.hosts).toContain("www.linkedin.com");
  });
  it.todo("finds Greenhouse adapter by boards.greenhouse.io");

  it("returns null for greenhouse.io root (not a job board page)", () => {
    expect(findAdapter("greenhouse.io")).toBeNull();
  });
});
