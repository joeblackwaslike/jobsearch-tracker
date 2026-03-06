import type { Adapter, JobData } from "./types";

export const blindAdapter: Adapter = {
  hosts: ["www.teamblind.com"],

  extract(): JobData | null {
    const titleEl =
      document.querySelector<HTMLElement>("h1[class*='title']") ??
      document.querySelector<HTMLElement>(".posting-header h1");
    const companyEl =
      document.querySelector<HTMLElement>("[class*='company-name']") ??
      document.querySelector<HTMLElement>(".company-info a");
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
