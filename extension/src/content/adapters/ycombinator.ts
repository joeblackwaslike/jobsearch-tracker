import { log } from "../debug";
import type { Adapter, JobData } from "./types";

/**
 * YCombinator company jobs (ycombinator.com/companies/{slug}/jobs/{id}).
 *
 * NOTE: The Apply button on YC company job pages links to apply.ycombinator.com/home —
 * this is the YC batch application for companies to join YC, NOT a job seeker application.
 * There is no direct ATS-style application form on ycombinator.com.
 *
 * We record intent on page load. Users who intend to apply will navigate to the company's
 * own careers page or workatastartup.com — the intent may be matched there.
 */
export const ycombinatorAdapter: Adapter = {
  hosts: ["www.ycombinator.com", "ycombinator.com"],
  source: "YCombinator",

  extract(): JobData | null {
    // Only on company job detail pages: /companies/{slug}/jobs/{jobId}
    if (!/^\/companies\/[^/]+\/jobs\/[^/]+/.test(location.pathname)) {
      log("yc", "extract() → null: not a company job detail page:", location.pathname);
      return null;
    }

    // Title: h1 (SSR — server-rendered, reliable)
    const titleEl = document.querySelector<HTMLElement>("h1");
    const position = titleEl?.textContent?.trim() ?? "";

    // Company: first h2 after h1 is the company name; or from URL slug
    const companyFromDom = document.querySelector<HTMLElement>("h2")?.textContent?.trim() ?? "";
    const slugMatch = location.pathname.match(/\/companies\/([^/]+)\/jobs\//);
    const companyFromSlug = slugMatch
      ? slugMatch[1].replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      : "";

    // Prefer DOM (more human-readable), fall back to slug
    const company = companyFromDom || companyFromSlug;

    log(
      "yc",
      "extract(): position =",
      position || "(null)",
      "| company =",
      company || "(null)",
      "(from",
      companyFromDom ? "DOM h2" : "URL slug",
      ")",
    );

    if (!position || !company) {
      log(
        "yc",
        "extract() → null: position",
        position ? "ok" : "missing",
        "| company",
        company ? "ok" : "missing",
      );
      return null;
    }

    log("yc", "extract() →", position, "@", company);
    return { position, company, url: location.href };
  },

  /**
   * #30 — Intent tracking for YCombinator company job pages.
   * Records intent on page load. The YC Apply button doesn't go to a company ATS,
   * so there's no outbound redirect to intercept — we record on page view instead.
   */
  watchForIntent(onIntent: (jobData: JobData) => void): () => void {
    const jobData = ycombinatorAdapter.extract();
    if (!jobData) {
      log("yc", "watchForIntent: extract() → null — no-op");
      return () => {};
    }
    log("yc", "watchForIntent: recording intent →", jobData.position, "@", jobData.company);
    onIntent(jobData);
    return () => {};
  },
};
