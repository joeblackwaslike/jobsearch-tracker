import { log } from "../debug";
import type { Adapter, JobData } from "./types";

export const workAtAStartupAdapter: Adapter = {
  hosts: ["www.workatastartup.com"],
  source: "Work at a Startup",

  extract(): JobData | null {
    // Only on job detail pages: /jobs/{numericId}
    if (!location.pathname.startsWith("/jobs/") || location.pathname === "/jobs/") {
      log("workatastartup", "extract() → null: not a /jobs/{id} path:", location.pathname);
      return null;
    }

    // Title: .job-name (confirmed correct in browser research)
    const titleEl = document.querySelector<HTMLElement>(".job-name");

    // Company: .company-name text is "{title} at {company} (W24)" — needs parsing.
    // The page title format "{title} at {company} | Y Combinator's Work at a Startup" is cleaner.
    let company = "";

    // Method 1: page title parse
    const titleMatch = document.title.match(/\bat\s+(.+?)\s*\|\s*Y Combinator/i);
    if (titleMatch) {
      company = titleMatch[1].replace(/\s*\([A-Z]\d+\)$/, "").trim();
    }

    // Method 2: parse .company-name text "Software Engineer at Forge (W24)"
    if (!company) {
      const companyNameEl = document.querySelector<HTMLElement>(".company-name");
      const companyText = companyNameEl?.textContent?.trim() ?? "";
      const atMatch = companyText.match(/\bat\s+(.+?)(?:\s*\([A-Z]\d+\))?\s*$/i);
      if (atMatch) company = atMatch[1].trim();
    }

    log(
      "workatastartup",
      "extract(): titleEl =",
      titleEl?.textContent?.trim() ?? "(null)",
      "| company =",
      company || "(null)",
    );

    if (!titleEl) {
      log("workatastartup", "extract() → null: no .job-name element found");
      return null;
    }
    if (!company) {
      log(
        "workatastartup",
        "extract() → null: could not determine company from title or .company-name",
      );
      return null;
    }

    const position = titleEl.textContent?.trim() ?? "";
    if (!position) {
      log("workatastartup", "extract() → null: .job-name found but textContent empty");
      return null;
    }

    log("workatastartup", "extract() →", position, "@", company);
    return { position, company, url: location.href };
  },

  /**
   * #27 — Intent tracking for Work at a Startup jobs.
   * Apply requires YC account login and the post-auth flow is unclear — the apply button
   * redirects to account.ycombinator.com/authenticate. We record intent on page load as a
   * conservative signal for when the user eventually applies via the YC platform or external ATS.
   *
   * TODO: Once post-auth flow is confirmed (watchForSubmission candidate), replace with submit tracking.
   */
  watchForIntent(onIntent: (jobData: JobData) => void): () => void {
    const jobData = workAtAStartupAdapter.extract();
    if (!jobData) {
      log("workatastartup", "watchForIntent: extract() → null — no-op");
      return () => {};
    }
    log(
      "workatastartup",
      "watchForIntent: recording intent →",
      jobData.position,
      "@",
      jobData.company,
    );
    onIntent(jobData);
    return () => {};
  },
};
