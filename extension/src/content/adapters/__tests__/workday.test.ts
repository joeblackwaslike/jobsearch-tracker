import * as fs from "node:fs";
import * as path from "node:path";
import { describe, expect, it } from "vitest";
import type { JobData } from "../types";
import { workdayAdapter } from "../workday";

function setLocation(hostname: string, pathname: string): void {
  Object.defineProperty(window, "location", {
    value: {
      ...window.location,
      hostname,
      pathname,
      href: `https://${hostname}${pathname}`,
    },
    writable: true,
    configurable: true,
  });
}

describe("workdayAdapter", () => {
  describe("hosts", () => {
    it("has empty hosts array (dynamically matched by *.myworkdayjobs.com)", () => {
      expect(workdayAdapter.hosts).toEqual([]);
    });
  });

  describe("extract()", () => {
    it("extracts position and company from Workday job page", () => {
      setLocation(
        "nvidia.wd5.myworkdayjobs.com",
        "/en-US/NVIDIAExternalCareerSite/job/Software-Engineer_JR123",
      );
      document.body.innerHTML = `
        <div data-automation-id="jobPostingHeader">Staff Software Engineer</div>
      `;
      const data = workdayAdapter.extract();
      expect(data?.position).toBe("Staff Software Engineer");
      expect(data?.company).toBe("Nvidia");
    });

    it("capitalizes company name from subdomain", () => {
      setLocation("salesforce.wd12.myworkdayjobs.com", "/en-US/Careers/job/Engineer_JR456");
      document.body.innerHTML = `
        <div data-automation-id="jobPostingHeader">Backend Engineer</div>
      `;
      const data = workdayAdapter.extract();
      expect(data?.company).toBe("Salesforce");
    });

    it("handles multi-word company names in subdomain", () => {
      setLocation("general-motors.wd5.myworkdayjobs.com", "/en-US/Careers/job/Developer_JR789");
      document.body.innerHTML = `
        <div data-automation-id="jobPostingHeader">Software Developer</div>
      `;
      const data = workdayAdapter.extract();
      expect(data?.company).toBe("General Motors");
    });

    it("returns null when jobPostingHeader element not found", () => {
      setLocation("acme.wd1.myworkdayjobs.com", "/en-US/Careers/job/Engineer_JR123");
      document.body.innerHTML = `<div>No job header here</div>`;
      expect(workdayAdapter.extract()).toBeNull();
    });

    it("returns null when company cannot be derived from hostname", () => {
      setLocation("localhost", "/job/Engineer_JR123");
      document.body.innerHTML = `
        <div data-automation-id="jobPostingHeader">Engineer</div>
      `;
      expect(workdayAdapter.extract()).toBeNull();
    });
  });

  describe("watchForSubmission()", () => {
    it("fires on confirmation URL path", async () => {
      setLocation(
        "acme.wd1.myworkdayjobs.com",
        "/en-US/Careers/job/Engineer_JR123/confirmationCheckout/",
      );
      document.body.innerHTML = `
        <div data-automation-id="jobPostingHeader">Software Engineer</div>
      `;

      const received = await new Promise<JobData>((resolve) => {
        workdayAdapter.watchForSubmission?.(resolve);
      });

      expect(received.position).toBe("Software Engineer");
      expect(received.company).toBe("Acme");
    });

    it("fires when DOM contains success text", async () => {
      setLocation(
        "acme.wd1.myworkdayjobs.com",
        "/en-US/Careers/job/Engineer_JR123/apply/complete/",
      );
      document.body.innerHTML = `
        <div data-automation-id="jobPostingHeader">Software Engineer</div>
        <h1>Thank you for applying!</h1>
      `;

      const received = await new Promise<JobData>((resolve) => {
        workdayAdapter.watchForSubmission?.(resolve);
      });

      expect(received.position).toBe("Software Engineer");
      expect(received.company).toBe("Acme");
    });
  });

  describe("extract() — fixture-based regression test", () => {
    it("extracts valid data from real captured HTML", () => {
      const fixturePath = path.join(__dirname, "fixtures/workday.html");

      // Skip if fixture doesn't exist yet
      if (!fs.existsSync(fixturePath)) {
        console.warn("⚠️  Skipping fixture test: fixtures/workday.html not found");
        console.warn("   Run: npm run capture-fixtures workday");
        return;
      }

      const fixtureHTML = fs.readFileSync(fixturePath, "utf-8");
      setLocation(
        "nvidia.wd5.myworkdayjobs.com",
        "/en-US/NVIDIAExternalCareerSite/job/Software-Engineer_JR123",
      );
      document.documentElement.innerHTML = fixtureHTML;

      const data = workdayAdapter.extract();

      // Assert that extraction succeeds and returns valid data
      expect(data).not.toBeNull();
      expect(data?.position).toBeTruthy();
      expect(data?.company).toBeTruthy();
      expect(data?.url).toBeTruthy();

      // Log the extracted data for visibility
      console.log(`   Extracted from fixture: ${data?.position} at ${data?.company}`);
    });
  });
});
