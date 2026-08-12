# Chrome Extension Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Chrome MV3 extension that injects a "Track" button into 17 supported job board pages and provides a popup fallback for any page, backed by the existing `/api/extension/{signin,refresh,track}` endpoints.

**Architecture:** Adapter registry — one content script with per-board adapters mapping `hostname → { extract(), getInjectTarget() }`. Background service worker owns all API calls, token refresh on 401, and whitelabeled Greenhouse/Ashby detection via `gh_jid`/DOM fingerprint. Popup is React 19. Content script is plain TypeScript/DOM only (no React).

**Tech Stack:** Vite 7, vite-plugin-web-extension, React 19, TypeScript 5, Vitest 4, jsdom, `@types/chrome`

---

## Reference

- **Design doc:** `docs/plans/2026-03-04-chrome-extension-design.md`
- **Backend API routes:** `frontend/src/routes/api/extension/{signin,refresh,track}.ts`
- **Backend service layer:** `frontend/src/lib/extension/track-service.ts`
- **OpenAPI schema types:** `frontend/src/lib/openapi/schemas.ts`

All three API endpoints expect/return JSON. `/track` requires `Authorization: Bearer <token>`. See design doc for full request/response shapes.

---

## Task 1: Scaffold the extension workspace

**Files:**
- Create: `extension/package.json`
- Create: `extension/tsconfig.json`
- Create: `extension/vite.config.ts`
- Create: `extension/manifest.json`
- Create: `extension/src/popup/index.html`
- Create: `extension/src/popup/main.tsx`
- Create: `extension/src/content/index.ts`
- Create: `extension/src/background/index.ts`
- Modify: `pnpm-workspace.yaml`

**Step 1: Add extension to the pnpm workspace**

Open `pnpm-workspace.yaml` and add `extension` alongside `frontend`:
```yaml
packages:
  - 'frontend'
  - 'extension'
```

**Step 2: Create `extension/package.json`**

```json
{
  "name": "jobsearch-tracker-extension",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "vite build --watch",
    "build": "vite build",
    "build:zip": "vite build && zip -r extension.zip dist/",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "react": "^19.2.4",
    "react-dom": "^19.2.4"
  },
  "devDependencies": {
    "@types/chrome": "^0.0.320",
    "@types/react": "^19.2.14",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^5.1.4",
    "jsdom": "^28.1.0",
    "typescript": "^5.9.3",
    "vite": "^7.3.1",
    "vite-plugin-web-extension": "^4.2.0",
    "vitest": "^4.0.18"
  }
}
```

**Step 3: Create `extension/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "strictNullChecks": true,
    "skipLibCheck": true,
    "types": ["chrome", "vitest/globals"],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

**Step 4: Create `extension/vite.config.ts`**

```ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import webExtension from "vite-plugin-web-extension";

export default defineConfig({
  plugins: [
    react(),
    webExtension({
      manifest: "manifest.json",
    }),
  ],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["src/test/setup.ts"],
  },
});
```

**Step 5: Create `extension/manifest.json`**

```json
{
  "manifest_version": 3,
  "name": "Job Search Tracker",
  "version": "0.1.0",
  "description": "One-click job application tracking from any job board.",
  "permissions": ["storage", "activeTab", "scripting", "tabs"],
  "host_permissions": ["<all_urls>"],
  "background": {
    "service_worker": "src/background/index.ts",
    "type": "module"
  },
  "action": {
    "default_popup": "src/popup/index.html",
    "default_title": "Job Search Tracker"
  },
  "content_scripts": [
    {
      "matches": [
        "*://*.linkedin.com/jobs/*",
        "*://*.indeed.com/*",
        "*://boards.greenhouse.io/*",
        "*://*.ashbyhq.com/*",
        "*://*.lever.co/*",
        "*://*.myworkdayjobs.com/*",
        "*://*.wellfound.com/*",
        "*://*.builtin.com/*",
        "*://*.dice.com/*",
        "*://*.levels.fyi/*",
        "*://*.ziprecruiter.com/*",
        "*://github.com/*/jobs*",
        "*://www.google.com/search*",
        "*://www.teamblind.com/*",
        "*://*.welcometothejungle.com/*",
        "*://www.workatastartup.com/*"
      ],
      "js": ["src/content/index.ts"],
      "run_at": "document_idle"
    }
  ]
}
```

**Step 6: Create stub entry points** (empty files so Vite can build)

`extension/src/popup/index.html`:
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Job Search Tracker</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./main.tsx"></script>
  </body>
</html>
```

`extension/src/popup/main.tsx`:
```tsx
import React from "react";
import { createRoot } from "react-dom/client";

const root = document.getElementById("root")!;
createRoot(root).render(<div>Hello Extension</div>);
```

`extension/src/content/index.ts`:
```ts
// content script entry point
console.log("[tracker] content script loaded");
```

`extension/src/background/index.ts`:
```ts
// background service worker
console.log("[tracker] background loaded");
```

**Step 7: Install dependencies**

```bash
cd extension && npx pnpm install
```

**Step 8: Verify the build works**

```bash
cd extension && npx pnpm build
```

Expected: `dist/` directory created with `manifest.json`, `popup/`, `content/`, `background/` folders. No errors.

**Step 9: Commit**

```bash
git add extension/ pnpm-workspace.yaml
git commit -m "feat(extension): scaffold Chrome MV3 extension workspace"
```

---

## Task 2: Test infrastructure

**Files:**
- Create: `extension/src/test/setup.ts`
- Create: `extension/src/test/chrome-mock.ts`

**Step 1: Create `extension/src/test/chrome-mock.ts`**

```ts
import { vi } from "vitest";

const store: Record<string, unknown> = {};

export const chromeMock = {
  storage: {
    local: {
      get: vi.fn(async (keys?: string | string[] | Record<string, unknown>) => {
        if (!keys) return { ...store };
        if (typeof keys === "string") return { [keys]: store[keys] };
        if (Array.isArray(keys)) {
          return Object.fromEntries(keys.map((k) => [k, store[k]]));
        }
        return Object.fromEntries(Object.keys(keys).map((k) => [k, store[k] ?? (keys as Record<string, unknown>)[k]]));
      }),
      set: vi.fn(async (items: Record<string, unknown>) => {
        Object.assign(store, items);
      }),
      remove: vi.fn(async (keys: string | string[]) => {
        const ks = typeof keys === "string" ? [keys] : keys;
        ks.forEach((k) => delete store[k]);
      }),
      clear: vi.fn(async () => {
        Object.keys(store).forEach((k) => delete store[k]);
      }),
    },
  },
  runtime: {
    sendMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    lastError: undefined as chrome.runtime.LastError | undefined,
  },
  tabs: {
    query: vi.fn(),
    onUpdated: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
  scripting: {
    executeScript: vi.fn(),
  },
} satisfies Partial<typeof chrome>;

export function resetChromeMock() {
  Object.keys(store).forEach((k) => delete store[k]);
  vi.clearAllMocks();
}
```

**Step 2: Create `extension/src/test/setup.ts`**

```ts
import { chromeMock } from "./chrome-mock";

// Inject chrome mock into global scope for all tests
Object.defineProperty(globalThis, "chrome", {
  value: chromeMock,
  writable: true,
  configurable: true,
});
```

**Step 3: Run the test suite to confirm it initialises cleanly**

```bash
cd extension && npx pnpm test
```

Expected: `No test files found` — no failures, just no tests yet. Exit code 0.

**Step 4: Commit**

```bash
git add extension/src/test/
git commit -m "test(extension): add vitest setup with chrome API mock"
```

---

## Task 3: Shared storage module

**Files:**
- Create: `extension/src/shared/storage.ts`
- Create: `extension/src/shared/__tests__/storage.test.ts`

**Step 1: Write the failing tests**

Create `extension/src/shared/__tests__/storage.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { resetChromeMock } from "../../test/chrome-mock";
import { clearStorage, getStorage, setStorage } from "../storage";

beforeEach(() => resetChromeMock());

describe("getStorage", () => {
  it("returns null for unset keys", async () => {
    const result = await getStorage("access_token");
    expect(result).toBeNull();
  });

  it("returns stored value", async () => {
    await setStorage({ access_token: "tok123" });
    const result = await getStorage("access_token");
    expect(result).toBe("tok123");
  });
});

describe("setStorage", () => {
  it("stores multiple keys at once", async () => {
    await setStorage({ access_token: "a", refresh_token: "b" });
    expect(await getStorage("access_token")).toBe("a");
    expect(await getStorage("refresh_token")).toBe("b");
  });
});

describe("clearStorage", () => {
  it("removes auth tokens but keeps backend_url and recent_jobs", async () => {
    await setStorage({
      access_token: "a",
      refresh_token: "b",
      backend_url: "https://myapp.com",
      recent_jobs: [],
    });
    await clearStorage("auth");
    expect(await getStorage("access_token")).toBeNull();
    expect(await getStorage("refresh_token")).toBeNull();
    expect(await getStorage("backend_url")).toBe("https://myapp.com");
  });

  it("removes all keys with 'all'", async () => {
    await setStorage({ backend_url: "https://myapp.com" });
    await clearStorage("all");
    expect(await getStorage("backend_url")).toBeNull();
  });
});
```

**Step 2: Run tests — verify they fail**

```bash
cd extension && npx pnpm test -- storage
```

Expected: FAIL — `Cannot find module '../storage'`

