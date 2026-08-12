import { log } from "../debug";
import type { Adapter, JobData } from "./types";

/**
 * GitHub Careers (github.careers) — GitHub's own company career site.
 * Job detail pages are at github.careers (intermediate branded page); clicking a job
 * redirects to careers-githubinc.icims.com (iCIMS ATS).
 *
 * Company is always "GitHub". Title is extracted from the DOM.
 * We record intent when the user clicks a link to the iCIMS ATS.
 */
export const githubCareersAdapter: Adapter = {
  hosts: ["github.careers", "www.github.careers"],
  source: "GitHub Careers",

  extract(): JobData | null {
    // Try common heading selectors for job title
    const titleEl =
      document.querySelector<HTMLElement>("h1") ??
      document.querySelector<HTMLElement>("[class*='job-title']") ??
      document.querySelector<HTMLElement>("[class*='posting-title']");

    // Fallback: parse from page title "{Job Title} | GitHub"
    let position = titleEl?.textContent?.trim() ?? "";
    if (!position) {
      const parts = document.title.split("|");
      position = parts[0]?.trim() ?? "";
    }

    log("github-careers", "extract(): titleEl =", position || "(null)");

    if (!position) {
      log("github-careers", "extract() → null: no job title found");
      return null;
    }

    log("github-careers", "extract() →", position, "@ GitHub");
    return { position, company: "GitHub", url: location.href };
  },

  /**
   * #24 — Intent tracking for GitHub Careers.
   * Attaches a click listener to any link pointing to the iCIMS ATS (careers-githubinc.icims.com).
   * On click, records intent so it can be matched when an iCIMS adapter fires TRACK.
   */
  watchForIntent(onIntent: (jobData: JobData) => void): () => void {
    const jobData = githubCareersAdapter.extract();
    if (!jobData) {
      log("github-careers", "watchForIntent: extract() → null — no-op");
      return () => {};
    }

    let fired = false;
    const handleClick = (e: MouseEvent) => {
      if (fired) return;
      const anchor = (e.target as Element).closest<HTMLAnchorElement>("a[href]");
      if (!anchor) return;

      // Listen for clicks that navigate to the iCIMS-hosted application
      if (anchor.href.includes(".icims.com")) {
        fired = true;
        log("github-careers", "watchForIntent: iCIMS link clicked →", jobData.position, "@ GitHub");
        onIntent(jobData);
      }
    };

    document.addEventListener("click", handleClick, true);
    log(
      "github-careers",
      "watchForIntent: listening for iCIMS click →",
      jobData.position,
      "@ GitHub",
    );

    return () => document.removeEventListener("click", handleClick, true);
  },
};
