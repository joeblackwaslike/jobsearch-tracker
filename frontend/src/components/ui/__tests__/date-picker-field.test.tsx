import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@/test/test-utils";
import { DatePickerField } from "../date-picker-field";

describe("DatePickerField", () => {
  it("renders placeholder when no value", () => {
    render(<DatePickerField value="" onChange={vi.fn()} placeholder="Pick a date" />);
    expect(screen.getByRole("button")).toHaveTextContent("Pick a date");
  });

  it("renders formatted date when value provided", () => {
    render(<DatePickerField value="2026-03-15" onChange={vi.fn()} />);
    expect(screen.getByRole("button")).toHaveTextContent("Mar 15, 2026");
  });

  it("opens popover on button click", async () => {
    render(<DatePickerField value="" onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole("button"));
    expect(document.querySelector("[data-slot='calendar']")).toBeInTheDocument();
  });
});
