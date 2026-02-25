import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Company } from "@/lib/queries/companies";
import { CompanyDetail } from "../company-detail";

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
  it("renders company details", () => {
    render(<CompanyDetail company={mockCompany} />);
    expect(screen.getByText("Test Company")).toBeInTheDocument();
    expect(screen.getByText("Technology")).toBeInTheDocument();
    expect(screen.getByText("San Francisco, CA")).toBeInTheDocument();
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
});
