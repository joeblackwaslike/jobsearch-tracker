import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/test-utils";
import { ApplicationDetail } from "../application-detail";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@tanstack/react-router", () => ({
  // biome-ignore lint/suspicious/noExplicitAny: mock component
  Link: ({ children, to, ...props }: any) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/queries/events", () => ({
  useEvents: () => ({ data: [], isLoading: false }),
  useCreateEvent: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateEvent: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteEvent: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock("@/lib/queries/applications", () => ({
  useCreateApplication: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateApplication: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useArchiveApplication: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock("@/lib/queries/companies", () => ({
  useSearchCompanies: () => ({ data: [], isLoading: false }),
  useCreateCompany: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateCompany: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock("@/lib/queries/application-documents", () => ({
  useApplicationDocuments: () => ({ data: [], isLoading: false }),
  useDetachDocument: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock("@/lib/queries/documents", () => ({
  useDocuments: () => ({ data: [], isLoading: false }),
  useSnapshotDocument: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock("@/lib/queries/event-contacts", () => ({
  useEventContacts: () => ({ data: [] }),
  useAddEventContact: () => ({ mutateAsync: vi.fn() }),
  useRemoveEventContact: () => ({ mutateAsync: vi.fn() }),
}));

vi.mock("@/lib/queries/contacts", () => ({
  useContacts: () => ({ data: [], isLoading: false }),
  useSearchContacts: () => ({ data: [], isLoading: false }),
  useCreateContact: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateContact: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteContact: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockApplication = {
  id: "app-1",
  user_id: "u1",
  company_id: "c1",
  position: "Senior Engineer",
  url: "https://example.com/job",
  status: "applied",
  work_type: "remote",
  employment_type: "full-time",
  location: "San Francisco, CA",
  salary: {
    min: 120000,
    max: 180000,
    currency: "USD",
    period: "yearly",
  },
  job_description: "Build amazing things",
  interest: "high",
  source: "LinkedIn",
  tags: ["react", "typescript"],
  applied_at: null,
  archived_at: null,
  archived_reason: null,
  created_at: "2026-01-15T00:00:00Z",
  updated_at: "2026-01-20T00:00:00Z",
  company: {
    id: "c1",
    user_id: "u1",
    name: "Acme Corp",
    description: null,
    links: null,
    industry: null,
    size: null,
    location: null,
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
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  },
  // biome-ignore lint/suspicious/noExplicitAny: mock data
} as any;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ApplicationDetail", () => {
  it("renders breadcrumb with company and position", () => {
    render(<ApplicationDetail application={mockApplication} />);

    const appLink = screen.getByRole("link", { name: "Applications" });
    expect(appLink).toBeVisible();

    const nav = appLink.closest("nav") as HTMLElement;
    expect(nav).toHaveTextContent("Acme Corp");
    expect(nav).toHaveTextContent("Senior Engineer");
  });

  it("renders header with company name, position, and status badge", () => {
    render(<ApplicationDetail application={mockApplication} />);

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("Acme Corp");

    const position = heading.nextElementSibling as HTMLElement;
    expect(position.tagName).toBe("P");
    expect(position).toHaveTextContent("Senior Engineer");

    const badges = screen.getAllByText("Applied");
    const statusBadge = badges.find(
      (el) => el.getAttribute("data-slot") === "badge",
    ) as HTMLElement;
    expect(statusBadge).toBeVisible();

    expect(screen.getByText(/High\s+interest/)).toBeVisible();
  });

  it("renders action buttons", () => {
    render(<ApplicationDetail application={mockApplication} />);

    expect(screen.getByRole("button", { name: /Edit Application/i })).toBeVisible();
  });

  it("renders View Company link", () => {
    render(<ApplicationDetail application={mockApplication} />);
    const link = screen.getByRole("link", { name: /view company/i });
    expect(link).toBeVisible();
    // The TanStack Router Link mock renders href={to}, which will be the template string
    // Just verify the link exists and is visible
  });

  it("renders Details card with application fields", () => {
    render(<ApplicationDetail application={mockApplication} />);

    expect(screen.getByText("Details")).toBeVisible();
    expect(screen.getByText("Remote")).toBeVisible();
    expect(screen.getByText("San Francisco, CA")).toBeVisible();
    expect(screen.getByText("$120,000 - $180,000 / yearly")).toBeVisible();
    expect(screen.getByText("LinkedIn")).toBeVisible();
  });

  it("renders Timeline section with Add Event button", () => {
    render(<ApplicationDetail application={mockApplication} />);

    expect(screen.getByRole("heading", { level: 2, name: "Timeline" })).toBeVisible();
    expect(screen.getByRole("button", { name: /Add Event/i })).toBeVisible();
  });

  it("renders job posting URL with Open button above job description", () => {
    render(<ApplicationDetail application={mockApplication} />);
    // URL text is visible
    expect(screen.getByText("https://example.com/job")).toBeVisible();
    // Open button links to the URL
    const openLink = screen.getByRole("link", { name: /open/i });
    expect(openLink).toHaveAttribute("href", "https://example.com/job");
  });

  it("renders job description as always-visible markdown without toggle", () => {
    render(<ApplicationDetail application={mockApplication} />);
    // Content is visible without any click needed
    expect(screen.getByText("Build amazing things")).toBeVisible();
    // No toggle button for job description
    expect(screen.queryByRole("button", { name: /job description/i })).not.toBeInTheDocument();
  });
});
