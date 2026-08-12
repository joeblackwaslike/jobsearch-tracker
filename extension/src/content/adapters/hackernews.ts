import { log } from "../debug";
import type { Adapter, JobData } from "./types";

/**
 * Parse company name and job title from a HN job post title.
 * Common formats:
 *   "{Company} (YC {batch}) Is Hiring {a/an} {Role}"
 *   "{Company} (YC {batch}): {Role} – {salary/location}"
 *   "{Company} Is Hiring {Role}"
 */
function parseHnTitle(fullTitle: string): { company: string; position: string } {
  // Extract company name (everything before YC batch, colon, or "Is Hiring")
  const companyMatch = fullTitle.match(
    /^([^(|:]+?)(?:\s*\(YC\s+[^)]+\))?(?:\s+Is Hiring|\s*:|\s*–)/i,
  );
  const company = companyMatch?.[1]?.trim() ?? "";

  // Extract role after "Is Hiring" or after colon
  const roleFromHiring = fullTitle.match(
    /Is Hiring\s+(?:a\s+|an\s+)?(.+?)(?:\s+(?:in\s|for\s|–|\().*)?$/i,
  );
  const roleFromColon = fullTitle.match(/:\s*(.+?)(?:\s+–.*)?$/);
  const position = roleFromHiring?.[1]?.trim() ?? roleFromColon?.[1]?.trim() ?? fullTitle;

  return { company, position };
}

export const hackerNewsAdapter: Adapter = {
  hosts: ["news.ycombinator.com"],
  source: "HackerNews Jobs",

  extract(): JobData | null {
    // Detect job list page (news.ycombinator.com/jobs)
    if (location.pathname === "/jobs") {
      // On the list page we don't extract a single job — return null (no single job to record)
      log("hn", "extract() → null: on jobs list page, not a single job");
      return null;
    }

    // Must be on an item page with a job type
    if (location.pathname !== "/item") {
      log("hn", "extract() → null: not /jobs or /item path:", location.pathname);
      return null;
    }

    // Detect job post (vs regular story) by absence of .subline in subtext
    const subtext = document.querySelector("table.fatitem .subtext");
    const hasSubline = !!document.querySelector("table.fatitem .subtext .subline");
    if (!subtext || hasSubline) {
      log("hn", "extract() → null: not a job post (has .subline or no subtext)");
      return null;
    }

    // Title link in the fatitem table
    const titleEl = document.querySelector<HTMLAnchorElement>("table.fatitem .titleline > a");
    const fullTitle =
      titleEl?.textContent?.trim() ?? document.title.replace(" | Hacker News", "").trim();

    if (!fullTitle) {
      log("hn", "extract() → null: no title text found");
      return null;
    }

    const { company, position } = parseHnTitle(fullTitle);

    log(
      "hn",
      "extract(): fullTitle =",
      fullTitle,
      "| company =",
      company || "(null)",
      "| position =",
      position || "(null)",
    );

    if (!company || !position) {
      log("hn", "extract() → null: could not parse company or position from title:", fullTitle);
      return null;
    }

    log("hn", "extract() →", position, "@", company);
    return { position, company, url: location.href };
  },

  /**
   * #29 — Intent tracking for HackerNews Jobs.
   * HN job posts always redirect to an external destination (company ATS, YC page, etc.).
   * We attach a click listener to the title link (and the apply body link for self-posts).
   * On click, record intent so it can be matched when the user submits on the ATS.
   */
  watchForIntent(onIntent: (jobData: JobData) => void): () => void {
    // Jobs list page: attach click listeners to each listing title
    if (location.pathname === "/jobs") {
      const links = document.querySelectorAll<HTMLAnchorElement>(
        "tr.athing.submission .titleline > a",
      );

      if (links.length === 0) {
        log("hn", "watchForIntent: no job listing links found on /jobs page");
        return () => {};
      }

      const handlers: Array<{ link: HTMLAnchorElement; fn: EventListener }> = [];

      links.forEach((link) => {
        const rowTitle = link.textContent?.trim() ?? "";
        const { company, position } = parseHnTitle(rowTitle);
        if (!company || !position) return;

        const fn = () => {
          if (link.href.includes("item?id=")) return; // self-post — wait for item page load
          log("hn", "watchForIntent: list link clicked →", position, "@", company);
          onIntent({ position, company, url: link.href });
        };
        link.addEventListener("click", fn);
        handlers.push({ link, fn });
      });

      log("hn", "watchForIntent: attached to", handlers.length, "job listing links");
      return () => {
        for (const { link, fn } of handlers) link.removeEventListener("click", fn);
      };
    }

    // Item page: record intent on load (job confirmed by extract())
    const jobData = hackerNewsAdapter.extract();
    if (!jobData) {
      log("hn", "watchForIntent: extract() → null — no-op");
      return () => {};
    }

    log(
      "hn",
      "watchForIntent: recording intent on job item page →",
      jobData.position,
      "@",
      jobData.company,
    );
    onIntent(jobData);
    return () => {};
  },
};
