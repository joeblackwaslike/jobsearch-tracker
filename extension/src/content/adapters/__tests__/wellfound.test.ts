import * as fs from "node:fs";
import * as path from "node:path";
import { describe, expect, it, vi } from "vitest";
import type { JobData } from "../types";
import { wellfoundAdapter } from "../wellfound";

function setLocation(pathname: string, search = ""): void {
  Object.defineProperty(window, "location", {
    value: {
      ...window.location,
      pathname,
      search,
      href: `https://wellfound.com${pathname}${search}`,
    },
    writable: true,
    configurable: true,
  });
}

function makeJobDetailDOM(title: string, company: string): void {
  document.body.innerHTML = `
    <div>
      <h1>${title}</h1>
      <a href="/company/${company.toLowerCase()}-5">${company}</a>
    </div>
  `;
}

describe("wellfoundAdapter", () => {
  describe("hosts", () => {
    it("includes wellfound.com", () => {
      expect(wellfoundAdapter.hosts).toContain("wellfound.com");
    });
  });

  describe("source", () => {
    it("has source set to Wellfound", () => {
      expect(wellfoundAdapter.source).toBe("Wellfound");
    });
  });

  describe("extract()", () => {
    it("extracts title and company from job detail page", () => {
      setLocation("/jobs/3941681-forward-deployed-engineer");
      makeJobDetailDOM("Forward Deployed Engineer", "GrowthX");
      const data = wellfoundAdapter.extract();
      expect(data?.position).toBe("Forward Deployed Engineer");
      expect(data?.company).toBe("GrowthX");
    });

    it("extracts from ?job_listing_slug query param URL", () => {
      setLocation("/jobs", "?job_listing_slug=3898377-senior-backend-software-engineer");
      makeJobDetailDOM("Senior Backend Engineer", "Acme");
      const data = wellfoundAdapter.extract();
      expect(data?.position).toBe("Senior Backend Engineer");
      expect(data?.company).toBe("Acme");
    });

    it("returns null when not on a job detail page", () => {
      setLocation("/jobs");
      document.body.innerHTML = `<div>Wellfound jobs listing</div>`;
      expect(wellfoundAdapter.extract()).toBeNull();
    });

    it("returns null when h1 not found", () => {
      setLocation("/jobs/3941681-some-job");
      document.body.innerHTML = `<a href="/company/acme">Acme</a>`;
      expect(wellfoundAdapter.extract()).toBeNull();
    });

    it("skips empty-text company links (logo wrappers) to find the text link", () => {
      setLocation("/jobs/3941681-some-job");
      document.body.innerHTML = `
        <h1>Engineer</h1>
        <a href="/company/acme"><img src="logo.png" /></a>
        <a href="/company/acme">Acme Corp</a>
      `;
      const data = wellfoundAdapter.extract();
      expect(data?.company).toBe("Acme Corp");
    });
  });

  describe("watchForIntent()", () => {
    it("fires onIntent on page load for job detail pages", async () => {
      setLocation("/jobs/3941681-forward-deployed-engineer");
      makeJobDetailDOM("Forward Deployed Engineer", "GrowthX");

      const received = await new Promise<JobData>((resolve) => {
        const cleanup = wellfoundAdapter.watchForIntent?.(resolve);
        return cleanup;
      });

      expect(received.position).toBe("Forward Deployed Engineer");
      expect(received.company).toBe("GrowthX");
    });

    it("does not fire when extract() returns null", () => {
      setLocation("/jobs"); // listing page, not detail
      document.body.innerHTML = `<div>listing</div>`;
      const callback = vi.fn();
      const cleanup = wellfoundAdapter.watchForIntent?.(callback);
      expect(() => cleanup?.()).not.toThrow();
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("extract() — fixture-based regression test", () => {
    it("extracts valid data from real captured HTML", () => {
      const fixturePath = path.join(__dirname, "fixtures/wellfound.html");

      // Skip if fixture doesn't exist yet
      if (!fs.existsSync(fixturePath)) {
        console.warn("⚠️  Skipping fixture test: fixtures/wellfound.html not found");
        console.warn("   Run: npm run capture-fixtures wellfound");
        return;
      }

      const fixtureHTML = fs.readFileSync(fixturePath, "utf-8");
      setLocation("/jobs/12345-test-job");
      document.documentElement.innerHTML = fixtureHTML;

      const data = wellfoundAdapter.extract();

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