**Step 3: Implement `extension/src/shared/storage.ts`**

```ts
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
```

**Step 4: Run tests — verify they pass**

```bash
cd extension && npx pnpm test -- storage
```

Expected: All 5 tests PASS.

**Step 5: Commit**

```bash
git add extension/src/shared/storage.ts extension/src/shared/__tests__/storage.test.ts
git commit -m "feat(extension): add typed chrome.storage wrapper"
```

---

## Task 4: Shared API module

**Files:**
- Create: `extension/src/shared/api.ts`
- Create: `extension/src/shared/__tests__/api.test.ts`

**Step 1: Write the failing tests**

Create `extension/src/shared/__tests__/api.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { signin, refresh, track } from "../api";

const BACKEND = "https://myapp.com";

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("signin", () => {
  it("returns tokens on 200", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ access_token: "a", refresh_token: "b" }), { status: 200 }),
    );
    const result = await signin(BACKEND, "user@test.com", "pass");
    expect(result).toEqual({ ok: true, access_token: "a", refresh_token: "b" });
  });

  it("returns error on 401", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Invalid credentials" }), { status: 401 }),
    );
    const result = await signin(BACKEND, "user@test.com", "wrong");
    expect(result).toEqual({ ok: false, error: "Invalid credentials" });
  });
});

describe("refresh", () => {
  it("returns new tokens on 200", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ access_token: "new-a", refresh_token: "new-b" }), { status: 200 }),
    );
    const result = await refresh(BACKEND, "old-refresh-token");
    expect(result).toEqual({ ok: true, access_token: "new-a", refresh_token: "new-b" });
  });

  it("returns session_expired on 401", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Invalid token" }), { status: 401 }),
    );
    const result = await refresh(BACKEND, "bad-token");
    expect(result).toEqual({ ok: false, error: "session_expired" });
  });
});

describe("track", () => {
  it("returns application_id on 200", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ application_id: "uuid-1", company_id: "uuid-2" }), { status: 200 }),
    );
    const result = await track(BACKEND, "tok", {
      company_name: "Acme",
      position: "Engineer",
      url: "https://acme.com/job",
    });
    expect(result).toEqual({ ok: true, application_id: "uuid-1", company_id: "uuid-2" });
  });

  it("returns duplicate on 409", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Application already tracked", application_id: "uuid-1" }), { status: 409 }),
    );
    const result = await track(BACKEND, "tok", {
      company_name: "Acme",
      position: "Engineer",
      url: "https://acme.com/job",
    });
    expect(result).toEqual({ ok: false, error: "duplicate", application_id: "uuid-1" });
  });

  it("returns unauthorized on 401", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
    );
    const result = await track(BACKEND, "expired-tok", {
      company_name: "Acme",
      position: "Engineer",
      url: "https://acme.com/job",
    });
    expect(result).toEqual({ ok: false, error: "unauthorized" });
  });
});
```

**Step 2: Run tests — verify they fail**

```bash
cd extension && npx pnpm test -- api
```

Expected: FAIL — `Cannot find module '../api'`

**Step 3: Implement `extension/src/shared/api.ts`**

```ts
export type SigninResult =
  | { ok: true; access_token: string; refresh_token: string }
  | { ok: false; error: string };

export type RefreshResult =
  | { ok: true; access_token: string; refresh_token: string }
  | { ok: false; error: "session_expired" };

export type TrackData = {
  company_name: string;
  position: string;
  url: string;
};

export type TrackResult =
  | { ok: true; application_id: string; company_id: string }
  | { ok: false; error: "duplicate"; application_id: string }
  | { ok: false; error: "unauthorized" }
  | { ok: false; error: string };

export async function signin(
  backendUrl: string,
  email: string,
  password: string,
): Promise<SigninResult> {
  const res = await fetch(`${backendUrl}/api/extension/signin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const json = await res.json();
  if (res.ok) return { ok: true, access_token: json.access_token, refresh_token: json.refresh_token };
  return { ok: false, error: json.error ?? "Sign in failed" };
}

export async function refresh(
  backendUrl: string,
  refreshToken: string,
): Promise<RefreshResult> {
  const res = await fetch(`${backendUrl}/api/extension/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  if (!res.ok) return { ok: false, error: "session_expired" };
  const json = await res.json();
  return { ok: true, access_token: json.access_token, refresh_token: json.refresh_token };
}

export async function track(
  backendUrl: string,
  accessToken: string,
  data: TrackData,
): Promise<TrackResult> {
  const res = await fetch(`${backendUrl}/api/extension/track`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (res.ok) return { ok: true, application_id: json.application_id, company_id: json.company_id };
  if (res.status === 401) return { ok: false, error: "unauthorized" };
  if (res.status === 409) return { ok: false, error: "duplicate", application_id: json.application_id };
  return { ok: false, error: json.error ?? "Unknown error" };
}
```

**Step 4: Run tests — verify they pass**

```bash
cd extension && npx pnpm test -- api
```

Expected: All 6 tests PASS.

**Step 5: Commit**

```bash
git add extension/src/shared/api.ts extension/src/shared/__tests__/api.test.ts
git commit -m "feat(extension): add typed API client for extension endpoints"
```

---

## Task 5: Adapter types and registry

**Files:**
- Create: `extension/src/content/adapters/types.ts`
- Create: `extension/src/content/adapters/index.ts`
- Create: `extension/src/content/adapters/__tests__/registry.test.ts`

**Step 1: Write the failing tests**

Create `extension/src/content/adapters/__tests__/registry.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { findAdapter } from "../index";

describe("findAdapter", () => {
  it("returns null for an unknown host", () => {
    expect(findAdapter("randomsite.com")).toBeNull();
  });

  it("finds the LinkedIn adapter by hostname", () => {
    const adapter = findAdapter("www.linkedin.com");
    expect(adapter).not.toBeNull();
    expect(adapter!.hosts).toContain("www.linkedin.com");
  });

  it("finds Greenhouse adapter by boards.greenhouse.io", () => {
    expect(findAdapter("boards.greenhouse.io")).not.toBeNull();
  });

  it("returns null for greenhouse.io root (not a job board page)", () => {
    expect(findAdapter("greenhouse.io")).toBeNull();
  });
});
```

**Step 2: Run tests — verify they fail**

```bash
cd extension && npx pnpm test -- registry
```

Expected: FAIL

**Step 3: Create `extension/src/content/adapters/types.ts`**

```ts
export interface JobData {
  company: string;
  position: string;
  url: string;
}

export interface Adapter {
  /** All hostnames this adapter handles (exact match against location.hostname). */
  hosts: string[];
  /**
   * Extract job data from the current page DOM.
   * Returns null if the page is not a job detail page (e.g. a list page).
   */
  extract(): JobData | null;
  /**
   * Return the element to inject the Track button adjacent to.
   * Returns null if the target hasn't rendered yet (caller will retry via MutationObserver).
   */
  getInjectTarget(): Element | null;
}
```

**Step 4: Create `extension/src/content/adapters/index.ts`**

```ts
import type { Adapter } from "./types";

// Adapters are registered here as they are implemented.
// Import each and add to the array.
const adapters: Adapter[] = [
  // adapters added in subsequent tasks
];

/** Look up the adapter for the current hostname. Returns null if unsupported. */
export function findAdapter(hostname: string): Adapter | null {
  return adapters.find((a) => a.hosts.includes(hostname)) ?? null;
}

export { adapters };
export type { Adapter };
```

**Step 5: Run tests — verify they pass**

```bash
cd extension && npx pnpm test -- registry
```

Expected: All 4 tests PASS (LinkedIn adapter doesn't exist yet but the test for it will fail — update the test file to only include the passing tests until LinkedIn is added; leave the LinkedIn + Greenhouse tests as `it.todo` for now).

Actually — adjust the registry tests:

```ts
// Replace the LinkedIn and Greenhouse tests with todos until those adapters are registered:
it.todo("finds the LinkedIn adapter by hostname");
it.todo("finds Greenhouse adapter by boards.greenhouse.io");
```

**Step 6: Commit**

```bash
git add extension/src/content/adapters/
git commit -m "feat(extension): add adapter types and registry"
```

---

## Task 6: Content script button injection

**Files:**
- Create: `extension/src/content/inject.ts`
- Create: `extension/src/content/__tests__/inject.test.ts`

**Step 1: Write the failing tests**

Create `extension/src/content/__tests__/inject.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { injectTrackButton, removeTrackButton, BUTTON_ID } from "../inject";
import type { JobData } from "../adapters/types";

const jobData: JobData = {
  company: "Acme Corp",
  position: "Senior Engineer",
  url: "https://acme.com/job/123",
};

describe("injectTrackButton", () => {
  let target: HTMLElement;

  beforeEach(() => {
    target = document.createElement("div");
    document.body.appendChild(target);
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("injects a button adjacent to the target element", () => {
    injectTrackButton(target, jobData, vi.fn());
    expect(document.getElementById(BUTTON_ID)).not.toBeNull();
  });

  it("does not inject a second button if one already exists", () => {
    injectTrackButton(target, jobData, vi.fn());
    injectTrackButton(target, jobData, vi.fn());
    const buttons = document.querySelectorAll(`#${BUTTON_ID}`);
    expect(buttons).toHaveLength(1);
  });

  it("calls onClick when the button is clicked", async () => {
    const onClick = vi.fn();
    injectTrackButton(target, jobData, onClick);
    const btn = document.getElementById(BUTTON_ID) as HTMLButtonElement;
    btn.click();
    expect(onClick).toHaveBeenCalledWith(jobData);
  });
});

