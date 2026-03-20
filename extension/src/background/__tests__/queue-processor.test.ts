import { beforeEach, describe, expect, it, vi } from "vitest";
import * as api from "../../shared/api";
import { addToQueue, getQueue, setStorage } from "../../shared/storage";
import { chromeMock, resetChromeMock } from "../../test/chrome-mock";
import { processQueue } from "../queue-processor";

beforeEach(async () => {
  resetChromeMock();
  await setStorage({ backend_url: "https://myapp.com", access_token: "tok" });
  vi.restoreAllMocks();
});

describe("processQueue", () => {
  it("returns 0 when queue is empty", async () => {
    const count = await processQueue();
    expect(count).toBe(0);
  });

  it("returns 0 when no auth tokens available", async () => {
    await addToQueue({ company_name: "Acme", position: "Dev", url: "https://acme.com" });
    await setStorage({ access_token: null });

    const count = await processQueue();
    expect(count).toBe(0);

    const queue = await getQueue();
    expect(queue).toHaveLength(1); // Not processed
  });

  it("processes single queued application successfully", async () => {
    await addToQueue({ company_name: "Acme", position: "Dev", url: "https://acme.com" });

    vi.spyOn(api, "track").mockResolvedValueOnce({
      ok: true,
      application_id: "app-1",
      company_id: "co-1",
    });

    const count = await processQueue();
    expect(count).toBe(1);

    const queue = await getQueue();
    expect(queue).toHaveLength(0);
  });

  it("processes multiple queued applications", async () => {
    await addToQueue({ company_name: "Acme", position: "Dev", url: "https://acme.com" });
    await addToQueue({ company_name: "Beta", position: "Eng", url: "https://beta.com" });
    await addToQueue({ company_name: "Gamma", position: "SDE", url: "https://gamma.com" });

    vi.spyOn(api, "track")
      .mockResolvedValueOnce({ ok: true, application_id: "app-1", company_id: "co-1" })
      .mockResolvedValueOnce({ ok: true, application_id: "app-2", company_id: "co-2" })
      .mockResolvedValueOnce({ ok: true, application_id: "app-3", company_id: "co-3" });

    const count = await processQueue();
    expect(count).toBe(3);

    const queue = await getQueue();
    expect(queue).toHaveLength(0);
  });

  it("removes duplicate applications from queue", async () => {
    await addToQueue({ company_name: "Acme", position: "Dev", url: "https://acme.com" });

    vi.spyOn(api, "track").mockResolvedValueOnce({
      ok: false,
      error: "duplicate",
      application_id: "existing-1",
    });

    const count = await processQueue();
    expect(count).toBe(1); // Counted as processed (not an error)

    const queue = await getQueue();
    expect(queue).toHaveLength(0);
  });

  it("stops processing on network error", async () => {
    await addToQueue({ company_name: "First", position: "Dev", url: "https://first.com" });
    await addToQueue({ company_name: "Second", position: "Eng", url: "https://second.com" });
    await addToQueue({ company_name: "Third", position: "SDE", url: "https://third.com" });

    vi.spyOn(api, "track")
      .mockResolvedValueOnce({ ok: true, application_id: "app-1", company_id: "co-1" })
      .mockResolvedValueOnce({ ok: false, error: "network_error" });

    const count = await processQueue();
    expect(count).toBe(1); // Only first one succeeded

    const queue = await getQueue();
    expect(queue).toHaveLength(2); // Second and third still queued
    expect(queue[0].company_name).toBe("Second");
    expect(queue[0].retry_count).toBe(1); // Retry count incremented
    expect(queue[1].company_name).toBe("Third");
    expect(queue[1].retry_count).toBe(0); // Not attempted yet
  });

  it("stops processing on unauthorized error", async () => {
    await addToQueue({ company_name: "First", position: "Dev", url: "https://first.com" });
    await addToQueue({ company_name: "Second", position: "Eng", url: "https://second.com" });

    vi.spyOn(api, "track").mockResolvedValueOnce({ ok: false, error: "unauthorized" });

    const count = await processQueue();
    expect(count).toBe(0);

    const queue = await getQueue();
    expect(queue).toHaveLength(2);
    expect(queue[0].retry_count).toBe(1);
  });

  it("removes applications that exceed max retries", async () => {
    await addToQueue({ company_name: "Acme", position: "Dev", url: "https://acme.com" });

    // Manually set retry count to max
    const queue = await getQueue();
    await setStorage({
      queued_applications: [{ ...queue[0], retry_count: 5 }],
    });

    const count = await processQueue();
    expect(count).toBe(0);

    const finalQueue = await getQueue();
    expect(finalQueue).toHaveLength(0); // Removed due to max retries
  });

  it("increments retry count on other errors", async () => {
    await addToQueue({ company_name: "Acme", position: "Dev", url: "https://acme.com" });

    vi.spyOn(api, "track").mockResolvedValueOnce({
      ok: false,
      error: "some_other_error",
    });

    const count = await processQueue();
    expect(count).toBe(0);

    const queue = await getQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].retry_count).toBe(1);
  });

  it("updates badge after successfully processing items", async () => {
    await addToQueue({ company_name: "Acme", position: "Dev", url: "https://acme.com" });

    vi.spyOn(api, "track").mockResolvedValueOnce({
      ok: true,
      application_id: "app-1",
      company_id: "co-1",
    });

    await processQueue();

    // Badge should be cleared (queue is now empty)
    expect(chromeMock.action.setBadgeText).toHaveBeenCalledWith({ text: "" });
    expect(chromeMock.action.setTitle).toHaveBeenCalledWith({ title: "Job Search Tracker" });
  });

  it("preserves source field when processing", async () => {
    await addToQueue({
      company_name: "Acme",
      position: "Dev",
      url: "https://acme.com",
      source: "LinkedIn",
    });

    const trackSpy = vi.spyOn(api, "track").mockResolvedValueOnce({
      ok: true,
      application_id: "app-1",
      company_id: "co-1",
    });

    await processQueue();

    expect(trackSpy).toHaveBeenCalledWith("https://myapp.com", "tok", {
      company_name: "Acme",
      position: "Dev",
      url: "https://acme.com",
      source: "LinkedIn",
    });
  });
});
