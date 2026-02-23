import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/test-utils";
import { EventTimeline } from "../event-timeline";

vi.mock("@/lib/queries/events", () => ({
  useDeleteEvent: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useCreateEvent: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateEvent: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock("@/lib/queries/event-contacts", () => ({
  useEventContacts: () => ({ data: [] }),
  useAddEventContact: () => ({ mutateAsync: vi.fn() }),
  useRemoveEventContact: () => ({ mutateAsync: vi.fn() }),
}));

vi.mock("@/lib/queries/contacts", () => ({
  useSearchContacts: () => ({ data: [], isLoading: false }),
  useCreateContact: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

const mockEvents = [
  {
    id: "evt-1",
    user_id: "u1",
    application_id: "app-1",
    type: "screening_interview",
    status: "scheduled",
    title: "Phone screen with HR",
    description: "Discuss role",
    url: "https://zoom.us/123",
    scheduled_at: "2026-02-20T14:00:00Z",
    duration_minutes: 30,
    notes: "",
    created_at: "2026-02-01T00:00:00Z",
    updated_at: "2026-02-01T00:00:00Z",
  },
  {
    id: "evt-2",
    user_id: "u1",
    application_id: "app-1",
    type: "offer",
    status: "completed",
    title: null,
    description: null,
    url: null,
    scheduled_at: "2026-03-01T10:00:00Z",
    duration_minutes: null,
    notes: "",
    created_at: "2026-03-01T00:00:00Z",
    updated_at: "2026-03-01T00:00:00Z",
  },
];

describe("EventTimeline", () => {
  it("renders empty state when no events", () => {
    render(<EventTimeline events={[]} applicationId="app-1" />);

    expect(
      screen.getByText("No events yet. Add an event to start tracking your timeline."),
    ).toBeInTheDocument();
  });

  it("renders event type labels and status badges", () => {
    render(<EventTimeline events={mockEvents} applicationId="app-1" />);

    expect(screen.getByText("Screening Interview")).toBeInTheDocument();
    expect(screen.getByText("Offer")).toBeInTheDocument();
    expect(screen.getByText("Scheduled")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
  });

  it("renders event title when present", () => {
    render(<EventTimeline events={mockEvents} applicationId="app-1" />);

    expect(screen.getByText("Phone screen with HR")).toBeInTheDocument();
  });

  it("renders multiple events", () => {
    render(<EventTimeline events={mockEvents} applicationId="app-1" />);

    expect(screen.getByText("Screening Interview")).toBeInTheDocument();
    expect(screen.getByText("Offer")).toBeInTheDocument();
  });
});
