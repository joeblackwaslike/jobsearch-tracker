import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@/test/test-utils";
import { CompanyContacts } from "../company-contacts";

vi.mock("@/lib/queries/contacts", () => ({
  useContacts: vi.fn(() => ({ data: [], isLoading: false })),
  useCreateContact: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useUpdateContact: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useDeleteContact: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
}));

describe("CompanyContacts", () => {
  it("renders empty state when no contacts", () => {
    render(<CompanyContacts companyId="company-1" />);
    expect(screen.getByText("No contacts yet")).toBeInTheDocument();
  });

  it("renders Add Contact button", () => {
    render(<CompanyContacts companyId="company-1" />);
    expect(screen.getByText("Add Contact")).toBeInTheDocument();
  });
});
