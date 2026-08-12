import { log } from "../debug";
import type { Adapter, JobData } from "./types";

export const githubAdapter: Adapter = {
  hosts: ["github.com"],
  source: "GitHub",

  extract(): JobData | null {
    // Only active on github.com/*/jobs/* paths (company org job listings)
    if (!location.pathname.includes("/jobs/")) {
      log("github", "extract() → null: not a /jobs/ path:", location.pathname);
      return null;
    }
    const titleEl =
      document.querySelector<HTMLElement>("h1.lh-condensed") ??
      document.querySelector<HTMLElement>(".job-listing-header h1");
    const companyEl =
      document.querySelector<HTMLElement>(".mr-3 a") ??
      document.querySelector<HTMLElement>("[class*='org-name']");
    const companyFromPath = location.pathname.split("/")[1] ?? "";

    log(
      "github",
      "extract(): titleEl =",
      titleEl?.textContent?.trim() ?? "(null)",
      "| companyEl =",
      companyEl?.textContent?.trim() ?? "(null)",
      "| companyFromPath =",
      companyFromPath || "(empty)",
    );

    if (!titleEl) {
      log("github", "extract() → null: no h1.lh-condensed / .job-listing-header h1 found");
      return null;
    }
    const position = titleEl.textContent?.trim() ?? "";
    const company = companyEl?.textContent?.trim() ?? companyFromPath;
    if (!position || !company) {
      log(
        "github",
        "extract() → null: empty position or company | position:",
        JSON.stringify(position),
        "company:",
        JSON.stringify(company),
      );
      return null;
    }
    log("github", "extract() →", position, "@", company);
    return { position, company, url: location.href };
  },

  /**
   * #24 — Intent tracking for GitHub org job listings (github.com/{org}/jobs/{id}).
   * These pages typically redirect to an external ATS. We record intent on page load.
   */
  watchForIntent(onIntent: (jobData: JobData) => void): () => void {
    const jobData = githubAdapter.extract();
    if (!jobData) {
      log("github", "watchForIntent: extract() → null — no-op");
      return () => {};
    }
    log("github", "watchForIntent: recording intent →", jobData.position, "@", jobData.company);
    onIntent(jobData);
    return () => {};
  },
};
