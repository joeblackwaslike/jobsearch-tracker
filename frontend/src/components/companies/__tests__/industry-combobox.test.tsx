import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { IndustryCombobox } from "../industry-combobox";

describe("IndustryCombobox", () => {
  it("renders with placeholder when no value", () => {
    render(<IndustryCombobox value="" onChange={vi.fn()} />);
    expect(screen.getByRole("combobox")).toHaveTextContent("Select industry");
  });

  it("shows selected value", () => {
    render(<IndustryCombobox value="Analytics" onChange={vi.fn()} />);
    expect(screen.getByRole("combobox")).toHaveTextContent("Analytics");
  });

  it("filters options by search input", async () => {
    render(<IndustryCombobox value="" onChange={vi.fn()} />);
    await userEvent.click(screen.getByRole("combobox"));
    await userEvent.type(screen.getByPlaceholderText("Search industry..."), "fin");
    expect(screen.getByText("Finance and Accounting")).toBeInTheDocument();
    expect(screen.queryByText("Analytics")).not.toBeInTheDocument();
  });

  it("calls onChange when an option is selected", async () => {
    const onChange = vi.fn();
    render(<IndustryCombobox value="" onChange={onChange} />);
    await userEvent.click(screen.getByRole("combobox"));
    await userEvent.click(screen.getByText("Analytics"));
    expect(onChange).toHaveBeenCalledWith("Analytics");
  });
});
