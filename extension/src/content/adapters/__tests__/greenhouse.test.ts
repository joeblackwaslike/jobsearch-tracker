import { describe, expect, it } from "vitest";
import { greenhouseAdapter } from "../greenhouse";
import type { JobData } from "../types";

// Legacy boards.greenhouse.io layout
function makeLegacyDOM(title: string, company: string): void {
  document.title = `${title} at ${company} - Greenhouse`;
  document.body.innerHTML = `
    <div class="app-title">${title}</div>
    <div class="company-name">${company}</div>
    <div id="header">
      <a class="btn btn--primary" href="#">Apply for this Job</a>
    </div>
  `;
}

// New job-boards.greenhouse.io layout (e.g. https://job-boards.greenhouse.io/anthropic/jobs/123)
function makeNewDOM(title: string, company: string): void {
  document.title = `Job Application for ${title} at ${company}`;
  document.body.innerHTML = `
    <h1 class="section-header section-header--large font-primary">${title}</h1>
    <div class="job__header">
      <button class="btn btn--rounded">Apply</button>
    </div>
  `;
}

describe("greenhouseAdapter", () => {
  describe("hosts", () => {
    it("includes boards.greenhouse.io (legacy)", () => {
      expect(greenhouseAdapter.hosts).toContain("boards.greenhouse.io");
    });

    it("includes job-boards.greenhouse.io (new layout)", () => {
      expect(greenhouseAdapter.hosts).toContain("job-boards.greenhouse.io");
    });
  });

  describe("extract() — legacy layout", () => {
    it("extracts position and company from DOM elements", () => {
      makeLegacyDOM("Staff Engineer", "Acme Corp");
      const data = greenhouseAdapter.extract();
      expect(data?.position).toBe("Staff Engineer");
      expect(data?.company).toBe("Acme Corp");
    });
  });

  describe("extract() — new layout (job-boards.greenhouse.io)", () => {
    it("extracts position from h1 and company from document.title", () => {
      makeNewDOM("Geopolitics Analyst, Policy", "Anthropic");
      const data = greenhouseAdapter.extract();
      expect(data?.position).toBe("Geopolitics Analyst, Policy");
      expect(data?.company).toBe("Anthropic");
    });
  });

  describe("extract() — edge cases", () => {
    it("returns null when no job title found", () => {
      document.title = "";
      document.body.innerHTML = `<div>nothing here</div>`;
      expect(greenhouseAdapter.extract()).toBeNull();
    });
  });

  describe("watchForSubmission()", () => {
    it("calls onSubmit when #application-form is removed from DOM", async () => {
      makeNewDOM("Geopolitics Analyst, Policy", "Anthropic");

      const form = document.createElement("div");
      form.id = "application-form";
      document.body.appendChild(form);

      const received = await new Promise<JobData>((resolve) => {
        const cleanup = greenhouseAdapter.watchForSubmission!(resolve);
        // Simulate form removal (successful submission)
        form.remove();
        // Return cleanup so it can be called if needed
        return cleanup;
      });

      expect(received.position).toBe("Geopolitics Analyst, Policy");
      expect(received.company).toBe("Anthropic");
    });

    it("returns a no-op cleanup when form is not present", () => {
      makeNewDOM("Engineer", "Acme");
      document.getElementById("application-form")?.remove();
      const cleanup = greenhouseAdapter.watchForSubmission!(() => {});
      expect(() => cleanup()).not.toThrow();
    });
  });
});
