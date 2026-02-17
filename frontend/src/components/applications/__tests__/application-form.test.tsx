import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor } from "@/test/test-utils";
import { ApplicationForm } from "../application-form";

// ---------------------------------------------------------------------------
// Mock dependencies
// ---------------------------------------------------------------------------

const createMutateAsync = vi.fn();
const updateMutateAsync = vi.fn();

vi.mock("@/lib/queries/applications", () => ({
  useCreateApplication: () => ({
    mutateAsync: createMutateAsync,
    isPending: false,
  }),
  useUpdateApplication: () => ({
    mutateAsync: updateMutateAsync,
    isPending: false,
  }),
}));

vi.mock("@/lib/queries/companies", () => ({
  useSearchCompanies: () => ({
    data: [],
    isLoading: false,
  }),
  useCreateCompany: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockApplication = {
  id: "app-1",
  user_id: "user-1",
  company_id: "c-1",
  position: "Senior Engineer",
  url: "https://example.com/job",
  status: "applied",
  work_type: "remote",
  employment_type: "full-time",
  location: "San Francisco, CA",
  salary: { min: 100000, max: 150000, currency: "USD", period: "yearly" },
  job_description: "Great job",
  interest: "high",
  source: "LinkedIn",
  tags: ["react", "typescript"],
  archived_at: null,
  archived_reason: null,
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
  company: {
    id: "c-1",
    user_id: "user-1",
    name: "Test Company",
    website: null,
    industry: null,
    location: null,
    notes: null,
    glassdoor_url: null,
    linkedin_url: null,
    researched: false,
    archived_at: null,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  },
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ApplicationForm", () => {
  it("renders create mode with title 'New Application'", () => {
    render(
      <ApplicationForm
        open={true}
        onOpenChange={vi.fn()}
        mode="create"
      />
    );

    expect(screen.getByText("New Application")).toBeInTheDocument();
    expect(
      screen.getByText("Add a new job application to track.")
    ).toBeInTheDocument();
  });

  it("renders create mode with Company, Position, and URL fields", () => {
    render(
      <ApplicationForm
        open={true}
        onOpenChange={vi.fn()}
        mode="create"
      />
    );

    // Company field
    expect(screen.getByText("Company *")).toBeInTheDocument();
    // Position field
    expect(screen.getByLabelText("Position *")).toBeInTheDocument();
    // URL field
    expect(screen.getByLabelText("URL")).toBeInTheDocument();
  });

  it("does not show edit-only fields in create mode", () => {
    render(
      <ApplicationForm
        open={true}
        onOpenChange={vi.fn()}
        mode="create"
      />
    );

    // These fields only appear in edit mode
    expect(screen.queryByText("Basic Information")).not.toBeInTheDocument();
    expect(screen.queryByText("Salary")).not.toBeInTheDocument();
    expect(screen.queryByText("Details")).not.toBeInTheDocument();
  });

  it("renders edit mode with title 'Edit Application'", () => {
    render(
      <ApplicationForm
        open={true}
        onOpenChange={vi.fn()}
        mode="edit"
        application={mockApplication}
      />
    );

    expect(screen.getByText("Edit Application")).toBeInTheDocument();
    expect(
      screen.getByText("Update application details.")
    ).toBeInTheDocument();
  });

  it("renders edit mode with all field sections", () => {
    render(
      <ApplicationForm
        open={true}
        onOpenChange={vi.fn()}
        mode="edit"
        application={mockApplication}
      />
    );

    // Section headings
    expect(screen.getByText("Basic Information")).toBeInTheDocument();
    expect(screen.getByText("Salary")).toBeInTheDocument();
    expect(screen.getByText("Details")).toBeInTheDocument();
  });

  it("populates edit mode fields with application data", () => {
    render(
      <ApplicationForm
        open={true}
        onOpenChange={vi.fn()}
        mode="edit"
        application={mockApplication}
      />
    );

    // Position should be populated
    expect(screen.getByLabelText("Position *")).toHaveValue(
      "Senior Engineer"
    );
    // URL
    expect(screen.getByLabelText("URL")).toHaveValue(
      "https://example.com/job"
    );
    // Location
    expect(screen.getByLabelText("Location")).toHaveValue(
      "San Francisco, CA"
    );
  });

  it("shows submit button text based on mode", () => {
    const { rerender } = render(
      <ApplicationForm
        open={true}
        onOpenChange={vi.fn()}
        mode="create"
      />
    );

    expect(
      screen.getByRole("button", { name: "Add Application" })
    ).toBeInTheDocument();

    rerender(
      <ApplicationForm
        open={true}
        onOpenChange={vi.fn()}
        mode="edit"
        application={mockApplication}
      />
    );

    expect(
      screen.getByRole("button", { name: "Save Changes" })
    ).toBeInTheDocument();
  });

  it("shows cancel button", () => {
    render(
      <ApplicationForm
        open={true}
        onOpenChange={vi.fn()}
        mode="create"
      />
    );

    expect(
      screen.getByRole("button", { name: "Cancel" })
    ).toBeInTheDocument();
  });

  it("validates required fields when submitting create form", async () => {
    const user = userEvent.setup();

    render(
      <ApplicationForm
        open={true}
        onOpenChange={vi.fn()}
        mode="create"
      />
    );

    // Submit without filling required fields
    await user.click(
      screen.getByRole("button", { name: "Add Application" })
    );

    await waitFor(() => {
      expect(screen.getByText("Company is required")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText("Position is required")).toBeInTheDocument();
    });
  });
});
