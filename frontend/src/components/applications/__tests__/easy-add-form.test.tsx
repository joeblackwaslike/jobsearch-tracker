import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/test-utils";
import { EasyAddForm } from "../easy-add-form";

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

describe("EasyAddForm", () => {
  it("renders the dialog with title", () => {
    render(<EasyAddForm open={true} onOpenChange={vi.fn()} />);
    expect(screen.getByText("Easy Add Application")).toBeInTheDocument();
  });

  it("shows Company, Position, URL, Resume fields", () => {
    render(<EasyAddForm open={true} onOpenChange={vi.fn()} />);
    expect(screen.getByText("Company *")).toBeInTheDocument();
    expect(screen.getByText("Position *")).toBeInTheDocument();
    expect(screen.getByText("URL")).toBeInTheDocument();
    expect(screen.getByText("Resume")).toBeInTheDocument();
  });
});
