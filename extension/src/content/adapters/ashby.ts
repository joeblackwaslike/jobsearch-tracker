import { log } from "../debug";
import type { Adapter, JobData } from "./types";

export const ashbyAdapter: Adapter = {
  hosts: ["jobs.ashbyhq.com"],

  extract(): JobData | null {
    const titleEl =
      document.querySelector<HTMLElement>("h1[class*='ashby-job-posting-heading']") ??
      document.querySelector<HTMLElement>("h1");

    const companyFromUrl = location.pathname.split("/")[1]?.replace(/-/g, " ");

    if (!titleEl || !companyFromUrl) return null;

    const position = titleEl.textContent?.trim() ?? "";
    if (!position) return null;

    const company = companyFromUrl.replace(/\b\w/g, (c) => c.toUpperCase());
    return { position, company, url: location.href };
  },

  watchForSubmission(onSubmit: (jobData: JobData) => void): () => void {
    const pathname = location.pathname;
    log("ashby", "watchForSubmission called, pathname:", pathname);

    // Active on /application path (Ashby's hosted apply page)
    // Some Ashby embeds use /apply — accept both
    if (!/\/(application|apply)\/?$/.test(pathname)) {
      log("ashby", "path does not end with /application or /apply — no-op");
      return () => {};
    }

    // Snapshot job data now — use the canonical job URL (strip /application or /apply)
    const titleEl =
      document.querySelector<HTMLElement>("h1[class*='ashby-job-posting-heading']") ??
      document.querySelector<HTMLElement>("h1");

    const companyFromUrl = pathname.split("/")[1]?.replace(/-/g, " ");

    log("ashby", "titleEl:", titleEl?.textContent?.trim() ?? "(none)");
    log("ashby", "companyFromUrl:", companyFromUrl ?? "(none)");

    if (!titleEl || !companyFromUrl) {
      log("ashby", "missing titleEl or company — no-op");
      return () => {};
    }

    const jobData: JobData = {
      position: titleEl.textContent?.trim() ?? "",
      company: companyFromUrl.replace(/\b\w/g, (c) => c.toUpperCase()),
      url: location.href.replace(/\/(application|apply)\/?$/, ""),
    };
    if (!jobData.position) {
      log("ashby", "empty position — no-op");
      return () => {};
    }

    // Primary: form submit event — fires before Ashby navigates to confirmation page.
    // Using capture phase so we run before React's synthetic handlers.
    const form = document.querySelector<HTMLFormElement>("form");
    if (form) {
      log("ashby", "watching form submit event for:", jobData.position, "@", jobData.company);
      let fired = false;
      const handleSubmit = () => {
        if (fired) return;
        fired = true;
        log("ashby", "form submit — firing onSubmit");
        onSubmit(jobData);
      };
      form.addEventListener("submit", handleSubmit, true);
      return () => form.removeEventListener("submit", handleSubmit, true);
    }

    // Fallback: MutationObserver for SPAs that swap DOM in place instead of navigating.
    log("ashby", "no form found — falling back to MutationObserver for:", jobData.position);
    const observer = new MutationObserver(() => {
      const h1Text = document.querySelector("h1")?.textContent?.trim() ?? "";
      if (h1Text) log("ashby", "mutation — h1 text:", h1Text);
      if (
        /thanks for submitting|application received|we.ll be in touch|submitted successfully/i.test(
          h1Text,
        )
      ) {
        log("ashby", "thank-you matched — firing onSubmit");
        observer.disconnect();
        onSubmit(jobData);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  },
};
