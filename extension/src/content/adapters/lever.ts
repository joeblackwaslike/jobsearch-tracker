import { log } from "../debug";
import type { Adapter, JobData } from "./types";

const SESSION_KEY = "jst_lever_job";

export const leverAdapter: Adapter = {
  hosts: ["jobs.lever.co"],

  extract(): JobData | null {
    const titleEl =
      document.querySelector<HTMLElement>(".posting-headline h2") ??
      document.querySelector<HTMLElement>("h2.posting-title");

    // Lever URL format: jobs.lever.co/[company]/[job-id][/apply[/confirmation]]
    // Company is always the first path segment
    const companyFromUrl = location.pathname.split("/")[1]?.replace(/-/g, " ");

    log(
      "lever",
      "extract(): titleEl =",
      titleEl?.textContent?.trim() ?? "(null)",
      "| companyFromUrl =",
      companyFromUrl ?? "(null)",
    );

    if (!companyFromUrl) {
      log("lever", "extract() → null: could not derive company from pathname:", location.pathname);
      return null;
    }

    const company = companyFromUrl.replace(/\b\w/g, (c) => c.toUpperCase());

    if (!titleEl) {
      // On the confirmation page the job headline may not be present; return company-only null
      log("lever", "extract() → null: no .posting-headline h2 or h2.posting-title found");
      return null;
    }

    const position = titleEl.textContent?.trim() ?? "";
    if (!position) {
      log("lever", "extract() → null: titleEl found but textContent empty");
      return null;
    }

    log("lever", "extract() →", position, "@", company);
    return { position, company, url: location.href };
  },

  /**
   * #19 — Auto-track Lever applications.
   *
   * Lever's apply flow is a separate page at `/{company}/{jobId}/apply`.
   * On successful submission the browser navigates to `/{company}/{jobId}/apply/confirmation`.
   *
   * Strategy:
   * 1. On the /apply page: cache job data in sessionStorage before navigation.
   * 2. On the /apply/confirmation page: retrieve cached data and fire onSubmit.
   */
  watchForSubmission(onSubmit: (jobData: JobData) => void): () => void {
    const path = location.pathname;

    // --- Confirmation page: fire onSubmit ---
    if (/\/apply\/confirmation/.test(path)) {
      log("lever", "watchForSubmission: on confirmation page");
      let jobData = leverAdapter.extract();

      if (!jobData) {
        // The confirmation page may not have the .posting-headline h2; fall back to cache
        try {
          const stored = sessionStorage.getItem(SESSION_KEY);
          if (stored) jobData = JSON.parse(stored) as JobData;
        } catch {
          // ignore
        }
      }

      if (jobData) {
        try {
          sessionStorage.removeItem(SESSION_KEY);
        } catch {
          // ignore
        }
        log(
          "lever",
          "watchForSubmission: firing onSubmit →",
          jobData.position,
          "@",
          jobData.company,
        );
        onSubmit(jobData);
      } else {
        log("lever", "watchForSubmission: confirmation page but no job data found");
      }

      return () => {};
    }

    // --- Apply page: cache job data so it survives navigation to /confirmation ---
    if (/\/apply/.test(path)) {
      const jobData = leverAdapter.extract();
      if (jobData) {
        try {
          sessionStorage.setItem(SESSION_KEY, JSON.stringify(jobData));
          log(
            "lever",
            "watchForSubmission: cached job data on /apply page →",
            jobData.position,
            "@",
            jobData.company,
          );
        } catch {
          // ignore storage errors
        }
      } else {
        log("lever", "watchForSubmission: on /apply page but extract() → null");
      }
      return () => {};
    }

    // Not on an apply-related page
    log("lever", "watchForSubmission: not on /apply or /confirmation — no-op");
    return () => {};
  },
};
