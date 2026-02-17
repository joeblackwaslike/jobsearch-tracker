import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@/test/test-utils";
import { ApplicationDocuments } from "../application-documents";

vi.mock("@/lib/queries/application-documents", () => ({
  useApplicationDocuments: vi.fn(() => ({ data: [], isLoading: false })),
  useDetachDocument: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
}));

vi.mock("@/lib/queries/documents", () => ({
  useDocuments: vi.fn(() => ({ data: [], isLoading: false })),
  useSnapshotDocument: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
}));

describe("ApplicationDocuments", () => {
  it("renders empty state when no documents attached", () => {
    render(<ApplicationDocuments applicationId="app-1" />);
    expect(screen.getByText("No documents attached")).toBeInTheDocument();
  });

  it("renders Attach Document button", () => {
    render(<ApplicationDocuments applicationId="app-1" />);
    expect(screen.getByText("Attach Document")).toBeInTheDocument();
  });
});