describe("removeTrackButton", () => {
  it("removes the button from the DOM", () => {
    const target = document.createElement("div");
    document.body.appendChild(target);
    injectTrackButton(target, jobData, vi.fn());
    expect(document.getElementById(BUTTON_ID)).not.toBeNull();
    removeTrackButton();
    expect(document.getElementById(BUTTON_ID)).toBeNull();
  });
});
```

**Step 2: Run tests — verify they fail**

```bash
cd extension && npx pnpm test -- inject
```

Expected: FAIL

**Step 3: Implement `extension/src/content/inject.ts`**

```ts
import type { JobData } from "./adapters/types";

export const BUTTON_ID = "jst-track-btn";

const BUTTON_STYLES: Partial<CSSStyleDeclaration> = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  padding: "8px 16px",
  marginLeft: "8px",
  backgroundColor: "#2563eb",
  color: "#ffffff",
  border: "none",
  borderRadius: "6px",
  fontSize: "14px",
  fontWeight: "600",
  fontFamily: "system-ui, -apple-system, sans-serif",
  cursor: "pointer",
  whiteSpace: "nowrap",
  verticalAlign: "middle",
  lineHeight: "1.4",
  transition: "background-color 0.15s ease",
  zIndex: "9999",
};

type ButtonState = "idle" | "loading" | "success" | "duplicate" | "expired" | "error";

export function injectTrackButton(
  target: Element,
  jobData: JobData,
  onClick: (data: JobData) => void,
): HTMLButtonElement | null {
  if (document.getElementById(BUTTON_ID)) return null;

  const btn = document.createElement("button");
  btn.id = BUTTON_ID;
  btn.textContent = "Track";
  Object.assign(btn.style, BUTTON_STYLES);

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    onClick(jobData);
  });

  btn.addEventListener("mouseenter", () => {
    if (btn.dataset.state === "idle" || !btn.dataset.state) {
      btn.style.backgroundColor = "#1d4ed8";
    }
  });
  btn.addEventListener("mouseleave", () => {
    if (btn.dataset.state === "idle" || !btn.dataset.state) {
      btn.style.backgroundColor = "#2563eb";
    }
  });

  target.insertAdjacentElement("afterend", btn);
  return btn;
}

export function setButtonState(state: ButtonState, message?: string): void {
  const btn = document.getElementById(BUTTON_ID) as HTMLButtonElement | null;
  if (!btn) return;

  btn.dataset.state = state;

  const labels: Record<ButtonState, string> = {
    idle: "Track",
    loading: "Tracking…",
    success: "Tracked ✓",
    duplicate: "Already tracked",
    expired: "Sign in again",
    error: message ?? "Failed — retry?",
  };

  const colors: Record<ButtonState, string> = {
    idle: "#2563eb",
    loading: "#6b7280",
    success: "#16a34a",
    duplicate: "#6b7280",
    expired: "#dc2626",
    error: "#dc2626",
  };

  btn.textContent = labels[state];
  btn.style.backgroundColor = colors[state];
  btn.disabled = state === "loading" || state === "success" || state === "duplicate";
}

export function removeTrackButton(): void {
  document.getElementById(BUTTON_ID)?.remove();
}
```

**Step 4: Run tests — verify they pass**

```bash
cd extension && npx pnpm test -- inject
```

Expected: All 4 tests PASS.

**Step 5: Commit**

```bash
git add extension/src/content/inject.ts extension/src/content/__tests__/inject.test.ts
git commit -m "feat(extension): add DOM button injection with state machine"
```

---

## Task 7: Content script entry point

**Files:**
- Create (replaces stub): `extension/src/content/index.ts`

No unit test for this file — it's the wiring layer. Integration is verified by loading the extension manually.

**Step 1: Implement `extension/src/content/index.ts`**

```ts
import { findAdapter } from "./adapters/index";
import { injectTrackButton, setButtonState } from "./inject";
import type { JobData } from "./adapters/types";

const MAX_RETRIES = 20;
const RETRY_INTERVAL_MS = 500;

function tryInject(retries = 0): void {
  const adapter = findAdapter(location.hostname);
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
    const adapter = findAdapter(location.hostname);
    const jobData = adapter?.extract() ?? null;
    sendResponse(jobData);
  }
  return true;
});
```

**Step 2: Verify build still succeeds**

```bash
cd extension && npx pnpm build
```

Expected: No errors.

**Step 3: Commit**

```bash
git add extension/src/content/index.ts
git commit -m "feat(extension): add content script entry point with SPA navigation support"
```

---

## Task 8: LinkedIn and Indeed adapters

**Files:**
- Create: `extension/src/content/adapters/linkedin.ts`
- Create: `extension/src/content/adapters/indeed.ts`
- Create: `extension/src/content/adapters/__tests__/linkedin.test.ts`
- Create: `extension/src/content/adapters/__tests__/indeed.test.ts`
- Modify: `extension/src/content/adapters/index.ts`

> **Note on selectors:** DOM selectors for all adapters in this plan are based on known-good patterns but job boards change their markup frequently. Before implementing each adapter, open a real job listing on that site, right-click the job title, and inspect the element to get the current selector. Update selectors as needed. The test fixtures use hardcoded HTML, so tests remain stable regardless of what the live site uses.

**Step 1: Write LinkedIn adapter test**

Create `extension/src/content/adapters/__tests__/linkedin.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { linkedInAdapter } from "../linkedin";

function makeLinkedInDOM(title: string, company: string): void {
  document.body.innerHTML = `
    <div class="jobs-unified-top-card">
      <h1 class="job-details-jobs-unified-top-card__job-title">
        <a>${title}</a>
      </h1>
      <div class="job-details-jobs-unified-top-card__company-name">
        <a>${company}</a>
      </div>
      <div class="jobs-apply-button--top-card">
        <button>Easy Apply</button>
      </div>
    </div>
  `;
}

describe("linkedInAdapter", () => {
  it("extracts job title and company", () => {
    makeLinkedInDOM("Senior Engineer", "Acme Corp");
    const data = linkedInAdapter.extract();
    expect(data?.position).toBe("Senior Engineer");
    expect(data?.company).toBe("Acme Corp");
    expect(data?.url).toBe(location.href);
  });

  it("returns null when not on a job detail page", () => {
    document.body.innerHTML = `<div>LinkedIn Feed</div>`;
    expect(linkedInAdapter.extract()).toBeNull();
  });

  it("identifies the inject target", () => {
    makeLinkedInDOM("Engineer", "Corp");
    expect(linkedInAdapter.getInjectTarget()).not.toBeNull();
  });
});
```

**Step 2: Write Indeed adapter test**

Create `extension/src/content/adapters/__tests__/indeed.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { indeedAdapter } from "../indeed";

function makeIndeedDOM(title: string, company: string): void {
  document.body.innerHTML = `
    <div class="jobsearch-ViewJobLayout">
      <h1 data-testid="jobsearch-JobInfoHeader-title">${title}</h1>
      <div data-testid="inlineHeader-companyName">
        <a>${company}</a>
      </div>
      <div class="jobsearch-IndeedApplyButton-contentWrapper">
        <button>Apply now</button>
      </div>
    </div>
  `;
}

describe("indeedAdapter", () => {
  it("extracts job title and company", () => {
    makeIndeedDOM("Backend Engineer", "TechCo");
    const data = indeedAdapter.extract();
    expect(data?.position).toBe("Backend Engineer");
    expect(data?.company).toBe("TechCo");
  });

  it("returns null when not on a job detail page", () => {
    document.body.innerHTML = `<div>Indeed homepage</div>`;
    expect(indeedAdapter.extract()).toBeNull();
  });
});
```

**Step 3: Run tests — verify they fail**

```bash
cd extension && npx pnpm test -- linkedin indeed
```

Expected: FAIL — modules not found.

**Step 4: Implement `extension/src/content/adapters/linkedin.ts`**

```ts
import type { Adapter, JobData } from "./types";

export const linkedInAdapter: Adapter = {
  hosts: ["www.linkedin.com", "linkedin.com"],

  extract(): JobData | null {
    // Verify we're on a job detail page (not feed/search)
    const titleEl =
      document.querySelector<HTMLElement>(
        ".job-details-jobs-unified-top-card__job-title h1",
      ) ??
      document.querySelector<HTMLElement>("h1.t-24.t-bold") ??
      document.querySelector<HTMLElement>(".jobs-unified-top-card__job-title");

    const companyEl =
      document.querySelector<HTMLElement>(
        ".job-details-jobs-unified-top-card__company-name a",
      ) ??
      document.querySelector<HTMLElement>(".jobs-unified-top-card__company-name a") ??
      document.querySelector<HTMLElement>(".topcard__org-name-link");

    if (!titleEl || !companyEl) return null;

    const position = titleEl.textContent?.trim() ?? "";
    const company = companyEl.textContent?.trim() ?? "";
    if (!position || !company) return null;

    return { position, company, url: location.href };
  },

  getInjectTarget(): Element | null {
    return (
      document.querySelector(".jobs-apply-button--top-card") ??
      document.querySelector(".jobs-s-apply") ??
      document.querySelector(".jobs-unified-top-card__content--two-pane")
    );
  },
};
```

**Step 5: Implement `extension/src/content/adapters/indeed.ts`**

```ts
import type { Adapter, JobData } from "./types";

