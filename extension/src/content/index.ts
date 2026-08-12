import { findAdapter, findAdapterByUrlParams } from "./adapters/index";
import type { JobData } from "./adapters/types";
import { getLog, log } from "./debug";
import { injectTrackButton, setButtonState } from "./inject";
import { showTrackErrorToast, showTrackedToast } from "./toast";

// ---------------------------------------------------------------------------
// Auto-track flow (adapters with watchForSubmission, e.g. Greenhouse)
// ---------------------------------------------------------------------------

function setupSubmissionWatcher(): void {
  const adapter = findAdapter(location.hostname) ?? findAdapterByUrlParams();
  if (!adapter) {
    log("init", "no adapter for", location.hostname, location.search || "(no params)");
    return;
  }

  if (!adapter.watchForSubmission) {
    // Button-injection adapter — handled by tryInject(), not here
    return;
  }

  log("init", "watchForSubmission adapter:", adapter.hosts[0] ?? "(url-param matched)");

  const jobData = adapter.extract();
  if (!jobData) {
    log("init", "extract() → null — watcher NOT set up");
    log("init", "  pathname:", location.pathname, "search:", location.search || "(none)");
    return;
  }

  log("init", "extract() →", jobData.position, "@", jobData.company);
  log("init", "setting up submission watcher…");

  adapter.watchForSubmission((data) => {
    log("submit", "onSubmit fired:", data.position, "@", data.company);
    handleAutoTrack(data);
  });
}

function handleAutoTrack(jobData: JobData): void {
  chrome.runtime.sendMessage(
    { type: "TRACK", data: jobData },
    (response: { ok: boolean; error?: string }) => {
      if (response?.ok || response?.error === "duplicate") {
        log("submit", "TRACK response ok");
        showTrackedToast(jobData);
      } else {
        log("submit", "TRACK response error:", response?.error ?? "no response");
        showTrackErrorToast();
      }
    },
  );
}

// ---------------------------------------------------------------------------
// Intent-tracking flow (aggregator boards with watchForIntent, e.g. Builtin)
// ---------------------------------------------------------------------------

function setupIntentWatcher(): void {
  const adapter = findAdapter(location.hostname) ?? findAdapterByUrlParams();
  if (!adapter?.watchForIntent) return;

  log("init", "watchForIntent adapter:", adapter.hosts[0] ?? "(url-param matched)");

  adapter.watchForIntent((jobData) => {
    log("intent", "onIntent fired:", jobData.position, "@", jobData.company);
    chrome.runtime.sendMessage({
      type: "RECORD_INTENT",
      data: {
        company: jobData.company,
        position: jobData.position,
        url: jobData.url,
        source: adapter.source ?? adapter.hosts[0] ?? "unknown",
      },
    });
  });
}

// ---------------------------------------------------------------------------
// Button-injection flow (adapters without watchForSubmission or watchForIntent)
// ---------------------------------------------------------------------------

const MAX_RETRIES = 20;
const RETRY_INTERVAL_MS = 500;

function tryInject(retries = 0): void {
  const adapter = findAdapter(location.hostname) ?? findAdapterByUrlParams();
  if (!adapter) return; // already logged by setupSubmissionWatcher

  // Skip button injection for adapters that use other flows
  if (adapter.watchForSubmission || adapter.watchForIntent) return;

  if (retries === 0) {
    log("inject", "button-injection adapter:", adapter.hosts[0] ?? "(url-param)");
  }

  const jobData = adapter.extract();
  if (!jobData) {
    if (retries === 0) log("inject", "extract() → null (retry in", RETRY_INTERVAL_MS, "ms)");
    if (retries < MAX_RETRIES) setTimeout(() => tryInject(retries + 1), RETRY_INTERVAL_MS);
    return;
  }

  const target = adapter.getInjectTarget?.();
  if (!target) {
    if (retries === 0)
      log("inject", "getInjectTarget() → null, will retry up to", MAX_RETRIES, "times");
    if (retries < MAX_RETRIES) {
      setTimeout(() => tryInject(retries + 1), RETRY_INTERVAL_MS);
    } else {
      log("inject", "getInjectTarget() never resolved after", MAX_RETRIES, "retries");
    }
    return;
  }

  log("inject", "button injected for:", jobData.position, "@", jobData.company);
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
// Icon status
// ---------------------------------------------------------------------------

/**
 * Tell the background which icon variant to show for this tab.
 * "active" (green) = adapter uses auto-tracking (watchForSubmission or watchForIntent).
 * "default" (gray) = button-injection adapter or no adapter.
 */
function sendAutoTrackStatus(): void {
  const adapter = findAdapter(location.hostname) ?? findAdapterByUrlParams();
  const active = !!(adapter?.watchForSubmission || adapter?.watchForIntent);
  chrome.runtime.sendMessage({ type: "AUTO_TRACK_STATUS", data: { active } });
}

// ---------------------------------------------------------------------------
// Initialise
// ---------------------------------------------------------------------------

// Submission-watcher adapters (e.g. Greenhouse)
setupSubmissionWatcher();

// Intent-tracking adapters (aggregator boards, e.g. Builtin, Levels.fyi)
setupIntentWatcher();

// Notify background to set the correct icon for this tab
sendAutoTrackStatus();

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
    setupIntentWatcher();
    sendAutoTrackStatus();
    setTimeout(() => tryInject(), 300);
  }
});
observer.observe(document.body, { childList: true, subtree: true });

// Respond to popup requests for job data or debug log
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "GET_JOB_DATA") {
    const adapter = findAdapter(location.hostname) ?? findAdapterByUrlParams();
    sendResponse(adapter?.extract() ?? null);
  } else if (message.type === "GET_DEBUG_LOG") {
    sendResponse(getLog());
  }
  return true;
});
