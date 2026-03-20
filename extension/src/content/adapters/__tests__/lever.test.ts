import * as fs from "node:fs";
import * as path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { leverAdapter } from "../lever";
import type { JobData } from "../types";

function setLocation(pathname: string): void {
  Object.defineProperty(window, "location", {
    value: {
      ...window.location,
      pathname,
      href: `https://jobs.lever.co${pathname}`,
    },
    writable: true,
    configurable: true,
  });
}

function makeJobDetailDOM(title: string): void {
  document.body.innerHTML = `
    <div class="posting-headline">
      <h2>${title}</h2>
    </div>
  `;
}

describe("leverAdapter", () => {
  describe("hosts", () => {
    it("handles jobs.lever.co", () => {
      expect(leverAdapter.hosts).toContain("jobs.lever.co");
    });
  });

  describe("extract()", () => {
    it("extracts position and company from job detail page", () => {
      setLocation("/jobgether/a6ea3078-d243-4dc8-8ee2-0e040c4a1348");
      makeJobDetailDOM("Remote Python Engineer");
      const data = leverAdapter.extract();
      expect(data?.position).toBe("Remote Python Engineer");
      expect(data?.company).toBe("Jobgether");
    });

    it("capitalises multi-word company slugs", () => {
      setLocation("/open-ai/some-job-id");
      makeJobDetailDOM("Research Scientist");
      const data = leverAdapter.extract();
      expect(data?.company).toBe("Open Ai");
    });

    it("returns null when job title element is not present", () => {
      setLocation("/somecompany/some-job-id");
      document.body.innerHTML = `<div>no headline here</div>`;
      expect(leverAdapter.extract()).toBeNull();
    });
  });

  describe("watchForSubmission()", () => {
    it("fires onSubmit on /apply/confirmation page using cached data", async () => {
      // Pre-populate sessionStorage with cached job data (simulating the /apply page cache step)
      const cachedJob: JobData = {
        position: "Remote Python Engineer",
        company: "Jobgether",
        url: "https://jobs.lever.co/jobgether/a6ea3078-d243-4dc8-8ee2-0e040c4a1348/apply",
      };
      sessionStorage.setItem("jst_lever_job", JSON.stringify(cachedJob));

      // Navigate to confirmation page
      setLocation("/jobgether/a6ea3078-d243-4dc8-8ee2-0e040c4a1348/apply/confirmation");
      document.body.innerHTML = `<h1>Thank you for applying!</h1>`;

      const received = await new Promise<JobData>((resolve) => {
        leverAdapter.watchForSubmission?.(resolve);
      });

      expect(received.position).toBe("Remote Python Engineer");
      expect(received.company).toBe("Jobgether");
      // sessionStorage should be cleaned up
      expect(sessionStorage.getItem("jst_lever_job")).toBeNull();
    });

    it("fires onSubmit on /apply/confirmation page using DOM extract()", async () => {
      sessionStorage.removeItem("jst_lever_job");
      setLocation("/jobgether/some-job-id/apply/confirmation");
      makeJobDetailDOM("Staff Engineer");

      const received = await new Promise<JobData>((resolve) => {
        leverAdapter.watchForSubmission?.(resolve);
      });

      expect(received.position).toBe("Staff Engineer");
      expect(received.company).toBe("Jobgether");
    });

    it("caches job data on /apply page", () => {
      sessionStorage.removeItem("jst_lever_job");
      setLocation("/somecompany/some-job-id/apply");
      makeJobDetailDOM("Frontend Engineer");

      const cleanup = leverAdapter.watchForSubmission?.(vi.fn());
      expect(() => cleanup?.()).not.toThrow();

      const stored = sessionStorage.getItem("jst_lever_job");
      expect(stored).not.toBeNull();
      // biome-ignore lint/style/noNonNullAssertion: checked non-null on the line above
      const parsed = JSON.parse(stored!) as JobData;
      expect(parsed.position).toBe("Frontend Engineer");
      expect(parsed.company).toBe("Somecompany");
    });

    it("is a no-op on job detail page (not /apply)", () => {
      setLocation("/somecompany/some-job-id");
      makeJobDetailDOM("Some Job");
      const callback = vi.fn();
      const cleanup = leverAdapter.watchForSubmission?.(callback);
      expect(() => cleanup?.()).not.toThrow();
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("extract() — fixture-based regression test", () => {
    it("extracts valid data from real captured HTML", () => {
      const fixturePath = path.join(__dirname, "fixtures/lever.html");

      // Skip if fixture doesn't exist yet
      if (!fs.existsSync(fixturePath)) {
        console.warn("⚠️  Skipping fixture test: fixtures/lever.html not found");
        console.warn("   Run: npm run capture-fixtures lever");
        return;
      }

      const fixtureHTML = fs.readFileSync(fixturePath, "utf-8");
      document.documentElement.innerHTML = fixtureHTML;

      const data = leverAdapter.extract();

      // Assert that extraction succeeds and returns valid data
      expect(data).not.toBeNull();
      expect(data?.position).toBeTruthy();
      expect(data?.company).toBeTruthy();
      expect(data?.url).toBeTruthy();

      // Log the extracted data for visibility
      console.log(`   Extracted from fixture: ${data?.position} at ${data?.company}`);
    });
  });
});