export const indeedAdapter: Adapter = {
  hosts: ["www.indeed.com", "indeed.com"],

  extract(): JobData | null {
    const titleEl =
      document.querySelector<HTMLElement>(
        '[data-testid="jobsearch-JobInfoHeader-title"]',
      ) ??
      document.querySelector<HTMLElement>("h1.jobsearch-JobInfoHeader-title");

    const companyEl =
      document.querySelector<HTMLElement>(
        '[data-testid="inlineHeader-companyName"]',
      ) ??
      document.querySelector<HTMLElement>('[data-testid="companyName"]');

    if (!titleEl || !companyEl) return null;

    const position = titleEl.textContent?.trim() ?? "";
    const company = companyEl.textContent?.trim() ?? "";
    if (!position || !company) return null;

    return { position, company, url: location.href };
  },

  getInjectTarget(): Element | null {
    return (
      document.querySelector(".jobsearch-IndeedApplyButton-contentWrapper") ??
      document.querySelector(".jobsearch-ApplyButtonContainer") ??
      document.querySelector('[data-testid="applyButton"]')
    );
  },
};
```

**Step 6: Register adapters in `extension/src/content/adapters/index.ts`**

```ts
import { linkedInAdapter } from "./linkedin";
import { indeedAdapter } from "./indeed";
import type { Adapter } from "./types";

const adapters: Adapter[] = [
  linkedInAdapter,
  indeedAdapter,
  // more adapters added in subsequent tasks
];

export function findAdapter(hostname: string): Adapter | null {
  return adapters.find((a) => a.hosts.includes(hostname)) ?? null;
}

export { adapters };
export type { Adapter };
```

Also update `extension/src/content/adapters/__tests__/registry.test.ts` — change the `it.todo` for LinkedIn to a real assertion now that the adapter is registered.

**Step 7: Run tests — verify they pass**

```bash
cd extension && npx pnpm test -- linkedin indeed registry
```

Expected: All tests PASS.

**Step 8: Commit**

```bash
git add extension/src/content/adapters/
git commit -m "feat(extension): add LinkedIn and Indeed adapters"
```

---

## Task 9: Greenhouse, Lever, and Ashby adapters

**Files:**
- Create: `extension/src/content/adapters/greenhouse.ts`
- Create: `extension/src/content/adapters/lever.ts`
- Create: `extension/src/content/adapters/ashby.ts`
- Create: `extension/src/content/adapters/__tests__/greenhouse.test.ts`
- Modify: `extension/src/content/adapters/index.ts`

Greenhouse's native board (`boards.greenhouse.io`) follows a consistent structure. The same adapter is reused by the background worker for whitelabeled instances.

**Step 1: Write Greenhouse test**

Create `extension/src/content/adapters/__tests__/greenhouse.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { greenhouseAdapter } from "../greenhouse";

function makeGreenhouseDOM(title: string, company: string): void {
  document.body.innerHTML = `
    <div class="app-title">${title}</div>
    <div class="company-name">${company}</div>
    <div id="header">
      <a class="btn btn--primary" href="#">Apply for this Job</a>
    </div>
  `;
}

describe("greenhouseAdapter", () => {
  it("extracts position and company", () => {
    makeGreenhouseDOM("Staff Engineer", "Greenhouse Inc");
    const data = greenhouseAdapter.extract();
    expect(data?.position).toBe("Staff Engineer");
    expect(data?.company).toBe("Greenhouse Inc");
  });

  it("returns null when no job title found", () => {
    document.body.innerHTML = `<div>nothing here</div>`;
    expect(greenhouseAdapter.extract()).toBeNull();
  });
});
```

**Step 2: Run test — verify it fails**

```bash
cd extension && npx pnpm test -- greenhouse
```

Expected: FAIL

**Step 3: Implement `extension/src/content/adapters/greenhouse.ts`**

```ts
import type { Adapter, JobData } from "./types";

export const greenhouseAdapter: Adapter = {
  hosts: ["boards.greenhouse.io"],

  extract(): JobData | null {
    const titleEl =
      document.querySelector<HTMLElement>(".app-title") ??
      document.querySelector<HTMLElement>("h1.section-header") ??
      document.querySelector<HTMLElement>('[class*="app-title"]');

    const companyEl =
      document.querySelector<HTMLElement>(".company-name") ??
      document.querySelector<HTMLElement>(".board-header__company") ??
      document.querySelector<HTMLElement>('[class*="company-name"]');

    if (!titleEl) return null;

    const position = titleEl.textContent?.trim() ?? "";
    // Company name may not be on the page; fall back to page title parsing
    const company =
      companyEl?.textContent?.trim() ||
      parseCompanyFromTitle(document.title);

    if (!position || !company) return null;
    return { position, company, url: location.href };
  },

  getInjectTarget(): Element | null {
    return (
      document.querySelector("#header .btn--primary") ??
      document.querySelector(".application-footer") ??
      document.querySelector(".opening")
    );
  },
};

function parseCompanyFromTitle(title: string): string {
  // Greenhouse titles are often "Position at Company - Greenhouse"
  const match = title.match(/at (.+?)(?:\s*[-|]\s*Greenhouse)?$/i);
  return match?.[1]?.trim() ?? "";
}
```

**Step 4: Implement `extension/src/content/adapters/lever.ts`**

```ts
import type { Adapter, JobData } from "./types";

export const leverAdapter: Adapter = {
  hosts: ["jobs.lever.co"],

  extract(): JobData | null {
    const titleEl =
      document.querySelector<HTMLElement>(".posting-headline h2") ??
      document.querySelector<HTMLElement>("h2.posting-title");

    // Lever URL format: jobs.lever.co/[company]/[job-id]
    // Extract company from URL path as it's more reliable than the DOM
    const companyFromUrl = location.pathname.split("/")[1]?.replace(/-/g, " ");

    if (!titleEl || !companyFromUrl) return null;

    const position = titleEl.textContent?.trim() ?? "";
    if (!position) return null;

    // Capitalise each word of the company slug
    const company = companyFromUrl.replace(/\b\w/g, (c) => c.toUpperCase());
    return { position, company, url: location.href };
  },

  getInjectTarget(): Element | null {
    return (
      document.querySelector(".postings-btn-wrapper") ??
      document.querySelector(".posting-apply") ??
      document.querySelector(".template-btn-submit")
    );
  },
};
```

**Step 5: Implement `extension/src/content/adapters/ashby.ts`**

```ts
import type { Adapter, JobData } from "./types";

export const ashbyAdapter: Adapter = {
  hosts: ["jobs.ashbyhq.com"],

  extract(): JobData | null {
    // Ashby: ashbyhq.com/[company]/[job-id]
    const titleEl = document.querySelector<HTMLElement>(
      "h1[class*='ashby-job-posting-heading']",
    ) ?? document.querySelector<HTMLElement>("h1");

    const companyFromUrl = location.pathname.split("/")[1]?.replace(/-/g, " ");

    if (!titleEl || !companyFromUrl) return null;

    const position = titleEl.textContent?.trim() ?? "";
    if (!position) return null;

    const company = companyFromUrl.replace(/\b\w/g, (c) => c.toUpperCase());
    return { position, company, url: location.href };
  },

  getInjectTarget(): Element | null {
    return (
      document.querySelector("._applyButton_") ??
      document.querySelector('[class*="applyButton"]') ??
      document.querySelector('[class*="apply-button"]')
    );
  },
};
```

**Step 6: Register new adapters in `index.ts`**

Add imports and include in the `adapters` array:
```ts
import { greenhouseAdapter } from "./greenhouse";
import { leverAdapter } from "./lever";
import { ashbyAdapter } from "./ashby";

const adapters: Adapter[] = [
  linkedInAdapter,
  indeedAdapter,
  greenhouseAdapter,
  leverAdapter,
  ashbyAdapter,
];
```

Also update the registry test's `it.todo` for Greenhouse to a real assertion.

**Step 7: Run all adapter tests**

```bash
cd extension && npx pnpm test -- greenhouse registry
```

Expected: All PASS.

**Step 8: Commit**

```bash
git add extension/src/content/adapters/
git commit -m "feat(extension): add Greenhouse, Lever, and Ashby adapters"
```

---

## Task 10: Remaining 11 adapters

**Files:**
- Create one file per adapter below (no individual test files — follow the patterns from Tasks 8–9 if you want coverage, but the focus here is breadth)
- Modify: `extension/src/content/adapters/index.ts`

> **Important:** For every adapter, open a real job listing on that site and inspect the DOM to verify selectors before finalising. The selectors below are best-effort starting points. Mark any unverified adapter with a `// TODO: verify selector` comment so it's easy to find later.

Create each file in `extension/src/content/adapters/`:

**`workday.ts`:**
```ts
import type { Adapter, JobData } from "./types";
export const workdayAdapter: Adapter = {
  hosts: [], // dynamically added by background worker — not a static host
  extract(): JobData | null {
    const titleEl = document.querySelector<HTMLElement>(
      '[data-automation-id="jobPostingHeader"]',
    );
    // Workday company name is usually in the subdomain: acme.myworkdayjobs.com
    const companyFromHost = location.hostname.split(".")[0]?.replace(/-/g, " ") ?? "";
    if (!titleEl || !companyFromHost) return null;
    const position = titleEl.textContent?.trim() ?? "";
    if (!position) return null;
    const company = companyFromHost.replace(/\b\w/g, (c) => c.toUpperCase());
    return { position, company, url: location.href };
  },
  getInjectTarget(): Element | null {
    return document.querySelector('[data-automation-id="applyButton"]');
  },
};
```

