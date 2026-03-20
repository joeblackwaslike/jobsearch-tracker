import { log } from "../debug";
import type { Adapter, JobData } from "./types";

export const googleJobsAdapter: Adapter = {
  hosts: ["www.google.com"],
  source: "Google Jobs",

  extract(): JobData | null {
    // Only active in Google Jobs mode (udm=8 or jobs panel present)
    const url = new URL(location.href);
    const isJobsMode = url.searchParams.get("udm") === "8";
    const jobsPanel = document.querySelector(
      "[class*='jobDetails'], .gws-plugins-horizon-jobs__tl-lif",
    );

    log(
      "google-jobs",
      "extract(): isJobsMode =",
      isJobsMode,
      "| jobsPanel =",
      jobsPanel ? "found" : "null",
    );

    if (!isJobsMode && !jobsPanel) {
      log("google-jobs", "extract() → null: not in Jobs mode (udm≠8 and no jobs panel)");
      return null;
    }

    const titleEl =
      document.querySelector<HTMLElement>(".gws-plugins-horizon-jobs__tl-lif h2") ??
      document.querySelector<HTMLElement>("[data-ved] h2");
    const companyEl = document.querySelector<HTMLElement>(
      ".gws-plugins-horizon-jobs__tl-lif [class*='company']",
    );

    log(
      "google-jobs",
      "extract(): titleEl =",
      titleEl?.textContent?.trim() ?? "(null)",
      "| companyEl =",
      companyEl?.textContent?.trim() ?? "(null)",
    );

    if (!titleEl) {
      log("google-jobs", "extract() → null: no h2 in jobs panel found");
      return null;
    }
    const position = titleEl.textContent?.trim() ?? "";
    const company = companyEl?.textContent?.trim() ?? "";
    if (!position) {
      log("google-jobs", "extract() → null: titleEl found but textContent empty");
      return null;
    }
    log("google-jobs", "extract() →", position, "@", company || "(company not found)");
    return { position, company, url: location.href };
  },

  /**
   * #25 — Intent tracking for Google Jobs.
   * Google Jobs is a pure aggregator — clicking Apply opens the external ATS in a new tab.
   * We attach a click listener to the Apply button in the job detail panel.
   * Intent is triggered on click (not page load) because users browse many jobs in the
   * jobs panel without navigating away — click is the meaningful signal.
   */
  watchForIntent(onIntent: (jobData: JobData) => void): () => void {
    // Google Jobs panel may not be loaded immediately — wait for the panel
    let cleanup = () => {};

    const tryAttach = () => {
      const jobData = googleJobsAdapter.extract();
      if (!jobData) return false;

      // Find the Apply button — Google renders it as an <a> or button with "Apply" text
      const panel =
        document.querySelector(".gws-plugins-horizon-jobs__tl-lif") ??
        document.querySelector("[class*='jobDetails']");
      if (!panel) return false;

      const applyBtn = Array.from(panel.querySelectorAll<HTMLElement>("a[href], button")).find(
        (el) =>
          el.textContent?.toLowerCase().includes("apply") &&
          !el.textContent?.toLowerCase().includes("easy"),
      );

      if (!applyBtn) return false;

      let fired = false;
      const handleClick = () => {
        if (fired) return;
        fired = true;
        const currentData = googleJobsAdapter.extract() ?? jobData;
        log(
          "google-jobs",
          "watchForIntent: apply button clicked →",
          currentData.position,
          "@",
          currentData.company,
        );
        onIntent(currentData);
      };

      applyBtn.addEventListener("click", handleClick);
      log(
        "google-jobs",
        "watchForIntent: attached to apply button →",
        jobData.position,
        "@",
        jobData.company,
      );
      cleanup = () => applyBtn.removeEventListener("click", handleClick);
      return true;
    };

    if (tryAttach()) return () => cleanup();

    // Panel may still be loading — retry with MutationObserver
    const observer = new MutationObserver(() => {
      if (tryAttach()) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      cleanup();
    };
  },
};
