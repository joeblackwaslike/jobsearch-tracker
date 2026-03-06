import type { Adapter, JobData } from "./types";

export const builtinAdapter: Adapter = {
  hosts: ["builtin.com", "www.builtin.com"],

  extract(): JobData | null {
    const titleEl =
      document.querySelector<HTMLElement>("h1[class*='job-title']") ??
      document.querySelector<HTMLElement>(".job-info h1");
    const companyEl =
      document.querySelector<HTMLElement>("a[class*='company']") ??
      document.querySelector<HTMLElement>("[class*='company-title']");
    if (!titleEl || !companyEl) return null;
    const position = titleEl.textContent?.trim() ?? "";
    const company = companyEl.textContent?.trim() ?? "";
    if (!position || !company) return null;
    return { position, company, url: location.href };
  },

  getInjectTarget(): Element | null {
    return (
      document.querySelector("[class*='apply-btn']") ??
      document.querySelector(".apply-button")
    );
  },
};
