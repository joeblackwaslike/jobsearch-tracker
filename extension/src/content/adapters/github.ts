import type { Adapter, JobData } from "./types";

export const githubAdapter: Adapter = {
  hosts: ["github.com"],

  extract(): JobData | null {
    // Only active on github.com/*/jobs/* paths
    if (!location.pathname.includes("/jobs/")) return null;
    const titleEl =
      document.querySelector<HTMLElement>("h1.lh-condensed") ??
      document.querySelector<HTMLElement>(".job-listing-header h1");
    const companyEl =
      document.querySelector<HTMLElement>(".mr-3 a") ??
      document.querySelector<HTMLElement>("[class*='org-name']");
    if (!titleEl) return null;
    const position = titleEl.textContent?.trim() ?? "";
    const company = companyEl?.textContent?.trim() ?? location.pathname.split("/")[1] ?? "";
    if (!position || !company) return null;
    return { position, company, url: location.href };
  },

  getInjectTarget(): Element | null {
    return (
      document.querySelector(".apply-area") ??
      document.querySelector("[class*='apply']")
    );
  },
};
