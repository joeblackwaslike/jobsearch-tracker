import { log } from "../debug";
import type { Adapter, JobData } from "./types";

/**
 * startup.jobs — startup job board.
 *
 * NOTE: startup.jobs was Cloudflare-blocked during research; selectors are best-effort.
 * Update selectors once browser research is completed.
 *
 * URL pattern: startup.jobs/{job-slug} (e.g. startup.jobs/senior-engineer-at-acme-123456)
 * Apply: redirects to external company ATS.
 */
export const startupJobsAdapter: Adapter = {
  hosts: ["startup.jobs", "www.startup.jobs"],
  source: "startup.jobs",

  extract(): JobData | null {
    // Heuristic: any path with more than one segment is a job detail page
    // (list page is typically /, /jobs, or /jobs/...)
    const parts = location.pathname.split("/").filter(Boolean);
    if (parts.length === 0) {
      log("startupjobs", "extract() → null: root path — not a job detail page");
      return null;
    }

    // Title: h1 (most common pattern)
    const titleEl =
      document.querySelector<HTMLElement>("h1") ??
      document.querySelector<HTMLElement>("[class*='job-title']");

    // Company: try common selectors, page title, og:title
    const companyEl =
      document.querySelector<HTMLElement>("[class*='company-name']") ??
      document.querySelector<HTMLElement>("[class*='company'] a") ??
      document.querySelector<HTMLElement>("a[href*='/company/']");

    // OG title fallback: "{title} at {company} | startup.jobs" or similar
    let company = companyEl?.textContent?.trim() ?? "";
    if (!company) {
      const ogTitle =
        document
          .querySelector<HTMLMetaElement>('meta[property="og:title"]')
          ?.getAttribute("content") ?? "";
      const atMatch = ogTitle.match(/\bat\s+(.+?)(?:\s*\|.*)?$/i);
      company = atMatch?.[1]?.trim() ?? "";
    }

    const position = titleEl?.textContent?.trim() ?? "";

    log(
      "startupjobs",
      "extract(): position =",
      position || "(null)",
      "| company =",
      company || "(null)",
    );

    if (!position || !company) {
      log(
        "startupjobs",
        "extract() → null: position",
        position ? "ok" : "missing",
        "| company",
        company ? "ok" : "missing",
      );
      return null;
    }

    log("startupjobs", "extract() →", position, "@", company);
    return { position, company, url: location.href };
  },

  /**
   * #31 — Intent tracking for startup.jobs.
   * Pure aggregator — records intent on page load when job data is available.
   */
  watchForIntent(onIntent: (jobData: JobData) => void): () => void {
    const jobData = startupJobsAdapter.extract();
    if (!jobData) {
      log("startupjobs", "watchForIntent: extract() → null — no-op");
      return () => {};
    }
    log(
      "startupjobs",
      "watchForIntent: recording intent →",
      jobData.position,
      "@",
      jobData.company,
    );
    onIntent(jobData);
    return () => {};
  },
};
