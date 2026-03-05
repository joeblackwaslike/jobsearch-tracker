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
