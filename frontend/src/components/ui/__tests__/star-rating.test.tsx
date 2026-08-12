import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@/test/test-utils";
import { StarRating } from "../star-rating";

describe("StarRating", () => {
  it("renders 5 star buttons", () => {
    render(<StarRating value={null} onChange={vi.fn()} />);
    expect(screen.getAllByRole("button")).toHaveLength(5);
  });

  it("calls onChange with star number when clicked", () => {
    const onChange = vi.fn();
    render(<StarRating value={null} onChange={onChange} />);
    fireEvent.click(screen.getAllByRole("button")[2]); // 3rd star = value 3
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it("clears rating when the current star is clicked again", () => {
    const onChange = vi.fn();
    render(<StarRating value={3} onChange={onChange} />);
    fireEvent.click(screen.getAllByRole("button")[2]); // click star 3 again
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("renders with accessible label via aria-label on container", () => {
    render(<StarRating value={4} onChange={vi.fn()} aria-label="Overall rating" />);
    expect(screen.getByRole("group", { name: "Overall rating" })).toBeInTheDocument();
  });
});
