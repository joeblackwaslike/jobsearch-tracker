import * as fs from "node:fs";
import * as path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { aijobsAdapter } from "../aijobs";
import type { JobData } from "../types";

function setLocation(pathname: string): void {
  Object.defineProperty(window, "location", {
    value: { ...window.location, pathname, href: `https://aijobs.net${pathname}` },
    writable: true,
    configurable: true,
  });
}

describe("aijobsAdapter", () => {
  describe("hosts", () => {
    it("includes aijobs.net", () => {
      expect(aijobsAdapter.hosts).toContain("aijobs.net");
    });
    it("includes www.aijobs.net", () => {
      expect(aijobsAdapter.hosts).toContain("www.aijobs.net");
    });
  });

  describe("source", () => {
    it("is aijobs.net", () => {
      expect(aijobsAdapter.source).toBe("aijobs.net");
    });
  });

  describe("extract()", () => {
    it("returns null on non-job paths", () => {
      setLocation("/jobs");
      document.body.innerHTML = `<h1>AI Jobs listing</h1>`;
      expect(aijobsAdapter.extract()).toBeNull();
    });

    it("extracts position from h1 on /job/ path", () => {
      setLocation("/job/ml-engineer-at-openai-abc123/");
      document.body.innerHTML = `<h1>ML Engineer</h1>`;
      const data = aijobsAdapter.extract();
      expect(data?.position).toBe("ML Engineer");
      expect(data?.company).toBe(""); // company not in DOM
    });

    it("falls back to document.title when no h1", () => {
      setLocation("/job/some-job/");
      document.title = "Data Scientist - aijobs.net";
      document.body.innerHTML = `<div>content</div>`;
      const data = aijobsAdapter.extract();
      expect(data?.position).toBe("Data Scientist");
    });

    it("returns null when no title can be found", () => {
      setLocation("/job/some-job/");
      document.title = "";
      document.body.innerHTML = `<div>no title</div>`;
      expect(aijobsAdapter.extract()).toBeNull();
    });
  });

  describe("watchForIntent()", () => {
    it("fires onIntent when the Apply button is clicked", async () => {
      setLocation("/job/ml-engineer-at-openai-abc123/");
      document.body.innerHTML = `
        <h1>ML Engineer</h1>
        <a href="/job/abc123/apply/" class="btn btn-primary">Apply</a>
      `;

      const received = await new Promise<JobData>((resolve) => {
        aijobsAdapter.watchForIntent?.(resolve);
        // biome-ignore lint/style/noNonNullAssertion: element is guaranteed by the HTML set up above
        const btn = document.querySelector<HTMLAnchorElement>('a[href*="/apply/"]')!;
        btn.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
      });

      expect(received.position).toBe("ML Engineer");
      expect(received.company).toBe("");
    });

    it("fires onIntent on page load when no apply button found", async () => {
      setLocation("/job/ml-engineer-at-openai-abc123/");
      document.body.innerHTML = `<h1>ML Engineer</h1>`;

      const received = await new Promise<JobData>((resolve) => {
        const cleanup = aijobsAdapter.watchForIntent?.(resolve);
        return cleanup;
      });

      expect(received.position).toBe("ML Engineer");
    });

    it("only fires once for apply button clicks", () => {
      setLocation("/job/some-job/");
      document.body.innerHTML = `
        <h1>Research Scientist</h1>
        <a href="/job/123/apply/">Apply</a>
      `;
      const callback = vi.fn();
      aijobsAdapter.watchForIntent?.(callback);

      // biome-ignore lint/style/noNonNullAssertion: element is guaranteed by the HTML set up above
      const btn = document.querySelector<HTMLAnchorElement>('a[href*="/apply/"]')!;
      btn.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
      btn.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("does not fire when extract() returns null", () => {
      setLocation("/jobs");
      document.body.innerHTML = `<h1>AI Jobs listing</h1>`;
      const callback = vi.fn();
      const cleanup = aijobsAdapter.watchForIntent?.(callback);
      expect(() => cleanup?.()).not.toThrow();
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("extract() — fixture-based regression test", () => {
    it("extracts valid data from real captured HTML", () => {
      const fixturePath = path.join(__dirname, "fixtures/aijobs.html");

      if (!fs.existsSync(fixturePath)) {
        console.warn("⚠️  Skipping fixture test: fixtures/aijobs.html not found");
        console.warn("   Run: node scripts/capture-fixtures.mjs aijobs");
        return;
      }

      // Set up location mock for AIJobs.net job
      setLocation("/job/software-engineer-usds-san-jose-california-united-states-10150");

      const fixtureHTML = fs.readFileSync(fixturePath, "utf-8");
      document.documentElement.innerHTML = fixtureHTML;

      const data = aijobsAdapter.extract();

      expect(data).not.toBeNull();
      expect(data?.position).toBeTruthy();
      // aijobs.net doesn't have company in DOM - intentionally empty string
      expect(data?.company).toBe("");
      expect(data?.url).toBeTruthy();

      console.log(`   Extracted from fixture: ${data?.position} (company not available in DOM)`);
    });
  });
});
