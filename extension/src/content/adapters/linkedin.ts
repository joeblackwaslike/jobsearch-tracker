import { log } from "../debug";
import type { Adapter, JobData } from "./types";

export const linkedInAdapter: Adapter = {
  hosts: ["www.linkedin.com", "linkedin.com"],
  source: "LinkedIn",

  extract(): JobData | null {
    // SDUI pages (new LinkedIn client): document.title is "{position} | {company} | LinkedIn"
    const fromTitle = parseTitleFromDocument();
    if (fromTitle) {
      log("linkedin", "extract() via title parse:", fromTitle.position, "@", fromTitle.company);
      return { ...fromTitle, url: location.href };
    }

    // Legacy DOM selectors (pre-SDUI client)
    const titleEl =
      document.querySelector<HTMLElement>(".job-details-jobs-unified-top-card__job-title h1") ??
      document.querySelector<HTMLElement>("h1.job-details-jobs-unified-top-card__job-title") ??
      document.querySelector<HTMLElement>("h1.t-24.t-bold") ??
      document.querySelector<HTMLElement>(".jobs-unified-top-card__job-title");

    const companyEl =
      document.querySelector<HTMLElement>(".job-details-jobs-unified-top-card__company-name a") ??
      document.querySelector<HTMLElement>(".jobs-unified-top-card__company-name a") ??
      document.querySelector<HTMLElement>(".topcard__org-name-link");

    log(
      "linkedin",
      "extract() DOM fallback: titleEl =",
      titleEl?.textContent?.trim() ?? "(null)",
      "| companyEl =",
      companyEl?.textContent?.trim() ?? "(null)",
    );

    if (!titleEl || !companyEl) {
      log(
        "linkedin",
        "extract() → null: titleEl",
        titleEl ? "ok" : "missing",
        "| companyEl",
        companyEl ? "ok" : "missing",
      );
      return null;
    }

    const position = titleEl.textContent?.trim() ?? "";
    const company = companyEl.textContent?.trim() ?? "";
    if (!position || !company) {
      log("linkedin", "extract() → null: empty position or company after trim");
      return null;
    }

    log("linkedin", "extract() →", position, "@", company);
    return { position, company, url: location.href };
  },

  /**
   * #17 — Intent tracking for external-apply LinkedIn jobs.
   * Attaches a click listener to the external Apply button (which wraps the ATS URL in a
   * LinkedIn redirect). On click, fires onIntent so the background can store a PendingIntent
   * that will be matched when the user submits on the destination ATS.
   * Easy Apply jobs (no redirect href) are handled by watchForSubmission.
   */
  watchForIntent(onIntent: (jobData: JobData) => void): () => void {
    // External apply buttons use LinkedIn's redirect wrapper
    const applyAnchor = document.querySelector<HTMLAnchorElement>('a[href*="/redir/redirect/"]');

    if (!applyAnchor) {
      log("linkedin", "watchForIntent: no external apply link — likely Easy Apply, skipping");
      return () => {};
    }

    const handleClick = () => {
      const jobData = linkedInAdapter.extract();
      if (!jobData) return;
      log(
        "linkedin",
        "watchForIntent: external apply clicked →",
        jobData.position,
        "@",
        jobData.company,
      );
      onIntent(jobData);
    };

    applyAnchor.addEventListener("click", handleClick);
    log("linkedin", "watchForIntent: listening for click on external apply button");

    return () => applyAnchor.removeEventListener("click", handleClick);
  },

  /**
   * #18 — Auto-track Easy Apply submissions.
   * Intercepts window.fetch to detect the LinkedIn Easy Apply submit endpoint and fires
   * onSubmit when the response confirms the application was received (applied: true).
   */
  watchForSubmission(onSubmit: (jobData: JobData) => void): () => void {
    // Only useful on job detail pages
    const isJobPage =
      /\/jobs\/view\/\d+/.test(location.pathname) ||
      new URLSearchParams(location.search).has("currentJobId");
    if (!isJobPage) {
      log("linkedin", "watchForSubmission: not a job page — no-op");
      return () => {};
    }

    const origFetch = window.fetch;
    let fired = false;

    window.fetch = async function (input, init) {
      const result = await origFetch.call(this, input, init);
      if (fired) return result;

      const url = typeof input === "string" ? input : input instanceof Request ? input.url : "";

      if (
        !url.includes("voyagerJobsDashOnsiteApplyApplication") ||
        !url.includes("action=submitApplication")
      ) {
        return result;
      }

      result
        .clone()
        .json()
        .then((json: { included?: Record<string, unknown>[] }) => {
          if (fired) return;
          const detail = (json?.included ?? []).find(
            (item) =>
              item.$type === "com.linkedin.voyager.dash.jobs.JobSeekerApplicationDetail" &&
              item.applied === true,
          );
          if (detail) {
            fired = true;
            window.fetch = origFetch;
            const jobData = linkedInAdapter.extract();
            if (jobData) {
              log(
                "linkedin",
                "watchForSubmission: Easy Apply confirmed →",
                jobData.position,
                "@",
                jobData.company,
              );
              onSubmit(jobData);
            }
          }
        })
        .catch(() => {});

      return result;
    };

    return () => {
      window.fetch = origFetch;
    };
  },
};

/** Parse job data from document.title on LinkedIn SDUI pages.
 *  Format: "{position} | {company} | LinkedIn"
 *  Only valid on job detail pages (/jobs/view/{id}/ or search results with a selected job).
 */
function parseTitleFromDocument(): Pick<JobData, "position" | "company"> | null {
  const isJobPage =
    /\/jobs\/view\/\d+/.test(location.pathname) ||
    new URLSearchParams(location.search).has("currentJobId");
  if (!isJobPage) {
    log(
      "linkedin",
      "parseTitleFromDocument: not a job page (pathname:",
      location.pathname,
      "search:",
      location.search || "(none)",
      ")",
    );
    return null;
  }

  const parts = document.title.split(" | ");
  if (parts.length < 3 || parts[parts.length - 1].trim() !== "LinkedIn") {
    log("linkedin", "parseTitleFromDocument: title format mismatch:", document.title);
    return null;
  }

  const position = parts[0].trim();
  const company = parts[1].trim();
  if (!position || !company) return null;

  return { position, company };
}
