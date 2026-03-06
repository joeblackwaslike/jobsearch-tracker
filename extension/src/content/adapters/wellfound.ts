import type { Adapter, JobData } from "./types";

export const wellfoundAdapter: Adapter = {
  hosts: ["wellfound.com", "www.wellfound.com"],

  extract(): JobData | null {
    const titleEl =
      document.querySelector<HTMLElement>("h1[class*='title']") ??
      document.querySelector<HTMLElement>("h1");
    const companyEl =
      document.querySelector<HTMLElement>("a[class*='startup']") ??
      document.querySelector<HTMLElement>("[class*='companyName']");
    if (!titleEl || !companyEl) return null;
    const position = titleEl.textContent?.trim() ?? "";
    const company = companyEl.textContent?.trim() ?? "";
    if (!position || !company) return null;
    return { position, company, url: location.href };
  },

  getInjectTarget(): Element | null {
    return (
      document.querySelector("a[class*='applyButton']") ??
      document.querySelector("[class*='apply']")
    );
  },
};
