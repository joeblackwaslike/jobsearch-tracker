import { log } from "../debug";
import type { Adapter, JobData } from "./types";

export const workableAdapter: Adapter = {
  hosts: ["apply.workable.com"],

  extract(): JobData | null {
    // Must be on a job page: /{company}/j/{jobId}/
    if (!location.pathname.includes("/j/")) return null;

    // document.title: "Senior Backend Engineer - Code Metal - Application"
    const parts = document.title.split(" - ");
    if (parts.length < 3 || !/application/i.test(parts[parts.length - 1])) return null;

    const position = parts[0].trim();
    // Join middle parts in case the company name contains " - "
    const company = parts.slice(1, -1).join(" - ").trim();
    if (!position || !company) return null;

    // Canonical job URL: /{company}/j/{jobId}/
    const match = location.pathname.match(/^(\/[^/]+\/j\/[^/]+)\//);
    const url = match ? `${location.origin}${match[1]}/` : location.href;

    return { position, company, url };
  },

  watchForSubmission(onSubmit: (jobData: JobData) => void): () => void {
    // Only active on the apply page
    if (!location.pathname.includes("/apply")) {
      log("workable", "not on /apply path — no-op");
      return () => {};
    }

    const jobData = workableAdapter.extract();
    if (!jobData) {
      log("workable", "extract() → null — no-op");
      return () => {};
    }

    log(
      "workable",
      "watching for thank-you / confirmation:",
      jobData.position,
      "@",
      jobData.company,
    );

    // After successful submission Workable shows a thank-you page
    const checkSuccess = () => {
      const h1Text = document.querySelector("h1")?.textContent ?? "";
      return (
        /thank you|application (was |has been )?received|successfully applied/i.test(h1Text) ||
        /thank.?you|confirmation|success/i.test(location.pathname)
      );
    };

    let fired = false;
    const fire = (trigger: string) => {
      if (fired) return;
      fired = true;
      log("workable", trigger, "— firing onSubmit");
      observer.disconnect();
      window.removeEventListener("popstate", handlePopState);
      onSubmit(jobData);
    };

    const observer = new MutationObserver(() => {
      const h1Text = document.querySelector("h1")?.textContent?.trim() ?? "";
      if (h1Text) log("workable", "mutation — h1:", h1Text.slice(0, 60));
      if (checkSuccess()) fire("DOM success signal");
    });

    const handlePopState = () => {
      log("workable", "popstate — pathname:", location.pathname);
      if (checkSuccess()) fire("popstate success signal");
    };

    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("popstate", handlePopState);

    return () => {
      observer.disconnect();
      window.removeEventListener("popstate", handlePopState);
    };
  },
};
