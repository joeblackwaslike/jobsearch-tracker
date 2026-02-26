import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Company } from "@/lib/queries/companies";
import { CompanyDetail } from "../company-detail";

// Mock the applications query hook used by AppsTab
vi.mock("@/lib/queries/applications", () => ({
  useApplicationsByCompany: () => ({ data: { data: [], count: 0 } }),
}));

const mockCompany = {
  id: "1",
  name: "Test Company",
  industry: "Technology",
  location: "San Francisco, CA",
  size: "100-500",
  researched: true,
  tags: ["startup", "remote"],
  ratings: null,
  description: null,
  culture: null,
  pros: null,
  cons: null,
  benefits: null,
  founded: null,
  tech_stack: null,
  links: null,
  archived_at: null,
  user_id: "u1",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
} as unknown as Company;

describe("CompanyDetail", () => {
  it("renders company name in header", () => {
    render(<CompanyDetail company={mockCompany} />);
    expect(screen.getByText("Test Company")).toBeInTheDocument();
  });

  it("shows Overview tab by default", () => {
    render(<CompanyDetail company={mockCompany} />);
    expect(screen.getByRole("tab", { name: "Overview" })).toHaveAttribute("data-state", "active");
  });

  it("shows Research tab content when clicked", async () => {
    const user = userEvent.setup();
    render(<CompanyDetail company={{ ...mockCompany, culture: "Great culture" } as Company} />);
    await user.click(screen.getByRole("tab", { name: "Research" }));
    expect(screen.getByRole("tab", { name: "Research" })).toHaveAttribute("data-state", "active");
  });

  it("shows data quality completeness", () => {
    render(<CompanyDetail company={mockCompany} />);
    expect(screen.getByText(/completeness/i)).toBeInTheDocument();
  });

  it("shows research status badge when researched", () => {
    render(<CompanyDetail company={mockCompany} />);
    expect(screen.getByText("Researched")).toBeInTheDocument();
  });

  it("renders tags as badges", () => {
    render(<CompanyDetail company={mockCompany} />);
    expect(screen.getByText("startup")).toBeInTheDocument();
    expect(screen.getByText("remote")).toBeInTheDocument();
  });

  it("hides researched badge when not researched", () => {
    render(<CompanyDetail company={{ ...mockCompany, researched: false } as Company} />);
    expect(screen.queryByText("Researched")).not.toBeInTheDocument();
  });

  it("renders description when present", () => {
    render(
      <CompanyDetail
        company={{ ...mockCompany, description: "Great company to work for" } as Company}
      />,
    );
    expect(screen.getByText("Great company to work for")).toBeInTheDocument();
  });
  it("renders links in links tab when stored as flat object", async () => {
    const user = userEvent.setup();
    render(
      <CompanyDetail
        company={{
          ...mockCompany,
          links: { website: "https://example.com", careers: "https://example.com/jobs" } as unknown as null,
        }}
      />,
    );
    await user.click(screen.getByRole("tab", { name: "Links" }));
    expect(screen.getByText("Website")).toBeInTheDocument();
    expect(screen.getByText("Careers Page")).toBeInTheDocument();
  });
});
