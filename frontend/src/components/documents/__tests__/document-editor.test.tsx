import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen } from "@/test/test-utils";
import { DocumentEditor } from "../document-editor";
import { useDocument } from "@/lib/queries/documents";

const updateMutateMock = vi.fn();
const deleteMutateMock = vi.fn();

const mockTextDoc = {
  id: "doc-1",
  user_id: "u1",
  name: "My Resume",
  type: "resume",
  content: "Professional summary here",
  uri: null,
  mime_type: null,
  revision: "v2.1",
  tags: ["engineering", "senior"],
  archived_at: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

const mockUploadedDoc = {
  ...mockTextDoc,
  id: "doc-2",
  name: "Uploaded Resume",
  content: null,
  uri: "user1/doc2/resume.pdf",
  mime_type: "application/pdf",
  revision: null,
  tags: [],
};

vi.mock("@/lib/queries/documents", () => ({
  useDocument: vi.fn(() => ({
    data: mockTextDoc,
    isLoading: false,
  })),
  useUpdateDocument: () => ({
    mutate: updateMutateMock,
    isPending: false,
  }),
  useDeleteDocument: () => ({
    mutate: deleteMutateMock,
    isPending: false,
  }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    storage: {
      from: () => ({
        createSignedUrl: vi
          .fn()
          .mockResolvedValue({
            data: { signedUrl: "https://example.com" },
            error: null,
          }),
      }),
    },
  }),
}));

describe("DocumentEditor", () => {
  beforeEach(() => {
    vi.mocked(useDocument).mockReturnValue({
      data: mockTextDoc,
      isLoading: false,
    } as any);
    updateMutateMock.mockReset();
    deleteMutateMock.mockReset();
  });

  it("renders empty state when no documentId", () => {
    render(<DocumentEditor documentId={undefined} onDeleted={vi.fn()} />);
    expect(
      screen.getByText("Select a document or create a new one")
    ).toBeInTheDocument();
  });

  it("renders text document with name, type, content, and Save button", () => {
    render(<DocumentEditor documentId="doc-1" onDeleted={vi.fn()} />);

    const nameInput = screen.getByDisplayValue("My Resume");
    expect(nameInput).toBeInTheDocument();

    const textarea = screen.getByPlaceholderText("Start writing...");
    expect(textarea).toHaveValue("Professional summary here");

    expect(
      screen.getByRole("button", { name: /Save/ })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Delete/ })
    ).toBeInTheDocument();
  });

  it("renders uploaded document with file info instead of textarea", () => {
    vi.mocked(useDocument).mockReturnValue({
      data: mockUploadedDoc,
      isLoading: false,
    } as any);

    render(<DocumentEditor documentId="doc-2" onDeleted={vi.fn()} />);

    expect(screen.getByText("resume.pdf")).toBeInTheDocument();
    expect(screen.getByText("application/pdf")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Download file/ })
    ).toBeInTheDocument();

    expect(
      screen.queryByPlaceholderText("Start writing...")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Save/ })
    ).not.toBeInTheDocument();
  });

  it("shows delete confirmation dialog", async () => {
    const user = userEvent.setup();
    render(<DocumentEditor documentId="doc-1" onDeleted={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /Delete/ }));

    expect(screen.getByText("Delete Document")).toBeInTheDocument();
    expect(screen.getByText(/Are you sure/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Cancel" })
    ).toBeInTheDocument();
    const deleteButtons = screen.getAllByRole("button", { name: /Delete/ });
    expect(deleteButtons.length).toBeGreaterThanOrEqual(1);
  });

  it("shows revision badge when present", () => {
    render(<DocumentEditor documentId="doc-1" onDeleted={vi.fn()} />);
    expect(screen.getByText("v2.1")).toBeInTheDocument();
  });
});
