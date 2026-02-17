import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@/test/test-utils";
import { ApplicationForm } from "../application-form";

// ---------------------------------------------------------------------------
// Mock dependencies
// ---------------------------------------------------------------------------

const createMutateAsync = vi.fn().mockResolvedValue({ id: "new-app" });

vi.mock("@/lib/queries/applications", () => ({
  useCreateApplication: () => ({
    mutateAsync: createMutateAsync,
    isPending: false,
  }),
  useUpdateApplication: () => ({
    mutateAsync: vi.fn(),
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

vi.mock("@/lib/queries/application-documents", () => ({
  useApplicationDocuments: vi.fn(() => ({ data: [], isLoading: false })),
  useDetachDocument: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
}));

vi.mock("@/lib/queries/documents", () => ({
  useDocuments: vi.fn(() => ({ data: [], isLoading: false })),
  useSnapshotDocument: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
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

describe("ApplicationForm with documents", () => {
  it("shows Attach button in create mode", () => {
    render(
      <ApplicationForm
        open={true}
        onOpenChange={vi.fn()}
        mode="create"
      />
    );
    expect(screen.getByText("Attach")).toBeInTheDocument();
  });

  it("shows Documents label in create mode", () => {
    render(
      <ApplicationForm
        open={true}
        onOpenChange={vi.fn()}
        mode="create"
      />
    );
    expect(screen.getByText("Documents")).toBeInTheDocument();
  });

  it("shows Documents fieldset in edit mode", () => {
    render(
      <ApplicationForm
        open={true}
        onOpenChange={vi.fn()}
        mode="edit"
        application={mockApplication}
      />
    );
    expect(screen.getByText("Documents")).toBeInTheDocument();
    expect(screen.getByText("Attach")).toBeInTheDocument();
  });

  it("shows Attach button in edit mode", () => {
    render(
      <ApplicationForm
        open={true}
        onOpenChange={vi.fn()}
        mode="edit"
        application={mockApplication}
      />
    );
    expect(
      screen.getByRole("button", { name: "Attach" })
    ).toBeInTheDocument();
  });
});
