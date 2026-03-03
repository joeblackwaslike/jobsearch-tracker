import { describe, expect, it } from "vitest";
import {
  detectEmploymentType,
  detectWorkType,
  getSourceFromUrl,
  isLikelyJobUrl,
  parseSalary,
} from "../url-import";

describe("parseSalary", () => {
  it("parses a dollar range", () => {
    expect(parseSalary("$120,000 - $180,000")).toEqual({
      min: 120000,
      max: 180000,
      currency: "USD",
    });
  });

  it("parses a k-notation range", () => {
    expect(parseSalary("$120k - $180k")).toEqual({
      min: 120000,
      max: 180000,
      currency: "USD",
    });
  });

  it("returns empty object for empty string", () => {
    expect(parseSalary("")).toEqual({});
  });

  it("detects GBP currency", () => {
    const result = parseSalary("£50,000 - £70,000");
    expect(result.currency).toBe("GBP");
  });
});

describe("detectWorkType", () => {
  it("detects remote", () => {
    expect(detectWorkType("This is a fully remote position")).toBe("remote");
  });

  it("detects hybrid", () => {
    expect(detectWorkType("Hybrid work arrangement available")).toBe("hybrid");
  });

  it("detects onsite", () => {
    expect(detectWorkType("Must work on-site in our office")).toBe("onsite");
  });

  it("returns undefined for no match", () => {
    expect(detectWorkType("Great opportunity")).toBeUndefined();
  });
});

describe("detectEmploymentType", () => {
  it("detects full-time from explicit label", () => {
    expect(detectEmploymentType("Employment Type: Full Time")).toBe("full-time");
  });

  it("detects contract", () => {
    expect(detectEmploymentType("Job Type: Contract")).toBe("contract");
  });

  it("detects internship", () => {
    expect(detectEmploymentType("Summer Internship 2026")).toBe("internship");
  });

  it("returns undefined for no match", () => {
    expect(detectEmploymentType("Come work with us")).toBeUndefined();
  });
});

describe("getSourceFromUrl", () => {
  it("returns lowercase job board name for known aggregators", () => {
    expect(getSourceFromUrl("https://www.linkedin.com/jobs/view/123")).toBe("linkedin");
    expect(getSourceFromUrl("https://www.glassdoor.com/jobs/abc")).toBe("glassdoor");
  });

  it("returns 'other' for ATS platforms (greenhouse, lever, workday, icims)", () => {
    expect(getSourceFromUrl("https://greenhouse.io/jobs/abc")).toBe("other");
  });

  it("returns 'other' for unknown sites", () => {
    expect(getSourceFromUrl("https://careers.somecompany.com/job/456")).toBe("other");
  });

  it("returns 'other' for invalid url", () => {
    expect(getSourceFromUrl("not-a-url")).toBe("other");
  });
});

describe("isLikelyJobUrl", () => {
  it("returns true for known job board domains", () => {
    expect(isLikelyJobUrl("https://www.linkedin.com/jobs/view/123")).toBe(true);
  });

  it("returns true for /jobs/ path", () => {
    expect(isLikelyJobUrl("https://somecompany.com/jobs/senior-engineer")).toBe(true);
  });

  it("returns true for /careers/ path", () => {
    expect(isLikelyJobUrl("https://company.com/careers/frontend")).toBe(true);
  });

  it("returns false for non-job urls", () => {
    expect(isLikelyJobUrl("https://google.com")).toBe(false);
  });

  it("returns false for invalid url", () => {
    expect(isLikelyJobUrl("not-a-url")).toBe(false);
  });
});
