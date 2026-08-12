import { beforeEach, describe, expect, it } from "vitest";
import { addToQueue } from "../../shared/storage";
import { chromeMock, resetChromeMock } from "../../test/chrome-mock";
import { updateBadge } from "../badge-manager";

beforeEach(() => {
  resetChromeMock();
});

describe("updateBadge", () => {
  it("clears badge and resets title when queue is empty", async () => {
    await updateBadge();

    expect(chromeMock.action.setBadgeText).toHaveBeenCalledWith({ text: "" });
    expect(chromeMock.action.setTitle).toHaveBeenCalledWith({
      title: "Job Search Tracker",
    });
  });

  it("shows count badge and offline title when queue has items", async () => {
    await addToQueue({ company_name: "Acme", position: "Dev", url: "https://acme.com" });
    await addToQueue({ company_name: "Beta", position: "Eng", url: "https://beta.com" });

    await updateBadge();

    expect(chromeMock.action.setBadgeText).toHaveBeenCalledWith({ text: "2" });
    expect(chromeMock.action.setBadgeBackgroundColor).toHaveBeenCalledWith({ color: "#dc2626" });
    expect(chromeMock.action.setTitle).toHaveBeenCalledWith({
      title: "Job Search Tracker — 2 queued (offline)",
    });
  });

  it("uses singular wording for a single queued item", async () => {
    await addToQueue({ company_name: "Acme", position: "Dev", url: "https://acme.com" });

    await updateBadge();

    expect(chromeMock.action.setTitle).toHaveBeenCalledWith({
      title: "Job Search Tracker — 1 queued (offline)",
    });
  });
});
