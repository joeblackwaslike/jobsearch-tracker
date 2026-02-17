import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@/test/test-utils";
import { AddEventDialog } from "../add-event-dialog";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const createMutateAsync = vi.fn();
const updateMutateAsync = vi.fn();

vi.mock("@/lib/queries/events", () => ({
  useCreateEvent: () => ({ mutateAsync: createMutateAsync, isPending: false }),
  useUpdateEvent: () => ({ mutateAsync: updateMutateAsync, isPending: false }),
}));

vi.mock("@/lib/queries/event-contacts", () => ({
  useEventContacts: () => ({ data: [] }),
  useAddInterviewer: () => ({ mutateAsync: vi.fn() }),
  useRemoveInterviewer: () => ({ mutateAsync: vi.fn() }),
}));

vi.mock("@/lib/queries/contacts", () => ({
  useSearchContacts: () => ({ data: [], isLoading: false }),
  useCreateContact: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockEvent = {
  id: "evt-1",
  user_id: "u1",
  application_id: "app-1",
  type: "technical_interview",
  status: "scheduled",
  title: "System design round",
  description: "Whiteboard session",
  url: "https://meet.google.com/abc",
  scheduled_at: "2026-03-15T14:30:00Z",
  duration_minutes: 60,
  created_at: "2026-02-01T00:00:00Z",
  updated_at: "2026-02-01T00:00:00Z",
};

const defaultProps = {
  open: true,
  onOpenChange: vi.fn(),
  applicationId: "app-1",
} as const;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("AddEventDialog", () => {
  it("renders create mode with Add Event title", () => {
    render(<AddEventDialog {...defaultProps} mode="create" />);

    expect(
      screen.getByRole("heading", { name: "Add Event" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Add a new event to this application timeline.")
    ).toBeInTheDocument();
  });

  it("renders edit mode with Edit Event title", () => {
    render(
      <AddEventDialog {...defaultProps} mode="edit" event={mockEvent} />
    );

    expect(screen.getByText("Edit Event")).toBeInTheDocument();
    expect(screen.getByText("Update event details.")).toBeInTheDocument();
  });

  it("renders all form field labels", () => {
    render(<AddEventDialog {...defaultProps} mode="create" />);

    const expectedLabels = [
      "Type *",
      "Status",
      "Title",
      "Date",
      "Time",
      "Duration (minutes)",
      "Meeting URL",
      "Description",
    ];

    for (const label of expectedLabels) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("pre-fills title in edit mode", () => {
    render(
      <AddEventDialog {...defaultProps} mode="edit" event={mockEvent} />
    );

    expect(screen.getByLabelText("Title")).toHaveValue("System design round");
  });

  it("shows Interviewers section only when companyId provided", () => {
    const { unmount } = render(
      <AddEventDialog {...defaultProps} mode="create" companyId="c1" />
    );

    expect(screen.getByText("Interviewers")).toBeInTheDocument();

    unmount();

    render(<AddEventDialog {...defaultProps} mode="create" />);

    expect(screen.queryByText("Interviewers")).not.toBeInTheDocument();
  });
});
