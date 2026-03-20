import * as fs from "node:fs";
import * as path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { linkedInAdapter } from "../linkedin";
import type { JobData } from "../types";

function setLocation(pathname: string, search = ""): void {
  Object.defineProperty(window, "location", {
    value: {
      ...window.location,
      pathname,
      search,
      href: `https://www.linkedin.com${pathname}${search}`,
    },
    writable: true,
    configurable: true,
  });
}

function makeLegacyDOM(title: string, company: string): void {
  document.body.innerHTML = `
    <div class="jobs-unified-top-card">
      <h1 class="job-details-jobs-unified-top-card__job-title">
        <a>${title}</a>
      </h1>
      <div class="job-details-jobs-unified-top-card__company-name">
        <a>${company}</a>
      </div>
    </div>
  `;
}

describe("linkedInAdapter", () => {
  describe("legacy DOM", () => {
    it("extracts job title and company", () => {
      setLocation("/jobs/");
      document.title = "";
      makeLegacyDOM("Senior Engineer", "Acme Corp");
      const data = linkedInAdapter.extract();
      expect(data?.position).toBe("Senior Engineer");
      expect(data?.company).toBe("Acme Corp");
    });

    it("returns null when not on a job detail page", () => {
      setLocation("/feed/");
      document.body.innerHTML = `<div>LinkedIn Feed</div>`;
      expect(linkedInAdapter.extract()).toBeNull();
    });
  });

  describe("SDUI document.title fallback", () => {
    it("parses position and company from title on /jobs/view/ pages", () => {
      setLocation("/jobs/view/4370884325/");
      document.title = "Senior Software Engineer | Alpaca | LinkedIn";
      document.body.innerHTML = `<div>obfuscated sdui markup</div>`;
      const data = linkedInAdapter.extract();
      expect(data?.position).toBe("Senior Software Engineer");
      expect(data?.company).toBe("Alpaca");
    });

    it("parses title on search results page with currentJobId param", () => {
      setLocation("/jobs/search-results/", "?currentJobId=4370884325");
      document.title = "Staff Engineer | Stripe | LinkedIn";
      document.body.innerHTML = `<div></div>`;
      const data = linkedInAdapter.extract();
      expect(data?.position).toBe("Staff Engineer");
      expect(data?.company).toBe("Stripe");
    });

    it("returns null when title does not end with LinkedIn sentinel", () => {
      setLocation("/jobs/view/123/");
      document.title = "Some Random Page Title";
      document.body.innerHTML = `<div></div>`;
      expect(linkedInAdapter.extract()).toBeNull();
    });

    it("does not use title on non-job pages", () => {
      setLocation("/feed/");
      document.title = "Feed | LinkedIn";
      document.body.innerHTML = `<div></div>`;
      expect(linkedInAdapter.extract()).toBeNull();
    });
  });

  describe("watchForIntent()", () => {
    it("fires onIntent when external apply link is clicked", async () => {
      setLocation("/jobs/view/4370884325/");
      document.title = "Senior Software Engineer | Alpaca | LinkedIn";
      document.body.innerHTML = `
        <a href="https://www.linkedin.com/redir/redirect/?url=https%3A%2F%2Fboards.greenhouse.io%2Falpaca%2Fjobs%2F123&urlhash=abc&isSdui=true">Apply</a>
      `;

      const received = await new Promise<JobData>((resolve) => {
        const cleanup = linkedInAdapter.watchForIntent?.(resolve);
        document.querySelector("a")?.click();
        return cleanup;
      });

      expect(received.position).toBe("Senior Software Engineer");
      expect(received.company).toBe("Alpaca");
    });

    it("returns no-op when no external apply link found (Easy Apply)", () => {
      setLocation("/jobs/view/4370884325/");
      document.title = "Engineer | Corp | LinkedIn";
      document.body.innerHTML = `<button>Easy Apply</button>`;

      const cleanup = linkedInAdapter.watchForIntent?.(vi.fn());
      expect(() => cleanup?.()).not.toThrow();
    });
  });

  describe("watchForSubmission()", () => {
    it("returns a no-op when not on a job page", () => {
      setLocation("/feed/");
      document.body.innerHTML = `<div></div>`;
      const cleanup = linkedInAdapter.watchForSubmission?.(vi.fn());
      expect(() => cleanup?.()).not.toThrow();
    });
  });

  describe("source", () => {
    it("has source set to LinkedIn", () => {
      expect(linkedInAdapter.source).toBe("LinkedIn");
    });
  });

  describe("extract() — fixture-based regression test", () => {
    it("extracts valid data from real captured HTML", () => {
      const fixturePath = path.join(__dirname, "fixtures/linkedin.html");

      // Skip if fixture doesn't exist yet
      if (!fs.existsSync(fixturePath)) {
        console.warn("⚠️  Skipping fixture test: fixtures/linkedin.html not found");
        console.warn("   Run: npm run capture-fixtures --with-auth linkedin");
        return;
      }

      const fixtureHTML = fs.readFileSync(fixturePath, "utf-8");
      Object.defineProperty(window, "location", {
        value: {
          ...window.location,
          pathname: "/jobs/view/123456",
          href: "https://www.linkedin.com/jobs/view/123456",
        },
        writable: true,
        configurable: true,
      });
      document.documentElement.innerHTML = fixtureHTML;

      const data = linkedInAdapter.extract();

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
