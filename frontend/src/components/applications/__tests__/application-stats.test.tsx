import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/test-utils";
import { ApplicationStats } from "../application-stats";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        is: vi.fn(() => ({
          gte: vi.fn(() => ({
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          })),
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        })),
      })),
    })),
  })),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const defaultProps = {};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ApplicationStats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders All time and This week sections", () => {
    render(<ApplicationStats {...defaultProps} />);

    expect(screen.getByText(/All time/i)).toBeInTheDocument();
    expect(screen.getByText(/This week/i)).toBeInTheDocument();
  });

  it("renders four stat cards in each section", () => {
    render(<ApplicationStats {...defaultProps} />);

    // All time section
    expect(screen.getAllByText(/Total/i)).toHaveLength(2);
    expect(screen.getAllByText(/Active/i)).toHaveLength(2);
    expect(screen.getAllByText(/Response rate/i)).toHaveLength(2);
    expect(screen.getAllByText(/Interviews/i)).toHaveLength(2);
  });

  it("shows -- placeholders when loading or no data", () => {
    render(<ApplicationStats {...defaultProps} />);

    // When data is loading/unavailable, it should show -- for stats
    const allDashes = screen.getAllByText("--");
    expect(allDashes.length).toBeGreaterThan(0);
  });

  it("displays icons for each stat card", () => {
    render(<ApplicationStats {...defaultProps} />);

    // Check that SVG icons are rendered (8 cards total, each has an icon)
    const icons = document.querySelectorAll("svg.lucide");
    expect(icons.length).toBe(8); // 4 cards x 2 sections
  });
});