> Note: Workday's content script `matches` entry uses `*.myworkdayjobs.com/*` which covers the host pattern. The adapter `hosts` array is left empty because the content script match rule handles it — the adapter is looked up by passing the full hostname. Update `findAdapter` to also accept a Workday URL by checking `location.hostname.endsWith("myworkdayjobs.com")` — see adjustment below.

**`wellfound.ts`:**
```ts
import type { Adapter, JobData } from "./types";
export const wellfoundAdapter: Adapter = {
  hosts: ["wellfound.com", "www.wellfound.com"],
  extract(): JobData | null {
    const titleEl = document.querySelector<HTMLElement>("h1[class*='title']") ??
      document.querySelector<HTMLElement>("h1");
    const companyEl = document.querySelector<HTMLElement>("a[class*='startup']") ??
      document.querySelector<HTMLElement>("[class*='companyName']");
    if (!titleEl || !companyEl) return null;
    const position = titleEl.textContent?.trim() ?? "";
    const company = companyEl.textContent?.trim() ?? "";
    if (!position || !company) return null;
    return { position, company, url: location.href };
  },
  getInjectTarget(): Element | null {
    return document.querySelector("a[class*='applyButton']") ??
      document.querySelector("[class*='apply']");
  },
};
```

**`builtin.ts`:**
```ts
import type { Adapter, JobData } from "./types";
export const builtinAdapter: Adapter = {
  hosts: ["builtin.com", "www.builtin.com"],
  extract(): JobData | null {
    const titleEl = document.querySelector<HTMLElement>("h1[class*='job-title']") ??
      document.querySelector<HTMLElement>(".job-info h1");
    const companyEl = document.querySelector<HTMLElement>("a[class*='company']") ??
      document.querySelector<HTMLElement>("[class*='company-title']");
    if (!titleEl || !companyEl) return null;
    const position = titleEl.textContent?.trim() ?? "";
    const company = companyEl.textContent?.trim() ?? "";
    if (!position || !company) return null;
    return { position, company, url: location.href };
  },
  getInjectTarget(): Element | null {
    return document.querySelector("[class*='apply-btn']") ??
      document.querySelector(".apply-button");
  },
};
```

**`dice.ts`:**
```ts
import type { Adapter, JobData } from "./types";
export const diceAdapter: Adapter = {
  hosts: ["www.dice.com", "dice.com"],
  extract(): JobData | null {
    const titleEl = document.querySelector<HTMLElement>("h1[data-cy='jobTitle']") ??
      document.querySelector<HTMLElement>(".job-header h1");
    const companyEl = document.querySelector<HTMLElement>("a[data-cy='companyNameLink']") ??
      document.querySelector<HTMLElement>("[class*='company-name']");
    if (!titleEl || !companyEl) return null;
    const position = titleEl.textContent?.trim() ?? "";
    const company = companyEl.textContent?.trim() ?? "";
    if (!position || !company) return null;
    return { position, company, url: location.href };
  },
  getInjectTarget(): Element | null {
    return document.querySelector("[data-cy='applyButton']") ??
      document.querySelector(".apply-button-container");
  },
};
```

**`levels.ts`:**
```ts
import type { Adapter, JobData } from "./types";
export const levelsAdapter: Adapter = {
  hosts: ["www.levels.fyi", "levels.fyi"],
  extract(): JobData | null {
    // Levels.fyi jobs: levels.fyi/jobs/[id]/[company]/[title]
    const parts = location.pathname.split("/").filter(Boolean);
    // path: /jobs/{id}/{company-slug}/{title-slug}
    if (parts[0] !== "jobs" || parts.length < 4) return null;
    const company = (parts[2] ?? "").replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    const titleEl = document.querySelector<HTMLElement>("h1") ??
      document.querySelector<HTMLElement>("[class*='jobTitle']");
    const position = titleEl?.textContent?.trim() ??
      (parts[3] ?? "").replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    if (!position || !company) return null;
    return { position, company, url: location.href };
  },
  getInjectTarget(): Element | null {
    return document.querySelector("[class*='applyButton']") ??
      document.querySelector("a[href*='apply']");
  },
};
```

**`ziprecruiter.ts`:**
```ts
import type { Adapter, JobData } from "./types";
export const ziprecruiterAdapter: Adapter = {
  hosts: ["www.ziprecruiter.com", "ziprecruiter.com"],
  extract(): JobData | null {
    const titleEl = document.querySelector<HTMLElement>("[class*='job_title']") ??
      document.querySelector<HTMLElement>("h1");
    const companyEl = document.querySelector<HTMLElement>("[class*='hiring_company_text']") ??
      document.querySelector<HTMLElement>("[class*='company_name']");
    if (!titleEl || !companyEl) return null;
    const position = titleEl.textContent?.trim() ?? "";
    const company = companyEl.textContent?.trim() ?? "";
    if (!position || !company) return null;
    return { position, company, url: location.href };
  },
  getInjectTarget(): Element | null {
    return document.querySelector("[class*='apply_button']") ??
      document.querySelector("a[data-testid='apply-button']");
  },
};
```

**`github.ts`:**
```ts
import type { Adapter, JobData } from "./types";
export const githubAdapter: Adapter = {
  hosts: ["github.com"],
  extract(): JobData | null {
    // Only active on github.com/*/jobs/* paths
    if (!location.pathname.includes("/jobs/")) return null;
    const titleEl = document.querySelector<HTMLElement>("h1.lh-condensed") ??
      document.querySelector<HTMLElement>(".job-listing-header h1");
    const companyEl = document.querySelector<HTMLElement>(".mr-3 a") ??
      document.querySelector<HTMLElement>("[class*='org-name']");
    if (!titleEl) return null;
    const position = titleEl.textContent?.trim() ?? "";
    const company = companyEl?.textContent?.trim() ?? location.pathname.split("/")[1] ?? "";
    if (!position || !company) return null;
    return { position, company, url: location.href };
  },
  getInjectTarget(): Element | null {
    return document.querySelector(".apply-area") ??
      document.querySelector("[class*='apply']");
  },
};
```

**`google.ts`:**
```ts
import type { Adapter, JobData } from "./types";
export const googleJobsAdapter: Adapter = {
  hosts: ["www.google.com"],
  extract(): JobData | null {
    // Only active in Google Jobs mode (udm=8 or jobs panel present)
    const url = new URL(location.href);
    const isJobsMode = url.searchParams.get("udm") === "8";
    const jobsPanel = document.querySelector("[class*='jobDetails'], .gws-plugins-horizon-jobs__tl-lif");
    if (!isJobsMode && !jobsPanel) return null;

    const titleEl = document.querySelector<HTMLElement>(
      ".gws-plugins-horizon-jobs__tl-lif h2",
    ) ?? document.querySelector<HTMLElement>("[data-ved] h2");
    const companyEl = document.querySelector<HTMLElement>(
      ".gws-plugins-horizon-jobs__tl-lif [class*='company']",
    );
    if (!titleEl) return null;
    const position = titleEl.textContent?.trim() ?? "";
    const company = companyEl?.textContent?.trim() ?? "";
    if (!position) return null;
    return { position, company, url: location.href };
  },
  getInjectTarget(): Element | null {
    return document.querySelector(".gws-plugins-horizon-jobs__tl-lif") ??
      document.querySelector("[class*='jobDetails']");
  },
};
```

**`blind.ts`:**
```ts
import type { Adapter, JobData } from "./types";
export const blindAdapter: Adapter = {
  hosts: ["www.teamblind.com"],
  extract(): JobData | null {
    const titleEl = document.querySelector<HTMLElement>("h1[class*='title']") ??
      document.querySelector<HTMLElement>(".posting-header h1");
    const companyEl = document.querySelector<HTMLElement>("[class*='company-name']") ??
      document.querySelector<HTMLElement>(".company-info a");
    if (!titleEl || !companyEl) return null;
    const position = titleEl.textContent?.trim() ?? "";
    const company = companyEl.textContent?.trim() ?? "";
    if (!position || !company) return null;
    return { position, company, url: location.href };
  },
  getInjectTarget(): Element | null {
    return document.querySelector("[class*='apply-btn']") ??
      document.querySelector(".apply-button");
  },
};
```

**`welcometothejungle.ts`:**
```ts
import type { Adapter, JobData } from "./types";
export const welcomeToTheJungleAdapter: Adapter = {
  hosts: ["www.welcometothejungle.com"],
  extract(): JobData | null {
    const titleEl = document.querySelector<HTMLElement>("h1[class*='sc-']") ??
      document.querySelector<HTMLElement>("[data-testid='job-header-title']");
    const companyEl = document.querySelector<HTMLElement>("[data-testid='company-title']") ??
      document.querySelector<HTMLElement>("[class*='company'] h2");
    if (!titleEl || !companyEl) return null;
    const position = titleEl.textContent?.trim() ?? "";
    const company = companyEl.textContent?.trim() ?? "";
    if (!position || !company) return null;
    return { position, company, url: location.href };
  },
  getInjectTarget(): Element | null {
    return document.querySelector("[data-testid='job-cta-button']") ??
      document.querySelector("[class*='applyButton']");
  },
};
```

