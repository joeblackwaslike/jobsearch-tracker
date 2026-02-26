import { waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@/test/test-utils";
import { ContactCombobox } from "../contact-combobox";

// Mock the contacts query
vi.mock("@/lib/queries/contacts", () => ({
  useSearchContacts: vi.fn(() => ({ data: [], isLoading: false })),
  useCreateContact: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
}));

describe("ContactCombobox", () => {
  it("renders the trigger button", () => {
    render(<ContactCombobox companyId="company-1" selectedContactIds={[]} onAdd={vi.fn()} />);
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByText("Search contacts...")).toBeInTheDocument();
  });

  it("shows selected contacts as chips", () => {
    const selectedContacts = [
      { id: "c1", name: "Alice Smith" },
      { id: "c2", name: "Bob Jones" },
    ];
    render(
      <ContactCombobox
        companyId="company-1"
        selectedContactIds={["c1", "c2"]}
        selectedContacts={selectedContacts}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    expect(screen.getByText("Bob Jones")).toBeInTheDocument();
  });

  it("calls onRemove when chip X is clicked", async () => {
    const { default: userEvent } = await import("@testing-library/user-event");
    const user = userEvent.setup();
    const onRemove = vi.fn();
    const selectedContacts = [{ id: "c1", name: "Alice Smith" }];

    render(
      <ContactCombobox
        companyId="company-1"
        selectedContactIds={["c1"]}
        selectedContacts={selectedContacts}
        onAdd={vi.fn()}
        onRemove={onRemove}
      />,
    );

    const removeButton = screen.getByLabelText("Remove Alice Smith");
    await user.click(removeButton);
    expect(onRemove).toHaveBeenCalledWith("c1");
  });

  it("focuses search input when combobox opens", async () => {
    render(<ContactCombobox companyId="c1" selectedContactIds={[]} onAdd={vi.fn()} />);
    fireEvent.click(screen.getByRole("combobox"));
    const searchInput = screen.getByPlaceholderText("Search by name...");
    await waitFor(() => {
      expect(document.activeElement).toBe(searchInput);
    });
  });
});
