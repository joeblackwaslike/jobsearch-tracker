import { within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@/test/test-utils";
import { FullApplicationForm } from "../full-application-form";

const mockCreateCompanyMutateAsync = vi
  .fn()
  .mockResolvedValue({ id: "company-1", name: "Acme Corp" });

vi.mock("@/lib/queries/applications", () => ({
  useCreateApplication: () => ({
    mutateAsync: vi.fn().mockResolvedValue({ id: "new" }),
    isPending: false,
  }),
  useUpdateApplication: () => ({
    mutateAsync: vi.fn().mockResolvedValue({ id: "updated" }),
    isPending: false,
  }),
}));
vi.mock("@/lib/queries/companies", () => ({
  useSearchCompanies: () => ({ data: [], isLoading: false }),
  useCreateCompany: () => ({ mutateAsync: mockCreateCompanyMutateAsync, isPending: false }),
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
vi.mock("@/components/documents/document-type-picker", () => ({
  DocumentTypePicker: ({ value }: { value: string | null }) => (
    <div data-testid="document-type-picker" data-value={value ?? "__none__"} />
  ),
}));

describe("FullApplicationForm", () => {
  it("renders with title New Application", () => {
    render(<FullApplicationForm open={true} onOpenChange={vi.fn()} />);
    expect(screen.getByRole("heading", { name: "New Application" })).toBeInTheDocument();
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
  it("DOES pre-populate resume from localStorage on open", () => {
    localStorage.setItem("tracker:default_resume_id", "some-doc-id");
    render(<FullApplicationForm open={true} onOpenChange={vi.fn()} />);
    // DocumentTypePicker should receive the stored id as its value prop.
    const picker = screen.getByTestId("document-type-picker");
    expect(picker).toHaveAttribute("data-value", "some-doc-id");
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
    expect(scrollArea).toContainElement(screen.getByRole("button", { name: "New Application" }));
    expect(scrollArea).toContainElement(screen.getByRole("button", { name: "Cancel" }));
  });
});

describe("url import prefill", () => {
  it("pre-fills all URL import fields when importData is provided", async () => {
    render(
      <FullApplicationForm
        open={true}
        onOpenChange={vi.fn()}
        importData={{
          jobUrl: "https://example.com/job",
          position: "Staff Engineer",
          companyName: "Acme Corp",
          locations: ["Remote"],
          workType: "remote",
          employmentType: "full-time",
          salaryMin: 150000,
          salaryMax: 200000,
          salaryCurrency: "USD",
          jobDescription: "Build great things",
          source: "LinkedIn",
        }}
      />,
    );
    expect(screen.getByDisplayValue("Staff Engineer")).toBeInTheDocument();
    expect(screen.getByDisplayValue("https://example.com/job")).toBeInTheDocument();
  });
});

describe("source field placement", () => {
  it("renders Source inside the Job Details fieldset", () => {
    render(<FullApplicationForm open={true} onOpenChange={vi.fn()} />);
    const jobDetails = screen.getByText("Job Details").closest("fieldset") as HTMLElement;
    expect(within(jobDetails).getByText("Source")).toBeInTheDocument();
  });

  it("does not render Source in the Additional Information fieldset", () => {
    render(<FullApplicationForm open={true} onOpenChange={vi.fn()} />);
    const additional = screen
      .getByText("Additional Information")
      .closest("fieldset") as HTMLElement;
    expect(within(additional).queryByText("Source")).not.toBeInTheDocument();
  });
});

describe("auto-create company on import", () => {
  it("calls createCompany.mutateAsync with companyName when importData is provided", async () => {
    mockCreateCompanyMutateAsync.mockClear();
    render(
      <FullApplicationForm
        open={true}
        onOpenChange={vi.fn()}
        importData={{
          jobUrl: "https://example.com/job",
          position: "Staff Engineer",
          companyName: "Acme Corp",
          locations: ["Remote"],
          workType: "remote",
          employmentType: "full-time",
          salaryMin: 150000,
          salaryMax: 200000,
          salaryCurrency: "USD",
          jobDescription: "Build great things",
          source: "LinkedIn",
        }}
      />,
    );

    await waitFor(() => {
      expect(mockCreateCompanyMutateAsync).toHaveBeenCalledWith({ name: "Acme Corp" });
    });
  });

  it("does NOT call createCompany.mutateAsync when importData has no companyName", async () => {
    mockCreateCompanyMutateAsync.mockClear();
    render(
      <FullApplicationForm
        open={true}
        onOpenChange={vi.fn()}
        importData={{
          jobUrl: "https://example.com/job",
          position: "Staff Engineer",
        }}
      />,
    );

    // Give the effect time to fire if it were going to
    await new Promise((r) => setTimeout(r, 50));
    expect(mockCreateCompanyMutateAsync).not.toHaveBeenCalled();
  });
});
