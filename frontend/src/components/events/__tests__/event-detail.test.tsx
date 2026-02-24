import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { EventDetail } from "../event-detail";
import type { EventWithApplication } from "@/lib/queries/events";

vi.mock("@/lib/queries/event-contacts", () => ({
  useEventContacts: vi.fn(() => ({ data: [] })),
}));

const mockEvent: EventWithApplication = {
  id: "1",
  type: "technical_interview",
  status: "scheduled",
  scheduled_at: "2026-02-25T10:00:00Z",
  duration_minutes: 60,
  title: null,
  notes: null,
  url: null,
  description: null,
  application_id: "app1",
  user_id: "u1",
  created_at: "2026-02-20T00:00:00Z",
  updated_at: "2026-02-20T00:00:00Z",
  application: {
    id: "app1",
    position: "Software Engineer",
    status: "applied",
    company: { id: "c1", name: "Test Company" },
  },
} as EventWithApplication;

describe("EventDetail", () => {
  it("renders event type as title when no title set", () => {
    render(<EventDetail event={mockEvent} />);
    expect(screen.getAllByText("Technical Interview").length).toBeGreaterThan(0);
  });

  it("renders status badge", () => {
    render(<EventDetail event={mockEvent} />);
    expect(screen.getByText("scheduled")).toBeInTheDocument();
  });

  it("shows related application", () => {
    render(<EventDetail event={mockEvent} />);
    expect(screen.getByText("Test Company")).toBeInTheDocument();
    expect(screen.getByText("Software Engineer")).toBeInTheDocument();
    expect(screen.getByText("View Application")).toBeInTheDocument();
  });

  it("renders custom title when provided", () => {
    render(<EventDetail event={{ ...mockEvent, title: "Final Round" }} />);
    expect(screen.getByText("Final Round")).toBeInTheDocument();
  });

  it("shows meeting link when url provided", () => {
    render(<EventDetail event={{ ...mockEvent, url: "https://zoom.us/j/123" }} />);
    expect(screen.getByText("https://zoom.us/j/123")).toBeInTheDocument();
    expect(screen.getByText("Open")).toBeInTheDocument();
  });
});
