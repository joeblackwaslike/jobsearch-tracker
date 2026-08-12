import { log } from "../debug";
import type { Adapter, JobData } from "./types";

/**
 * aijobs.net — AI/ML job aggregator.
 *
 * Limitation: the job detail page HTML does not include the company name (per research).
 * The company appears only in "Related Jobs" but is not reliably extractable.
 * We record intent with an empty company string and rely on the backend's fuzzy matching
 * when the ATS adapter fires TRACK.
 *
 * TODO: investigate the apply gateway API (`/job/{hashId}/apply/`) to get company from
 * authenticated response payload.
 */
export const aijobsAdapter: Adapter = {
  hosts: ["aijobs.net", "www.aijobs.net"],
  source: "aijobs.net",

  extract(): JobData | null {
    // Only on job detail pages: /job/{slug}/
    if (!location.pathname.startsWith("/job/")) {
      log("aijobs", "extract() → null: not a /job/ path:", location.pathname);
      return null;
    }

    // Title: h1 (confirmed in research)
    const titleEl = document.querySelector<HTMLElement>("h1");
    // Fallback: document.title format "{title} - aijobs.net" or "{title} - AI Jobs"
    const position = titleEl?.textContent?.trim() ?? document.title.split(" - ")[0]?.trim() ?? "";

    // Company: not available in page DOM — use empty string
    // (intent will rely on title+TTL matching at the ATS side)
    const company = "";

    log("aijobs", "extract(): position =", position || "(null)", "| company = (not available)");

    if (!position) {
      log("aijobs", "extract() → null: no job title found");
      return null;
    }

    log("aijobs", "extract() →", position, "@ (company unknown)");
    return { position, company, url: location.href };
  },

  /**
   * #31 — Intent tracking for aijobs.net.
   * Fires on Apply button click (links to /job/{hashId}/apply/) to minimize false positives.
   * Company is unknown from the DOM; the background will attempt TTL-based matching.
   */
  watchForIntent(onIntent: (jobData: JobData) => void): () => void {
    const jobData = aijobsAdapter.extract();
    if (!jobData) {
      log("aijobs", "watchForIntent: extract() → null — no-op");
      return () => {};
    }

    // Apply button: a.btn.btn-primary[href*="/apply/"]
    const applyBtn = document.querySelector<HTMLAnchorElement>('a[href*="/apply/"]');
    if (!applyBtn) {
      log("aijobs", "watchForIntent: no apply button found — recording intent on page load");
      onIntent(jobData);
      return () => {};
    }

    let fired = false;
    const handleClick = () => {
      if (fired) return;
      fired = true;
      log("aijobs", "watchForIntent: apply button clicked →", jobData.position);
      onIntent(jobData);
    };

    applyBtn.addEventListener("click", handleClick);
    log("aijobs", "watchForIntent: listening for apply click →", jobData.position);

    return () => applyBtn.removeEventListener("click", handleClick);
  },
};
