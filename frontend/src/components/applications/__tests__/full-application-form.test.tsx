import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/test-utils";
import { FullApplicationForm } from "../full-application-form";

vi.mock("@/lib/queries/applications", () => ({
  useCreateApplication: () => ({
    mutateAsync: vi.fn().mockResolvedValue({ id: "new" }),
    isPending: false,
  }),
}));
vi.mock("@/lib/queries/companies", () => ({
  useSearchCompanies: () => ({ data: [], isLoading: false }),
  useCreateCompany: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));
vi.mock("@/lib/queries/documents", () => ({
  useDocuments: () => ({ data: [], isLoading: false }),
  useSnapshotDocument: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUploadDocument: () => ({ mutateAsync: vi.fn(), isPending: false }),
  documentsQueryOptions: vi.fn((type?: string) => ({
    queryKey: ["documents", { type }],
    queryFn: vi.fn(() => []),
  })),
}));

describe("FullApplicationForm", () => {
  it("renders with title New Application", () => {
    render(<FullApplicationForm open={true} onOpenChange={vi.fn()} />);
    expect(screen.getByText("New Application")).toBeInTheDocument();
  });

  it("shows all field group headings", () => {
    render(<FullApplicationForm open={true} onOpenChange={vi.fn()} />);
    expect(screen.getByText("Basic Information")).toBeInTheDocument();
    expect(screen.getByText("Job Details")).toBeInTheDocument();
    expect(screen.getByText("Salary Information")).toBeInTheDocument();
    expect(screen.getByText("Additional Information")).toBeInTheDocument();
  });
});
