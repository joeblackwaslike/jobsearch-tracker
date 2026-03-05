import type { Adapter, JobData } from "./types";

export const leverAdapter: Adapter = {
  hosts: ["jobs.lever.co"],

  extract(): JobData | null {
    const titleEl =
      document.querySelector<HTMLElement>(".posting-headline h2") ??
      document.querySelector<HTMLElement>("h2.posting-title");

    // Lever URL format: jobs.lever.co/[company]/[job-id]
    // Extract company from URL path as it's more reliable than the DOM
    const companyFromUrl = location.pathname.split("/")[1]?.replace(/-/g, " ");

    if (!titleEl || !companyFromUrl) return null;

    const position = titleEl.textContent?.trim() ?? "";
    if (!position) return null;

    // Capitalise each word of the company slug
    const company = companyFromUrl.replace(/\b\w/g, (c) => c.toUpperCase());
    return { position, company, url: location.href };
  },

  getInjectTarget(): Element | null {
    return (
      document.querySelector(".postings-btn-wrapper") ??
      document.querySelector(".posting-apply") ??
      document.querySelector(".template-btn-submit")
    );
  },
};
