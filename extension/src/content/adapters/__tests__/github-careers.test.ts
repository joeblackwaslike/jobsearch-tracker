import { describe, expect, it, vi } from "vitest";
import { githubCareersAdapter } from "../github-careers";
import type { JobData } from "../types";

function setLocation(pathname: string): void {
  Object.defineProperty(window, "location", {
    value: { ...window.location, pathname, href: `https://github.careers${pathname}` },
    writable: true,
    configurable: true,
  });
}

describe("githubCareersAdapter", () => {
  describe("hosts", () => {
    it("includes github.careers", () => {
      expect(githubCareersAdapter.hosts).toContain("github.careers");
    });
    it("includes www.github.careers", () => {
      expect(githubCareersAdapter.hosts).toContain("www.github.careers");
    });
  });

  describe("source", () => {
    it("is GitHub Careers", () => {
      expect(githubCareersAdapter.source).toBe("GitHub Careers");
    });
  });

  describe("extract()", () => {
    it("extracts position from h1 and returns GitHub as company", () => {
      setLocation("/en/careers/");
      document.body.innerHTML = `<h1>Staff Software Engineer</h1>`;
      const data = githubCareersAdapter.extract();
      expect(data?.position).toBe("Staff Software Engineer");
      expect(data?.company).toBe("GitHub");
    });

    it("falls back to page title when h1 absent", () => {
      setLocation("/en/careers/");
      document.title = "Senior Product Manager | GitHub";
      document.body.innerHTML = `<div>no h1</div>`;
      const data = githubCareersAdapter.extract();
      expect(data?.position).toBe("Senior Product Manager");
      expect(data?.company).toBe("GitHub");
    });

    it("returns null when no title found", () => {
      setLocation("/en/careers/");
      document.title = "";
      document.body.innerHTML = `<div>empty page</div>`;
      expect(githubCareersAdapter.extract()).toBeNull();
    });
  });

  describe("watchForIntent()", () => {
    it("fires onIntent when an iCIMS link is clicked", async () => {
      setLocation("/en/careers/");
      document.body.innerHTML = `
        <h1>Staff Engineer</h1>
        <a href="https://careers-githubinc.icims.com/jobs/3456/apply">Apply Now</a>
      `;

      const received = await new Promise<JobData>((resolve) => {
        githubCareersAdapter.watchForIntent?.(resolve);
        // Simulate click on the iCIMS anchor
        // biome-ignore lint/style/noNonNullAssertion: element is guaranteed by the HTML set up above
        const link = document.querySelector<HTMLAnchorElement>("a[href*='.icims.com']")!;
        link.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
      });

      expect(received.position).toBe("Staff Engineer");
      expect(received.company).toBe("GitHub");
    });

    it("does not fire for non-iCIMS links", () => {
      setLocation("/en/careers/");
      document.body.innerHTML = `
        <h1>Staff Engineer</h1>
        <a href="https://example.com/some-link">Not iCIMS</a>
      `;
      const callback = vi.fn();
      githubCareersAdapter.watchForIntent?.(callback);

      // biome-ignore lint/style/noNonNullAssertion: element is guaranteed by the HTML set up above
      const link = document.querySelector<HTMLAnchorElement>("a")!;
      link.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));

      expect(callback).not.toHaveBeenCalled();
    });

    it("does not fire when extract() returns null", () => {
      setLocation("/en/careers/");
      document.title = "";
      document.body.innerHTML = `<div>empty</div>`;
      const callback = vi.fn();
      const cleanup = githubCareersAdapter.watchForIntent?.(callback);
      expect(() => cleanup?.()).not.toThrow();
      expect(callback).not.toHaveBeenCalled();
    });

    it("only fires once even if clicked multiple times", () => {
      setLocation("/en/careers/");
      document.body.innerHTML = `
        <h1>Staff Engineer</h1>
        <a href="https://careers-githubinc.icims.com/jobs/3456/apply">Apply</a>
      `;
      const callback = vi.fn();
      githubCareersAdapter.watchForIntent?.(callback);

      // biome-ignore lint/style/noNonNullAssertion: element is guaranteed by the HTML set up above
      const link = document.querySelector<HTMLAnchorElement>("a")!;
      link.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
      link.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));

      expect(callback).toHaveBeenCalledTimes(1);
    });
  });
});
