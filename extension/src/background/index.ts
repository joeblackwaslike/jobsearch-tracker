import { refresh, track } from "../shared/api";
import type { TrackData, TrackResult } from "../shared/api";
import { ashbyAdapter, greenhouseAdapter } from "../content/adapters/index";
import { appendRecentJob, getStorage, setStorage } from "../shared/storage";

// Exported for testability
export async function handleTrackMessage(data: TrackData): Promise<TrackResult> {
  const [backendUrl, accessToken, refreshToken] = await Promise.all([
    getStorage("backend_url"),
    getStorage("access_token"),
    getStorage("refresh_token"),
  ]);

  if (!backendUrl || !accessToken || !refreshToken) {
    return { ok: false, error: "session_expired" };
  }

  const result = await track(backendUrl, accessToken, data);

  if (result.ok) {
    await appendRecentJob({
      application_id: result.application_id,
      company: data.company_name,
      position: data.position,
      tracked_at: new Date().toISOString(),
    });
    return result;
  }

  if (result.error === "unauthorized") {
    const refreshResult = await refresh(backendUrl, refreshToken);
    if (!refreshResult.ok) return { ok: false, error: "session_expired" };

    await setStorage({
      access_token: refreshResult.access_token,
      refresh_token: refreshResult.refresh_token,
    });

    const retryResult = await track(backendUrl, refreshResult.access_token, data);
    if (retryResult.ok) {
      await appendRecentJob({
        application_id: retryResult.application_id,
        company: data.company_name,
        position: data.position,
        tracked_at: new Date().toISOString(),
      });
    }
    return retryResult;
  }

  return result;
}

// Message listener (not testable directly — wired at module level)
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "TRACK") {
    handleTrackMessage(message.data as TrackData).then(sendResponse);
    return true; // keep channel open for async response
  }
});

// Whitelabeled Greenhouse + Ashby detection via tabs.onUpdated
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete" || !tab.url) return;

  const url = new URL(tab.url);
  const isWhitelabeledGreenhouse = url.searchParams.has("gh_jid");
  const isWhitelabeledAshby = url.searchParams.has("ashby_jid");

  // Suppress unused variable warnings — adapters are referenced to ensure
  // they're imported (tree-shaking guard) and for future use in DOM fingerprinting.
  void greenhouseAdapter;
  void ashbyAdapter;

  if (isWhitelabeledGreenhouse || isWhitelabeledAshby) {
    chrome.scripting.executeScript({
      target: { tabId },
      files: ["src/content/index.js"],
    });
  }
});
