import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
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
    data: [{ id: "c-1", name: "Test Company" }],
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

const snapshotMutateAsync = vi.fn();

vi.mock("@/lib/queries/documents", () => ({
  useSnapshotDocument: () => ({
    mutateAsync: snapshotMutateAsync,
    isPending: false,
  }),
}));

vi.mock("@/components/documents/document-type-picker", () => ({
  DocumentTypePicker: ({
    value,
    onChange,
  }: {
    value: string | null;
    onChange: (doc: { id: string } | null) => void;
  }) => (
    <div>
      <button type="button" onClick={() => onChange({ id: "doc-resume-1" })}>
        Select Resume
      </button>
      {value && <span data-testid="selected-resume">{value}</span>}
    </div>
  ),
}));

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
  applied_at: null,
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
} as unknown as ApplicationWithCompany;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ApplicationForm", () => {
  it("renders create mode with title 'New Application'", () => {
    render(<ApplicationForm open={true} onOpenChange={vi.fn()} mode="create" />);

    expect(screen.getByText("New Application")).toBeInTheDocument();
    expect(screen.getByText("Add a new job application to track.")).toBeInTheDocument();
  });

  it("renders create mode with Company, Position, and URL fields", () => {
    render(<ApplicationForm open={true} onOpenChange={vi.fn()} mode="create" />);

    // Company field
    expect(screen.getByText("Company *")).toBeInTheDocument();
    // Position field
    expect(screen.getByLabelText("Position *")).toBeInTheDocument();
    // URL field
    expect(screen.getByLabelText("URL")).toBeInTheDocument();
  });

  it("does not show edit-only fields in create mode", () => {
    render(<ApplicationForm open={true} onOpenChange={vi.fn()} mode="create" />);

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
      />,
    );

    expect(screen.getByText("Edit Application")).toBeInTheDocument();
    expect(screen.getByText("Update application details.")).toBeInTheDocument();
  });

  it("renders edit mode with all field sections", () => {
    render(
      <ApplicationForm
        open={true}
        onOpenChange={vi.fn()}
        mode="edit"
        application={mockApplication}
      />,
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
      />,
    );

    // Position should be populated
    expect(screen.getByLabelText("Position *")).toHaveValue("Senior Engineer");
    // URL
    expect(screen.getByLabelText("URL")).toHaveValue("https://example.com/job");
    // Location
    expect(screen.getByLabelText("Location")).toHaveValue("San Francisco, CA");
  });

  it("shows submit button text based on mode", () => {
    const { rerender } = render(
      <ApplicationForm open={true} onOpenChange={vi.fn()} mode="create" />,
    );

    expect(screen.getByRole("button", { name: "Add Application" })).toBeInTheDocument();

    rerender(
      <ApplicationForm
        open={true}
        onOpenChange={vi.fn()}
        mode="edit"
        application={mockApplication}
      />,
    );

    expect(screen.getByRole("button", { name: "Save Changes" })).toBeInTheDocument();
  });

  it("shows cancel button", () => {
    render(<ApplicationForm open={true} onOpenChange={vi.fn()} mode="create" />);

    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("validates required fields when submitting create form", async () => {
    const user = userEvent.setup();

    render(<ApplicationForm open={true} onOpenChange={vi.fn()} mode="create" />);

    // Submit without filling required fields
    await user.click(screen.getByRole("button", { name: "Add Application" }));

    await waitFor(() => {
      expect(screen.getByText("Company is required")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText("Position is required")).toBeInTheDocument();
    });
  });

  describe("create mode resume picker", () => {
    it("renders DocumentTypePicker in create mode", () => {
      render(<ApplicationForm open mode="create" onOpenChange={vi.fn()} />);
      expect(screen.getByText("Resume")).toBeInTheDocument();
    });

    it("pre-selects resume from localStorage if present", () => {
      localStorage.setItem("thrive:default_resume_id", "doc-resume-1");
      render(<ApplicationForm open mode="create" onOpenChange={vi.fn()} />);
      expect(screen.getByTestId("selected-resume")).toHaveTextContent("doc-resume-1");
      localStorage.removeItem("thrive:default_resume_id");
    });

    it("snapshots and attaches selected resume after successful create", async () => {
      const user = userEvent.setup();
      createMutateAsync.mockResolvedValueOnce({ id: "new-app-1" });
      snapshotMutateAsync.mockResolvedValueOnce({});

      render(<ApplicationForm open mode="create" onOpenChange={vi.fn()} />);

      await user.click(screen.getByText("Select Resume"));

      // Fill required fields
      await user.click(screen.getByRole("combobox"));
      await user.click(await screen.findByText("Test Company"));
      await user.type(screen.getByLabelText("Position *"), "Engineer");

      await user.click(screen.getByRole("button", { name: "Add Application" }));

      await waitFor(() => {
        expect(snapshotMutateAsync).toHaveBeenCalledWith({
          applicationId: "new-app-1",
          documentId: "doc-resume-1",
        });
      });
    });

    it("saves selected resume id to localStorage on successful submit", async () => {
      const user = userEvent.setup();
      createMutateAsync.mockResolvedValueOnce({ id: "new-app-1" });
      snapshotMutateAsync.mockResolvedValueOnce({});

      render(<ApplicationForm open mode="create" onOpenChange={vi.fn()} />);

      await user.click(screen.getByText("Select Resume"));

      await user.click(screen.getByRole("combobox"));
      await user.click(await screen.findByText("Test Company"));
      await user.type(screen.getByLabelText("Position *"), "Engineer");

      await user.click(screen.getByRole("button", { name: "Add Application" }));

      await waitFor(() => {
        expect(localStorage.getItem("thrive:default_resume_id")).toBe("doc-resume-1");
      });
    });
  });

  describe("edit mode resume picker", () => {
    it("renders DocumentTypePicker in edit mode", () => {
      render(
        <ApplicationForm open mode="edit" application={mockApplication} onOpenChange={vi.fn()} />,
      );
      expect(screen.getByText("Resume")).toBeInTheDocument();
    });

    it("does not read from localStorage in edit mode", () => {
      localStorage.setItem("thrive:default_resume_id", "doc-resume-1");
      render(
        <ApplicationForm open mode="edit" application={mockApplication} onOpenChange={vi.fn()} />,
      );
      expect(screen.queryByTestId("selected-resume")).not.toBeInTheDocument();
      localStorage.removeItem("thrive:default_resume_id");
    });
  });
});
