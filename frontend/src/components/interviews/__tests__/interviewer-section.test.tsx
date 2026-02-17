import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@/test/test-utils";
import { AddEventDialog } from "@/components/applications/add-event-dialog";

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
  useAddInterviewer: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useRemoveInterviewer: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
}));

describe("AddEventDialog with interviewers", () => {
  it("renders Interviewers section when companyId is provided", () => {
    render(
      <AddEventDialog
        open={true}
        onOpenChange={vi.fn()}
        applicationId="app-1"
        companyId="company-1"
        mode="create"
      />
    );
    expect(screen.getByText("Interviewers")).toBeInTheDocument();
  });

  it("does not render Interviewers section when companyId is not provided", () => {
    render(
      <AddEventDialog
        open={true}
        onOpenChange={vi.fn()}
        applicationId="app-1"
        mode="create"
      />
    );
    expect(screen.queryByText("Interviewers")).not.toBeInTheDocument();
  });

  it("renders the interviewer combobox trigger when companyId is provided", () => {
    render(
      <AddEventDialog
        open={true}
        onOpenChange={vi.fn()}
        applicationId="app-1"
        companyId="company-1"
        mode="create"
      />
    );
    expect(screen.getByText("Search interviewers...")).toBeInTheDocument();
  });
});
