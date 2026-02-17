import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@/test/test-utils";
import { ScheduleDialog } from "../schedule-dialog";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/lib/queries/applications", () => ({
  useApplications: () => ({
    data: {
      data: [
        {
          id: "app-1",
          position: "Engineer",
          company_id: "c1",
          company: { name: "Acme" },
          user_id: "u1",
          url: null,
          status: "applied",
          work_type: null,
          employment_type: null,
          location: null,
          salary: null,
          job_description: null,
          interest: null,
          source: null,
          tags: null,
          applied_at: null,
          archived_at: null,
          archived_reason: null,
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-01T00:00:00Z",
        },
      ],
      count: 1,
    },
    isLoading: false,
  }),
}));

vi.mock("@/lib/queries/events", () => ({
  useCreateEvent: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock("@/lib/queries/event-contacts", () => ({
  useAddInterviewer: () => ({ mutateAsync: vi.fn() }),
}));

vi.mock("@/lib/queries/contacts", () => ({
  useSearchContacts: () => ({ data: [], isLoading: false }),
  useCreateContact: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const defaultProps = {
  open: true,
  onOpenChange: vi.fn(),
} as const;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ScheduleDialog", () => {
  it("renders Schedule Interview title and form fields", () => {
    render(<ScheduleDialog {...defaultProps} />);

    expect(
      screen.getByRole("heading", { name: "Schedule Interview" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Schedule a new interview for an existing application.")
    ).toBeInTheDocument();

    const expectedLabels = [
      "Application *",
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

  it("shows application combobox with placeholder", () => {
    render(<ScheduleDialog {...defaultProps} />);

    const placeholder = screen.getByText("Select application...");
    expect(placeholder).toBeInTheDocument();

    const combobox = placeholder.closest("[role='combobox']");
    expect(combobox).toBeInTheDocument();
  });

  it("shows Cancel and Schedule Interview buttons", () => {
    render(<ScheduleDialog {...defaultProps} />);

    expect(
      screen.getByRole("button", { name: "Cancel" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Schedule Interview" })
    ).toBeInTheDocument();
  });

  it("validates application is required on submit", async () => {
    const { default: userEvent } = await import("@testing-library/user-event");
    const user = userEvent.setup();

    render(<ScheduleDialog {...defaultProps} />);

    await user.click(
      screen.getByRole("button", { name: "Schedule Interview" })
    );

    await waitFor(() => {
      expect(screen.getByText("Application is required")).toBeInTheDocument();
    });
  });
});
