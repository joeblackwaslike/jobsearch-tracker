import type { Adapter, JobData } from "./types";

export const diceAdapter: Adapter = {
  hosts: ["www.dice.com", "dice.com"],

  extract(): JobData | null {
    const titleEl =
      document.querySelector<HTMLElement>("h1[data-cy='jobTitle']") ??
      document.querySelector<HTMLElement>(".job-header h1");
    const companyEl =
      document.querySelector<HTMLElement>("a[data-cy='companyNameLink']") ??
      document.querySelector<HTMLElement>("[class*='company-name']");
    if (!titleEl || !companyEl) return null;
    const position = titleEl.textContent?.trim() ?? "";
    const company = companyEl.textContent?.trim() ?? "";
    if (!position || !company) return null;
    return { position, company, url: location.href };
  },

  getInjectTarget(): Element | null {
    return (
      document.querySelector("[data-cy='applyButton']") ??
      document.querySelector(".apply-button-container")
    );
  },
};
