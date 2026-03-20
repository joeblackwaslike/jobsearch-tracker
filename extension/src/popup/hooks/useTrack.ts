import { useCallback, useState } from "react";
import type { TrackData } from "../../shared/api";

type TrackStatus = "idle" | "loading" | "success" | "duplicate" | "expired" | "queued" | "error";

export function useTrack() {
  const [status, setStatus] = useState<TrackStatus>("idle");
  const [applicationId, setApplicationId] = useState<string | null>(null);

  const track = useCallback(async (data: TrackData) => {
    setStatus("loading");
    return new Promise<void>((resolve) => {
      chrome.runtime.sendMessage(
        { type: "TRACK", data },
        (response: { ok: boolean; error?: string; application_id?: string }) => {
          if (!response) {
            setStatus("error");
          } else if (response.ok) {
            setApplicationId(response.application_id ?? null);
            setStatus("success");
          } else if (response.error === "duplicate") {
            setApplicationId(response.application_id ?? null);
            setStatus("duplicate");
          } else if (response.error === "session_expired") {
            setStatus("expired");
          } else if (response.error === "offline_queued") {
            setStatus("queued");
          } else {
            setStatus("error");
          }
          resolve();
        },
      );
    });
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setApplicationId(null);
  }, []);

  return { status, applicationId, track, reset };
}
