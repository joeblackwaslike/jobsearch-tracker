import type { Adapter, JobData } from "./types";

export const workdayAdapter: Adapter = {
  hosts: [], // dynamically matched by findAdapter for *.myworkdayjobs.com

  extract(): JobData | null {
    const titleEl = document.querySelector<HTMLElement>(
      '[data-automation-id="jobPostingHeader"]',
    );
    // Workday company name is usually in the subdomain: acme.myworkdayjobs.com
    const companyFromHost = location.hostname.split(".")[0]?.replace(/-/g, " ") ?? "";
    if (!titleEl || !companyFromHost) return null;
    const position = titleEl.textContent?.trim() ?? "";
    if (!position) return null;
    const company = companyFromHost.replace(/\b\w/g, (c) => c.toUpperCase());
    return { position, company, url: location.href };
  },

  getInjectTarget(): Element | null {
    return document.querySelector('[data-automation-id="applyButton"]');
  },
};
