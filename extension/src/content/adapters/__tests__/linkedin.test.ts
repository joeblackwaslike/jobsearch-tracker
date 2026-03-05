import { describe, expect, it } from "vitest";
import { linkedInAdapter } from "../linkedin";

function makeLinkedInDOM(title: string, company: string): void {
  document.body.innerHTML = `
    <div class="jobs-unified-top-card">
      <h1 class="job-details-jobs-unified-top-card__job-title">
        <a>${title}</a>
      </h1>
      <div class="job-details-jobs-unified-top-card__company-name">
        <a>${company}</a>
      </div>
      <div class="jobs-apply-button--top-card">
        <button>Easy Apply</button>
      </div>
    </div>
  `;
}

describe("linkedInAdapter", () => {
  it("extracts job title and company", () => {
    makeLinkedInDOM("Senior Engineer", "Acme Corp");
    const data = linkedInAdapter.extract();
    expect(data?.position).toBe("Senior Engineer");
    expect(data?.company).toBe("Acme Corp");
    expect(data?.url).toBe(location.href);
  });

  it("returns null when not on a job detail page", () => {
    document.body.innerHTML = `<div>LinkedIn Feed</div>`;
    expect(linkedInAdapter.extract()).toBeNull();
  });

  it("identifies the inject target", () => {
    makeLinkedInDOM("Engineer", "Corp");
    expect(linkedInAdapter.getInjectTarget()).not.toBeNull();
  });
});
