import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@/test/test-utils";
import { UrlInput } from "../url-input";

describe("UrlInput", () => {
  it("renders an input", () => {
    render(<UrlInput value="" onChange={vi.fn()} />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("calls onChange when typing", () => {
    const onChange = vi.fn();
    render(<UrlInput value="" onChange={onChange} />);
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "https://example.com" },
    });
    expect(onChange).toHaveBeenCalledWith("https://example.com");
  });

  it("shows no error for valid URL on blur", () => {
    render(<UrlInput value="https://example.com" onChange={vi.fn()} />);
    fireEvent.blur(screen.getByRole("textbox"));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows error for invalid URL on blur when validate=true", () => {
    render(<UrlInput value="not-a-url" onChange={vi.fn()} validate />);
    fireEvent.blur(screen.getByRole("textbox"));
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("allows blank when allowBlank=true (default)", () => {
    render(<UrlInput value="" onChange={vi.fn()} validate />);
    fireEvent.blur(screen.getByRole("textbox"));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("rejects blank when allowBlank=false", () => {
    render(<UrlInput value="" onChange={vi.fn()} validate allowBlank={false} />);
    fireEvent.blur(screen.getByRole("textbox"));
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("shows external error prop", () => {
    render(<UrlInput value="" onChange={vi.fn()} error="Required" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Required");
  });

  it("strips whitespace before validating", () => {
    render(<UrlInput value="  https://example.com  " onChange={vi.fn()} validate />);
    fireEvent.blur(screen.getByRole("textbox"));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
