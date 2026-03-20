import { log } from "../debug";
import type { Adapter, JobData } from "./types";

export const wellfoundAdapter: Adapter = {
  hosts: ["wellfound.com", "www.wellfound.com"],
  source: "Wellfound",

  extract(): JobData | null {
    // Only run on job detail pages: /jobs/{id}-{slug} or ?job_listing_slug=...
    const isJobPage =
      location.pathname.startsWith("/jobs/") ||
      new URLSearchParams(location.search).has("job_listing_slug");

    if (!isJobPage) {
      log(
        "wellfound",
        "extract() → null: not a job detail page (pathname:",
        location.pathname,
        ")",
      );
      return null;
    }

    // Title: bare h1 (confirmed — no class on job detail pages)
    const titleEl = document.querySelector<HTMLElement>("h1");

    // Company: first a[href*="/company/"] with non-empty text (first match may wrap a logo img)
    const companyEl = Array.from(
      document.querySelectorAll<HTMLAnchorElement>("a[href*='/company/']"),
    ).find((a) => a.textContent?.trim());

    log(
      "wellfound",
      "extract(): titleEl =",
      titleEl?.textContent?.trim() ?? "(null)",
      "| companyEl =",
      companyEl?.textContent?.trim() ?? "(null)",
    );

    if (!titleEl || !companyEl) {
      log(
        "wellfound",
        "extract() → null: titleEl",
        titleEl ? "ok" : "missing",
        "| companyEl",
        companyEl ? "ok" : "missing",
      );
      return null;
    }

    const position = titleEl.textContent?.trim() ?? "";
    const company = companyEl.textContent?.trim() ?? "";

    if (!position || !company) {
      log("wellfound", "extract() → null: empty position or company after trim");
      return null;
    }

    log("wellfound", "extract() →", position, "@", company);
    return { position, company, url: location.href };
  },

  /**
   * #21 — Intent tracking for Wellfound job views.
   *
   * Wellfound hosts its own application flow (not an external ATS redirect), but users
   * sometimes find a job on Wellfound and then apply via the company's own careers page.
   * Recording intent on page load lets us attribute those eventual ATS submissions.
   *
   * If the user applies directly via Wellfound's own form, the intent will simply expire
   * unused (no ATS adapter fires TRACK). A future `watchForSubmission` implementation
   * should replace this once Wellfound's submit API endpoint is confirmed.
   */
  watchForIntent(onIntent: (jobData: JobData) => void): () => void {
    const jobData = wellfoundAdapter.extract();
    if (!jobData) {
      log("wellfound", "watchForIntent: extract() → null — no-op");
      return () => {};
    }

    log("wellfound", "watchForIntent: recording intent →", jobData.position, "@", jobData.company);
    onIntent(jobData);

    return () => {};
  },
};
