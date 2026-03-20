import type { Adapter, JobData } from "./types";

export const indeedAdapter: Adapter = {
  hosts: ["www.indeed.com", "indeed.com"],

  extract(): JobData | null {
    const titleEl =
      document.querySelector<HTMLElement>('[data-testid="jobsearch-JobInfoHeader-title"]') ??
      document.querySelector<HTMLElement>("h1.jobsearch-JobInfoHeader-title");

    const companyEl =
      document.querySelector<HTMLElement>('[data-testid="inlineHeader-companyName"]') ??
      document.querySelector<HTMLElement>('[data-testid="companyName"]');

    if (!titleEl || !companyEl) return null;

    const position = titleEl.textContent?.trim() ?? "";
    const company = companyEl.textContent?.trim() ?? "";
    if (!position || !company) return null;

    return { position, company, url: location.href };
  },

  getInjectTarget(): Element | null {
    return (
      document.querySelector(".jobsearch-IndeedApplyButton-contentWrapper") ??
      document.querySelector(".jobsearch-ApplyButtonContainer") ??
      document.querySelector('[data-testid="applyButton"]')
    );
  },
};
