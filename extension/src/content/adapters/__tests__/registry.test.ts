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
  it("finds Greenhouse adapter by boards.greenhouse.io (legacy)", () => {
    expect(findAdapter("boards.greenhouse.io")).not.toBeNull();
  });

  it("finds Greenhouse adapter by job-boards.greenhouse.io (new layout)", () => {
    expect(findAdapter("job-boards.greenhouse.io")).not.toBeNull();
  });

  it("returns null for greenhouse.io root (not a job board page)", () => {
    expect(findAdapter("greenhouse.io")).toBeNull();
  });
});
