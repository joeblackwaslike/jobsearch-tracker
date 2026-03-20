import * as fs from "node:fs";
import * as path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { hackerNewsAdapter } from "../hackernews";
import type { JobData } from "../types";

function setLocation(pathname: string, search = ""): void {
  Object.defineProperty(window, "location", {
    value: {
      ...window.location,
      pathname,
      search,
      href: `https://news.ycombinator.com${pathname}${search}`,
    },
    writable: true,
    configurable: true,
  });
}

/** Minimal HN item page DOM for a job post (no .subline in subtext) */
function makeJobItemDOM(title: string, externalHref = "https://example.com/apply"): void {
  document.body.innerHTML = `
    <table class="fatitem">
      <tr>
        <td class="subtext">
          <!-- No .subline — this is a job post, not a comment thread -->
        </td>
      </tr>
      <tr>
        <td class="title">
          <span class="titleline">
            <a href="${externalHref}">${title}</a>
          </span>
        </td>
      </tr>
    </table>
  `;
}

/** HN item page DOM for a regular story (has .subline) */
function makeStoryItemDOM(title: string): void {
  document.body.innerHTML = `
    <table class="fatitem">
      <tr>
        <td class="subtext">
          <span class="subline">456 points | 123 comments</span>
        </td>
      </tr>
      <tr>
        <td class="title">
          <span class="titleline"><a href="https://example.com">${title}</a></span>
        </td>
      </tr>
    </table>
  `;
}

/** HN /jobs list page DOM */
function makeJobsListDOM(jobs: Array<{ title: string; href: string }>): void {
  const rows = jobs
    .map(
      ({ title, href }) => `
    <tr class="athing submission">
      <td class="title">
        <span class="titleline"><a href="${href}">${title}</a></span>
      </td>
    </tr>
  `,
    )
    .join("");
  document.body.innerHTML = `<table>${rows}</table>`;
}