**`workatastartup.ts`:**
```ts
import type { Adapter, JobData } from "./types";
export const workAtAStartupAdapter: Adapter = {
  hosts: ["www.workatastartup.com"],
  extract(): JobData | null {
    const titleEl = document.querySelector<HTMLElement>("h1.company-name") ??
      document.querySelector<HTMLElement>(".listing-title h1") ??
      document.querySelector<HTMLElement>(".job-name");
    const companyEl = document.querySelector<HTMLElement>(".company-header h1") ??
      document.querySelector<HTMLElement>("[class*='startup-name']");
    if (!titleEl) return null;
    const position = titleEl.textContent?.trim() ?? "";
    const company = companyEl?.textContent?.trim() ?? "";
    if (!position || !company) return null;
    return { position, company, url: location.href };
  },
  getInjectTarget(): Element | null {
    return document.querySelector(".apply-button") ??
      document.querySelector("a[href*='apply']");
  },
};
```

**Register all adapters in `index.ts`:**

Update `extension/src/content/adapters/index.ts` to include all adapters. Also handle the Workday case (subdomain matching):

```ts
import { linkedInAdapter } from "./linkedin";
import { indeedAdapter } from "./indeed";
import { greenhouseAdapter } from "./greenhouse";
import { leverAdapter } from "./lever";
import { ashbyAdapter } from "./ashby";
import { workdayAdapter } from "./workday";
import { wellfoundAdapter } from "./wellfound";
import { builtinAdapter } from "./builtin";
import { diceAdapter } from "./dice";
import { levelsAdapter } from "./levels";
import { ziprecruiterAdapter } from "./ziprecruiter";
import { githubAdapter } from "./github";
import { googleJobsAdapter } from "./google";
import { blindAdapter } from "./blind";
import { welcomeToTheJungleAdapter } from "./welcometothejungle";
import { workAtAStartupAdapter } from "./workatastartup";
import type { Adapter } from "./types";

const adapters: Adapter[] = [
  linkedInAdapter,
  indeedAdapter,
  greenhouseAdapter,
  leverAdapter,
  ashbyAdapter,
  wellfoundAdapter,
  builtinAdapter,
  diceAdapter,
  levelsAdapter,
  ziprecruiterAdapter,
  githubAdapter,
  googleJobsAdapter,
  blindAdapter,
  welcomeToTheJungleAdapter,
  workAtAStartupAdapter,
];

export function findAdapter(hostname: string): Adapter | null {
  // Exact host match
  const exact = adapters.find((a) => a.hosts.includes(hostname));
  if (exact) return exact;

  // Workday: any *.myworkdayjobs.com subdomain
  if (hostname.endsWith(".myworkdayjobs.com")) return workdayAdapter;

  return null;
}

export { adapters, workdayAdapter, greenhouseAdapter, ashbyAdapter };
export type { Adapter };
```

**Build and verify:**

```bash
cd extension && npx pnpm build
```

Expected: No errors.

**Step: Commit**

```bash
git add extension/src/content/adapters/
git commit -m "feat(extension): add all 11 remaining job board adapters"
```

---

## Task 11: Background service worker

**Files:**
- Create (replaces stub): `extension/src/background/index.ts`
- Create: `extension/src/background/__tests__/background.test.ts`

**Step 1: Write failing tests**

Create `extension/src/background/__tests__/background.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetChromeMock } from "../../test/chrome-mock";
import { setStorage } from "../../shared/storage";
import * as api from "../../shared/api";

// We test the handler functions exported from background, not the side-effectful
// module initialization. Export handlers from background/index.ts.
import { handleTrackMessage } from "../index";

beforeEach(async () => {
  resetChromeMock();
  await setStorage({ backend_url: "https://myapp.com", access_token: "tok", refresh_token: "ref" });
  vi.restoreAllMocks();
});

describe("handleTrackMessage", () => {
  it("returns ok:true on successful track", async () => {
    vi.spyOn(api, "track").mockResolvedValueOnce({
      ok: true,
      application_id: "app-1",
      company_id: "co-1",
    });

    const result = await handleTrackMessage({
      company_name: "Acme",
      position: "Engineer",
      url: "https://acme.com/job",
    });

    expect(result).toMatchObject({ ok: true, application_id: "app-1" });
  });

  it("refreshes token on 401 and retries", async () => {
    vi.spyOn(api, "track")
      .mockResolvedValueOnce({ ok: false, error: "unauthorized" })
      .mockResolvedValueOnce({ ok: true, application_id: "app-2", company_id: "co-2" });
    vi.spyOn(api, "refresh").mockResolvedValueOnce({
      ok: true,
      access_token: "new-tok",
      refresh_token: "new-ref",
    });

    const result = await handleTrackMessage({
      company_name: "Acme",
      position: "Engineer",
      url: "https://acme.com/job",
    });

    expect(api.refresh).toHaveBeenCalledOnce();
    expect(api.track).toHaveBeenCalledTimes(2);
    expect(result).toMatchObject({ ok: true, application_id: "app-2" });
  });

  it("returns session_expired when refresh fails", async () => {
    vi.spyOn(api, "track").mockResolvedValue({ ok: false, error: "unauthorized" });
    vi.spyOn(api, "refresh").mockResolvedValueOnce({ ok: false, error: "session_expired" });

    const result = await handleTrackMessage({
      company_name: "Acme",
      position: "Engineer",
      url: "https://acme.com/job",
    });

    expect(result).toEqual({ ok: false, error: "session_expired" });
  });

  it("returns duplicate on 409", async () => {
    vi.spyOn(api, "track").mockResolvedValueOnce({
      ok: false,
      error: "duplicate",
      application_id: "existing-id",
    });

    const result = await handleTrackMessage({
      company_name: "Acme",
      position: "Engineer",
      url: "https://acme.com/job",
    });

    expect(result).toEqual({ ok: false, error: "duplicate", application_id: "existing-id" });
  });
});
```

**Step 2: Run tests — verify they fail**

```bash
cd extension && npx pnpm test -- background
```

Expected: FAIL

**Step 3: Implement `extension/src/background/index.ts`**

```ts
import { track, refresh } from "../shared/api";
import { getStorage, setStorage, appendRecentJob } from "../shared/storage";
import { greenhouseAdapter } from "../content/adapters/index";
import { ashbyAdapter } from "../content/adapters/index";
import type { TrackData, TrackResult } from "../shared/api";

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
    handleTrackMessage(message.data).then(sendResponse);
    return true; // keep channel open for async response
  }
});

// Whitelabeled Greenhouse + Ashby detection via tabs.onUpdated
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete" || !tab.url) return;

  const url = new URL(tab.url);
  const isWhitelabledGreenhouse = url.searchParams.has("gh_jid");
  // Ashby whitelabeled: check for Ashby-specific meta or URL patterns
  const isWhitelabeledAshby =
    url.searchParams.has("ashby_jid") ||
    url.hostname.includes("ashby");

  if (isWhitelabledGreenhouse || isWhitelabeledAshby) {
    const adapter = isWhitelabledGreenhouse ? greenhouseAdapter : ashbyAdapter;
    chrome.scripting.executeScript({
      target: { tabId },
      func: injectAdapterScript,
      args: [adapter.hosts[0] ?? "__whitelabeled__"],
    });
  }
});

// This function runs in the target tab context
function injectAdapterScript(_adapterHost: string): void {
  // The content script is not loaded on this tab (it's a whitelabeled domain).
  // We dynamically load it by injecting the content script bundle.
  // The content script's findAdapter() checks for gh_jid via a special
  // hostname sentinel set in the adapter registry.
  //
  // A simpler approach: just inject the full content/index.js script file.
  // chrome.scripting.executeScript with files: ["content/index.js"] handles this.
}
```

> **Note:** The `injectAdapterScript` approach has a subtlety — you can't easily inject the full content script bundle from inside another `executeScript` call. The cleaner pattern is to use `files` in the `executeScript` call instead of `func`. Update the `tabs.onUpdated` handler:

```ts
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete" || !tab.url) return;

  const url = new URL(tab.url);
  const isWhitelabeledGreenhouse = url.searchParams.has("gh_jid");
  const isWhitelabeledAshby = url.searchParams.has("ashby_jid");

  if (isWhitelabeledGreenhouse || isWhitelabeledAshby) {
    chrome.scripting.executeScript({
      target: { tabId },
      files: ["content/index.js"],
    });
  }
});
```

The content script's `findAdapter()` won't match by hostname on a whitelabeled domain. Add a fallback in `findAdapter` for this case — check the page's `document.querySelector('[id*="greenhouse"]')` DOM fingerprint, or better: export a `findAdapterByUrlParams()` function that checks `location.search`:

Add to `extension/src/content/adapters/index.ts`:
```ts
export function findAdapterByUrlParams(): Adapter | null {
  if (new URLSearchParams(location.search).has("gh_jid")) return greenhouseAdapter;
  if (new URLSearchParams(location.search).has("ashby_jid")) return ashbyAdapter;
  return null;
}
```

Update `extension/src/content/index.ts` to try `findAdapterByUrlParams()` as a fallback when `findAdapter(location.hostname)` returns null.

