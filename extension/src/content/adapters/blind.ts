import { log } from "../debug";
import type { Adapter, JobData } from "./types";

export const blindAdapter: Adapter = {
  hosts: ["www.teamblind.com"],
  source: "TeamBlind",

  extract(): JobData | null {
    // Only on job detail pages: /jobs/{numericId}
    if (!location.pathname.startsWith("/jobs/") || location.pathname === "/jobs/") {
      log("teamblind", "extract() → null: not a /jobs/{id} path:", location.pathname);
      return null;
    }

    // Title: bare h1 (confirmed class "text-lg/5 font-bold" but tag alone is sufficient)
    const titleEl = document.querySelector<HTMLElement>("h1");

    // Company: a[href*="/company/"] with non-empty text (first match may wrap a logo — skip it)
    const companyEl = Array.from(
      document.querySelectorAll<HTMLAnchorElement>("a[href*='/company/']"),
    ).find((a) => a.textContent?.trim());

    // Fallback: page title "{title} at {company} | Blind Job Board - Blind"
    let company = companyEl?.textContent?.trim() ?? "";
    if (!company) {
      const match = document.title.match(/\bat\s+(.+?)\s*\|/);
      company = match?.[1]?.trim() ?? "";
    }

    log(
      "teamblind",
      "extract(): titleEl =",
      titleEl?.textContent?.trim() ?? "(null)",
      "| company =",
      company || "(null)",
    );

    if (!titleEl || !company) {
      log(
        "teamblind",
        "extract() → null: titleEl",
        titleEl ? "ok" : "missing",
        "| company",
        company ? "ok" : "missing",
      );
      return null;
    }

    const position = titleEl.textContent?.trim() ?? "";
    if (!position) {
      log("teamblind", "extract() → null: titleEl found but textContent empty");
      return null;
    }

    log("teamblind", "extract() →", position, "@", company);
    return { position, company, url: location.href };
  },

  /**
   * #26 — Intent tracking for TeamBlind jobs.
   * TeamBlind is a pure aggregator — Apply redirects to the external ATS via a shortener.
   * We record intent on page load so it can be attributed when the user submits on the ATS.
   */
  watchForIntent(onIntent: (jobData: JobData) => void): () => void {
    const jobData = blindAdapter.extract();
    if (!jobData) {
      log("teamblind", "watchForIntent: extract() → null — no-op");
      return () => {};
    }
    log("teamblind", "watchForIntent: recording intent →", jobData.position, "@", jobData.company);
    onIntent(jobData);
    return () => {};
  },
};