describe("hackerNewsAdapter", () => {
  describe("hosts", () => {
    it("includes news.ycombinator.com", () => {
      expect(hackerNewsAdapter.hosts).toContain("news.ycombinator.com");
    });
  });

  describe("source", () => {
    it("is HackerNews Jobs", () => {
      expect(hackerNewsAdapter.source).toBe("HackerNews Jobs");
    });
  });

  describe("extract()", () => {
    it("returns null on /jobs list page", () => {
      setLocation("/jobs");
      makeJobsListDOM([
        { title: "Acme (YC W24) Is Hiring an Engineer", href: "https://acme.com/jobs" },
      ]);
      expect(hackerNewsAdapter.extract()).toBeNull();
    });

    it("returns null on non-item paths", () => {
      setLocation("/newest");
      document.body.innerHTML = `<div>news feed</div>`;
      expect(hackerNewsAdapter.extract()).toBeNull();
    });

    it("returns null for regular story items (has .subline)", () => {
      setLocation("/item", "?id=12345");
      makeStoryItemDOM("Some HN Story");
      expect(hackerNewsAdapter.extract()).toBeNull();
    });

    it("extracts job from 'Is Hiring' format title", () => {
      setLocation("/item", "?id=42");
      makeJobItemDOM("Acme Corp (YC W24) Is Hiring a Senior Engineer");
      const data = hackerNewsAdapter.extract();
      expect(data?.company).toBe("Acme Corp");
      expect(data?.position).toBe("Senior Engineer");
    });

    it("extracts job from colon format title", () => {
      setLocation("/item", "?id=43");
      makeJobItemDOM("Widgets Inc (YC S23): Backend Engineer – Remote");
      const data = hackerNewsAdapter.extract();
      expect(data?.company).toBe("Widgets Inc");
      expect(data?.position).toBe("Backend Engineer");
    });

    it("extracts job without YC batch", () => {
      setLocation("/item", "?id=44");
      makeJobItemDOM("Startup Co Is Hiring a Product Manager in SF");
      const data = hackerNewsAdapter.extract();
      expect(data?.company).toBe("Startup Co");
      expect(data?.position).toBe("Product Manager");
    });

    it("returns null when subtext is missing", () => {
      setLocation("/item", "?id=45");
      document.body.innerHTML = `
        <table class="fatitem">
          <tr><td class="title"><span class="titleline"><a href="#">Some Job</a></span></td></tr>
        </table>
      `;
      expect(hackerNewsAdapter.extract()).toBeNull();
    });
  });

  describe("watchForIntent() — /item page", () => {
    it("fires onIntent on page load for job item pages", async () => {
      setLocation("/item", "?id=42");
      makeJobItemDOM("Forge (YC W21) Is Hiring a Software Engineer");

      const received = await new Promise<JobData>((resolve) => {
        const cleanup = hackerNewsAdapter.watchForIntent?.(resolve);
        return cleanup;
      });

      expect(received.company).toBe("Forge");
      expect(received.position).toBe("Software Engineer");
    });

    it("does not fire for story items", () => {
      setLocation("/item", "?id=99");
      makeStoryItemDOM("A Regular HN Post");
      const callback = vi.fn();
      const cleanup = hackerNewsAdapter.watchForIntent?.(callback);
      expect(() => cleanup?.()).not.toThrow();
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("watchForIntent() — /jobs list page", () => {
    it("fires onIntent when a listing link (external) is clicked", async () => {
      setLocation("/jobs");
      makeJobsListDOM([
        {
          title: "Acme (YC W24) Is Hiring an Engineer",
          href: "https://acme.com/apply",
        },
      ]);

      const received = await new Promise<JobData>((resolve) => {
        hackerNewsAdapter.watchForIntent?.(resolve);
        // biome-ignore lint/style/noNonNullAssertion: element is guaranteed by the HTML set up above
        const link = document.querySelector<HTMLAnchorElement>(
          "tr.athing.submission .titleline > a",
        )!;
        link.dispatchEvent(new MouseEvent("click", { bubbles: false, cancelable: true }));
      });

      expect(received.company).toBe("Acme");
    });

    it("does not fire for self-post links (item?id=...)", () => {
      setLocation("/jobs");
      makeJobsListDOM([
        {
          title: "Pave (YC W21) Is Hiring a PM",
          href: "https://news.ycombinator.com/item?id=999",
        },
      ]);
      const callback = vi.fn();
      hackerNewsAdapter.watchForIntent?.(callback);

      // biome-ignore lint/style/noNonNullAssertion: element is guaranteed by the HTML set up above
      const link = document.querySelector<HTMLAnchorElement>(
        "tr.athing.submission .titleline > a",
      )!;
      link.dispatchEvent(new MouseEvent("click", { bubbles: false, cancelable: true }));

      expect(callback).not.toHaveBeenCalled();
    });

    it("does not fire when no listing links found", () => {
      setLocation("/jobs");
      document.body.innerHTML = `<div>no job listings</div>`;
      const callback = vi.fn();
      const cleanup = hackerNewsAdapter.watchForIntent?.(callback);
      expect(() => cleanup?.()).not.toThrow();
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("extract() — fixture-based regression test", () => {
    it("extracts valid data from real captured HTML", () => {
      const fixturePath = path.join(__dirname, "fixtures/hackernews.html");

      // Skip if fixture doesn't exist yet
      if (!fs.existsSync(fixturePath)) {
        console.warn("⚠️  Skipping fixture test: fixtures/hackernews.html not found");
        console.warn("   Run: npm run capture-fixtures hackernews");
        return;
      }

      const fixtureHTML = fs.readFileSync(fixturePath, "utf-8");
      Object.defineProperty(window, "location", {
        value: {
          ...window.location,
          pathname: "/item",
          href: "https://news.ycombinator.com/item?id=40123456",
        },
        writable: true,
        configurable: true,
      });
      document.documentElement.innerHTML = fixtureHTML;

      const data = hackerNewsAdapter.extract();

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
