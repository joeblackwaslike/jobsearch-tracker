import { log } from "../debug";
import type { Adapter, JobData } from "./types";

/**
 * Greenhouse Hosted Career Sites — companies serving Greenhouse applications
 * on their own domain (e.g. careers.withwaymo.com, jobs.stripe.com).
 *
 * Detected via the `gh_jid` URL query param (not by hostname).
 * Submit goes to: {company-domain}/call_to_actions/{ctaId}/form_submissions
 */
export const greenhouseCareersAdapter: Adapter = {
  hosts: [], // No fixed hosts — matched via findAdapterByUrlParams() on gh_jid

  extract(): JobData | null {
    if (!new URLSearchParams(location.search).has("gh_jid")) return null;

    // document.title: "Job Title - Location1 - Location2..."
    const position = document.title.split(" - ")[0]?.trim() ?? "";
    if (!position) return null;

    const company = domainToCompany(location.hostname);
    if (!company) return null;

    return { position, company, url: location.href };
  },

  watchForSubmission(onSubmit: (jobData: JobData) => void): () => void {
    const jobData = greenhouseCareersAdapter.extract();
    if (!jobData) {
      log(
        "gh-careers",
        "extract() → null — no-op | hostname:",
        location.hostname,
        "gh_jid:",
        new URLSearchParams(location.search).get("gh_jid") ?? "(none)",
      );
      return () => {};
    }

    log(
      "gh-careers",
      "watching for thank-you signal:",
      jobData.position,
      "@",
      jobData.company,
      "| url:",
      jobData.url,
    );

    // After form submission, the page replaces the form with a thank-you message
    const observer = new MutationObserver(() => {
      const successEl =
        document.querySelector(
          '[class*="success"], [class*="thank-you"], [class*="confirmation"]',
        ) ??
        [...document.querySelectorAll("h1, h2, h3")].find((el) =>
          /thank you|application received|successfully submitted|we.ll be in touch/i.test(
            el.textContent ?? "",
          ),
        );

      if (successEl) {
        log(
          "gh-careers",
          "success signal found:",
          successEl.tagName,
          "|",
          successEl.textContent?.trim().slice(0, 80),
        );
        observer.disconnect();
        onSubmit(jobData);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  },
};

/** Convert a career site hostname to a company name.
 *  careers.withwaymo.com → Waymo
 *  jobs.stripe.com       → Stripe
 *  grammarly.com         → Grammarly
 */
function domainToCompany(hostname: string): string {
  return hostname
    .replace(/^(careers|jobs|work|apply|hiring)\./i, "")
    .split(".")[0]
    ?.replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
