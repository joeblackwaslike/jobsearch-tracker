import { log } from "../debug";
import type { Adapter, JobData } from "./types";

export const builtinAdapter: Adapter = {
  hosts: ["builtin.com", "www.builtin.com"],
  source: "Builtin",

  extract(): JobData | null {
    // Only on job detail pages: /job/{slug}/{id}
    if (!location.pathname.startsWith("/job/")) {
      log("builtin", "extract() → null: not a /job/ path:", location.pathname);
      return null;
    }

    // Title: bare h1 (confirmed via browser research — class fw-extrabold fs-xl mb-sm, but h1 tag is sufficient)
    const titleEl = document.querySelector<HTMLElement>("h1");

    // Company: JSON-LD hiringOrganization.name is most reliable
    let company = extractJsonLdCompany();

    // Fallback: page title "{title} - {company} | Built In"
    if (!company) {
      const titleParts = document.title.split(" - ");
      if (titleParts.length >= 2) {
        const tail = titleParts[titleParts.length - 1] ?? "";
        company = tail.split(" | ")[0]?.trim() ?? "";
      }
    }

    // Fallback 2: first a[href*="/company/"] with non-empty text (skip logo wrappers)
    if (!company) {
      company =
        Array.from(document.querySelectorAll<HTMLAnchorElement>("a[href*='/company/']"))
          .find((a) => a.textContent?.trim())
          ?.textContent?.trim() ?? "";
    }

    log(
      "builtin",
      "extract(): titleEl =",
      titleEl?.textContent?.trim() ?? "(null)",
      "| company =",
      company || "(null)",
    );

    if (!titleEl || !company) {
      log(
        "builtin",
        "extract() → null: titleEl",
        titleEl ? "ok" : "missing",
        "| company",
        company ? "ok" : "missing",
      );
      return null;
    }

    const position = titleEl.textContent?.trim() ?? "";
    if (!position) {
      log("builtin", "extract() → null: titleEl found but textContent empty");
      return null;
    }

    log("builtin", "extract() →", position, "@", company);
    return { position, company, url: location.href };
  },

  /**
   * #22 — Intent tracking for Builtin jobs.
   * Builtin is a pure aggregator — Apply opens the external ATS in a new tab.
   * We record intent on page load so it can be attributed when the user submits on the ATS.
   */
  watchForIntent(onIntent: (jobData: JobData) => void): () => void {
    const jobData = builtinAdapter.extract();
    if (!jobData) {
      log("builtin", "watchForIntent: extract() → null — no-op");
      return () => {};
    }
    log("builtin", "watchForIntent: recording intent →", jobData.position, "@", jobData.company);
    onIntent(jobData);
    return () => {};
  },
};

/** Extract company name from JSON-LD JobPosting schema. */
function extractJsonLdCompany(): string {
  for (const script of document.querySelectorAll<HTMLScriptElement>(
    'script[type="application/ld+json"]',
  )) {
    try {
      const data = JSON.parse(script.textContent ?? "") as Record<string, unknown>;
      const entries: unknown[] = Array.isArray(data["@graph"])
        ? (data["@graph"] as unknown[])
        : [data];
      for (const entry of entries) {
        const e = entry as Record<string, unknown>;
        if (e["@type"] === "JobPosting") {
          const org = e.hiringOrganization as Record<string, unknown> | undefined;
          if (typeof org?.name === "string" && org.name) return org.name as string;
        }
      }
    } catch {
      // ignore parse errors
    }
  }
  return "";
}
