import { describe, expect, it } from "vitest";
import { greenhouseAdapter } from "../greenhouse";

function makeGreenhouseDOM(title: string, company: string): void {
  document.body.innerHTML = `
    <div class="app-title">${title}</div>
    <div class="company-name">${company}</div>
    <div id="header">
      <a class="btn btn--primary" href="#">Apply for this Job</a>
    </div>
  `;
}

describe("greenhouseAdapter", () => {
  it("extracts position and company", () => {
    makeGreenhouseDOM("Staff Engineer", "Greenhouse Inc");
    const data = greenhouseAdapter.extract();
    expect(data?.position).toBe("Staff Engineer");
    expect(data?.company).toBe("Greenhouse Inc");
  });

  it("returns null when no job title found", () => {
    document.body.innerHTML = `<div>nothing here</div>`;
    expect(greenhouseAdapter.extract()).toBeNull();
  });
});
