import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@/test/test-utils";
import { CityMultiCombobox } from "../city-multi-combobox";

describe("CityMultiCombobox", () => {
  it("renders with placeholder when empty", () => {
    render(<CityMultiCombobox value={[]} onChange={vi.fn()} />);
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("displays selected values as badges", () => {
    render(<CityMultiCombobox value={["New York, NY", "Austin, TX"]} onChange={vi.fn()} />);
    expect(screen.getByText("New York, NY")).toBeInTheDocument();
    expect(screen.getByText("Austin, TX")).toBeInTheDocument();
  });

  it("calls onChange with new array when a city is removed", () => {
    const onChange = vi.fn();
    render(<CityMultiCombobox value={["New York, NY", "Austin, TX"]} onChange={onChange} />);
    // Each badge has an ×/remove button with aria-label="Remove {city}"
    const removeButtons = screen.getAllByRole("button", { name: /remove/i });
    fireEvent.click(removeButtons[0]);
    expect(onChange).toHaveBeenCalledWith(["Austin, TX"]);
  });
});
