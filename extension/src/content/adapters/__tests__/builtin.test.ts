import * as fs from "node:fs";
import * as path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { builtinAdapter } from "../builtin";
import type { JobData } from "../types";

function setLocation(pathname: string): void {
  Object.defineProperty(window, "location", {
    value: { ...window.location, pathname, href: `https://builtin.com${pathname}` },
    writable: true,
    configurable: true,
  });
}

function makeJsonLdScript(company: string): string {
  return `<script type="application/ld+json">{"@type":"JobPosting","hiringOrganization":{"name":"${company}"}}</script>`;
}

describe("builtinAdapter", () => {
  describe("hosts", () => {
    it("includes builtin.com", () => {
      expect(builtinAdapter.hosts).toContain("builtin.com");
    });
    it("includes www.builtin.com", () => {
      expect(builtinAdapter.hosts).toContain("www.builtin.com");
    });
  });

  describe("source", () => {
    it("is Builtin", () => {
      expect(builtinAdapter.source).toBe("Builtin");
    });
  });

  describe("extract()", () => {
    it("returns null on non-job pages", () => {
      setLocation("/");
      document.body.innerHTML = `<h1>Built In</h1>`;
      expect(builtinAdapter.extract()).toBeNull();
    });

    it("extracts position and company from JSON-LD", () => {
      setLocation("/job/engineer/senior-software-engineer/12345");
      document.body.innerHTML = `
        <h1>Senior Software Engineer</h1>
        ${makeJsonLdScript("Acme Corp")}
      `;
      const data = builtinAdapter.extract();
      expect(data?.position).toBe("Senior Software Engineer");
      expect(data?.company).toBe("Acme Corp");
    });

    it("falls back to page title when JSON-LD absent", () => {
      setLocation("/job/engineer/backend-engineer/99");
      document.title = "Backend Engineer - Widgets Inc | Built In";
      document.body.innerHTML = `<h1>Backend Engineer</h1>`;
      const data = builtinAdapter.extract();
      expect(data?.position).toBe("Backend Engineer");
      expect(data?.company).toBe("Widgets Inc");
    });

    it("falls back to a[href*='/company/'] when JSON-LD and title are missing", () => {
      setLocation("/job/engineer/backend-engineer/99");
      document.title = "";
      document.body.innerHTML = `
        <h1>Backend Engineer</h1>
        <a href="/company/widgets-inc">Widgets Inc</a>
      `;
      const data = builtinAdapter.extract();
      expect(data?.company).toBe("Widgets Inc");
    });

    it("skips empty-text company links", () => {
      setLocation("/job/engineer/backend-engineer/99");
      document.title = "";
      document.body.innerHTML = `
        <h1>Backend Engineer</h1>
        <a href="/company/widgets-inc"><img src="logo.png" /></a>
        <a href="/company/widgets-inc">Widgets Inc</a>
      `;
      const data = builtinAdapter.extract();
      expect(data?.company).toBe("Widgets Inc");
    });

    it("returns null when h1 is missing", () => {
      setLocation("/job/engineer/some-job/1");
      document.body.innerHTML = makeJsonLdScript("Acme");
      expect(builtinAdapter.extract()).toBeNull();
    });

    it("returns null when company cannot be determined", () => {
      setLocation("/job/engineer/some-job/1");
      document.title = "";
      document.body.innerHTML = `<h1>Some Job</h1>`;
      expect(builtinAdapter.extract()).toBeNull();
    });
  });

  describe("watchForIntent()", () => {
    it("fires onIntent on page load for job detail pages", async () => {
      setLocation("/job/engineer/senior-software-engineer/12345");
      document.body.innerHTML = `
        <h1>Senior Software Engineer</h1>
        ${makeJsonLdScript("Acme Corp")}
      `;

      const received = await new Promise<JobData>((resolve) => {
        const cleanup = builtinAdapter.watchForIntent?.(resolve);
        return cleanup;
      });

      expect(received.position).toBe("Senior Software Engineer");
      expect(received.company).toBe("Acme Corp");
    });

    it("does not fire when extract() returns null", () => {
      setLocation("/");
      document.body.innerHTML = `<div>listing</div>`;
      const callback = vi.fn();
      const cleanup = builtinAdapter.watchForIntent?.(callback);
      expect(() => cleanup?.()).not.toThrow();
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("extract() — fixture-based regression test", () => {
    it("extracts valid data from real captured HTML", { timeout: 15000 }, () => {
      const fixturePath = path.join(__dirname, "fixtures/builtin.html");

      if (!fs.existsSync(fixturePath)) {
        console.warn("⚠️  Skipping fixture test: fixtures/builtin.html not found");
        console.warn("   Run: node scripts/capture-fixtures.mjs builtin");
        return;
      }

      // Set up location mock for BuiltIn NYC job
      setLocation("/job/software-engineer-new-grads-new-york/8554050");

      const fixtureHTML = fs.readFileSync(fixturePath, "utf-8");
      document.documentElement.innerHTML = fixtureHTML;

      const data = builtinAdapter.extract();

      expect(data).not.toBeNull();
      expect(data?.position).toBeTruthy();
      expect(data?.company).toBeTruthy();
      expect(data?.url).toBeTruthy();

      console.log(`   Extracted from fixture: ${data?.position} at ${data?.company}`);
    });
  });
});
