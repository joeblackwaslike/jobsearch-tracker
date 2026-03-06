import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { injectTrackButton, removeTrackButton, BUTTON_ID } from "../inject";
import type { JobData } from "../adapters/types";

const jobData: JobData = {
  company: "Acme Corp",
  position: "Senior Engineer",
  url: "https://acme.com/job/123",
};

describe("injectTrackButton", () => {
  let target: HTMLElement;

  beforeEach(() => {
    target = document.createElement("div");
    document.body.appendChild(target);
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("injects a button adjacent to the target element", () => {
    injectTrackButton(target, jobData, vi.fn());
    expect(document.getElementById(BUTTON_ID)).not.toBeNull();
  });

  it("does not inject a second button if one already exists", () => {
    injectTrackButton(target, jobData, vi.fn());
    injectTrackButton(target, jobData, vi.fn());
    const buttons = document.querySelectorAll(`#${BUTTON_ID}`);
    expect(buttons).toHaveLength(1);
  });

  it("calls onClick when the button is clicked", async () => {
    const onClick = vi.fn();
    injectTrackButton(target, jobData, onClick);
    const btn = document.getElementById(BUTTON_ID) as HTMLButtonElement;
    btn.click();
    expect(onClick).toHaveBeenCalledWith(jobData);
  });
});

describe("removeTrackButton", () => {
  it("removes the button from the DOM", () => {
    const target = document.createElement("div");
    document.body.appendChild(target);
    injectTrackButton(target, jobData, vi.fn());
    expect(document.getElementById(BUTTON_ID)).not.toBeNull();
    removeTrackButton();
    expect(document.getElementById(BUTTON_ID)).toBeNull();
  });
});
