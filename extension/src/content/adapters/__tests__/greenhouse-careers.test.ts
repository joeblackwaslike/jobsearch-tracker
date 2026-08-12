import * as fs from "node:fs";
import * as path from "node:path";
import { describe, expect, it } from "vitest";
import { greenhouseCareersAdapter } from "../greenhouse-careers";
import type { JobData } from "../types";

function setLocation(hostname: string, search: string, pathname = "/jobs/some-job"): void {
  Object.defineProperty(window, "location", {
    value: {
      ...window.location,
      hostname,
      pathname,
      search,
      href: `https://${hostname}${pathname}${search}`,
    },
    writable: true,
    configurable: true,
  });
}

describe("greenhouseCareersAdapter", () => {
  describe("hosts", () => {
    it("has no fixed hosts (matched by URL param)", () => {
      expect(greenhouseCareersAdapter.hosts).toHaveLength(0);
    });
  });

  describe("extract()", () => {
    it("extracts position from document.title and company from domain", () => {
      setLocation("careers.withwaymo.com", "?gh_jid=7531397");
      document.title =
        "Software Engineer, Multiverse - Mountain View, California - San Francisco, California";
      const data = greenhouseCareersAdapter.extract();
      expect(data?.position).toBe("Software Engineer, Multiverse");
      expect(data?.company).toBe("Withwaymo");
    });

    it("strips 'careers.' prefix from domain for company name", () => {
      setLocation("careers.stripe.com", "?gh_jid=12345");
      document.title = "Staff Engineer - New York, NY";
      const data = greenhouseCareersAdapter.extract();
      expect(data?.company).toBe("Stripe");
    });

    it("strips 'jobs.' prefix from domain for company name", () => {
      setLocation("jobs.acme.com", "?gh_jid=99999");
      document.title = "Senior Engineer - Remote";
      const data = greenhouseCareersAdapter.extract();
      expect(data?.company).toBe("Acme");
    });

    it("returns null when gh_jid param is absent", () => {
      setLocation("careers.stripe.com", "");
      document.title = "Staff Engineer - New York";
      expect(greenhouseCareersAdapter.extract()).toBeNull();
    });
  });

  describe("watchForSubmission()", () => {
    it("calls onSubmit when a thank-you heading appears", async () => {
      setLocation("careers.withwaymo.com", "?gh_jid=7531397");
      document.title = "Software Engineer, Multiverse - Mountain View, California";
      document.body.innerHTML = `<h1>Working at Waymo</h1><form></form>`;

      const received = await new Promise<JobData>((resolve) => {
        greenhouseCareersAdapter.watchForSubmission?.(resolve);
        // Simulate Greenhouse CMS showing thank-you message
        const h2 = document.createElement("h2");
        h2.textContent = "Thank you for applying!";
        document.body.appendChild(h2);
      });

      expect(received.position).toBe("Software Engineer, Multiverse");
    });

    it("returns no-op when extract() returns null", () => {
      setLocation("careers.withwaymo.com", ""); // no gh_jid
      document.title = "Some Page";
      const cleanup = greenhouseCareersAdapter.watchForSubmission?.(() => {});
      expect(() => cleanup?.()).not.toThrow();
    });
  });

  describe("extract() — fixture-based regression test", () => {
    it("extracts valid data from real captured HTML", () => {
      const fixturePath = path.join(__dirname, "fixtures/greenhouse-careers.html");

      if (!fs.existsSync(fixturePath)) {
        console.warn("⚠️  Skipping fixture test: fixtures/greenhouse-careers.html not found");
        console.warn("   Run: node scripts/capture-fixtures.mjs greenhouse-careers");
        return;
      }

      const fixtureHTML = fs.readFileSync(fixturePath, "utf-8");

      // Set up location mock for Waymo
      setLocation("careers.withwaymo.com", "?gh_jid=7531397");
      document.documentElement.innerHTML = fixtureHTML;

      const data = greenhouseCareersAdapter.extract();

      expect(data).not.toBeNull();
      expect(data?.position).toBeTruthy();
      expect(data?.company).toBeTruthy();
      expect(data?.url).toBeTruthy();

      console.log(`   Extracted from fixture: ${data?.position} at ${data?.company}`);
    });
  });
});
