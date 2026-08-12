import { ashbyAdapter, greenhouseAdapter } from "../content/adapters/index";
import type { TrackData, TrackResult } from "../shared/api";
import { refresh, track } from "../shared/api";
import type { PendingIntent } from "../shared/storage";
import {
  addPendingIntent,
  addToQueue,
  appendRecentJob,
  getStorage,
  resolveIntent,
  setStorage,
} from "../shared/storage";
import { updateBadge } from "./badge-manager";
import { processQueue } from "./queue-processor";

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

  // Merge source from a pending intent if the ATS doesn't supply one
  if (!data.source) {
    const intent = await resolveIntent(data.company_name);
    if (intent) {
      data = { ...data, source: intent.source, url: data.url || intent.url };
    }
  }

  const result = await track(backendUrl, accessToken, data);

  // Network error: queue for retry
  if (!result.ok && result.error === "network_error") {
    await addToQueue({
      company_name: data.company_name,
      position: data.position,
      url: data.url,
      source: data.source,
    });
    await updateBadge();
    return { ok: false, error: "offline_queued" };
  }

  if (result.ok) {
    await appendRecentJob({
      application_id: result.application_id,
      company: data.company_name,
      position: data.position,
      tracked_at: new Date().toISOString(),
    });
    // Process queue in background (don't await)
    processQueue();
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

    // Network error on retry: queue
    if (!retryResult.ok && retryResult.error === "network_error") {
      await addToQueue({
        company_name: data.company_name,
        position: data.position,
        url: data.url,
        source: data.source,
      });
      await updateBadge();
      return { ok: false, error: "offline_queued" };
    }

    if (retryResult.ok) {
      await appendRecentJob({
        application_id: retryResult.application_id,
        company: data.company_name,
        position: data.position,
        tracked_at: new Date().toISOString(),
      });
      // Process queue in background (don't await)
      processQueue();
    }
    return retryResult;
  }

  return result;
}

// Icon paths (relative to extension root, as served from dist/)
const ICON_GRAY = {
  "16": "src/assets/icons/icon-gray-16.png",
  "32": "src/assets/icons/icon-gray-32.png",
  "48": "src/assets/icons/icon-gray-48.png",
  "128": "src/assets/icons/icon-gray-128.png",
} as const;

const ICON_GREEN = {
  "16": "src/assets/icons/icon-green-16.png",
  "32": "src/assets/icons/icon-green-32.png",
  "48": "src/assets/icons/icon-green-48.png",
  "128": "src/assets/icons/icon-green-128.png",
} as const;

// Message listener (not testable directly — wired at module level)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "TRACK") {
    handleTrackMessage(message.data as TrackData).then(sendResponse);
    return true; // keep channel open for async response
  }

  if (message.type === "RECORD_INTENT") {
    addPendingIntent(message.data as Omit<PendingIntent, "stored_at">).then(() =>
      sendResponse({ ok: true }),
    );
    return true;
  }

  if (message.type === "AUTO_TRACK_STATUS") {
    const tabId = sender.tab?.id;
    if (tabId !== undefined) {
      const active = (message.data as { active: boolean }).active;
      chrome.action.setIcon({ tabId, path: active ? ICON_GREEN : ICON_GRAY });
    }
  }
});

// Whitelabeled Greenhouse + Ashby detection via tabs.onUpdated
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Reset icon to gray on every navigation (content script will re-send AUTO_TRACK_STATUS on load)
  if (changeInfo.status === "loading") {
    chrome.action.setIcon({ tabId, path: ICON_GRAY });
  }

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
