import { beforeEach, describe, expect, it, vi } from "vitest";
import * as api from "../../shared/api";
import { getQueue, setStorage } from "../../shared/storage";
import { resetChromeMock } from "../../test/chrome-mock";

// We test the handler functions exported from background, not the side-effectful
// module initialization. Export handlers from background/index.ts.
import { handleTrackMessage } from "../index";

beforeEach(async () => {
  resetChromeMock();
  await setStorage({ backend_url: "https://myapp.com", access_token: "tok", refresh_token: "ref" });
  vi.restoreAllMocks();
});

describe("handleTrackMessage", () => {
  it("returns ok:true on successful track", async () => {
    vi.spyOn(api, "track").mockResolvedValueOnce({
      ok: true,
      application_id: "app-1",
      company_id: "co-1",
    });

    const result = await handleTrackMessage({
      company_name: "Acme",
      position: "Engineer",
      url: "https://acme.com/job",
    });

    expect(result).toMatchObject({ ok: true, application_id: "app-1" });
  });

  it("refreshes token on 401 and retries", async () => {
    vi.spyOn(api, "track")
      .mockResolvedValueOnce({ ok: false, error: "unauthorized" })
      .mockResolvedValueOnce({ ok: true, application_id: "app-2", company_id: "co-2" });
    vi.spyOn(api, "refresh").mockResolvedValueOnce({
      ok: true,
      access_token: "new-tok",
      refresh_token: "new-ref",
    });

    const result = await handleTrackMessage({
      company_name: "Acme",
      position: "Engineer",
      url: "https://acme.com/job",
    });

    expect(api.refresh).toHaveBeenCalledOnce();
    expect(api.track).toHaveBeenCalledTimes(2);
    expect(result).toMatchObject({ ok: true, application_id: "app-2" });
  });

  it("returns session_expired when refresh fails", async () => {
    vi.spyOn(api, "track").mockResolvedValue({ ok: false, error: "unauthorized" });
    vi.spyOn(api, "refresh").mockResolvedValueOnce({ ok: false, error: "session_expired" });

    const result = await handleTrackMessage({
      company_name: "Acme",
      position: "Engineer",
      url: "https://acme.com/job",
    });

    expect(result).toEqual({ ok: false, error: "session_expired" });
  });

  it("returns duplicate on 409", async () => {
    vi.spyOn(api, "track").mockResolvedValueOnce({
      ok: false,
      error: "duplicate",
      application_id: "existing-id",
    });

    const result = await handleTrackMessage({
      company_name: "Acme",
      position: "Engineer",
      url: "https://acme.com/job",
    });

    expect(result).toEqual({ ok: false, error: "duplicate", application_id: "existing-id" });
  });

  it("queues application on network error", async () => {
    vi.spyOn(api, "track").mockResolvedValueOnce({
      ok: false,
      error: "network_error",
    });

    const result = await handleTrackMessage({
      company_name: "Acme",
      position: "Engineer",
      url: "https://acme.com/job",
    });

    expect(result).toEqual({ ok: false, error: "offline_queued" });

    const queue = await getQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].company_name).toBe("Acme");
    expect(queue[0].position).toBe("Engineer");
    expect(queue[0].retry_count).toBe(0);
  });

  it("queues application with source if provided", async () => {
    vi.spyOn(api, "track").mockResolvedValueOnce({
      ok: false,
      error: "network_error",
    });

    const result = await handleTrackMessage({
      company_name: "Acme",
      position: "Engineer",
      url: "https://acme.com/job",
      source: "LinkedIn",
    });

    expect(result).toEqual({ ok: false, error: "offline_queued" });

    const queue = await getQueue();
    expect(queue[0].source).toBe("LinkedIn");
  });

  it("queues application on network error after token refresh", async () => {
    vi.spyOn(api, "track")
      .mockResolvedValueOnce({ ok: false, error: "unauthorized" })
      .mockResolvedValueOnce({ ok: false, error: "network_error" });
    vi.spyOn(api, "refresh").mockResolvedValueOnce({
      ok: true,
      access_token: "new-tok",
      refresh_token: "new-ref",
    });

    const result = await handleTrackMessage({
      company_name: "Acme",
      position: "Engineer",
      url: "https://acme.com/job",
    });

    expect(result).toEqual({ ok: false, error: "offline_queued" });

    const queue = await getQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].company_name).toBe("Acme");
  });
});
