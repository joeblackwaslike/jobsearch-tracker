import type { Adapter, JobData } from "./types";

export const greenhouseAdapter: Adapter = {
  hosts: ["boards.greenhouse.io"],

  extract(): JobData | null {
    const titleEl =
      document.querySelector<HTMLElement>(".app-title") ??
      document.querySelector<HTMLElement>("h1.section-header") ??
      document.querySelector<HTMLElement>('[class*="app-title"]');

    const companyEl =
      document.querySelector<HTMLElement>(".company-name") ??
      document.querySelector<HTMLElement>(".board-header__company") ??
      document.querySelector<HTMLElement>('[class*="company-name"]');

    if (!titleEl) return null;

    const position = titleEl.textContent?.trim() ?? "";
    // Company name may not be on the page; fall back to page title parsing
    const company =
      companyEl?.textContent?.trim() ||
      parseCompanyFromTitle(document.title);

    if (!position || !company) return null;
    return { position, company, url: location.href };
  },

  getInjectTarget(): Element | null {
    return (
      document.querySelector("#header .btn--primary") ??
      document.querySelector(".application-footer") ??
      document.querySelector(".opening")
    );
  },
};

function parseCompanyFromTitle(title: string): string {
  // Greenhouse titles are often "Position at Company - Greenhouse"
  const match = title.match(/at (.+?)(?:\s*[-|]\s*Greenhouse)?$/i);
  return match?.[1]?.trim() ?? "";
}
