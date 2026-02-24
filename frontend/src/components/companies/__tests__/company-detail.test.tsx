import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CompanyDetail } from "../company-detail";
import type { Company } from "@/lib/queries/companies";

const mockCompany: Company = {
  id: "1",
  name: "Test Company",
  industry: "Technology",
  location: "San Francisco, CA",
  size: "100-500",
  researched: true,
  tags: ["startup", "remote"],
  website: null,
  email: null,
  phone: null,
  notes: null,
  ratings: null,
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

  it("shows research status badge", () => {
    render(<CompanyDetail company={mockCompany} />);
    expect(screen.getByText("Researched")).toBeInTheDocument();
  });

  it("renders tags as badges", () => {
    render(<CompanyDetail company={mockCompany} />);
    expect(screen.getByText("startup")).toBeInTheDocument();
    expect(screen.getByText("remote")).toBeInTheDocument();
  });

  it("shows Not Researched when not researched", () => {
    render(<CompanyDetail company={{ ...mockCompany, researched: false }} />);
    expect(screen.getByText("Not Researched")).toBeInTheDocument();
  });

  it("renders notes when present", () => {
    render(<CompanyDetail company={{ ...mockCompany, notes: "Great company to work for" }} />);
    expect(screen.getByText("Great company to work for")).toBeInTheDocument();
  });
});
