import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/test-utils";
import { SalaryRangeSlider } from "../salary-range-slider";

describe("SalaryRangeSlider", () => {
  it("renders period select", () => {
    render(
      <SalaryRangeSlider period="yearly" currency="USD" min={0} max={200000} onChange={vi.fn()} />,
    );
    expect(screen.getByText("Annual")).toBeInTheDocument();
  });

  it("renders hourly period", () => {
    render(
      <SalaryRangeSlider period="hourly" currency="USD" min={0} max={100} onChange={vi.fn()} />,
    );
    expect(screen.getByText("Hourly")).toBeInTheDocument();
  });

  it("shows formatted range label for annual", () => {
    render(
      <SalaryRangeSlider
        period="yearly"
        currency="USD"
        min={150000}
        max={250000}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText("$150k – $250k")).toBeInTheDocument();
  });
});
