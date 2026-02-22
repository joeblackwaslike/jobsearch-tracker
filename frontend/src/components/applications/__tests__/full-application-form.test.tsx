import { within } from "@testing-library/react";
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

describe("resume auto-fill and label", () => {
  it("does NOT pre-populate resume from localStorage on open", () => {
    localStorage.setItem("tracker:default_resume_id", "some-doc-id");
    render(<FullApplicationForm open={true} onOpenChange={vi.fn()} />);
    // DocumentTypePicker value should be null (showing "None"), not the stored ID
    const picker = document.querySelector("select, [role='combobox']");
    // The resume picker should not show a pre-selected document
    expect(screen.queryByText("some-doc-id")).not.toBeInTheDocument();
  });

  it("does not render a 'Resume' label in the Documents section", () => {
    render(<FullApplicationForm open={true} onOpenChange={vi.fn()} />);
    expect(screen.queryByText("Resume")).not.toBeInTheDocument();
  });
});

describe("modal overflow regression", () => {
  it("dialog content does not have overflow-hidden class", () => {
    render(<FullApplicationForm open={true} onOpenChange={vi.fn()} />);
    const dialogContent = document.querySelector('[data-slot="dialog-content"]');
    expect(dialogContent).not.toHaveClass("overflow-hidden");
  });

  it("scroll area has a max-height constraint", () => {
    render(<FullApplicationForm open={true} onOpenChange={vi.fn()} />);
    const scrollArea = document.querySelector('[data-slot="scroll-area"]');
    expect(scrollArea?.className).toMatch(/max-h-/);
  });

  it("cancel and submit buttons are inside the scroll area", () => {
    render(<FullApplicationForm open={true} onOpenChange={vi.fn()} />);
    const scrollArea = document.querySelector('[data-slot="scroll-area"]');
    expect(scrollArea).toContainElement(screen.getByRole("button", { name: "Add Application" }));
    expect(scrollArea).toContainElement(screen.getByRole("button", { name: "Cancel" }));
  });
});

describe("source field placement", () => {
  it("renders Source inside the Job Details fieldset", () => {
    render(<FullApplicationForm open={true} onOpenChange={vi.fn()} />);
    const jobDetails = screen.getByText("Job Details").closest("fieldset")!;
    expect(within(jobDetails).getByText("Source")).toBeInTheDocument();
  });

  it("does not render Source in the Additional Information fieldset", () => {
    render(<FullApplicationForm open={true} onOpenChange={vi.fn()} />);
    const additional = screen.getByText("Additional Information").closest("fieldset")!;
    expect(within(additional).queryByText("Source")).not.toBeInTheDocument();
  });
});
