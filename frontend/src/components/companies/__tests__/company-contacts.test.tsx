import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/test-utils";
import { CompanyContacts } from "../company-contacts";

vi.mock("@/lib/queries/contacts", () => ({
  useContacts: vi.fn(() => ({ data: [], isLoading: false })),
  useCreateContact: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useUpdateContact: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useArchiveContact: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
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

  it("renders Source input in the add contact form", async () => {
    const user = userEvent.setup();
    render(<CompanyContacts companyId="c-1" />);
    await user.click(screen.getByRole("button", { name: /add contact/i }));
    expect(screen.getByLabelText(/source/i)).toBeInTheDocument();
  });
});