**Step 4: Run tests — verify they pass**

```bash
cd extension && npx pnpm test -- background
```

Expected: All 4 tests PASS.

**Step 5: Run full test suite**

```bash
cd extension && npx pnpm test
```

Expected: All tests PASS.

**Step 6: Commit**

```bash
git add extension/src/background/ extension/src/content/
git commit -m "feat(extension): add background service worker with token refresh and whitelabeled board detection"
```

---

## Task 12: Popup hooks

**Files:**
- Create: `extension/src/popup/hooks/useStorage.ts`
- Create: `extension/src/popup/hooks/useAuth.ts`
- Create: `extension/src/popup/hooks/useTrack.ts`
- Create: `extension/src/popup/hooks/__tests__/useAuth.test.tsx`
- Create: `extension/src/popup/hooks/__tests__/useTrack.test.tsx`

**Step 1: Implement `useStorage.ts`** (simple reactive wrapper, no separate test needed)

```ts
import { useCallback, useEffect, useState } from "react";
import { getStorage, setStorage } from "../../shared/storage";
import type { StorageSchema } from "../../shared/storage";

export function useStorage<K extends keyof StorageSchema>(key: K) {
  const [value, setValue] = useState<StorageSchema[K] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStorage(key).then((v) => {
      setValue(v);
      setLoading(false);
    });
  }, [key]);

  const update = useCallback(
    async (newValue: StorageSchema[K]) => {
      await setStorage({ [key]: newValue } as Partial<StorageSchema>);
      setValue(newValue);
    },
    [key],
  );

  return { value, loading, update };
}
```

**Step 2: Write `useAuth` tests**

Create `extension/src/popup/hooks/__tests__/useAuth.test.tsx`:

```tsx
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetChromeMock } from "../../../test/chrome-mock";
import { setStorage } from "../../../shared/storage";
import * as api from "../../../shared/api";
import { useAuth } from "../useAuth";

beforeEach(async () => {
  resetChromeMock();
  vi.restoreAllMocks();
});

describe("useAuth", () => {
  it("isAuthenticated is false when no tokens in storage", async () => {
    const { result } = renderHook(() => useAuth());
    await act(async () => {}); // flush effects
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("isAuthenticated is true when tokens exist", async () => {
    await setStorage({ access_token: "tok", refresh_token: "ref", backend_url: "https://app.com" });
    const { result } = renderHook(() => useAuth());
    await act(async () => {});
    expect(result.current.isAuthenticated).toBe(true);
  });

  it("signIn stores tokens on success", async () => {
    await setStorage({ backend_url: "https://app.com" });
    vi.spyOn(api, "signin").mockResolvedValueOnce({
      ok: true,
      access_token: "a",
      refresh_token: "b",
    });
    const { result } = renderHook(() => useAuth());
    await act(async () => {});
    await act(async () => {
      await result.current.signIn("user@test.com", "pass");
    });
    expect(result.current.isAuthenticated).toBe(true);
  });

  it("signOut clears tokens", async () => {
    await setStorage({ access_token: "tok", refresh_token: "ref", backend_url: "https://app.com" });
    const { result } = renderHook(() => useAuth());
    await act(async () => {});
    await act(async () => { result.current.signOut(); });
    expect(result.current.isAuthenticated).toBe(false);
  });
});
```

**Step 3: Run tests — verify they fail**

```bash
cd extension && npx pnpm test -- useAuth
```

Expected: FAIL

**Step 4: Implement `useAuth.ts`**

```ts
import { useCallback, useEffect, useState } from "react";
import { clearStorage, getStorage, setStorage } from "../../shared/storage";
import { signin as apiSignin } from "../../shared/api";

export type SignInError = "invalid_credentials" | "no_backend_url" | "unknown";

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<SignInError | null>(null);

  useEffect(() => {
    getStorage("access_token").then((token) => {
      setIsAuthenticated(!!token);
      setLoading(false);
    });
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setError(null);
    const backendUrl = await getStorage("backend_url");
    if (!backendUrl) {
      setError("no_backend_url");
      return false;
    }
    const result = await apiSignin(backendUrl, email, password);
    if (!result.ok) {
      setError("invalid_credentials");
      return false;
    }
    await setStorage({ access_token: result.access_token, refresh_token: result.refresh_token });
    setIsAuthenticated(true);
    return true;
  }, []);

  const signOut = useCallback(async () => {
    await clearStorage("auth");
    setIsAuthenticated(false);
  }, []);

  return { isAuthenticated, loading, error, signIn, signOut };
}
```

**Step 5: Run tests — verify they pass**

```bash
cd extension && npx pnpm test -- useAuth
```

Expected: All 4 PASS.

**Step 6: Write `useTrack` tests**

Create `extension/src/popup/hooks/__tests__/useTrack.test.tsx`:

```tsx
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetChromeMock } from "../../../test/chrome-mock";
import { useTrack } from "../useTrack";

beforeEach(() => resetChromeMock());

describe("useTrack", () => {
  it("sends TRACK message to background and returns success", async () => {
    (chrome.runtime.sendMessage as ReturnType<typeof vi.fn>).mockImplementation(
      (_msg: unknown, callback: (r: unknown) => void) => {
        callback({ ok: true, application_id: "app-1" });
      },
    );

    const { result } = renderHook(() => useTrack());
    await act(async () => {
      await result.current.track({
        company_name: "Acme",
        position: "Engineer",
        url: "https://acme.com/job",
      });
    });

    expect(result.current.status).toBe("success");
  });

  it("status is duplicate on 409 response", async () => {
    (chrome.runtime.sendMessage as ReturnType<typeof vi.fn>).mockImplementation(
      (_msg: unknown, callback: (r: unknown) => void) => {
        callback({ ok: false, error: "duplicate", application_id: "existing" });
      },
    );

    const { result } = renderHook(() => useTrack());
    await act(async () => {
      await result.current.track({ company_name: "A", position: "B", url: "https://a.com" });
    });

    expect(result.current.status).toBe("duplicate");
  });
});
```

**Step 7: Implement `useTrack.ts`**

```ts
import { useCallback, useState } from "react";
import type { TrackData } from "../../shared/api";

type TrackStatus = "idle" | "loading" | "success" | "duplicate" | "expired" | "error";

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
```

**Step 8: Run all hook tests**

```bash
cd extension && npx pnpm test -- useAuth useTrack
```

Expected: All PASS.

**Step 9: Commit**

```bash
git add extension/src/popup/hooks/
git commit -m "feat(extension): add popup hooks (useStorage, useAuth, useTrack)"
```

---

## Task 13: Popup screens

**Files:**
- Create: `extension/src/popup/screens/AuthScreen.tsx`
- Create: `extension/src/popup/screens/MainScreen.tsx`
- Create: `extension/src/popup/screens/SettingsScreen.tsx`
- Create: `extension/src/popup/App.tsx`
- Modify: `extension/src/popup/main.tsx`
- Create: `extension/src/popup/popup.css`

**Step 1: Create global popup styles `extension/src/popup/popup.css`**

```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg: #ffffff;
  --bg-secondary: #f3f4f6;
  --text: #111827;
  --text-muted: #6b7280;
  --border: #e5e7eb;
  --primary: #2563eb;
  --primary-hover: #1d4ed8;
  --success: #16a34a;
  --error: #dc2626;
  --radius: 6px;
  --font: system-ui, -apple-system, sans-serif;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #111827;
    --bg-secondary: #1f2937;
    --text: #f9fafb;
    --text-muted: #9ca3af;
    --border: #374151;
  }
}

body {
  width: 360px;
  min-height: 200px;
  font-family: var(--font);
  font-size: 14px;
  color: var(--text);
  background: var(--bg);
  padding: 16px;
}

.screen { display: flex; flex-direction: column; gap: 12px; }
.screen-header { display: flex; align-items: center; justify-content: space-between; }
.screen-title { font-size: 16px; font-weight: 700; }
.label { font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 4px; }
.input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg-secondary);
  color: var(--text);
  font-size: 14px;
  outline: none;
}
.input:focus { border-color: var(--primary); }
.btn {
  width: 100%;
  padding: 9px 16px;
  border: none;
  border-radius: var(--radius);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.15s;
}
.btn-primary { background: var(--primary); color: #fff; }
.btn-primary:hover:not(:disabled) { background: var(--primary-hover); }
.btn-secondary { background: var(--bg-secondary); color: var(--text); border: 1px solid var(--border); }
.btn:disabled { opacity: 0.6; cursor: not-allowed; }
.error-msg { font-size: 12px; color: var(--error); }
.success-msg { font-size: 12px; color: var(--success); }
.icon-btn { background: none; border: none; cursor: pointer; color: var(--text-muted); padding: 4px; border-radius: var(--radius); }
.icon-btn:hover { background: var(--bg-secondary); }
.divider { height: 1px; background: var(--border); }
.recent-list { display: flex; flex-direction: column; gap: 6px; }
.recent-item { padding: 8px; background: var(--bg-secondary); border-radius: var(--radius); }
.recent-item-title { font-weight: 600; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.recent-item-company { font-size: 12px; color: var(--text-muted); }
.field { display: flex; flex-direction: column; }
```

**Step 2: Implement `AuthScreen.tsx`**

