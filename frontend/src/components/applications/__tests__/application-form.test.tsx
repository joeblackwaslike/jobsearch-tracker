import { within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ApplicationWithCompany } from "@/lib/queries/applications";
import { render, screen } from "@/test/test-utils";
import { ApplicationForm } from "../application-form";

// ---------------------------------------------------------------------------
// Mock dependencies
// ---------------------------------------------------------------------------

const updateMutateAsync = vi.fn();

vi.mock("@/lib/queries/applications", () => ({
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

const snapshotMutateAsync = vi.fn();

vi.mock("@/lib/queries/documents", () => ({
  useSnapshotDocument: () => ({
    mutateAsync: snapshotMutateAsync,
    isPending: false,
  }),
  useUploadDocument: () => ({ mutateAsync: vi.fn(), isPending: false }),
  documentsQueryOptions: vi.fn((type?: string) => ({
    queryKey: ["documents", { type }],
    queryFn: vi.fn(() => []),
  })),
}));

vi.mock("@/lib/queries/application-documents", () => ({
  useApplicationDocuments: vi.fn(() => ({ data: [], isLoading: false })),
  useDetachDocument: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
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
  locations: ["San Francisco, CA"],
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
  it("renders edit mode with title 'Edit Application'", () => {
    render(<ApplicationForm open={true} onOpenChange={vi.fn()} application={mockApplication} />);
    expect(screen.getByText("Edit Application")).toBeInTheDocument();
    expect(screen.getByText("Update application details.")).toBeInTheDocument();
  });

  it("renders edit mode with all field sections", () => {
    render(<ApplicationForm open={true} onOpenChange={vi.fn()} application={mockApplication} />);
    expect(screen.getByText("Basic Information")).toBeInTheDocument();
    expect(screen.getByText("Job Details")).toBeInTheDocument();
    expect(screen.getByText("Salary")).toBeInTheDocument();
    expect(screen.getByText("Additional Information")).toBeInTheDocument();
  });

  it("populates edit mode fields with application data", () => {
    render(<ApplicationForm open={true} onOpenChange={vi.fn()} application={mockApplication} />);
    expect(screen.getByLabelText("Position *")).toHaveValue("Senior Engineer");
    expect(screen.getByLabelText("URL")).toHaveValue("https://example.com/job");
  });

  it("shows Save Changes submit button", () => {
    render(<ApplicationForm open={true} onOpenChange={vi.fn()} application={mockApplication} />);
    expect(screen.getByRole("button", { name: "Save Changes" })).toBeInTheDocument();
  });

  it("shows cancel button", () => {
    render(<ApplicationForm open={true} onOpenChange={vi.fn()} application={mockApplication} />);
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  describe("edit mode resume picker", () => {
    it("renders DocumentTypePicker in edit mode", () => {
      render(<ApplicationForm open application={mockApplication} onOpenChange={vi.fn()} />);
      expect(screen.getByText("Resume")).toBeInTheDocument();
    });

    it("does not read from localStorage in edit mode", () => {
      localStorage.setItem("tracker:default_resume_id", "doc-resume-1");
      render(<ApplicationForm open application={mockApplication} onOpenChange={vi.fn()} />);
      expect(screen.queryByTestId("selected-resume")).not.toBeInTheDocument();
      localStorage.removeItem("tracker:default_resume_id");
    });
  });
});

describe("notes field", () => {
  it("renders Notes textarea", () => {
    render(<ApplicationForm open={true} onOpenChange={vi.fn()} application={mockApplication} />);
    expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
  });

  it("pre-fills notes when application has notes", () => {
    const app = { ...mockApplication, notes: "My private notes" };
    render(
      <ApplicationForm
        open={true}
        onOpenChange={vi.fn()}
        application={app as ApplicationWithCompany}
      />,
    );
    expect(screen.getByLabelText(/notes/i)).toHaveValue("My private notes");
  });
});

describe("source field placement", () => {
  it("renders Source inside the Job Details fieldset", () => {
    render(<ApplicationForm open={true} onOpenChange={vi.fn()} application={null} />);
    const jobDetails = screen.getByText("Job Details").closest("fieldset") as HTMLElement;
    expect(within(jobDetails).getByText("Source")).toBeInTheDocument();
  });

  it("does not render Source in the Additional Information fieldset", () => {
    render(<ApplicationForm open={true} onOpenChange={vi.fn()} application={null} />);
    const additional = screen
      .getByText("Additional Information")
      .closest("fieldset") as HTMLElement;
    expect(within(additional).queryByText("Source")).not.toBeInTheDocument();
  });
});
