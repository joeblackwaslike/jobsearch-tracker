import { log } from "../debug";
import type { Adapter, JobData } from "./types";

/** Patterns that indicate the Workday apply wizard has reached a confirmation/success state. */
const CONFIRMATION_PATTERNS = [
  /\/confirmationCheckout\//i,
  /\/apply\/success\//i,
  /\/apply\/complete\//i,
  /\/apply\/submitted\//i,
];

/** DOM text patterns that indicate a successful submission on the Workday confirmation page. */
const SUCCESS_TEXT_RE =
  /thank you|you.{0,20}applied|application (was |has been )?received|successfully (submitted|applied)/i;

function isConfirmationUrl(): boolean {
  return CONFIRMATION_PATTERNS.some((re) => re.test(location.pathname));
}

function isSuccessDOM(): boolean {
  const h1Text =
    document.querySelector("h1, [data-automation-id='confirmationContainer']")?.textContent ?? "";
  return SUCCESS_TEXT_RE.test(h1Text);
}

export const workdayAdapter: Adapter = {
  hosts: [], // dynamically matched by findAdapter for *.myworkdayjobs.com

  extract(): JobData | null {
    const titleEl = document.querySelector<HTMLElement>('[data-automation-id="jobPostingHeader"]');
    // Workday company name is usually in the subdomain: acme.myworkdayjobs.com
    // Validate that hostname matches the expected pattern
    if (!location.hostname.includes(".myworkdayjobs.com")) {
      log(
        "workday",
        "extract() → null: hostname does not match *.myworkdayjobs.com pattern:",
        location.hostname,
      );
      return null;
    }
    const companyFromHost = location.hostname.split(".")[0]?.replace(/-/g, " ") ?? "";

    log(
      "workday",
      "extract(): titleEl =",
      titleEl?.textContent?.trim() ?? "(null)",
      "| companyFromHost =",
      companyFromHost || "(empty)",
    );

    if (!titleEl) {
      log("workday", 'extract() → null: no [data-automation-id="jobPostingHeader"] found');
      return null;
    }
    if (!companyFromHost) {
      log(
        "workday",
        "extract() → null: could not derive company from hostname:",
        location.hostname,
      );
      return null;
    }

    const position = titleEl.textContent?.trim() ?? "";
    if (!position) {
      log("workday", "extract() → null: jobPostingHeader found but textContent empty");
      return null;
    }

    const company = companyFromHost.replace(/\b\w/g, (c) => c.toUpperCase());
    log("workday", "extract() →", position, "@", company);
    return { position, company, url: location.href };
  },

  /**
   * #20 — Auto-track Workday applications.
   *
   * Workday's apply flow is an inline SPA wizard on the same subdomain. The URL path changes
   * at each wizard step. We detect completion by watching for:
   * 1. URL containing known confirmation path segments (e.g. /confirmationCheckout/)
   * 2. DOM h1 text matching success phrases (e.g. "Thank you for applying")
   *
   * A `fired` guard prevents duplicate callbacks across multiple MutationObserver invocations.
   */
  watchForSubmission(onSubmit: (jobData: JobData) => void): () => void {
    // Capture job data early — it's available throughout the wizard
    const jobData = workdayAdapter.extract();
    if (!jobData) {
      log("workday", "watchForSubmission: extract() → null — no-op");
      return () => {};
    }

    log(
      "workday",
      "watchForSubmission: watching for confirmation →",
      jobData.position,
      "@",
      jobData.company,
    );

    let fired = false;
    let observer: MutationObserver | null = null;

    const handleNavChange = () => {
      if (isConfirmationUrl() || isSuccessDOM()) fire("navigation event");
    };

    const fire = (trigger: string) => {
      if (fired) return;
      fired = true;
      observer?.disconnect();
      window.removeEventListener("popstate", handleNavChange);
      log("workday", trigger, "→ firing onSubmit");
      onSubmit(jobData);
    };

    // Check immediately in case we're already on the confirmation page
    if (isConfirmationUrl() || isSuccessDOM()) {
      fire("initial check");
      return () => {};
    }

    observer = new MutationObserver(() => {
      const h1Text = document.querySelector("h1")?.textContent?.trim() ?? "";
      if (h1Text) log("workday", "mutation — h1:", h1Text.slice(0, 80));
      if (isConfirmationUrl() || isSuccessDOM()) fire("DOM/URL mutation");
    });

    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("popstate", handleNavChange);

    return () => {
      observer?.disconnect();
      window.removeEventListener("popstate", handleNavChange);
    };
  },
};
