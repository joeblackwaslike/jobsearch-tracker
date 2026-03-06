import type { Adapter, JobData } from "./types";

export const linkedInAdapter: Adapter = {
  hosts: ["www.linkedin.com", "linkedin.com"],

  extract(): JobData | null {
    // Verify we're on a job detail page (not feed/search)
    const titleEl =
      document.querySelector<HTMLElement>(
        ".job-details-jobs-unified-top-card__job-title h1",
      ) ??
      document.querySelector<HTMLElement>(
        "h1.job-details-jobs-unified-top-card__job-title",
      ) ??
      document.querySelector<HTMLElement>("h1.t-24.t-bold") ??
      document.querySelector<HTMLElement>(".jobs-unified-top-card__job-title");

    const companyEl =
      document.querySelector<HTMLElement>(
        ".job-details-jobs-unified-top-card__company-name a",
      ) ??
      document.querySelector<HTMLElement>(".jobs-unified-top-card__company-name a") ??
      document.querySelector<HTMLElement>(".topcard__org-name-link");

    if (!titleEl || !companyEl) return null;

    const position = titleEl.textContent?.trim() ?? "";
    const company = companyEl.textContent?.trim() ?? "";
    if (!position || !company) return null;

    return { position, company, url: location.href };
  },

  getInjectTarget(): Element | null {
    return (
      document.querySelector(".jobs-apply-button--top-card") ??
      document.querySelector(".jobs-s-apply") ??
      document.querySelector(".jobs-unified-top-card__content--two-pane")
    );
  },
};
