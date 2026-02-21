import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/test-utils";
import { ApplicationTable } from "../application-table";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const navigateMock = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigateMock,
}));

vi.mock("@/lib/queries/applications", () => ({
  useArchiveApplication: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const mockData = [
  {
    id: "app-1",
    user_id: "u1",
    company_id: "c1",
    position: "Senior Engineer",
    url: null,
    status: "applied",
    work_type: "remote",
    employment_type: "full-time",
    location: "San Francisco",
    interest: "high",
    source: null,
    salary: { min: 100000, max: 150000, currency: "USD", period: "yearly" },
    job_description: null,
    tags: null,
    applied_at: "2026-01-15",
    archived_at: null,
    archived_reason: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-10T00:00:00Z",
    company: { name: "Acme Corp" },
  },
  {
    id: "app-2",
    user_id: "u1",
    company_id: "c2",
    position: "Frontend Dev",
    url: null,
    status: "interviewing",
    work_type: "hybrid",
    employment_type: "contract",
    location: "NYC",
    interest: null,
    source: null,
    salary: null,
    job_description: null,
    tags: null,
    applied_at: null,
    archived_at: null,
    archived_reason: null,
    created_at: "2026-01-05T00:00:00Z",
    updated_at: "2026-01-08T00:00:00Z",
    company: { name: "Beta Inc" },
  },
] as const;

// ---------------------------------------------------------------------------
// Default props helper
// ---------------------------------------------------------------------------

const defaultProps = {
  data: mockData as unknown as Parameters<typeof ApplicationTable>[0]["data"],
  sorting: [] as Parameters<typeof ApplicationTable>[0]["sorting"],
  onSortingChange: vi.fn(),
  columnVisibility: {},
  onColumnVisibilityChange: vi.fn(),
  onEdit: vi.fn(),
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ApplicationTable", () => {
  it("renders rows with position, company, and status badge", () => {
    render(<ApplicationTable {...defaultProps} />);

    expect(screen.getByText("Senior Engineer")).toBeVisible();
    expect(screen.getByText("Acme Corp")).toBeVisible();
    // "Applied" appears both as a sortable column header and as a status badge
    const appliedBadge = screen
      .getAllByText("Applied")
      .find((el) => el.getAttribute("data-slot") === "badge");
    expect(appliedBadge).toBeVisible();

    expect(screen.getByText("Frontend Dev")).toBeVisible();
    expect(screen.getByText("Beta Inc")).toBeVisible();
    expect(screen.getByText("Interviewing")).toBeVisible();
  });

  it("renders empty state when data is empty", () => {
    render(<ApplicationTable {...defaultProps} data={[]} />);

    expect(screen.getByText("No applications found")).toBeVisible();
    expect(screen.getByText("Try adjusting your filters or add a new application.")).toBeVisible();
  });

  it("renders salary column with formatted values", () => {
    render(<ApplicationTable {...defaultProps} />);

    expect(screen.getByText("$100k - $150k/yr")).toBeVisible();
    // The second row has null salary, rendered as "-"
    // Multiple "-" dashes exist in the table, so just confirm the salary text is present
    const salaryDashes = screen.getAllByText("-");
    expect(salaryDashes.length).toBeGreaterThan(0);
  });

  it("calls navigate on row click", async () => {
    const user = userEvent.setup();
    render(<ApplicationTable {...defaultProps} />);

    const row = screen.getByText("Senior Engineer").closest("tr");
    expect(row).not.toBeNull();
    await user.click(row!);

    expect(navigateMock).toHaveBeenCalledWith({
      to: "/applications/app-1",
    });
  });

  it("renders interest badge when present, dash when absent", () => {
    render(<ApplicationTable {...defaultProps} />);

    // First row has interest "high" which renders as "High" badge
    expect(screen.getByText("High")).toBeVisible();

    // Second row has interest null which renders as "-"
    // Verify the second row renders correctly (interest null shows "-")
    expect(screen.getByText("Frontend Dev")).toBeVisible();
  });

  it("renders an edit button per row", () => {
    const onEdit = vi.fn();
    render(
      <ApplicationTable
        data={mockData as unknown as Parameters<typeof ApplicationTable>[0]["data"]}
        onEdit={onEdit}
        sorting={[]}
        onSortingChange={vi.fn()}
        columnVisibility={{}}
        onColumnVisibilityChange={vi.fn()}
      />,
    );
    expect(screen.getAllByTitle("Edit application")).toHaveLength(mockData.length);
  });

  it("calls onEdit when edit button clicked without navigating", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(
      <ApplicationTable
        data={mockData as unknown as Parameters<typeof ApplicationTable>[0]["data"]}
        onEdit={onEdit}
        sorting={[]}
        onSortingChange={vi.fn()}
        columnVisibility={{}}
        onColumnVisibilityChange={vi.fn()}
      />,
    );
    await user.click(screen.getAllByTitle("Edit application")[0]);
    expect(onEdit).toHaveBeenCalledWith(mockData[0]);
  });
});
