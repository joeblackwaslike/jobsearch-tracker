import * as fs from "node:fs";
import * as path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { googleJobsAdapter } from "../google";
import type { JobData } from "../types";

function setLocation(search: string): void {
  Object.defineProperty(window, "location", {
    value: {
      ...window.location,
      pathname: "/search",
      search,
      href: `https://www.google.com/search${search}`,
    },
    writable: true,
    configurable: true,
  });
}

function makeJobsPanel(title: string, company = ""): void {
  document.body.innerHTML = `
    <div class="gws-plugins-horizon-jobs__tl-lif">
      <h2>${title}</h2>
      ${company ? `<span class="company-name-class">${company}</span>` : ""}
      <a href="https://example.com/apply">Apply</a>
    </div>
  `;
}

describe("googleJobsAdapter", () => {
  describe("hosts", () => {
    it("includes www.google.com", () => {
      expect(googleJobsAdapter.hosts).toContain("www.google.com");
    });
  });

  describe("source", () => {
    it("is Google Jobs", () => {
      expect(googleJobsAdapter.source).toBe("Google Jobs");
    });
  });

  describe("extract()", () => {
    it("returns null when not in Jobs mode and no jobs panel", () => {
      setLocation("?q=test");
      document.body.innerHTML = `<div>regular search</div>`;
      expect(googleJobsAdapter.extract()).toBeNull();
    });

    it("extracts title when udm=8 and jobs panel present", () => {
      setLocation("?udm=8&q=engineer");
      makeJobsPanel("Software Engineer", "Google");
      const data = googleJobsAdapter.extract();
      expect(data?.position).toBe("Software Engineer");
    });

    it("extracts title from jobs panel without udm=8", () => {
      setLocation("?q=engineer+jobs");
      makeJobsPanel("Backend Engineer");
      const data = googleJobsAdapter.extract();
      expect(data?.position).toBe("Backend Engineer");
    });

    it("returns null when no h2 in jobs panel", () => {
      setLocation("?udm=8");
      document.body.innerHTML = `
        <div class="gws-plugins-horizon-jobs__tl-lif">
          <p>No title here</p>
        </div>
      `;
      expect(googleJobsAdapter.extract()).toBeNull();
    });

    it("returns empty string for company when no company element", () => {
      setLocation("?udm=8");
      makeJobsPanel("Staff Engineer");
      const data = googleJobsAdapter.extract();
      expect(data?.position).toBe("Staff Engineer");
      expect(data?.company).toBe("");
    });
  });

  describe("watchForIntent()", () => {
    it("fires onIntent when Apply button is clicked", async () => {
      setLocation("?udm=8");
      makeJobsPanel("Software Engineer", "Google LLC");

      const received = await new Promise<JobData>((resolve) => {
        googleJobsAdapter.watchForIntent?.(resolve);
        // biome-ignore lint/style/noNonNullAssertion: element is guaranteed by the HTML set up above
        const applyBtn = document.querySelector<HTMLAnchorElement>("a")!;
        applyBtn.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
      });

      expect(received.position).toBe("Software Engineer");
    });

    it("does not fire when panel is not present", () => {
      setLocation("?q=test");
      document.body.innerHTML = `<div>regular search</div>`;
      const callback = vi.fn();
      const cleanup = googleJobsAdapter.watchForIntent?.(callback);
      expect(() => cleanup?.()).not.toThrow();
      expect(callback).not.toHaveBeenCalled();
    });

    it("attaches via MutationObserver when panel loads late", async () => {
      setLocation("?udm=8");
      document.body.innerHTML = `<div id="root"></div>`;

      const received = await new Promise<JobData>((resolve) => {
        googleJobsAdapter.watchForIntent?.(resolve);
        // Dynamically inject the jobs panel
        // biome-ignore lint/style/noNonNullAssertion: element is guaranteed by the HTML set up above
        document.getElementById("root")!.innerHTML = `
          <div class="gws-plugins-horizon-jobs__tl-lif">
            <h2>Late Engineer</h2>
            <a href="https://example.com/apply">Apply</a>
          </div>
        `;
        // Trigger click after injection
        setTimeout(() => {
          // biome-ignore lint/style/noNonNullAssertion: element is guaranteed by the HTML set up above
          const btn = document.querySelector<HTMLAnchorElement>(
            ".gws-plugins-horizon-jobs__tl-lif a",
          )!;
          btn.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
        }, 10);
      });

      expect(received.position).toBe("Late Engineer");
    });
  });

  describe("extract() — fixture-based regression test", () => {
    it("extracts valid data from real captured HTML", () => {
      const fixturePath = path.join(__dirname, "fixtures/google.html");

      // Skip if fixture doesn't exist yet
      if (!fs.existsSync(fixturePath)) {
        console.warn("⚠️  Skipping fixture test: fixtures/google.html not found");
        console.warn("   Run: npm run capture-fixtures google");
        return;
      }

      const fixtureHTML = fs.readFileSync(fixturePath, "utf-8");
      setLocation("?q=software+engineer+jobs&udm=8");
      document.documentElement.innerHTML = fixtureHTML;

      const data = googleJobsAdapter.extract();

      // Assert that extraction succeeds and returns valid data
      expect(data).not.toBeNull();
      expect(data?.position).toBeTruthy();
      // Company is optional for Google Jobs
      expect(data?.url).toBeTruthy();

      // Log the extracted data for visibility
      console.log(
        `   Extracted from fixture: ${data?.position}${data?.company ? ` at ${data.company}` : ""}`,
      );
    });
  });
});
