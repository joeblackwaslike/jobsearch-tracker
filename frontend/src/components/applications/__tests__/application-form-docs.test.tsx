import { describe, expect, it, vi } from "vitest";
import type { ApplicationWithCompany } from "@/lib/queries/applications";
import { render, screen } from "@/test/test-utils";
import { ApplicationForm } from "../application-form";

// ---------------------------------------------------------------------------
// Mock dependencies
// ---------------------------------------------------------------------------

vi.mock("@/lib/queries/applications", () => ({
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
  useUploadDocument: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  documentsQueryOptions: vi.fn((type?: string) => ({
    queryKey: ["documents", { type }],
    queryFn: vi.fn(() => []),
  })),
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

describe("ApplicationForm with documents", () => {
  it("shows Documents fieldset in edit mode", () => {
    render(<ApplicationForm open={true} onOpenChange={vi.fn()} application={mockApplication} />);
    expect(screen.getByText("Documents")).toBeInTheDocument();
  });
});
