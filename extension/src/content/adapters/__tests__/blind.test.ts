import * as fs from "node:fs";
import * as path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { blindAdapter } from "../blind";
import type { JobData } from "../types";

function setLocation(pathname: string): void {
  Object.defineProperty(window, "location", {
    value: { ...window.location, pathname, href: `https://www.teamblind.com${pathname}` },
    writable: true,
    configurable: true,
  });
}

describe("blindAdapter", () => {
  describe("hosts", () => {
    it("includes www.teamblind.com", () => {
      expect(blindAdapter.hosts).toContain("www.teamblind.com");
    });
  });

  describe("source", () => {
    it("is TeamBlind", () => {
      expect(blindAdapter.source).toBe("TeamBlind");
    });
  });

  describe("extract()", () => {
    it("returns null on non-job paths", () => {
      setLocation("/feed");
      document.body.innerHTML = `<h1>Feed</h1>`;
      expect(blindAdapter.extract()).toBeNull();
    });

    it("returns null on /jobs/ root", () => {
      setLocation("/jobs/");
      document.body.innerHTML = `<h1>Jobs listing</h1>`;
      expect(blindAdapter.extract()).toBeNull();
    });

    it("extracts position from h1 and company from a[href*='/company/']", () => {
      setLocation("/jobs/12345");
      document.body.innerHTML = `
        <h1>Senior Engineer</h1>
        <a href="/company/acme-corp">Acme Corp</a>
      `;
      const data = blindAdapter.extract();
      expect(data?.position).toBe("Senior Engineer");
      expect(data?.company).toBe("Acme Corp");
    });

    it("skips empty-text company links (logo anchors)", () => {
      setLocation("/jobs/12345");
      document.body.innerHTML = `
        <h1>Senior Engineer</h1>
        <a href="/company/acme"><img src="logo.png" /></a>
        <a href="/company/acme">Acme</a>
      `;
      const data = blindAdapter.extract();
      expect(data?.company).toBe("Acme");
    });

    it("falls back to page title pattern when no company link", () => {
      setLocation("/jobs/99999");
      document.title = "Staff Engineer at Meta | Blind Job Board - Blind";
      document.body.innerHTML = `<h1>Staff Engineer</h1>`;
      const data = blindAdapter.extract();
      expect(data?.position).toBe("Staff Engineer");
      expect(data?.company).toBe("Meta");
    });

    it("returns null when no h1 found", () => {
      setLocation("/jobs/12345");
      document.body.innerHTML = `<a href="/company/acme">Acme</a>`;
      expect(blindAdapter.extract()).toBeNull();
    });

    it("returns null when company cannot be determined", () => {
      setLocation("/jobs/12345");
      document.title = "";
      document.body.innerHTML = `<h1>Some Job</h1>`;
      expect(blindAdapter.extract()).toBeNull();
    });
  });

  describe("watchForIntent()", () => {
    it("fires onIntent on page load for job detail pages", async () => {
      setLocation("/jobs/12345");
      document.body.innerHTML = `
        <h1>Senior Engineer</h1>
        <a href="/company/stripe">Stripe</a>
      `;

      const received = await new Promise<JobData>((resolve) => {
        const cleanup = blindAdapter.watchForIntent?.(resolve);
        return cleanup;
      });

      expect(received.position).toBe("Senior Engineer");
      expect(received.company).toBe("Stripe");
    });

    it("does not fire when extract() returns null", () => {
      setLocation("/feed");
      document.body.innerHTML = `<div>not a job</div>`;
      const callback = vi.fn();
      const cleanup = blindAdapter.watchForIntent?.(callback);
      expect(() => cleanup?.()).not.toThrow();
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("extract() — fixture-based regression test", () => {
    it("extracts valid data from real captured HTML", () => {
      const fixturePath = path.join(__dirname, "fixtures/blind.html");

      // Skip if fixture doesn't exist yet
      if (!fs.existsSync(fixturePath)) {
        console.warn("⚠️  Skipping fixture test: fixtures/blind.html not found");
        console.warn("   Run: npm run capture-fixtures blind");
        return;
      }

      const fixtureHTML = fs.readFileSync(fixturePath, "utf-8");
      setLocation("/jobs/12345");
      document.documentElement.innerHTML = fixtureHTML;

      const data = blindAdapter.extract();

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
