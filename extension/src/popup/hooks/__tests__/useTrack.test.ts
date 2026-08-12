import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { chromeMock, resetChromeMock } from "../../../test/chrome-mock";
import { useTrack } from "../useTrack";

beforeEach(() => {
  resetChromeMock();
});

function mockResponse(response: object) {
  chromeMock.runtime.sendMessage.mockImplementation((_msg: unknown, cb: (r: unknown) => void) =>
    cb(response),
  );
}

describe("useTrack", () => {
  it("starts as idle", () => {
    const { result } = renderHook(() => useTrack());
    expect(result.current.status).toBe("idle");
  });

  it("sets status to success on ok response", async () => {
    mockResponse({ ok: true, application_id: "app-1" });
    const { result } = renderHook(() => useTrack());

    await act(async () => {
      await result.current.track({
        company_name: "Acme",
        position: "Dev",
        url: "https://acme.com",
      });
    });

    expect(result.current.status).toBe("success");
    expect(result.current.applicationId).toBe("app-1");
  });

  it("sets status to queued on offline_queued error", async () => {
    mockResponse({ ok: false, error: "offline_queued" });
    const { result } = renderHook(() => useTrack());

    await act(async () => {
      await result.current.track({
        company_name: "Acme",
        position: "Dev",
        url: "https://acme.com",
      });
    });

    expect(result.current.status).toBe("queued");
  });

  it("sets status to duplicate on duplicate error", async () => {
    mockResponse({ ok: false, error: "duplicate", application_id: "existing-1" });
    const { result } = renderHook(() => useTrack());

    await act(async () => {
      await result.current.track({
        company_name: "Acme",
        position: "Dev",
        url: "https://acme.com",
      });
    });

    expect(result.current.status).toBe("duplicate");
  });

  it("sets status to expired on session_expired error", async () => {
    mockResponse({ ok: false, error: "session_expired" });
    const { result } = renderHook(() => useTrack());

    await act(async () => {
      await result.current.track({
        company_name: "Acme",
        position: "Dev",
        url: "https://acme.com",
      });
    });

    expect(result.current.status).toBe("expired");
  });

  it("sets status to error on unknown error", async () => {
    mockResponse({ ok: false, error: "something_unexpected" });
    const { result } = renderHook(() => useTrack());

    await act(async () => {
      await result.current.track({
        company_name: "Acme",
        position: "Dev",
        url: "https://acme.com",
      });
    });

    expect(result.current.status).toBe("error");
  });

  it("resets status to idle on reset()", async () => {
    mockResponse({ ok: true, application_id: "app-1" });
    const { result } = renderHook(() => useTrack());

    await act(async () => {
      await result.current.track({
        company_name: "Acme",
        position: "Dev",
        url: "https://acme.com",
      });
    });
    expect(result.current.status).toBe("success");

    act(() => result.current.reset());
    expect(result.current.status).toBe("idle");
  });
});
