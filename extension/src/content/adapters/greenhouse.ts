import type { Adapter, JobData } from "./types";

export const greenhouseAdapter: Adapter = {
  hosts: ["boards.greenhouse.io", "job-boards.greenhouse.io"],

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
    const company =
      companyEl?.textContent?.trim() ||
      parseCompanyFromTitle(document.title);

    if (!position || !company) return null;
    return { position, company, url: location.href };
  },

  watchForSubmission(onSubmit: (jobData: JobData) => void): () => void {
    // Capture job data now, before the form submission changes the DOM
    const jobData = greenhouseAdapter.extract();

    const form = document.getElementById("application-form");
    if (!form || !jobData) return () => {};

    const parent = form.parentElement;
    if (!parent) return () => {};

    const observer = new MutationObserver(() => {
      // Form removed from DOM = successful submission / navigation
      if (!document.getElementById("application-form")) {
        observer.disconnect();
        onSubmit(jobData);
      }
    });

    observer.observe(parent, { childList: true });

    // Also catch React Router URL-based navigation (some Greenhouse setups redirect)
    const handleUrlChange = () => {
      if (!document.getElementById("application-form")) {
        observer.disconnect();
        onSubmit(jobData);
      }
    };
    window.addEventListener("popstate", handleUrlChange);

    return () => {
      observer.disconnect();
      window.removeEventListener("popstate", handleUrlChange);
    };
  },
};

function parseCompanyFromTitle(title: string): string {
  // Greenhouse titles are often "Position at Company - Greenhouse"
  const match = title.match(/at (.+?)(?:\s*[-|]\s*Greenhouse)?$/i);
  return match?.[1]?.trim() ?? "";
}
