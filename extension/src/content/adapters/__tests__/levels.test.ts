import * as fs from "node:fs";
import * as path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { levelsAdapter } from "../levels";
import type { JobData } from "../types";

function setLocation(pathname: string, search = ""): void {
  Object.defineProperty(window, "location", {
    value: {
      ...window.location,
      pathname,
      search,
      href: `https://levels.fyi${pathname}${search}`,
    },
    writable: true,
    configurable: true,
  });
}

describe("levelsAdapter", () => {
  describe("hosts", () => {
    it("includes levels.fyi", () => {
      expect(levelsAdapter.hosts).toContain("levels.fyi");
    });
    it("includes www.levels.fyi", () => {
      expect(levelsAdapter.hosts).toContain("www.levels.fyi");
    });
  });

  describe("source", () => {
    it("is Levels.fyi", () => {
      expect(levelsAdapter.source).toBe("Levels.fyi");
    });
  });

  describe("extract()", () => {
    it("returns null when no jobId param", () => {
      setLocation("/jobs/company/google/title/software-engineer", "");
      document.body.innerHTML = `<h1>Software Engineer</h1>`;
      expect(levelsAdapter.extract()).toBeNull();
    });

    it("returns null when not on /jobs path", () => {
      setLocation("/companies/google", "?jobId=123");
      document.body.innerHTML = `<h1>Software Engineer</h1>`;
      expect(levelsAdapter.extract()).toBeNull();
    });

    it("extracts title and company from [class*='companyName'] element", () => {
      setLocation("/jobs/company/google/title/software-engineer", "?jobId=123");
      document.body.innerHTML = `
        <div class="jobTitleRow_abc"><h1>Software Engineer</h1></div>
        <span class="companyName_xyz">Google</span>
      `;
      const data = levelsAdapter.extract();
      expect(data?.position).toBe("Software Engineer");
      expect(data?.company).toBe("Google");
    });

    it("falls back company from URL path slug", () => {
      setLocation("/jobs/company/stripe/title/backend-engineer", "?jobId=456");
      document.body.innerHTML = `<h1 class="jobTitleRow_x">Backend Engineer</h1>`;
      const data = levelsAdapter.extract();
      expect(data?.position).toBe("Backend Engineer");
      expect(data?.company).toBe("Stripe");
    });

    it("converts hyphenated slug to title case for company", () => {
      setLocation("/jobs/company/open-ai/title/some-role", "?jobId=789");
      document.body.innerHTML = `<div class="jobTitleRow_x"><h1>Some Role</h1></div>`;
      const data = levelsAdapter.extract();
      expect(data?.company).toBe("Open Ai");
    });

    it("prefers second h1 when companyName and path slug are both absent", () => {
      setLocation("/jobs", "?jobId=999");
      document.body.innerHTML = `
        <h1>Google Software Engineer Jobs</h1>
        <h1>Staff Engineer</h1>
      `;
      // Without companyName or URL slug, company would be empty → null
      expect(levelsAdapter.extract()).toBeNull();
    });

    it("returns null when no title element found and no fallback", () => {
      setLocation("/jobs", "?jobId=1");
      document.body.innerHTML = `<span class="companyName_x">Google</span>`;
      // No h1 at all → null
      expect(levelsAdapter.extract()).toBeNull();
    });
  });

  describe("watchForIntent()", () => {
    it("fires onIntent on page load for job detail pages", async () => {
      setLocation("/jobs/company/google/title/software-engineer", "?jobId=123");
      document.body.innerHTML = `
        <div class="jobTitleRow_abc"><h1>Software Engineer</h1></div>
        <span class="companyName_xyz">Google</span>
      `;

      const received = await new Promise<JobData>((resolve) => {
        const cleanup = levelsAdapter.watchForIntent?.(resolve);
        return cleanup;
      });

      expect(received.position).toBe("Software Engineer");
      expect(received.company).toBe("Google");
    });

    it("does not fire on non-job pages", () => {
      setLocation("/jobs", "");
      document.body.innerHTML = `<div>browse jobs</div>`;
      const callback = vi.fn();
      const cleanup = levelsAdapter.watchForIntent?.(callback);
      expect(() => cleanup?.()).not.toThrow();
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("extract() — fixture-based regression test", () => {
    it("extracts valid data from real captured HTML", () => {
      const fixturePath = path.join(__dirname, "fixtures/levels.html");

      if (!fs.existsSync(fixturePath)) {
        console.warn("⚠️  Skipping fixture test: fixtures/levels.html not found");
        console.warn("   Run: node scripts/capture-fixtures.mjs levels");
        return;
      }

      // Set up location mock
      setLocation("/jobs", "?locationSlug=united-states&jobId=95431004121899718");

      const fixtureHTML = fs.readFileSync(fixturePath, "utf-8");
      document.documentElement.innerHTML = fixtureHTML;

      const data = levelsAdapter.extract();

      expect(data).not.toBeNull();
      expect(data?.position).toBeTruthy();
      expect(data?.company).toBeTruthy();
      expect(data?.url).toBeTruthy();

      console.log(`   Extracted from fixture: ${data?.position} at ${data?.company}`);
    });
  });
});
