import { describe, expect, it, vi } from "vitest";
import { AddEventDialog } from "@/components/applications/add-event-dialog";
import { render, screen } from "@/test/test-utils";

vi.mock("@/lib/queries/events", () => ({
  useCreateEvent: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useUpdateEvent: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
}));

vi.mock("@/lib/queries/contacts", () => ({
  useSearchContacts: vi.fn(() => ({ data: [], isLoading: false })),
  useCreateContact: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
}));

vi.mock("@/lib/queries/event-contacts", () => ({
  useEventContacts: vi.fn(() => ({ data: [], isLoading: false })),
  useAddEventContact: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useRemoveEventContact: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
}));

describe("AddEventDialog with contacts", () => {
  it("renders Contacts section when companyId is provided", () => {
    render(
      <AddEventDialog
        open={true}
        onOpenChange={vi.fn()}
        applicationId="app-1"
        companyId="company-1"
        mode="create"
      />,
    );
    expect(screen.getByText("Contacts")).toBeInTheDocument();
  });

  it("does not render Contacts section when companyId is not provided", () => {
    render(
      <AddEventDialog open={true} onOpenChange={vi.fn()} applicationId="app-1" mode="create" />,
    );
    expect(screen.queryByText("Contacts")).not.toBeInTheDocument();
  });

  it("renders the contact combobox trigger when companyId is provided", () => {
    render(
      <AddEventDialog
        open={true}
        onOpenChange={vi.fn()}
        applicationId="app-1"
        companyId="company-1"
        mode="create"
      />,
    );
    expect(screen.getByText("Search contacts...")).toBeInTheDocument();
  });
});
