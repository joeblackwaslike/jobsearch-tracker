import * as fs from "node:fs";
import * as path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { githubAdapter } from "../github";
import type { JobData } from "../types";

function setLocation(pathname: string): void {
  Object.defineProperty(window, "location", {
    value: { ...window.location, pathname, href: `https://github.com${pathname}` },
    writable: true,
    configurable: true,
  });
}

describe("githubAdapter", () => {
  describe("hosts", () => {
    it("includes github.com", () => {
      expect(githubAdapter.hosts).toContain("github.com");
    });
  });

  describe("source", () => {
    it("is GitHub", () => {
      expect(githubAdapter.source).toBe("GitHub");
    });
  });

  describe("extract()", () => {
    it("returns null when not on a /jobs/ path", () => {
      setLocation("/github/docs");
      document.body.innerHTML = `<h1 class="lh-condensed">Some Page</h1>`;
      expect(githubAdapter.extract()).toBeNull();
    });

    it("extracts title from h1.lh-condensed and company from path", () => {
      setLocation("/stripe/jobs/3842910");
      document.body.innerHTML = `
        <h1 class="lh-condensed">Staff Backend Engineer</h1>
      `;
      const data = githubAdapter.extract();
      expect(data?.position).toBe("Staff Backend Engineer");
      expect(data?.company).toBe("stripe");
    });

    it("extracts company from .mr-3 a when present", () => {
      setLocation("/stripe/jobs/3842910");
      document.body.innerHTML = `
        <h1 class="lh-condensed">Staff Backend Engineer</h1>
        <div class="mr-3"><a href="/stripe">Stripe</a></div>
      `;
      const data = githubAdapter.extract();
      expect(data?.company).toBe("Stripe");
    });

    it("returns null when no h1 found", () => {
      setLocation("/stripe/jobs/1234");
      document.body.innerHTML = `<div>no title</div>`;
      expect(githubAdapter.extract()).toBeNull();
    });
  });

  describe("watchForIntent()", () => {
    it("fires onIntent on page load for job detail pages", async () => {
      setLocation("/acme/jobs/9999");
      document.body.innerHTML = `
        <h1 class="lh-condensed">Software Engineer</h1>
        <div class="mr-3"><a href="/acme">Acme</a></div>
      `;

      const received = await new Promise<JobData>((resolve) => {
        const cleanup = githubAdapter.watchForIntent?.(resolve);
        return cleanup;
      });

      expect(received.position).toBe("Software Engineer");
      expect(received.company).toBe("Acme");
    });

    it("does not fire when extract() returns null", () => {
      setLocation("/github/docs");
      document.body.innerHTML = `<div>not a job</div>`;
      const callback = vi.fn();
      const cleanup = githubAdapter.watchForIntent?.(callback);
      expect(() => cleanup?.()).not.toThrow();
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("extract() — fixture-based regression test", () => {
    it("extracts valid data from real captured HTML", () => {
      const fixturePath = path.join(__dirname, "fixtures/github.html");

      // Skip if fixture doesn't exist yet
      if (!fs.existsSync(fixturePath)) {
        console.warn("⚠️  Skipping fixture test: fixtures/github.html not found");
        console.warn("   Run: npm run capture-fixtures github");
        return;
      }

      const fixtureHTML = fs.readFileSync(fixturePath, "utf-8");
      setLocation("/anthropic/jobs/senior-software-engineer");
      document.documentElement.innerHTML = fixtureHTML;

      const data = githubAdapter.extract();

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
