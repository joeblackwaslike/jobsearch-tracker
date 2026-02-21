import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@/test/test-utils";
import { TagInput } from "../tag-input";

describe("TagInput", () => {
  it("renders existing tags as chips", () => {
    render(<TagInput value={["react", "typescript"]} onChange={vi.fn()} />);
    expect(screen.getByText("react")).toBeInTheDocument();
    expect(screen.getByText("typescript")).toBeInTheDocument();
  });

  it("adds a tag when comma is typed", () => {
    const onChange = vi.fn();
    render(<TagInput value={[]} onChange={onChange} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "react," } });
    expect(onChange).toHaveBeenCalledWith(["react"]);
  });

  it("removes a tag when × is clicked", () => {
    const onChange = vi.fn();
    render(<TagInput value={["react"]} onChange={onChange} />);
    const removeBtn = screen.getByRole("button", { name: /remove react/i });
    fireEvent.click(removeBtn);
    expect(onChange).toHaveBeenCalledWith([]);
  });
});
