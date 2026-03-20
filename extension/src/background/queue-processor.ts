import { track } from "../shared/api";
import {
  appendRecentJob,
  getQueue,
  getStorage,
  incrementRetryCount,
  removeFromQueue,
} from "../shared/storage";
import { updateBadge } from "./badge-manager";

const MAX_RETRY_COUNT = 5;

/**
 * Process queued applications. Call this after any successful track to retry
 * queued items when backend is reachable again.
 *
 * Returns number of successfully processed items.
 */
export async function processQueue(): Promise<number> {
  const [backendUrl, accessToken] = await Promise.all([
    getStorage("backend_url"),
    getStorage("access_token"),
  ]);

  if (!backendUrl || !accessToken) return 0;

  const queue = await getQueue();
  if (queue.length === 0) return 0;

  let processed = 0;

  // Process queue in order, stop on first failure
  for (let i = 0; i < queue.length; i++) {
    const app = queue[i];

    // Remove if exceeded max retries
    if (app.retry_count >= MAX_RETRY_COUNT) {
      await removeFromQueue(i);
      queue.splice(i, 1); // Keep local array in sync with storage
      i--;
      continue;
    }

    const result = await track(backendUrl, accessToken, {
      company_name: app.company_name,
      position: app.position,
      url: app.url,
      source: app.source,
    });

    // Network error: stop processing (backend likely down again)
    if (!result.ok && result.error === "network_error") {
      await incrementRetryCount(i);
      break;
    }

    // Unauthorized: can't proceed without valid token
    if (!result.ok && result.error === "unauthorized") {
      await incrementRetryCount(i);
      break;
    }

    // Success or duplicate: remove from queue
    if (result.ok || result.error === "duplicate") {
      if (result.ok) {
        await appendRecentJob({
          application_id: result.application_id,
          company: app.company_name,
          position: app.position,
          tracked_at: new Date().toISOString(),
        });
      }
      await removeFromQueue(i);
      queue.splice(i, 1); // Keep local array in sync with storage
      processed++;
      // Adjust index since we removed an item
      i--;
      continue;
    }

    // Other errors: increment retry, continue to next
    await incrementRetryCount(i);
  }

  await updateBadge();
  return processed;
}
