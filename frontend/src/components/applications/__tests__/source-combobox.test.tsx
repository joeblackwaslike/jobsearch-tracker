import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@/test/test-utils";
import { SourceCombobox } from "../source-combobox";

describe("SourceCombobox", () => {
  it("renders with placeholder when no value", () => {
    render(<SourceCombobox value="" onChange={vi.fn()} />);
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("displays selected value", () => {
    render(<SourceCombobox value="linkedin" onChange={vi.fn()} />);
    expect(screen.getByText("linkedin")).toBeInTheDocument();
  });

  it("shows all options when opened even when a value is selected", async () => {
    render(<SourceCombobox value="linkedin" onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole("combobox"));
    // Should show other options, not just linkedin
    expect(screen.getByText("indeed")).toBeInTheDocument();
  });

  it("calls onChange with custom value when user types and confirms", async () => {
    const onChange = vi.fn();
    render(<SourceCombobox value="" onChange={onChange} />);
    fireEvent.click(screen.getByRole("combobox"));
    const input = screen.getByPlaceholderText("Search or type source...");
    fireEvent.change(input, { target: { value: "custom-board" } });
    // CommandEmpty "Use custom-board" button (text may be split across nodes due to HTML entities)
    fireEvent.click(
      screen.getByText((_content, element) => {
        return (
          element?.tagName === "BUTTON" && (element.textContent ?? "").includes("custom-board")
        );
      }),
    );
    expect(onChange).toHaveBeenCalledWith("custom-board");
  });
});
