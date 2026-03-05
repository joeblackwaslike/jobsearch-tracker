import type { Adapter, JobData } from "./types";

export const workAtAStartupAdapter: Adapter = {
  hosts: ["www.workatastartup.com"],

  extract(): JobData | null {
    const titleEl =
      document.querySelector<HTMLElement>("h1.company-name") ??
      document.querySelector<HTMLElement>(".listing-title h1") ??
      document.querySelector<HTMLElement>(".job-name");
    const companyEl =
      document.querySelector<HTMLElement>(".company-header h1") ??
      document.querySelector<HTMLElement>("[class*='startup-name']");
    if (!titleEl) return null;
    const position = titleEl.textContent?.trim() ?? "";
    const company = companyEl?.textContent?.trim() ?? "";
    if (!position || !company) return null;
    return { position, company, url: location.href };
  },

  getInjectTarget(): Element | null {
    return (
      document.querySelector(".apply-button") ??
      document.querySelector("a[href*='apply']")
    );
  },
};
