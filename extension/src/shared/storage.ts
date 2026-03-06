export interface RecentJob {
  application_id: string;
  company: string;
  position: string;
  tracked_at: string;
}

export interface StorageSchema {
  access_token: string | null;
  refresh_token: string | null;
  backend_url: string | null;
  recent_jobs: RecentJob[];
}

const DEFAULTS: StorageSchema = {
  access_token: null,
  refresh_token: null,
  backend_url: null,
  recent_jobs: [],
};

export async function getStorage<K extends keyof StorageSchema>(
  key: K,
): Promise<StorageSchema[K]> {
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
