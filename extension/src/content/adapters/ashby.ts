import type { Adapter, JobData } from "./types";

export const ashbyAdapter: Adapter = {
  hosts: ["jobs.ashbyhq.com"],

  extract(): JobData | null {
    // Ashby: ashbyhq.com/[company]/[job-id]
    const titleEl =
      document.querySelector<HTMLElement>(
        "h1[class*='ashby-job-posting-heading']",
      ) ?? document.querySelector<HTMLElement>("h1");

    const companyFromUrl = location.pathname.split("/")[1]?.replace(/-/g, " ");

    if (!titleEl || !companyFromUrl) return null;

    const position = titleEl.textContent?.trim() ?? "";
    if (!position) return null;

    const company = companyFromUrl.replace(/\b\w/g, (c) => c.toUpperCase());
    return { position, company, url: location.href };
  },

  getInjectTarget(): Element | null {
    return (
      document.querySelector("._applyButton_") ??
      document.querySelector('[class*="applyButton"]') ??
      document.querySelector('[class*="apply-button"]')
    );
  },
};
