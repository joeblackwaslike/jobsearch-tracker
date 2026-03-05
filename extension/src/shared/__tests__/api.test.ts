import { beforeEach, describe, expect, it, vi } from "vitest";
import { signin, refresh, track } from "../api";

const BACKEND = "https://myapp.com";

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("signin", () => {
  it("returns tokens on 200", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ access_token: "a", refresh_token: "b" }), { status: 200 }),
    );
    const result = await signin(BACKEND, "user@test.com", "pass");
    expect(result).toEqual({ ok: true, access_token: "a", refresh_token: "b" });
  });

  it("returns error on 401", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Invalid credentials" }), { status: 401 }),
    );
    const result = await signin(BACKEND, "user@test.com", "wrong");
    expect(result).toEqual({ ok: false, error: "Invalid credentials" });
  });
});

describe("refresh", () => {
  it("returns new tokens on 200", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ access_token: "new-a", refresh_token: "new-b" }), { status: 200 }),
    );
    const result = await refresh(BACKEND, "old-refresh-token");
    expect(result).toEqual({ ok: true, access_token: "new-a", refresh_token: "new-b" });
  });

  it("returns session_expired on 401", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Invalid token" }), { status: 401 }),
    );
    const result = await refresh(BACKEND, "bad-token");
    expect(result).toEqual({ ok: false, error: "session_expired" });
  });
});

describe("track", () => {
  it("returns application_id on 200", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ application_id: "uuid-1", company_id: "uuid-2" }), { status: 200 }),
    );
    const result = await track(BACKEND, "tok", {
      company_name: "Acme",
      position: "Engineer",
      url: "https://acme.com/job",
    });
    expect(result).toEqual({ ok: true, application_id: "uuid-1", company_id: "uuid-2" });
  });

  it("returns duplicate on 409", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Application already tracked", application_id: "uuid-1" }), { status: 409 }),
    );
    const result = await track(BACKEND, "tok", {
      company_name: "Acme",
      position: "Engineer",
      url: "https://acme.com/job",
    });
    expect(result).toEqual({ ok: false, error: "duplicate", application_id: "uuid-1" });
  });

  it("returns unauthorized on 401", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
    );
    const result = await track(BACKEND, "expired-tok", {
      company_name: "Acme",
      position: "Engineer",
      url: "https://acme.com/job",
    });
    expect(result).toEqual({ ok: false, error: "unauthorized" });
  });
});
