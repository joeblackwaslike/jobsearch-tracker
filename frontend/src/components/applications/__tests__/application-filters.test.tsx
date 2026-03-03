import { fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/test-utils";
import { ApplicationFilters, type ApplicationFiltersState } from "../application-filters";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const defaultProps = {
  filters: {} as ApplicationFiltersState,
  onFiltersChange: vi.fn(),
  columnVisibility: {},
  onColumnVisibilityChange: vi.fn(),
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ApplicationFilters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders search input and all filter buttons", () => {
    render(<ApplicationFilters {...defaultProps} />);

    expect(screen.getByPlaceholderText("Search applications...")).toBeInTheDocument();

    expect(screen.getByRole("button", { name: /Status/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Interest/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Work Type/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Employment/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Columns/ })).toBeInTheDocument();
  });

  it("calls onFiltersChange with search text after debounce", () => {
    vi.useFakeTimers();

    const onFiltersChange = vi.fn();
    render(<ApplicationFilters {...defaultProps} onFiltersChange={onFiltersChange} />);

    const input = screen.getByPlaceholderText("Search applications...");
    fireEvent.change(input, { target: { value: "engineer" } });

    // Should not be called before debounce elapses
    expect(onFiltersChange).not.toHaveBeenCalled();

    // Advance past the 300ms debounce
    vi.advanceTimersByTime(300);

    expect(onFiltersChange).toHaveBeenCalledWith(expect.objectContaining({ search: "engineer" }));
  });

  it("shows Clear filters button only when filters are active", () => {
    const { rerender } = render(<ApplicationFilters {...defaultProps} />);

    expect(screen.queryByRole("button", { name: /Clear filters/ })).not.toBeInTheDocument();

    rerender(<ApplicationFilters {...defaultProps} filters={{ status: ["applied"] }} />);

    expect(screen.getByRole("button", { name: /Clear filters/ })).toBeInTheDocument();
  });

  it("calls onFiltersChange with empty object when Clear filters clicked", async () => {
    const user = userEvent.setup();
    const onFiltersChange = vi.fn();

    render(
      <ApplicationFilters
        {...defaultProps}
        filters={{ status: ["applied"] }}
        onFiltersChange={onFiltersChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Clear filters/ }));

    expect(onFiltersChange).toHaveBeenCalledWith({});
  });

  it("shows filter count badge when items selected", () => {
    render(
      <ApplicationFilters {...defaultProps} filters={{ status: ["applied", "interviewing"] }} />,
    );

    const statusButton = screen.getByRole("button", { name: /Status/ });
    expect(statusButton).toHaveTextContent("2");
  });
});
