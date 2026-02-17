import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen } from "@/test/test-utils";
import { DocumentPicker } from "../document-picker";

vi.mock("@/lib/queries/documents", () => ({
  useDocuments: vi.fn(() => ({
    data: [
      { id: "d1", name: "My Resume", type: "resume", updated_at: "2026-01-01" },
      { id: "d2", name: "Cover Letter", type: "cover_letter", updated_at: "2026-01-02" },
      { id: "d3", name: "Portfolio", type: "other", updated_at: "2026-01-03" },
    ],
    isLoading: false,
  })),
}));

describe("DocumentPicker", () => {
  it("renders document list grouped by type", () => {
    render(
      <DocumentPicker
        open={true}
        onOpenChange={vi.fn()}
        onSelect={vi.fn()}
        excludeIds={[]}
      />
    );
    expect(screen.getByText("Resumes")).toBeInTheDocument();
    expect(screen.getByText("My Resume")).toBeInTheDocument();
    expect(screen.getByText("Cover Letters")).toBeInTheDocument();
    expect(screen.getByText("Cover Letter")).toBeInTheDocument();
    expect(screen.getByText("Other")).toBeInTheDocument();
    expect(screen.getByText("Portfolio")).toBeInTheDocument();
  });

  it("excludes documents in excludeIds", () => {
    render(
      <DocumentPicker
        open={true}
        onOpenChange={vi.fn()}
        onSelect={vi.fn()}
        excludeIds={["d1"]}
      />
    );
    expect(screen.queryByText("My Resume")).not.toBeInTheDocument();
    expect(screen.getByText("Cover Letter")).toBeInTheDocument();
  });

  it("calls onSelect and closes when a document is clicked", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <DocumentPicker
        open={true}
        onOpenChange={onOpenChange}
        onSelect={onSelect}
        excludeIds={[]}
      />
    );

    await user.click(screen.getByText("My Resume"));

    expect(onSelect).toHaveBeenCalledWith("d1", "My Resume");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("shows empty state when all documents are excluded", () => {
    render(
      <DocumentPicker
        open={true}
        onOpenChange={vi.fn()}
        onSelect={vi.fn()}
        excludeIds={["d1", "d2", "d3"]}
      />
    );
    expect(
      screen.getByText("No documents yet. Create documents on the Documents page.")
    ).toBeInTheDocument();
  });
});
