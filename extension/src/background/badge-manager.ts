import { getQueueCount } from "../shared/storage";

const DEFAULT_TITLE = "Job Search Tracker";

/**
 * Update extension badge and tooltip to reflect queue state.
 * Red badge with count + offline tooltip when queue has items; cleared when empty.
 */
export async function updateBadge(): Promise<void> {
  const count = await getQueueCount();

  if (count === 0) {
    await chrome.action.setBadgeText({ text: "" });
    await chrome.action.setTitle({ title: DEFAULT_TITLE });
  } else {
    await chrome.action.setBadgeText({ text: count.toString() });
    await chrome.action.setBadgeBackgroundColor({ color: "#dc2626" }); // red-600
    await chrome.action.setTitle({ title: `${DEFAULT_TITLE} — ${count} queued (offline)` });
  }
}
