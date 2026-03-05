import type { Adapter, JobData } from "./types";

export const googleJobsAdapter: Adapter = {
  hosts: ["www.google.com"],

  extract(): JobData | null {
    // Only active in Google Jobs mode (udm=8 or jobs panel present)
    const url = new URL(location.href);
    const isJobsMode = url.searchParams.get("udm") === "8";
    const jobsPanel = document.querySelector(
      "[class*='jobDetails'], .gws-plugins-horizon-jobs__tl-lif",
    );
    if (!isJobsMode && !jobsPanel) return null;

    const titleEl =
      document.querySelector<HTMLElement>(
        ".gws-plugins-horizon-jobs__tl-lif h2",
      ) ?? document.querySelector<HTMLElement>("[data-ved] h2");
    const companyEl = document.querySelector<HTMLElement>(
      ".gws-plugins-horizon-jobs__tl-lif [class*='company']",
    );
    if (!titleEl) return null;
    const position = titleEl.textContent?.trim() ?? "";
    const company = companyEl?.textContent?.trim() ?? "";
    if (!position) return null;
    return { position, company, url: location.href };
  },

  getInjectTarget(): Element | null {
    return (
      document.querySelector(".gws-plugins-horizon-jobs__tl-lif") ??
      document.querySelector("[class*='jobDetails']")
    );
  },
};