```tsx
import { useState } from "react";
import { getStorage, setStorage } from "../../shared/storage";
import { useAuth } from "../hooks/useAuth";

export function AuthScreen() {
  const { signIn, error } = useAuth();
  const [backendUrl, setBackendUrl] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [backendSaved, setBackendSaved] = useState(false);

  // Pre-fill backend URL if already set
  useState(() => {
    getStorage("backend_url").then((url) => {
      if (url) setBackendUrl(url);
    });
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    if (backendUrl) {
      await setStorage({ backend_url: backendUrl.replace(/\/$/, "") });
      setBackendSaved(true);
    }
    await signIn(email, password);
    setLoading(false);
  }

  return (
    <form className="screen" onSubmit={handleSubmit}>
      <div className="screen-header">
        <span className="screen-title">Job Search Tracker</span>
      </div>

      <div className="field">
        <label className="label">Backend URL</label>
        <input
          className="input"
          type="url"
          placeholder="https://your-app.com"
          value={backendUrl}
          onChange={(e) => setBackendUrl(e.target.value)}
          required
        />
      </div>

      <div className="field">
        <label className="label">Email</label>
        <input
          className="input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="field">
        <label className="label">Password</label>
        <input
          className="input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      {error === "invalid_credentials" && (
        <span className="error-msg">Invalid email or password.</span>
      )}
      {error === "no_backend_url" && (
        <span className="error-msg">Enter your backend URL first.</span>
      )}

      <button className="btn btn-primary" type="submit" disabled={loading}>
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
```

**Step 3: Implement `MainScreen.tsx`**

```tsx
import { useEffect, useState } from "react";
import { getStorage } from "../../shared/storage";
import type { RecentJob } from "../../shared/storage";
import { useTrack } from "../hooks/useTrack";

interface Props {
  onSettings: () => void;
}

export function MainScreen({ onSettings }: Props) {
  const { status, track } = useTrack();
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [url, setUrl] = useState("");
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([]);

  useEffect(() => {
    // Get current tab URL
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (tab?.url) setUrl(tab.url);
    });

    // Try to get job data from content script
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (!tab?.id) return;
      chrome.tabs.sendMessage(
        tab.id,
        { type: "GET_JOB_DATA" },
        (data: { company: string; position: string } | null) => {
          if (chrome.runtime.lastError) return; // no content script on this page
          if (data) {
            setCompany(data.company);
            setPosition(data.position);
          }
        },
      );
    });

    // Load recent jobs
    getStorage("recent_jobs").then(setRecentJobs);
  }, []);

  async function handleTrack(e: React.FormEvent) {
    e.preventDefault();
    await track({ company_name: company, position, url });
  }

  const statusMessages: Record<string, string> = {
    success: "Tracked successfully!",
    duplicate: "Already tracked.",
    expired: "Session expired — sign in again.",
    error: "Something went wrong.",
  };

  return (
    <div className="screen">
      <div className="screen-header">
        <span className="screen-title">Track Job</span>
        <button className="icon-btn" onClick={onSettings} title="Settings" type="button">
          ⚙
        </button>
      </div>

      <form onSubmit={handleTrack} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div className="field">
          <label className="label">Company</label>
          <input className="input" value={company} onChange={(e) => setCompany(e.target.value)} required />
        </div>
        <div className="field">
          <label className="label">Position</label>
          <input className="input" value={position} onChange={(e) => setPosition(e.target.value)} required />
        </div>
        <div className="field">
          <label className="label">URL</label>
          <input className="input" type="url" value={url} onChange={(e) => setUrl(e.target.value)} required />
        </div>

        {status !== "idle" && status !== "loading" && (
          <span className={status === "success" ? "success-msg" : "error-msg"}>
            {statusMessages[status]}
          </span>
        )}

        <button
          className="btn btn-primary"
          type="submit"
          disabled={status === "loading" || status === "success" || status === "duplicate"}
        >
          {status === "loading" ? "Tracking…" : "Track"}
        </button>
      </form>

      {recentJobs.length > 0 && (
        <>
          <div className="divider" />
          <div>
            <div className="label" style={{ marginBottom: 8 }}>Recently tracked</div>
            <div className="recent-list">
              {recentJobs.map((job) => (
                <div className="recent-item" key={job.application_id}>
                  <div className="recent-item-title">{job.position}</div>
                  <div className="recent-item-company">{job.company}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
```

**Step 4: Implement `SettingsScreen.tsx`**

```tsx
import { useEffect, useState } from "react";
import { getStorage, setStorage } from "../../shared/storage";
import { useAuth } from "../hooks/useAuth";

interface Props {
  onBack: () => void;
}

export function SettingsScreen({ onBack }: Props) {
  const { signOut } = useAuth();
  const [backendUrl, setBackendUrl] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getStorage("backend_url").then((url) => {
      if (url) setBackendUrl(url);
    });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    await setStorage({ backend_url: backendUrl.replace(/\/$/, "") });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleSignOut() {
    await signOut();
  }

  return (
    <div className="screen">
      <div className="screen-header">
        <button className="icon-btn" onClick={onBack} type="button">← Back</button>
        <span className="screen-title">Settings</span>
      </div>

      <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div className="field">
          <label className="label">Backend URL</label>
          <input
            className="input"
            type="url"
            value={backendUrl}
            onChange={(e) => setBackendUrl(e.target.value)}
            placeholder="https://your-app.com"
            required
          />
        </div>
        {saved && <span className="success-msg">Saved.</span>}
        <button className="btn btn-secondary" type="submit">Save</button>
      </form>

      <div className="divider" />

      <button className="btn btn-secondary" type="button" onClick={handleSignOut}>
        Sign out
      </button>
    </div>
  );
}
```

**Step 5: Implement `App.tsx`**

```tsx
import { useEffect, useState } from "react";
import { getStorage } from "../shared/storage";
import { AuthScreen } from "./screens/AuthScreen";
import { MainScreen } from "./screens/MainScreen";
import { SettingsScreen } from "./screens/SettingsScreen";

type Screen = "loading" | "auth" | "main" | "settings";

export function App() {
  const [screen, setScreen] = useState<Screen>("loading");

  useEffect(() => {
    getStorage("access_token").then((token) => {
      setScreen(token ? "main" : "auth");
    });
  }, []);

  if (screen === "loading") return null;
  if (screen === "auth") return <AuthScreen />;
  if (screen === "settings") return <SettingsScreen onBack={() => setScreen("main")} />;
  return <MainScreen onSettings={() => setScreen("settings")} />;
}
```

**Step 6: Update `main.tsx`**

```tsx
import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./popup.css";

const root = document.getElementById("root")!;
createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

**Step 7: Build and verify**

```bash
cd extension && npx pnpm build
```

Expected: Clean build. `dist/popup/index.html` references `main.js`.

**Step 8: Run the full test suite**

```bash
cd extension && npx pnpm test
```

Expected: All tests PASS.

**Step 9: Commit**

```bash
git add extension/src/popup/
git commit -m "feat(extension): add popup screens (Auth, Main, Settings)"
```

---

## Task 14: Load and verify the extension

This is a manual task — no automated test can simulate loading an unpacked extension into Chrome.

**Step 1: Build the extension**

```bash
cd extension && npx pnpm build
```

**Step 2: Load in Chrome**

1. Open `chrome://extensions`
2. Enable "Developer mode" (top-right toggle)
3. Click "Load unpacked"
4. Select the `extension/dist/` directory
5. The extension should appear with the name "Job Search Tracker"

**Step 3: Verify popup opens**

Click the extension icon. Should show the AuthScreen (Backend URL + email + password).

**Step 4: Sign in**

Enter your running local backend URL (e.g., `http://localhost:3000`) and credentials. Should transition to MainScreen.

**Step 5: Test on a supported job board**

1. Navigate to a LinkedIn job listing
2. The "Track" button should appear near the job title within ~3 seconds
3. Click "Track" — should show "Tracked ✓" on success

**Step 6: Test popup fallback on an unsupported page**

1. Navigate to any non-job-board page
2. Open the popup — current URL should be pre-filled; company/position fields are empty
3. Fill in manually and click Track

**Step 7: Test whitelabeled Greenhouse**

1. Find a job listing with `?gh_jid=` in the URL on a custom domain
2. The Track button should appear (may take a moment as the background worker detects and injects)

**Step 8: Commit final state**

```bash
git add -A
git commit -m "feat(extension): complete Chrome MV3 extension with 17 job board adapters"
```

---

## Summary

| Task | What it delivers |
|------|-----------------|
| 1 | Project scaffold, workspace integration, empty builds |
| 2 | Test infrastructure (Vitest + Chrome mock) |
| 3 | `shared/storage.ts` — typed chrome.storage wrapper |
| 4 | `shared/api.ts` — typed fetch client for 3 extension endpoints |
| 5 | Adapter types + registry |
| 6 | `content/inject.ts` — DOM button + state machine |
| 7 | `content/index.ts` — wiring + SPA navigation |
| 8 | LinkedIn + Indeed adapters |
| 9 | Greenhouse + Lever + Ashby adapters |
| 10 | 11 remaining adapters (Workday, Wellfound, Built In, Dice, Levels, ZipRecruiter, GitHub, Google, Blind, WTTJ, WaaS) |
| 11 | Background service worker (message routing, token refresh, whitelabeled detection) |
| 12 | Popup hooks (useStorage, useAuth, useTrack) |
| 13 | Popup screens (Auth, Main, Settings) |
| 14 | Manual load + verification |
