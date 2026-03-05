import type { Adapter, JobData } from "./types";

export const levelsAdapter: Adapter = {
  hosts: ["www.levels.fyi", "levels.fyi"],

  extract(): JobData | null {
    // Levels.fyi jobs: levels.fyi/jobs/[id]/[company-slug]/[title-slug]
    const parts = location.pathname.split("/").filter(Boolean);
    if (parts[0] !== "jobs" || parts.length < 4) return null;
    const company = (parts[2] ?? "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const titleEl =
      document.querySelector<HTMLElement>("h1") ??
      document.querySelector<HTMLElement>("[class*='jobTitle']");
    const position =
      titleEl?.textContent?.trim() ??
      (parts[3] ?? "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    if (!position || !company) return null;
    return { position, company, url: location.href };
  },

  getInjectTarget(): Element | null {
    return (
      document.querySelector("[class*='applyButton']") ??
      document.querySelector("a[href*='apply']")
    );
  },
};
