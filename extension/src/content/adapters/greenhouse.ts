import { log } from "../debug";
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

    log(
      "greenhouse",
      "extract(): titleEl =",
      titleEl?.textContent?.trim() ?? "(null)",
      "| companyEl =",
      companyEl?.textContent?.trim() ?? "(null)",
    );

    if (!titleEl) {
      log("greenhouse", "extract() → null: no .app-title / h1.section-header found");
      return null;
    }

    const position = titleEl.textContent?.trim() ?? "";
    const company = companyEl?.textContent?.trim() || parseCompanyFromTitle(document.title);

    if (!position) {
      log("greenhouse", "extract() → null: titleEl found but textContent empty");
      return null;
    }
    if (!company) {
      log(
        "greenhouse",
        "extract() → null: no companyEl and title parse failed, title =",
        document.title,
      );
      return null;
    }
    log("greenhouse", "extract() →", position, "@", company);
    return { position, company, url: location.href };
  },

  watchForSubmission(onSubmit: (jobData: JobData) => void): () => void {
    // Capture job data now, before the form submission changes the DOM
    const jobData = greenhouseAdapter.extract();
    if (!jobData) {
      log("greenhouse", "watchForSubmission: extract() → null — no-op");
      return () => {};
    }

    const form = document.getElementById("application-form");
    if (!form) {
      log("greenhouse", "watchForSubmission: no #application-form in DOM — no-op");
      return () => {};
    }

    const parent = form.parentElement;
    if (!parent) {
      log("greenhouse", "#application-form has no parentElement — no-op");
      return () => {};
    }

    log(
      "greenhouse",
      "watching #application-form removal for:",
      jobData.position,
      "@",
      jobData.company,
    );

    const fire = () => {
      if (!document.getElementById("application-form")) {
        log("greenhouse", "#application-form gone — firing onSubmit");
        observer.disconnect();
        window.removeEventListener("popstate", handleUrlChange);
        onSubmit(jobData);
      }
    };

    const observer = new MutationObserver(fire);
    observer.observe(parent, { childList: true });

    // Also catch React Router URL-based navigation (some Greenhouse setups redirect)
    const handleUrlChange = () => {
      log("greenhouse", "popstate — checking for form removal");
      fire();
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
