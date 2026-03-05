import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetChromeMock } from "../../../test/chrome-mock";
import { setStorage } from "../../../shared/storage";
import * as api from "../../../shared/api";
import { useAuth } from "../useAuth";

beforeEach(async () => {
  resetChromeMock();
  vi.restoreAllMocks();
});

describe("useAuth", () => {
  it("isAuthenticated is false when no tokens in storage", async () => {
    const { result } = renderHook(() => useAuth());
    await act(async () => {}); // flush effects
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("isAuthenticated is true when tokens exist", async () => {
    await setStorage({ access_token: "tok", refresh_token: "ref", backend_url: "https://app.com" });
    const { result } = renderHook(() => useAuth());
    await act(async () => {});
    expect(result.current.isAuthenticated).toBe(true);
  });

  it("signIn stores tokens on success", async () => {
    await setStorage({ backend_url: "https://app.com" });
    vi.spyOn(api, "signin").mockResolvedValueOnce({
      ok: true,
      access_token: "a",
      refresh_token: "b",
    });
    const { result } = renderHook(() => useAuth());
    await act(async () => {});
    await act(async () => {
      await result.current.signIn("user@test.com", "pass");
    });
    expect(result.current.isAuthenticated).toBe(true);
  });

  it("signOut clears tokens", async () => {
    await setStorage({ access_token: "tok", refresh_token: "ref", backend_url: "https://app.com" });
    const { result } = renderHook(() => useAuth());
    await act(async () => {});
    await act(async () => { result.current.signOut(); });
    expect(result.current.isAuthenticated).toBe(false);
  });
});
