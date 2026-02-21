import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@/test/test-utils";
import { CompanyForm } from "../company-form";

const createMutateAsync = vi.fn();
const updateMutateAsync = vi.fn();

vi.mock("@/lib/queries/companies", () => ({
  useCreateCompany: () => ({ mutateAsync: createMutateAsync, isPending: false }),
  useUpdateCompany: () => ({ mutateAsync: updateMutateAsync, isPending: false }),
}));

vi.mock("@/lib/queries/contacts", () => ({
  useContacts: () => ({ data: [], isLoading: false }),
  useSearchContacts: () => ({ data: [], isLoading: false }),
  useCreateContact: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateContact: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteContact: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

const mockCompany = {
  id: "c-1",
  user_id: "u1",
  name: "Acme Corp",
  description: "A tech company",
  links: {
    website: "https://acme.com",
    linkedin: "https://linkedin.com/acme",
    careers: "",
    glassdoor: "",
    news: "",
  },
  industry: "Technology",
  size: "51-200",
  location: "San Francisco",
  founded: "2015-01-01",
  culture: "Fast-paced",
  benefits: "401k",
  pros: "Good pay",
  cons: "Long hours",
  tech_stack: "React, Node",
  ratings: {
    overall: "4",
    culture: "5",
    work_life: "",
    compensation: "",
    growth: "",
    management: "",
  },
  tags: ["startup", "remote"],
  researched: true,
  archived_at: null,
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
  website: null,
  notes: null,
  glassdoor_url: null,
  linkedin_url: null,
};

const noop = vi.fn();

describe("CompanyForm", () => {
  it("renders create mode with Add Company title and full form", () => {
    render(<CompanyForm open={true} onOpenChange={noop} mode="create" />);

    expect(screen.getByRole("heading", { name: "Add Company" })).toBeInTheDocument();
    expect(screen.getByText("Basic Information")).toBeInTheDocument();
    expect(screen.getByText("Links")).toBeInTheDocument();
    expect(screen.getByText("Research Notes")).toBeInTheDocument();
    expect(screen.getByText("Ratings (1-5)")).toBeInTheDocument();
  });

  it("renders edit mode with all section headings", () => {
    render(
      <CompanyForm open={true} onOpenChange={noop} mode="edit" company={mockCompany as never} />,
    );

    expect(screen.getByText("Edit Company")).toBeInTheDocument();
    expect(screen.getByText("Basic Information")).toBeInTheDocument();
    expect(screen.getByText("Links")).toBeInTheDocument();
    expect(screen.getByText("Research Notes")).toBeInTheDocument();
    expect(screen.getByText("Ratings (1-5)")).toBeInTheDocument();
    expect(screen.getByText("Tags & Status")).toBeInTheDocument();
    expect(screen.getByText("Contacts")).toBeInTheDocument();
  });

  it("pre-fills name in edit mode", () => {
    render(
      <CompanyForm open={true} onOpenChange={noop} mode="edit" company={mockCompany as never} />,
    );

    expect(screen.getByLabelText("Name *")).toHaveValue("Acme Corp");
  });

  it("validates name is required on create submit", async () => {
    const user = userEvent.setup();

    render(<CompanyForm open={true} onOpenChange={noop} mode="create" />);

    await user.click(screen.getByRole("button", { name: "Add Company" }));

    await waitFor(() => {
      expect(screen.getByText("Name is required")).toBeInTheDocument();
    });
  });

  it("shows correct submit button text per mode", () => {
    const { rerender } = render(<CompanyForm open={true} onOpenChange={noop} mode="create" />);

    expect(screen.getByRole("button", { name: "Add Company" })).toBeInTheDocument();

    rerender(
      <CompanyForm open={true} onOpenChange={noop} mode="edit" company={mockCompany as never} />,
    );

    expect(screen.getByRole("button", { name: "Save Changes" })).toBeInTheDocument();
  });

  it("shows Contacts section in edit mode", () => {
    render(
      <CompanyForm open={true} onOpenChange={noop} mode="edit" company={mockCompany as never} />,
    );

    expect(screen.getByText("Contacts")).toBeInTheDocument();
  });
});
