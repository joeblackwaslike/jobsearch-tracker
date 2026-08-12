import * as fs from "node:fs";
import * as path from "node:path";
import { describe, expect, it } from "vitest";
import { ashbyAdapter } from "../ashby";
import type { JobData } from "../types";

function setLocation(path: string): void {
  Object.defineProperty(window, "location", {
    value: { ...window.location, pathname: path, href: `https://jobs.ashbyhq.com${path}` },
    writable: true,
    configurable: true,
  });
}

function makeJobDOM(title: string): void {
  document.body.innerHTML = `<h1 class="ashby-job-posting-heading-xyz">${title}</h1>`;
}

function makeApplicationDOM(title: string): void {
  document.body.innerHTML = `<h1 class="ashby-job-posting-heading-xyz">${title}</h1><form id="application-form"></form>`;
}

describe("ashbyAdapter", () => {
  describe("hosts", () => {
    it("includes jobs.ashbyhq.com", () => {
      expect(ashbyAdapter.hosts).toContain("jobs.ashbyhq.com");
    });
  });

  describe("extract()", () => {
    it("extracts position and titlecases company from URL slug", () => {
      setLocation("/heron-data/64c89b7a-5fa4-4687-abad-a68616b57901");
      makeJobDOM("Senior Backend Engineer");
      const data = ashbyAdapter.extract();
      expect(data?.position).toBe("Senior Backend Engineer");
      expect(data?.company).toBe("Heron Data");
    });

    it("falls back to first h1 when class selector misses", () => {
      setLocation("/alpaca/some-uuid");
      document.body.innerHTML = `<h1>Staff Engineer</h1>`;
      const data = ashbyAdapter.extract();
      expect(data?.position).toBe("Staff Engineer");
      expect(data?.company).toBe("Alpaca");
    });

    it("returns null when no h1 found", () => {
      setLocation("/alpaca/some-uuid");
      document.body.innerHTML = `<p>no title</p>`;
      expect(ashbyAdapter.extract()).toBeNull();
    });
  });

  describe("watchForSubmission()", () => {
    it("returns no-op when not on /application path", () => {
      setLocation("/herondata/some-uuid");
      makeJobDOM("Engineer");
      const cleanup = ashbyAdapter.watchForSubmission?.(() => {});
      expect(() => cleanup?.()).not.toThrow();
    });

    it("calls onSubmit when the form is submitted (primary path)", async () => {
      setLocation("/heron-data/some-uuid/application");
      makeApplicationDOM("Senior Backend Engineer");

      const received = await new Promise<JobData>((resolve) => {
        ashbyAdapter.watchForSubmission?.(resolve);
        // Simulate user submitting the Ashby application form
        document
          .querySelector("form")
          ?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      });

      expect(received.position).toBe("Senior Backend Engineer");
      expect(received.company).toBe("Heron Data");
      // URL should strip /application suffix
      expect(received.url).not.toMatch(/\/application$/);
    });

    it("calls onSubmit when thank-you h1 appears (fallback: no form)", async () => {
      setLocation("/heron-data/some-uuid/application");
      // No form — adapter uses MutationObserver fallback
      document.body.innerHTML = `<h1 class="ashby-job-posting-heading-xyz">Senior Backend Engineer</h1>`;

      const received = await new Promise<JobData>((resolve) => {
        ashbyAdapter.watchForSubmission?.(resolve);
        document.body.innerHTML = `<h1>Thanks for submitting your application!</h1>`;
      });

      expect(received.position).toBe("Senior Backend Engineer");
      expect(received.company).toBe("Heron Data");
      expect(received.url).not.toMatch(/\/application$/);
    });

    it("returns no-op when h1 is missing on /application path", () => {
      setLocation("/alpaca/some-uuid/application");
      document.body.innerHTML = `<p>no title</p>`;
      const cleanup = ashbyAdapter.watchForSubmission?.(() => {});
      expect(() => cleanup?.()).not.toThrow();
    });
  });

  describe("extract() — fixture-based regression test", () => {
    it("extracts valid data from real captured HTML", () => {
      const fixturePath = path.join(__dirname, "fixtures/ashby.html");

      // Skip if fixture doesn't exist yet (hasn't been captured)
      if (!fs.existsSync(fixturePath)) {
        console.warn("⚠️  Skipping fixture test: fixtures/ashby.html not found");
        console.warn("   Run: npx tsx scripts/capture-fixtures.ts ashby");
        return;
      }

      const fixtureHTML = fs.readFileSync(fixturePath, "utf-8");
      document.documentElement.innerHTML = fixtureHTML;

      const data = ashbyAdapter.extract();

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
