import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCompanies } from "@/lib/queries/companies";
import { render, screen } from "@/test/test-utils";
import { CompanyDirectory } from "../company-directory";

const mockCompanies = [
  {
    id: "c1",
    user_id: "u1",
    name: "Acme Corp",
    description: null,
    links: null,
    industry: "Technology",
    size: "51-200",
    location: "San Francisco",
    founded: null,
    culture: null,
    benefits: null,
    pros: null,
    cons: null,
    tech_stack: null,
    ratings: { overall: "4" },
    tags: ["startup"],
    researched: true,
    archived_at: null,
    website: null,
    notes: null,
    glassdoor_url: null,
    linkedin_url: null,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "c2",
    user_id: "u1",
    name: "Beta Inc",
    description: null,
    links: null,
    industry: "Finance",
    size: "201-500",
    location: "NYC",
    founded: null,
    culture: null,
    benefits: null,
    pros: null,
    cons: null,
    tech_stack: null,
    ratings: null,
    tags: null,
    researched: false,
    archived_at: null,
    website: null,
    notes: null,
    glassdoor_url: null,
    linkedin_url: null,
    created_at: "2025-01-05T00:00:00Z",
    updated_at: "2025-01-05T00:00:00Z",
  },
];

vi.mock("@/lib/queries/companies", () => ({
  useCompanies: vi.fn(() => ({
    data: { data: mockCompanies, count: 2 },
    isLoading: false,
  })),
  useCreateCompany: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateCompany: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useArchiveCompany: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("@/lib/queries/contacts", () => ({
  useContacts: () => ({ data: [], isLoading: false }),
  useSearchContacts: () => ({ data: [], isLoading: false }),
  useCreateContact: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateContact: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteContact: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

const cardViewProps = {
  searchParam: "",
  viewParam: "cards",
  onSearchChange: vi.fn(),
  onViewChange: vi.fn(),
};

describe("CompanyDirectory", () => {
  beforeEach(() => {
    vi.mocked(useCompanies).mockReturnValue({
      data: { data: mockCompanies, count: 2 },
      isLoading: false,
    } as any);
  });

  it("renders header, stats cards, and search", () => {
    render(<CompanyDirectory {...cardViewProps} />);

    expect(screen.getByRole("heading", { name: "Companies" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /New Company/ })).toBeInTheDocument();
    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.getAllByText("Researched").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Open Apps")).toBeInTheDocument();
    expect(screen.getByText("Avg Rating")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search companies...")).toBeInTheDocument();
  });

  it("renders company names in cards view", () => {
    render(<CompanyDirectory {...cardViewProps} />);

    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    expect(screen.getByText("Beta Inc")).toBeInTheDocument();
  });

  it("renders empty state when no companies", () => {
    vi.mocked(useCompanies).mockReturnValue({
      data: { data: [], count: 0 },
      isLoading: false,
    } as any);

    render(<CompanyDirectory {...cardViewProps} />);

    expect(screen.getByText("No companies yet")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Add Your First Company/ })).toBeInTheDocument();
  });

  it("renders table view with correct column headers", () => {
    render(<CompanyDirectory {...cardViewProps} viewParam="table" />);

    expect(screen.getByRole("columnheader", { name: "Name" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Industry" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Location" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Size" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Researched" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Tags" })).toBeInTheDocument();
  });

  it("defaults to table view when no viewParam given", () => {
    render(<CompanyDirectory searchParam="" onSearchChange={vi.fn()} onViewChange={vi.fn()} />);

    expect(screen.getByRole("table")).toBeInTheDocument();
  });
});
