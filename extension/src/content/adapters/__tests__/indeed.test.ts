import { describe, expect, it } from "vitest";
import { indeedAdapter } from "../indeed";

function makeIndeedDOM(title: string, company: string): void {
  document.body.innerHTML = `
    <div class="jobsearch-ViewJobLayout">
      <h1 data-testid="jobsearch-JobInfoHeader-title">${title}</h1>
      <div data-testid="inlineHeader-companyName">
        <a>${company}</a>
      </div>
      <div class="jobsearch-IndeedApplyButton-contentWrapper">
        <button>Apply now</button>
      </div>
    </div>
  `;
}

describe("indeedAdapter", () => {
  it("extracts job title and company", () => {
    makeIndeedDOM("Backend Engineer", "TechCo");
    const data = indeedAdapter.extract();
    expect(data?.position).toBe("Backend Engineer");
    expect(data?.company).toBe("TechCo");
  });

  it("returns null when not on a job detail page", () => {
    document.body.innerHTML = `<div>Indeed homepage</div>`;
    expect(indeedAdapter.extract()).toBeNull();
  });
});
