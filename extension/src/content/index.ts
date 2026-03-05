import { findAdapter, findAdapterByUrlParams } from "./adapters/index";
import { injectTrackButton, setButtonState } from "./inject";
import type { JobData } from "./adapters/types";

const MAX_RETRIES = 20;
const RETRY_INTERVAL_MS = 500;

function tryInject(retries = 0): void {
  const adapter = findAdapter(location.hostname) ?? findAdapterByUrlParams();
  if (!adapter) return;

  const jobData = adapter.extract();
  if (!jobData) {
    // Not a job detail page (e.g. a search results page)
    return;
  }

  const target = adapter.getInjectTarget();
  if (!target) {
    if (retries < MAX_RETRIES) {
      setTimeout(() => tryInject(retries + 1), RETRY_INTERVAL_MS);
    }
    return;
  }

  injectTrackButton(target, jobData, handleTrack);
}

function handleTrack(jobData: JobData): void {
  setButtonState("loading");

  chrome.runtime.sendMessage(
    { type: "TRACK", data: jobData },
    (response: { ok: boolean; error?: string; application_id?: string }) => {
      if (!response) {
        setButtonState("error", "No response from extension");
        return;
      }
      if (response.ok) {
        setButtonState("success");
      } else if (response.error === "duplicate") {
        setButtonState("duplicate");
      } else if (response.error === "session_expired") {
        setButtonState("expired");
      } else {
        setButtonState("error");
      }
    },
  );
}

// Initial injection attempt
tryInject();

// Re-run on SPA navigation (LinkedIn, Indeed, etc.)
let lastUrl = location.href;
const observer = new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    // Remove any stale button from the previous page
    document.getElementById("jst-track-btn")?.remove();
    setTimeout(() => tryInject(), 300);
  }
});
observer.observe(document.body, { childList: true, subtree: true });

// Also listen for GET_JOB_DATA requests from the popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "GET_JOB_DATA") {
    const adapter = findAdapter(location.hostname) ?? findAdapterByUrlParams();
    const jobData = adapter?.extract() ?? null;
    sendResponse(jobData);
  }
  return true;
});
