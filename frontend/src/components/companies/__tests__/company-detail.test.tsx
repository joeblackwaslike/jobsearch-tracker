import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Company } from "@/lib/queries/companies";
import { CompanyDetail } from "../company-detail";

// Mock the applications query hook used by AppsTab
vi.mock("@/lib/queries/applications", () => ({
  useApplicationsByCompany: () => ({ data: { data: [], count: 0 } }),
}));

vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-router")>();
  return { ...actual, useNavigate: () => vi.fn() };
});

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

  it("does not render tags as badges in the header", () => {
    render(<CompanyDetail company={mockCompany} />);
    expect(screen.queryByText("startup")).not.toBeInTheDocument();
    expect(screen.queryByText("remote")).not.toBeInTheDocument();
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
    // Website is shown in the header, not the links tab
    expect(screen.queryByText("Website")).not.toBeInTheDocument();
    expect(screen.getByText("Careers Page")).toBeInTheDocument();
  });
  it("renders individual tech stack badges from comma-separated string", async () => {
    const user = userEvent.setup();
    render(
      <CompanyDetail
        company={{ ...mockCompany, tech_stack: "React, TypeScript, AWS" } as Company}
      />,
    );
    await user.click(screen.getByRole("tab", { name: "Research" }));
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    expect(screen.getByText("AWS")).toBeInTheDocument();
  });
  it("renders work-life balance and career growth ratings from camelCase keys", () => {
    render(
      <CompanyDetail
        company={{
          ...mockCompany,
          ratings: {
            overall: 4.2,
            workLifeBalance: 4.0,
            compensation: 4.5,
            careerGrowth: 4.3,
            culture: 4.1,
            management: 3.9,
          } as unknown as null,
        }}
      />,
    );
    expect(screen.getByText("Work-Life Balance")).toBeInTheDocument();
    expect(screen.getByText("Career Growth")).toBeInTheDocument();
    expect(screen.getByText("Culture")).toBeInTheDocument();
    expect(screen.getByText("Management")).toBeInTheDocument();
  });
});
