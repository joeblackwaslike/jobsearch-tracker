import { log } from "../debug";
import type { Adapter, JobData } from "./types";

export const levelsAdapter: Adapter = {
  hosts: ["www.levels.fyi", "levels.fyi"],
  source: "Levels.fyi",

  extract(): JobData | null {
    // Levels.fyi job detail pages use a ?jobId= query param (NOT path segments).
    // URL patterns:
    //   levels.fyi/jobs?jobId={id}
    //   levels.fyi/jobs/company/{slug}/title/{slug}?jobId={id}
    const params = new URLSearchParams(location.search);
    const hasJobId = params.has("jobId");
    const isJobsPath = location.pathname.startsWith("/jobs");

    log(
      "levels",
      "extract(): pathname =",
      location.pathname,
      "| jobId param =",
      params.get("jobId") ?? "(none)",
    );

    if (!isJobsPath || !hasJobId) {
      log("levels", "extract() → null: not a job detail page (need /jobs path + ?jobId= param)");
      return null;
    }

    // Title: there are two h1 elements — the first is a page header (e.g. "Google Software Engineer Jobs"),
    // the second is the actual job title. Prefer the one inside [class*="jobTitleRow"].
    const titleEl =
      document.querySelector<HTMLElement>("[class*='jobTitleRow'] h1") ??
      Array.from(document.querySelectorAll<HTMLElement>("h1")).find(
        (h) => !h.textContent?.includes("Jobs"),
      ) ??
      document.querySelectorAll<HTMLElement>("h1")[1];

    // Company: CSS module class contains "companyName" as a stable substring
    const companyEl = document.querySelector<HTMLElement>("[class*='companyName']");

    // Fallback: company from URL path /jobs/company/{slug}/...
    let companyFromPath = "";
    const pathMatch = location.pathname.match(/\/jobs\/company\/([^/]+)/);
    if (pathMatch) {
      companyFromPath = pathMatch[1].replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    }

    const company = companyEl?.textContent?.trim() || companyFromPath;

    log(
      "levels",
      "extract(): titleEl =",
      titleEl?.textContent?.trim() ?? "(null)",
      "| company =",
      company || "(null)",
    );

    if (!titleEl || !company) {
      log(
        "levels",
        "extract() → null: titleEl",
        titleEl ? "ok" : "missing",
        "| company",
        company ? "ok" : "missing",
      );
      return null;
    }

    const position = titleEl.textContent?.trim() ?? "";
    if (!position) {
      log("levels", "extract() → null: titleEl found but textContent empty");
      return null;
    }

    log("levels", "extract() →", position, "@", company);
    return { position, company, url: location.href };
  },

  /**
   * #23 — Intent tracking for Levels.fyi jobs.
   * Levels.fyi is a pure aggregator — Apply opens the external ATS in a new tab.
   * We record intent on page load so it can be attributed when the user submits on the ATS.
   */
  watchForIntent(onIntent: (jobData: JobData) => void): () => void {
    const jobData = levelsAdapter.extract();
    if (!jobData) {
      log("levels", "watchForIntent: extract() → null — no-op");
      return () => {};
    }
    log("levels", "watchForIntent: recording intent →", jobData.position, "@", jobData.company);
    onIntent(jobData);
    return () => {};
  },
};
