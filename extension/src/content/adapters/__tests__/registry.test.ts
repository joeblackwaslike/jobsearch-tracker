import { describe, expect, it } from "vitest";
import { findAdapter } from "../index";

describe("findAdapter", () => {
  it("returns null for an unknown host", () => {
    expect(findAdapter("randomsite.com")).toBeNull();
  });

  it.todo("finds the LinkedIn adapter by hostname");
  it.todo("finds Greenhouse adapter by boards.greenhouse.io");

  it("returns null for greenhouse.io root (not a job board page)", () => {
    expect(findAdapter("greenhouse.io")).toBeNull();
  });
});
