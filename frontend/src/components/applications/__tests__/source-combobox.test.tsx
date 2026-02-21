import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/test-utils";
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
});
