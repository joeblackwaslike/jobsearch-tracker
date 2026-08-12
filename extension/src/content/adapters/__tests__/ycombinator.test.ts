import * as fs from "node:fs";
import * as path from "node:path";
import { describe, expect, it, vi } from "vitest";
import type { JobData } from "../types";
import { ycombinatorAdapter } from "../ycombinator";

function setLocation(pathname: string): void {
  Object.defineProperty(window, "location", {
    value: {
      ...window.location,
      pathname,
      href: `https://www.ycombinator.com${pathname}`,
    },
    writable: true,
    configurable: true,
  });
}

describe("ycombinatorAdapter", () => {
  describe("hosts", () => {
    it("includes www.ycombinator.com", () => {
      expect(ycombinatorAdapter.hosts).toContain("www.ycombinator.com");
    });
    it("includes ycombinator.com", () => {
      expect(ycombinatorAdapter.hosts).toContain("ycombinator.com");
    });
  });

  describe("source", () => {
    it("is YCombinator", () => {
      expect(ycombinatorAdapter.source).toBe("YCombinator");
    });
  });

  describe("extract()", () => {
    it("returns null on non-job paths", () => {
      setLocation("/companies");
      document.body.innerHTML = `<h1>Companies</h1>`;
      expect(ycombinatorAdapter.extract()).toBeNull();
    });

    it("returns null on company root (no job segment)", () => {
      setLocation("/companies/stripe");
      document.body.innerHTML = `<h1>Stripe</h1>`;
      expect(ycombinatorAdapter.extract()).toBeNull();
    });

    it("extracts position from h1 and company from h2", () => {
      setLocation("/companies/stripe/jobs/12345");
      document.body.innerHTML = `
        <h1>Senior Backend Engineer</h1>
        <h2>Stripe</h2>
      `;
      const data = ycombinatorAdapter.extract();
      expect(data?.position).toBe("Senior Backend Engineer");
      expect(data?.company).toBe("Stripe");
    });

    it("falls back to URL slug when h2 is absent", () => {
      setLocation("/companies/open-source-co/jobs/67890");
      document.body.innerHTML = `<h1>Staff Engineer</h1>`;
      const data = ycombinatorAdapter.extract();
      expect(data?.position).toBe("Staff Engineer");
      expect(data?.company).toBe("Open Source Co");
    });

    it("prefers h2 DOM text over URL slug", () => {
      setLocation("/companies/pave/jobs/44444");
      document.body.innerHTML = `
        <h1>PM</h1>
        <h2>Pave, Inc.</h2>
      `;
      const data = ycombinatorAdapter.extract();
      expect(data?.company).toBe("Pave, Inc.");
    });

    it("returns null when no h1 found", () => {
      setLocation("/companies/acme/jobs/1");
      document.body.innerHTML = `<h2>Acme</h2>`;
      expect(ycombinatorAdapter.extract()).toBeNull();
    });

    it("converts slug to title case when h2 is absent", () => {
      setLocation("/companies/my-startup/jobs/1");
      document.body.innerHTML = `<h1>Founding Engineer</h1>`;
      const data = ycombinatorAdapter.extract();
      expect(data?.company).toBe("My Startup");
    });
  });

  describe("watchForIntent()", () => {
    it("fires onIntent on page load for job detail pages", async () => {
      setLocation("/companies/stripe/jobs/12345");
      document.body.innerHTML = `
        <h1>Senior Backend Engineer</h1>
        <h2>Stripe</h2>
      `;

      const received = await new Promise<JobData>((resolve) => {
        const cleanup = ycombinatorAdapter.watchForIntent?.(resolve);
        return cleanup;
      });

      expect(received.position).toBe("Senior Backend Engineer");
      expect(received.company).toBe("Stripe");
    });

    it("does not fire when extract() returns null", () => {
      setLocation("/companies");
      document.body.innerHTML = `<h1>Companies</h1>`;
      const callback = vi.fn();
      const cleanup = ycombinatorAdapter.watchForIntent?.(callback);
      expect(() => cleanup?.()).not.toThrow();
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("extract() — fixture-based regression test", () => {
    it("extracts valid data from real captured HTML", () => {
      const fixturePath = path.join(__dirname, "fixtures/ycombinator.html");

      // Skip if fixture doesn't exist yet
      if (!fs.existsSync(fixturePath)) {
        console.warn("⚠️  Skipping fixture test: fixtures/ycombinator.html not found");
        console.warn("   Run: npm run capture-fixtures ycombinator");
        return;
      }

      const fixtureHTML = fs.readFileSync(fixturePath, "utf-8");
      setLocation("/companies/stripe/jobs/senior-backend-engineer");
      document.documentElement.innerHTML = fixtureHTML;

      const data = ycombinatorAdapter.extract();

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
