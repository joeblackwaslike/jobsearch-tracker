import { beforeEach, describe, expect, it } from "vitest";
import { resetChromeMock } from "../../test/chrome-mock";
import {
  addToQueue,
  clearStorage,
  getQueue,
  getQueueCount,
  getStorage,
  incrementRetryCount,
  removeFromQueue,
  setStorage,
} from "../storage";

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

describe("Queue helpers", () => {
  describe("addToQueue", () => {
    it("adds application to empty queue", async () => {
      await addToQueue({
        company_name: "Acme Corp",
        position: "Engineer",
        url: "https://jobs.acme.com/123",
      });

      const queue = await getQueue();
      expect(queue).toHaveLength(1);
      expect(queue[0].company_name).toBe("Acme Corp");
      expect(queue[0].position).toBe("Engineer");
      expect(queue[0].retry_count).toBe(0);
      expect(queue[0].queued_at).toBeTruthy();
    });

    it("appends to existing queue", async () => {
      await addToQueue({ company_name: "First", position: "A", url: "https://a.com" });
      await addToQueue({ company_name: "Second", position: "B", url: "https://b.com" });

      const queue = await getQueue();
      expect(queue).toHaveLength(2);
      expect(queue[0].company_name).toBe("First");
      expect(queue[1].company_name).toBe("Second");
    });

    it("includes source if provided", async () => {
      await addToQueue({
        company_name: "Acme",
        position: "Dev",
        url: "https://jobs.com",
        source: "LinkedIn",
      });

      const queue = await getQueue();
      expect(queue[0].source).toBe("LinkedIn");
    });
  });

  describe("getQueue", () => {
    it("returns empty array when no queue exists", async () => {
      const queue = await getQueue();
      expect(queue).toEqual([]);
    });

    it("returns all queued applications", async () => {
      await addToQueue({ company_name: "A", position: "X", url: "https://a.com" });
      await addToQueue({ company_name: "B", position: "Y", url: "https://b.com" });

      const queue = await getQueue();
      expect(queue).toHaveLength(2);
    });
  });

  describe("removeFromQueue", () => {
    it("removes application at specified index", async () => {
      await addToQueue({ company_name: "First", position: "A", url: "https://a.com" });
      await addToQueue({ company_name: "Second", position: "B", url: "https://b.com" });
      await addToQueue({ company_name: "Third", position: "C", url: "https://c.com" });

      await removeFromQueue(1); // Remove "Second"

      const queue = await getQueue();
      expect(queue).toHaveLength(2);
      expect(queue[0].company_name).toBe("First");
      expect(queue[1].company_name).toBe("Third");
    });

    it("does nothing if index out of bounds", async () => {
      await addToQueue({ company_name: "Only", position: "A", url: "https://a.com" });
      await removeFromQueue(99);

      const queue = await getQueue();
      expect(queue).toHaveLength(1);
    });
  });

  describe("incrementRetryCount", () => {
    it("increments retry count for specified application", async () => {
      await addToQueue({ company_name: "Test", position: "Dev", url: "https://test.com" });

      let queue = await getQueue();
      expect(queue[0].retry_count).toBe(0);

      await incrementRetryCount(0);
      queue = await getQueue();
      expect(queue[0].retry_count).toBe(1);

      await incrementRetryCount(0);
      queue = await getQueue();
      expect(queue[0].retry_count).toBe(2);
    });

    it("does not affect other applications", async () => {
      await addToQueue({ company_name: "A", position: "X", url: "https://a.com" });
      await addToQueue({ company_name: "B", position: "Y", url: "https://b.com" });

      await incrementRetryCount(0);

      const queue = await getQueue();
      expect(queue[0].retry_count).toBe(1);
      expect(queue[1].retry_count).toBe(0);
    });
  });

  describe("getQueueCount", () => {
    it("returns 0 for empty queue", async () => {
      const count = await getQueueCount();
      expect(count).toBe(0);
    });

    it("returns correct count", async () => {
      await addToQueue({ company_name: "A", position: "X", url: "https://a.com" });
      await addToQueue({ company_name: "B", position: "Y", url: "https://b.com" });
      await addToQueue({ company_name: "C", position: "Z", url: "https://c.com" });

      const count = await getQueueCount();
      expect(count).toBe(3);
    });
  });
});
