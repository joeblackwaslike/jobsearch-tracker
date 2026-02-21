import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/test-utils";
import { DocumentTypePicker } from "../document-type-picker";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockDocuments = [
  { id: "d1", name: "My Resume", type: "resume", updated_at: "2026-01-01" },
  { id: "d2", name: "Cover Letter", type: "cover_letter", updated_at: "2026-01-02" },
];

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/lib/queries/documents", () => ({
  documentsQueryOptions: vi.fn(() => ({
    queryKey: ["documents", { type: undefined }],
    queryFn: async () => mockDocuments,
  })),
}));

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-query")>();
  return {
    ...actual,
    useQuery: vi.fn(() => ({ data: mockDocuments })),
  };
});

// Mock shadcn Select with a native <select> element so jsdom can interact with it.
// The native <select> has the implicit ARIA role "combobox" in jsdom.
vi.mock("@/components/ui/select", () => ({
  Select: ({
    value,
    onValueChange,
    children,
  }: {
    value: string;
    onValueChange: (val: string) => void;
    children: React.ReactNode;
  }) => (
    <select value={value} onChange={(e) => onValueChange(e.target.value)}>
      {children}
    </select>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectValue: ({ placeholder }: { placeholder?: string }) => (
    <option value="" disabled>
      {placeholder ?? ""}
    </option>
  ),
  SelectContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectItem: ({ value, children }: { value: string; children: React.ReactNode }) => (
    <option value={value}>{children}</option>
  ),
}));

vi.mock("../upload-dialog", () => ({
  UploadDialog: ({
    open,
    onSuccess,
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: (id: string) => void;
  }) => {
    if (!open) return null;
    return (
      <div>
        <span>Upload Dialog</span>
        <button type="button" onClick={() => onSuccess?.("new-doc-id")}>
          Simulate Upload
        </button>
      </div>
    );
  },
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("DocumentTypePicker", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders a select combobox trigger", () => {
    render(<DocumentTypePicker value={null} onChange={vi.fn()} />);
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("shows document names as options", () => {
    render(<DocumentTypePicker value={null} onChange={vi.fn()} />);
    expect(screen.getByRole("option", { name: "My Resume" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Cover Letter" })).toBeInTheDocument();
  });

  it('shows "Attach new…" as the last option', () => {
    render(<DocumentTypePicker value={null} onChange={vi.fn()} />);
    const options = screen.getAllByRole("option");
    const lastOption = options[options.length - 1];
    expect(lastOption).toHaveTextContent("Attach new…");
  });

  it("calls onChange with the selected document when one is chosen", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DocumentTypePicker value={null} onChange={onChange} />);

    await user.selectOptions(screen.getByRole("combobox"), "d1");

    expect(onChange).toHaveBeenCalledWith(mockDocuments[0]);
  });

  it('opens UploadDialog when "Attach new…" is selected', async () => {
    const user = userEvent.setup();
    render(<DocumentTypePicker value={null} onChange={vi.fn()} />);

    await user.selectOptions(screen.getByRole("combobox"), "__attach_new__");

    expect(screen.getByText("Upload Dialog")).toBeInTheDocument();
  });

  it("calls onChange with new document id after upload success", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DocumentTypePicker value={null} onChange={onChange} />);

    await user.selectOptions(screen.getByRole("combobox"), "__attach_new__");
    await user.click(screen.getByRole("button", { name: "Simulate Upload" }));

    expect(onChange).toHaveBeenCalledWith({ id: "new-doc-id" });
  });
});
