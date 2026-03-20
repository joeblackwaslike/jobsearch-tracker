export interface RecentJob {
  application_id: string;
  company: string;
  position: string;
  tracked_at: string;
}

/** Stored when a user views a job on an aggregator board (e.g. Builtin, Levels.fyi). */
export interface PendingIntent {
  company: string;
  position: string;
  url: string;
  /** Board that originated the intent (e.g. "Builtin"). */
  source: string;
  /** Unix ms timestamp — intents expire after INTENT_TTL_MS. */
  stored_at: number;
}

/** Queued application when backend is unreachable. */
export interface QueuedApplication {
  company_name: string;
  position: string;
  url: string;
  source?: string;
  /** ISO timestamp when queued. */
  queued_at: string;
  /** Number of retry attempts. */
  retry_count: number;
}

const INTENT_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours
const _MAX_RETRY_COUNT = 5; // Give up after 5 retries

export interface StorageSchema {
  access_token: string | null;
  refresh_token: string | null;
  backend_url: string | null;
  recent_jobs: RecentJob[];
  pending_intents: PendingIntent[];
  queued_applications: QueuedApplication[];
}

const DEFAULTS: StorageSchema = {
  access_token: null,
  refresh_token: null,
  backend_url: null,
  recent_jobs: [],
  pending_intents: [],
  queued_applications: [],
};

export async function getStorage<K extends keyof StorageSchema>(key: K): Promise<StorageSchema[K]> {
  const result = await chrome.storage.local.get(key);
  return (result[key] as StorageSchema[K]) ?? (DEFAULTS[key] as StorageSchema[K]);
}

export async function setStorage(items: Partial<StorageSchema>): Promise<void> {
  await chrome.storage.local.set(items as Record<string, unknown>);
}

export async function clearStorage(scope: "auth" | "all"): Promise<void> {
  if (scope === "all") {
    await chrome.storage.local.clear();
    return;
  }
  await chrome.storage.local.remove(["access_token", "refresh_token"]);
}

export async function appendRecentJob(job: RecentJob): Promise<void> {
  const existing = await getStorage("recent_jobs");
  const updated = [job, ...existing].slice(0, 5);
  await setStorage({ recent_jobs: updated });
}

// ---------------------------------------------------------------------------
// Intent helpers
// ---------------------------------------------------------------------------

/** Normalise a company name for fuzzy matching: lowercase alphanumeric only. */
function normalizeCompany(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(inc|llc|ltd|corp|co|the)\b\.?/g, "")
    .replace(/[^a-z0-9]/g, "");
}

/** True if the two company names are likely the same organisation. */
export function companiesMatch(a: string, b: string): boolean {
  const na = normalizeCompany(a);
  const nb = normalizeCompany(b);
  return na === nb || na.includes(nb) || nb.includes(na);
}

/** Persist a new pending intent (prunes expired ones first). */
export async function addPendingIntent(intent: Omit<PendingIntent, "stored_at">): Promise<void> {
  const now = Date.now();
  const existing = await getStorage("pending_intents");
  const live = existing.filter((i) => now - i.stored_at < INTENT_TTL_MS);
  await setStorage({ pending_intents: [...live, { ...intent, stored_at: now }] });
}

/**
 * Find and remove a pending intent matching the given company name.
 * Returns the intent if found (so the caller can merge its source/url), or null.
 */
export async function resolveIntent(companyName: string): Promise<PendingIntent | null> {
  const now = Date.now();
  const existing = await getStorage("pending_intents");
  const live = existing.filter((i) => now - i.stored_at < INTENT_TTL_MS);
  const idx = live.findIndex((i) => companiesMatch(i.company, companyName));
  if (idx === -1) {
    await setStorage({ pending_intents: live });
    return null;
  }
  const [matched] = live.splice(idx, 1);
  await setStorage({ pending_intents: live });
  return matched;
}

// ---------------------------------------------------------------------------
// Queue helpers
// ---------------------------------------------------------------------------

/** Add application to queue when backend is unreachable. */
export async function addToQueue(
  app: Omit<QueuedApplication, "queued_at" | "retry_count">,
): Promise<void> {
  const existing = await getStorage("queued_applications");
  const queued: QueuedApplication = {
    ...app,
    queued_at: new Date().toISOString(),
    retry_count: 0,
  };
  await setStorage({ queued_applications: [...existing, queued] });
}

/** Get all queued applications. */
export async function getQueue(): Promise<QueuedApplication[]> {
  return await getStorage("queued_applications");
}

/** Remove application from queue by index. */
export async function removeFromQueue(index: number): Promise<void> {
  const existing = await getStorage("queued_applications");
  const updated = existing.filter((_, i) => i !== index);
  await setStorage({ queued_applications: updated });
}

/** Increment retry count for queued application. */
export async function incrementRetryCount(index: number): Promise<void> {
  const existing = await getStorage("queued_applications");
  const updated = existing.map((app, i) =>
    i === index ? { ...app, retry_count: app.retry_count + 1 } : app,
  );
  await setStorage({ queued_applications: updated });
}

/** Get count of queued applications. */
export async function getQueueCount(): Promise<number> {
  const queue = await getStorage("queued_applications");
  return queue.length;
}
