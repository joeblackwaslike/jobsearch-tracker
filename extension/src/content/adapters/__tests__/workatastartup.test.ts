import * as fs from "node:fs";
import * as path from "node:path";
import { describe, expect, it, vi } from "vitest";
import type { JobData } from "../types";
import { workAtAStartupAdapter } from "../workatastartup";

function setLocation(pathname: string): void {
  Object.defineProperty(window, "location", {
    value: {
      ...window.location,
      pathname,
      href: `https://www.workatastartup.com${pathname}`,
    },
    writable: true,
    configurable: true,
  });
}

describe("workAtAStartupAdapter", () => {
  describe("hosts", () => {
    it("includes www.workatastartup.com", () => {
      expect(workAtAStartupAdapter.hosts).toContain("www.workatastartup.com");
    });
  });

  describe("source", () => {
    it("is Work at a Startup", () => {
      expect(workAtAStartupAdapter.source).toBe("Work at a Startup");
    });
  });

  describe("extract()", () => {
    it("returns null on non-job paths", () => {
      setLocation("/companies");
      document.body.innerHTML = `<div class="job-name">Some Job</div>`;
      expect(workAtAStartupAdapter.extract()).toBeNull();
    });

    it("returns null on /jobs/ root", () => {
      setLocation("/jobs/");
      document.body.innerHTML = `<div class="job-name">Some Job</div>`;
      expect(workAtAStartupAdapter.extract()).toBeNull();
    });

    it("extracts position from .job-name and company from page title", () => {
      setLocation("/jobs/12345");
      document.title = "Software Engineer at Forge | Y Combinator's Work at a Startup";
      document.body.innerHTML = `<div class="job-name">Software Engineer</div>`;
      const data = workAtAStartupAdapter.extract();
      expect(data?.position).toBe("Software Engineer");
      expect(data?.company).toBe("Forge");
    });

    it("strips YC batch suffix from page title company", () => {
      setLocation("/jobs/12345");
      document.title = "Backend Engineer at Pave (W21) | Y Combinator's Work at a Startup";
      document.body.innerHTML = `<div class="job-name">Backend Engineer</div>`;
      const data = workAtAStartupAdapter.extract();
      expect(data?.company).toBe("Pave");
    });

    it("falls back to .company-name text parsing", () => {
      setLocation("/jobs/12345");
      document.title = ""; // no page title
      document.body.innerHTML = `
        <div class="job-name">Frontend Engineer</div>
        <div class="company-name">Frontend Engineer at Acme (S22)</div>
      `;
      const data = workAtAStartupAdapter.extract();
      expect(data?.position).toBe("Frontend Engineer");
      expect(data?.company).toBe("Acme");
    });

    it("returns null when .job-name is missing", () => {
      setLocation("/jobs/12345");
      document.title = "Some Job at Company | Y Combinator's Work at a Startup";
      document.body.innerHTML = `<div>no job-name element</div>`;
      expect(workAtAStartupAdapter.extract()).toBeNull();
    });

    it("returns null when company cannot be determined", () => {
      setLocation("/jobs/12345");
      document.title = "";
      document.body.innerHTML = `<div class="job-name">Some Job</div>`;
      expect(workAtAStartupAdapter.extract()).toBeNull();
    });
  });

  describe("watchForIntent()", () => {
    it("fires onIntent on page load for job detail pages", async () => {
      setLocation("/jobs/12345");
      document.title = "Data Engineer at Segment | Y Combinator's Work at a Startup";
      document.body.innerHTML = `<div class="job-name">Data Engineer</div>`;

      const received = await new Promise<JobData>((resolve) => {
        const cleanup = workAtAStartupAdapter.watchForIntent?.(resolve);
        return cleanup;
      });

      expect(received.position).toBe("Data Engineer");
      expect(received.company).toBe("Segment");
    });

    it("does not fire when extract() returns null", () => {
      setLocation("/companies");
      document.body.innerHTML = `<div>listing</div>`;
      const callback = vi.fn();
      const cleanup = workAtAStartupAdapter.watchForIntent?.(callback);
      expect(() => cleanup?.()).not.toThrow();
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("extract() — fixture-based regression test", () => {
    it("extracts valid data from real captured HTML", () => {
      const fixturePath = path.join(__dirname, "fixtures/workatastartup.html");

      // Skip if fixture doesn't exist yet
      if (!fs.existsSync(fixturePath)) {
        console.warn("⚠️  Skipping fixture test: fixtures/workatastartup.html not found");
        console.warn("   Run: npm run capture-fixtures --with-auth workatastartup");
        return;
      }

      const fixtureHTML = fs.readFileSync(fixturePath, "utf-8");
      Object.defineProperty(window, "location", {
        value: {
          ...window.location,
          pathname: "/jobs/12345",
          href: "https://www.workatastartup.com/jobs/12345",
        },
        writable: true,
        configurable: true,
      });
      document.documentElement.innerHTML = fixtureHTML;

      const data = workAtAStartupAdapter.extract();

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
