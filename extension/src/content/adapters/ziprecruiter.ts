import type { Adapter, JobData } from "./types";

export const ziprecruiterAdapter: Adapter = {
  hosts: ["www.ziprecruiter.com", "ziprecruiter.com"],

  extract(): JobData | null {
    const titleEl =
      document.querySelector<HTMLElement>("[class*='job_title']") ??
      document.querySelector<HTMLElement>("h1");
    const companyEl =
      document.querySelector<HTMLElement>("[class*='hiring_company_text']") ??
      document.querySelector<HTMLElement>("[class*='company_name']");
    if (!titleEl || !companyEl) return null;
    const position = titleEl.textContent?.trim() ?? "";
    const company = companyEl.textContent?.trim() ?? "";
    if (!position || !company) return null;
    return { position, company, url: location.href };
  },

  getInjectTarget(): Element | null {
    return (
      document.querySelector("[class*='apply_button']") ??
      document.querySelector("a[data-testid='apply-button']")
    );
  },
};
