import { log } from "../debug";
import type { Adapter, JobData } from "./types";

export const welcomeToTheJungleAdapter: Adapter = {
  hosts: ["www.welcometothejungle.com", "welcometothejungle.com"],
  source: "Welcome to the Jungle",

  extract(): JobData | null {
    // Only on job detail pages: /{locale}/companies/{slug}/jobs/{job-slug}
    if (!/\/companies\/[^/]+\/jobs\//.test(location.pathname)) {
      log("wttj", "extract() → null: not a company job detail page:", location.pathname);
      return null;
    }

    // OG title format: "{Title}  – {Company} – {Contract Type} – {Location}"
    // (note: double space before dashes is present in the wild)
    const ogTitle = document
      .querySelector<HTMLMetaElement>('meta[property="og:title"]')
      ?.getAttribute("content");

    let position = "";
    let company = "";

    if (ogTitle) {
      const parts = ogTitle.split(/\s*–\s*/);
      position = parts[0]?.trim() ?? "";
      company = parts[1]?.trim() ?? "";
      log("wttj", "extract() via OG title:", position, "@", company);
    }

    // Fallback: DOM selectors
    if (!position) {
      const titleEl =
        document.querySelector<HTMLElement>("h1[class*='sc-']") ??
        document.querySelector<HTMLElement>("[data-testid='job-header-title']");
      position = titleEl?.textContent?.trim() ?? "";
    }
    if (!company) {
      // Company slug from URL: /companies/{slug}/jobs/...
      const slugMatch = location.pathname.match(/\/companies\/([^/]+)\/jobs\//);
      if (slugMatch) {
        company = slugMatch[1].replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      }
    }
    if (!company) {
      const companyEl =
        document.querySelector<HTMLElement>("[data-testid='company-title']") ??
        document.querySelector<HTMLElement>("[class*='company'] h2");
      company = companyEl?.textContent?.trim() ?? "";
    }

    log("wttj", "extract(): position =", position || "(null)", "| company =", company || "(null)");

    if (!position || !company) {
      log(
        "wttj",
        "extract() → null: position",
        position ? "ok" : "missing",
        "| company",
        company ? "ok" : "missing",
      );
      return null;
    }

    log("wttj", "extract() →", position, "@", company);
    return { position, company, url: location.href };
  },

  /**
   * #28 — Intent tracking for Welcome to the Jungle jobs.
   * WTTJ redirects to an external ATS when the user clicks Apply.
   * We use document-level click delegation to detect Apply button clicks, since the button
   * is rendered by React after page load (not in SSR HTML).
   *
   * Intent is triggered on Apply click (not page load) to avoid false positives from browsing.
   */
  watchForIntent(onIntent: (jobData: JobData) => void): () => void {
    const jobData = welcomeToTheJungleAdapter.extract();
    if (!jobData) {
      log("wttj", "watchForIntent: extract() → null — no-op");
      return () => {};
    }

    let fired = false;

    const handleClick = (e: MouseEvent) => {
      if (fired) return;
      const el = (e.target as Element).closest<HTMLElement>("a[href], button");
      if (!el) return;

      const text = el.textContent?.toLowerCase() ?? "";
      const href = el.getAttribute("href") ?? "";

      if (text.includes("apply") || href.includes("apply")) {
        fired = true;
        log(
          "wttj",
          "watchForIntent: apply button clicked →",
          jobData.position,
          "@",
          jobData.company,
        );
        onIntent(jobData);
      }
    };

    document.addEventListener("click", handleClick, true);
    log(
      "wttj",
      "watchForIntent: listening for apply click →",
      jobData.position,
      "@",
      jobData.company,
    );

    return () => document.removeEventListener("click", handleClick, true);
  },
};
