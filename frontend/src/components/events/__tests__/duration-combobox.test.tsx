import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@/test/test-utils";
import { DurationCombobox } from "../duration-combobox";

describe("DurationCombobox", () => {
  it("shows placeholder when no value", () => {
    render(<DurationCombobox value={undefined} onChange={vi.fn()} />);
    expect(screen.getByRole("combobox", { name: "Duration" })).toHaveTextContent(
      "Select duration...",
    );
  });

  it("shows formatted value when preset selected", () => {
    render(<DurationCombobox value={30} onChange={vi.fn()} />);
    expect(screen.getByRole("combobox", { name: "Duration" })).toHaveTextContent("30 min");
  });

  it("shows formatted value for custom duration", () => {
    render(<DurationCombobox value={75} onChange={vi.fn()} />);
    expect(screen.getByRole("combobox", { name: "Duration" })).toHaveTextContent("1 hr 15 min");
  });

  it("calls onChange with preset value when option selected", async () => {
    const onChange = vi.fn();
    const { default: userEvent } = await import("@testing-library/user-event");
    const user = userEvent.setup();
    render(<DurationCombobox value={undefined} onChange={onChange} />);
    await user.click(screen.getByRole("combobox", { name: "Duration" }));
    await user.click(screen.getByText("30 min"));
    expect(onChange).toHaveBeenCalledWith(30);
  });

  it("calls onChange with undefined when None selected", async () => {
    const onChange = vi.fn();
    const { default: userEvent } = await import("@testing-library/user-event");
    const user = userEvent.setup();
    render(<DurationCombobox value={30} onChange={onChange} />);
    await user.click(screen.getByRole("combobox", { name: "Duration" }));
    await user.click(screen.getByText("None"));
    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  it("has correct value for 20 min option (not 15)", () => {
    const onChange = vi.fn();
    render(<DurationCombobox value={undefined} onChange={onChange} />);
    fireEvent.click(screen.getByRole("combobox"));
    expect(screen.getByText("20 min")).toBeInTheDocument();
  });

  it("shows 'Use N min' option when typing a valid non-preset number", async () => {
    render(<DurationCombobox value={undefined} onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole("combobox"));
    const input = screen.getByPlaceholderText(/minutes/i);
    fireEvent.change(input, { target: { value: "90" } });
    // 90 is a preset — no custom item
    expect(screen.queryByText(/use 90 min/i)).not.toBeInTheDocument();
    // Now try a non-preset
    fireEvent.change(input, { target: { value: "77" } });
    expect(screen.getByText(/use 77 min/i)).toBeInTheDocument();
  });

  it("selecting 'Use N min' calls onChange with parsed number", () => {
    const onChange = vi.fn();
    render(<DurationCombobox value={undefined} onChange={onChange} />);
    fireEvent.click(screen.getByRole("combobox"));
    const input = screen.getByPlaceholderText(/minutes/i);
    fireEvent.change(input, { target: { value: "77" } });
    fireEvent.click(screen.getByText(/use 77 min/i));
    expect(onChange).toHaveBeenCalledWith(77);
  });

  it("pressing Enter when input matches a preset: last onChange call is the preset value", async () => {
    const onChange = vi.fn();
    const { default: userEvent } = await import("@testing-library/user-event");
    const user = userEvent.setup();
    render(<DurationCombobox value={undefined} onChange={onChange} />);
    await user.click(screen.getByRole("combobox", { name: "Duration" }));
    const input = screen.getByPlaceholderText(/minutes/i);
    await user.type(input, "30");
    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenLastCalledWith(30);
  });

  it("pressing Enter with a valid custom number: last onChange call is that number", async () => {
    const onChange = vi.fn();
    const { default: userEvent } = await import("@testing-library/user-event");
    const user = userEvent.setup();
    render(<DurationCombobox value={undefined} onChange={onChange} />);
    await user.click(screen.getByRole("combobox", { name: "Duration" }));
    const input = screen.getByPlaceholderText(/minutes/i);
    await user.type(input, "77");
    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenLastCalledWith(77);
  });
});
