import type { Adapter, JobData } from "./types";

export const welcomeToTheJungleAdapter: Adapter = {
  hosts: ["www.welcometothejungle.com"],

  extract(): JobData | null {
    const titleEl =
      document.querySelector<HTMLElement>("h1[class*='sc-']") ??
      document.querySelector<HTMLElement>("[data-testid='job-header-title']");
    const companyEl =
      document.querySelector<HTMLElement>("[data-testid='company-title']") ??
      document.querySelector<HTMLElement>("[class*='company'] h2");
    if (!titleEl || !companyEl) return null;
    const position = titleEl.textContent?.trim() ?? "";
    const company = companyEl.textContent?.trim() ?? "";
    if (!position || !company) return null;
    return { position, company, url: location.href };
  },

  getInjectTarget(): Element | null {
    return (
      document.querySelector("[data-testid='job-cta-button']") ??
      document.querySelector("[class*='applyButton']")
    );
  },
};
