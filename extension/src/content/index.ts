import { findAdapter, findAdapterByUrlParams } from "./adapters/index";
import { injectTrackButton, setButtonState } from "./inject";
import { showTrackedToast, showTrackErrorToast } from "./toast";
import type { JobData } from "./adapters/types";

// ---------------------------------------------------------------------------
// Auto-track flow (adapters with watchForSubmission, e.g. Greenhouse)
// ---------------------------------------------------------------------------

function setupSubmissionWatcher(): void {
  const adapter = findAdapter(location.hostname) ?? findAdapterByUrlParams();
  if (!adapter?.watchForSubmission) return;

  const jobData = adapter.extract();
  if (!jobData) return;

  adapter.watchForSubmission((data) => {
    handleAutoTrack(data);
  });
}

function handleAutoTrack(jobData: JobData): void {
  chrome.runtime.sendMessage(
    { type: "TRACK", data: jobData },
    (response: { ok: boolean; error?: string }) => {
      if (response?.ok || response?.error === "duplicate") {
        showTrackedToast(jobData);
      } else {
        showTrackErrorToast();
      }
    },
  );
}

// ---------------------------------------------------------------------------
// Button-injection flow (adapters without watchForSubmission)
// ---------------------------------------------------------------------------

const MAX_RETRIES = 20;
const RETRY_INTERVAL_MS = 500;

function tryInject(retries = 0): void {
  const adapter = findAdapter(location.hostname) ?? findAdapterByUrlParams();
  if (!adapter) return;

  // Skip button injection for adapters that use the submission-watcher flow
  if (adapter.watchForSubmission) return;

  const jobData = adapter.extract();
  if (!jobData) return;

  const target = adapter.getInjectTarget?.();
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

// ---------------------------------------------------------------------------
// Initialise
// ---------------------------------------------------------------------------

// Submission-watcher adapters (e.g. Greenhouse)
setupSubmissionWatcher();

// Button-injection adapters — initial attempt + retries to survive framework hydration
tryInject();
for (const delay of [500, 1000, 1500, 2500]) {
  setTimeout(() => {
    if (!document.getElementById("jst-track-btn")) tryInject();
  }, delay);
}

// SPA navigation: reset on URL change
let lastUrl = location.href;
const observer = new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    document.getElementById("jst-track-btn")?.remove();
    setupSubmissionWatcher();
    setTimeout(() => tryInject(), 300);
  }
});
observer.observe(document.body, { childList: true, subtree: true });

// Respond to popup requests for job data on this page
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "GET_JOB_DATA") {
    const adapter = findAdapter(location.hostname) ?? findAdapterByUrlParams();
    sendResponse(adapter?.extract() ?? null);
  }
  return true;
});
