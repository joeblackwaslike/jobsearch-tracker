import * as fs from "node:fs";
import * as path from "node:path";
import { describe, expect, it, vi } from "vitest";
import type { JobData } from "../types";
import { welcomeToTheJungleAdapter } from "../welcometothejungle";

function setLocation(pathname: string): void {
  Object.defineProperty(window, "location", {
    value: {
      ...window.location,
      pathname,
      href: `https://www.welcometothejungle.com${pathname}`,
    },
    writable: true,
    configurable: true,
  });
}

function setOgTitle(content: string): void {
  let meta = document.querySelector<HTMLMetaElement>('meta[property="og:title"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("property", "og:title");
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", content);
}

describe("welcomeToTheJungleAdapter", () => {
  describe("hosts", () => {
    it("includes www.welcometothejungle.com", () => {
      expect(welcomeToTheJungleAdapter.hosts).toContain("www.welcometothejungle.com");
    });
    it("includes welcometothejungle.com", () => {
      expect(welcomeToTheJungleAdapter.hosts).toContain("welcometothejungle.com");
    });
  });

  describe("source", () => {
    it("is Welcome to the Jungle", () => {
      expect(welcomeToTheJungleAdapter.source).toBe("Welcome to the Jungle");
    });
  });

  describe("extract()", () => {
    it("returns null on non-job pages", () => {
      setLocation("/en/jobs");
      document.body.innerHTML = `<div>listing</div>`;
      expect(welcomeToTheJungleAdapter.extract()).toBeNull();
    });

    it("extracts position and company from OG title", () => {
      setLocation("/en/companies/acme/jobs/software-engineer_london");
      setOgTitle("Software Engineer – Acme – Full-Time – London");
      document.body.innerHTML = `<div>content</div>`;
      const data = welcomeToTheJungleAdapter.extract();
      expect(data?.position).toBe("Software Engineer");
      expect(data?.company).toBe("Acme");
    });

    it("falls back to URL slug for company when OG title missing", () => {
      setLocation("/en/companies/cool-startup/jobs/backend-engineer_paris");
      document.head.innerHTML = ""; // no OG meta
      document.body.innerHTML = `<h1 class="sc-abc123">Backend Engineer</h1>`;
      const data = welcomeToTheJungleAdapter.extract();
      expect(data?.position).toBe("Backend Engineer");
      expect(data?.company).toBe("Cool Startup");
    });

    it("returns null when no position found", () => {
      setLocation("/en/companies/acme/jobs/some-job");
      document.head.innerHTML = "";
      document.body.innerHTML = `<div>no heading</div>`;
      expect(welcomeToTheJungleAdapter.extract()).toBeNull();
    });
  });

  describe("watchForIntent()", () => {
    it("fires onIntent when an Apply link is clicked", async () => {
      setLocation("/en/companies/stripe/jobs/engineer_sf");
      setOgTitle("Staff Engineer – Stripe – Full-Time – San Francisco");
      document.body.innerHTML = `
        <button>Apply</button>
      `;

      const received = await new Promise<JobData>((resolve) => {
        welcomeToTheJungleAdapter.watchForIntent?.(resolve);
        // biome-ignore lint/style/noNonNullAssertion: element is guaranteed by the HTML set up above
        const btn = document.querySelector<HTMLButtonElement>("button")!;
        btn.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
      });

      expect(received.position).toBe("Staff Engineer");
      expect(received.company).toBe("Stripe");
    });

    it("fires onIntent when an Apply anchor is clicked", async () => {
      setLocation("/en/companies/stripe/jobs/engineer_sf");
      setOgTitle("Staff Engineer – Stripe – Full-Time – SF");
      document.body.innerHTML = `
        <a href="/apply-link">Apply now</a>
      `;

      const received = await new Promise<JobData>((resolve) => {
        welcomeToTheJungleAdapter.watchForIntent?.(resolve);
        // biome-ignore lint/style/noNonNullAssertion: element is guaranteed by the HTML set up above
        const a = document.querySelector<HTMLAnchorElement>("a")!;
        a.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
      });

      expect(received.position).toBe("Staff Engineer");
    });

    it("does not fire for non-apply button clicks", () => {
      setLocation("/en/companies/stripe/jobs/engineer_sf");
      setOgTitle("Staff Engineer – Stripe – Full-Time – SF");
      document.body.innerHTML = `
        <button>Share</button>
        <button>Save</button>
      `;
      const callback = vi.fn();
      welcomeToTheJungleAdapter.watchForIntent?.(callback);

      document.querySelectorAll("button").forEach((btn) => {
        btn.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
      });

      expect(callback).not.toHaveBeenCalled();
    });

    it("only fires once", () => {
      setLocation("/en/companies/acme/jobs/dev_paris");
      setOgTitle("Developer – Acme – Full-Time – Paris");
      document.body.innerHTML = `<button>Apply</button>`;
      const callback = vi.fn();
      welcomeToTheJungleAdapter.watchForIntent?.(callback);

      // biome-ignore lint/style/noNonNullAssertion: element is guaranteed by the HTML set up above
      const btn = document.querySelector<HTMLButtonElement>("button")!;
      btn.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
      btn.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("does not fire when extract() returns null", () => {
      setLocation("/en/jobs");
      document.head.innerHTML = "";
      document.body.innerHTML = `<div>listing</div>`;
      const callback = vi.fn();
      const cleanup = welcomeToTheJungleAdapter.watchForIntent?.(callback);
      expect(() => cleanup?.()).not.toThrow();
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("extract() — fixture-based regression test", () => {
    it("extracts valid data from real captured HTML", () => {
      const fixturePath = path.join(__dirname, "fixtures/welcometothejungle.html");

      // Skip if fixture doesn't exist yet
      if (!fs.existsSync(fixturePath)) {
        console.warn("⚠️  Skipping fixture test: fixtures/welcometothejungle.html not found");
        console.warn("   Run: npm run capture-fixtures welcometothejungle");
        return;
      }

      const fixtureHTML = fs.readFileSync(fixturePath, "utf-8");
      setLocation("/en/companies/acme-corp/jobs/software-engineer");
      document.documentElement.innerHTML = fixtureHTML;

      const data = welcomeToTheJungleAdapter.extract();

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
