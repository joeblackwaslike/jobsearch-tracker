import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/test-utils";
import { CityCombobox } from "../city-combobox";

describe("CityCombobox", () => {
  it("renders with placeholder", () => {
    render(<CityCombobox value="" onChange={vi.fn()} />);
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("displays selected value", () => {
    render(<CityCombobox value="San Francisco, CA" onChange={vi.fn()} />);
    expect(screen.getByText("San Francisco, CA")).toBeInTheDocument();
  });
});
