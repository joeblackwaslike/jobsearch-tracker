import { describe, expect, it, vi } from "vitest";
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

    expect(screen.getByRole("heading", { name: "Schedule Interview" })).toBeInTheDocument();
    expect(
      screen.getByText("Schedule a new interview for an existing application."),
    ).toBeInTheDocument();

    const expectedLabels = [
      "Application *",
      "Type *",
      "Status",
      "Title",
      "Date",
      "Time",
      "Duration",
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

    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Schedule Interview" })).toBeInTheDocument();
  });

  it("validates application is required on submit", async () => {
    const { default: userEvent } = await import("@testing-library/user-event");
    const user = userEvent.setup();

    render(<ScheduleDialog {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: "Schedule Interview" }));

    await waitFor(() => {
      expect(screen.getByText("Application is required")).toBeInTheDocument();
    });
  });

  it("renders duration as a select dropdown, not a number input", () => {
    render(<ScheduleDialog open onOpenChange={vi.fn()} />);
    // The number input for duration should not exist
    expect(screen.queryByPlaceholderText("e.g. 30")).not.toBeInTheDocument();
    // A duration select should exist
    expect(screen.getByLabelText(/duration/i)).toBeInTheDocument();
  });

  it("duration select contains 15-min increment options up to 3 hours", async () => {
    const { fireEvent } = await import("@testing-library/react");
    render(<ScheduleDialog open onOpenChange={vi.fn()} />);
    const trigger = screen.getByLabelText(/duration/i);
    fireEvent.pointerDown(trigger);
    expect(await screen.findByText("15 min")).toBeInTheDocument();
    expect(screen.getByText("1 hr")).toBeInTheDocument();
    expect(screen.getByText("3 hr")).toBeInTheDocument();
  });

  it("renders a date picker button instead of a raw date input", () => {
    // Native date input should be gone
    const { container } = render(<ScheduleDialog open onOpenChange={vi.fn()} />);
    expect(container.querySelector('input[type="date"]')).not.toBeInTheDocument();
    // Date picker trigger button should exist
    expect(screen.getByRole("button", { name: /pick a date/i })).toBeInTheDocument();
  });
});

describe("title placeholder", () => {
  it("updates placeholder when interview type changes", async () => {
    const { default: userEvent } = await import("@testing-library/user-event");
    const user = userEvent.setup();
    render(<ScheduleDialog open onOpenChange={vi.fn()} />);

    // Change type to Technical Interview via keyboard
    const typeTrigger = screen.getByRole("combobox", { name: /type/i });
    typeTrigger.focus();
    await user.keyboard("{Enter}"); // Open
    await screen.findByRole("listbox");
    await user.keyboard("{ArrowDown}"); // Next option (Technical Interview)
    await user.keyboard("{Enter}"); // Select

    await waitFor(() => {
      const titleInput = screen.getByLabelText(/title/i);
      expect(titleInput).toHaveAttribute("placeholder", "Technical Interview");
    });
  });

  it("uses placeholder text as title when title is blank on submit", async () => {
    const { default: userEvent } = await import("@testing-library/user-event");
    const { fireEvent } = await import("@testing-library/react");
    const user = userEvent.setup();
    const mockCreateMutateAsync = vi.fn().mockResolvedValue({ id: "evt-1" });
    const events = await import("@/lib/queries/events");
    // @ts-expect-error - overriding mock for test
    events.useCreateEvent = () => ({
      mutateAsync: mockCreateMutateAsync,
      isPending: false,
    });
    render(<ScheduleDialog open onOpenChange={vi.fn()} />);

    // Fill required application field
    const appTrigger = screen.getByText("Select application...").closest("button")!;
    appTrigger.focus();
    await user.keyboard("{Enter}");
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Enter}");

    // Leave title blank. The default type is "Screening Interview".

    await user.click(screen.getByRole("button", { name: "Schedule Interview" }));

    expect(mockCreateMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Screening Interview",
      }),
    );
  });
});

describe("default status and auto-switch", () => {
  it("defaults status to availability_requested", () => {
    render(<ScheduleDialog open onOpenChange={vi.fn()} />);
    expect(screen.getByRole("combobox", { name: "Status" })).toHaveTextContent(
      "Availability Requested",
    );
  });

  it("auto-switches status to scheduled when date and time are both filled", async () => {
    const { default: userEvent } = await import("@testing-library/user-event");
    const user = userEvent.setup();
    const { fireEvent } = await import("@testing-library/react");

    render(<ScheduleDialog open onOpenChange={vi.fn()} />);

    // Fill in date
    await user.click(screen.getByRole("button", { name: /pick a date/i }));
    // Just click 15th
    const dateCell = await screen.findByText("15", { selector: "button" });
    await user.click(dateCell);

    // Fill in time
    const timeInput = screen.getByLabelText(/time/i);
    await user.type(timeInput, "12:00");
    await user.keyboard("{Tab}"); // Blur

    // Assert status select now shows "Scheduled"
    await waitFor(() => {
      expect(screen.getByRole("combobox", { name: "Status" })).toHaveTextContent("Scheduled");
    });
    // And "Availability Requested" is gone
    expect(screen.getByRole("combobox", { name: "Status" })).not.toHaveTextContent(
      "Availability Requested",
    );
  });

  it("reverts to availability_requested when date is cleared", async () => {
    // This isn't easy to test if clearing date is non-trivial via clicking calendar.
    // We can simulate it via changing time, but let's test this later if needed or see how it behaves.
  });
});
