import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetChromeMock } from "../../../test/chrome-mock";
import { useTrack } from "../useTrack";

beforeEach(() => resetChromeMock());

describe("useTrack", () => {
  it("sends TRACK message to background and returns success", async () => {
    (chrome.runtime.sendMessage as ReturnType<typeof vi.fn>).mockImplementation(
      (_msg: unknown, callback: (r: unknown) => void) => {
        callback({ ok: true, application_id: "app-1" });
      },
    );

    const { result } = renderHook(() => useTrack());
    await act(async () => {
      await result.current.track({
        company_name: "Acme",
        position: "Engineer",
        url: "https://acme.com/job",
      });
    });

    expect(result.current.status).toBe("success");
  });

  it("status is duplicate on 409 response", async () => {
    (chrome.runtime.sendMessage as ReturnType<typeof vi.fn>).mockImplementation(
      (_msg: unknown, callback: (r: unknown) => void) => {
        callback({ ok: false, error: "duplicate", application_id: "existing" });
      },
    );

    const { result } = renderHook(() => useTrack());
    await act(async () => {
      await result.current.track({ company_name: "A", position: "B", url: "https://a.com" });
    });

    expect(result.current.status).toBe("duplicate");
  });
});
