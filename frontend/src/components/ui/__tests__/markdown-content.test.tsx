import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MarkdownContent } from "../markdown-content";

describe("MarkdownContent", () => {
  it("renders plain text", () => {
    render(<MarkdownContent content="Hello world" />);
    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });

  it("renders bold text from markdown", () => {
    render(<MarkdownContent content="**bold text**" />);
    const bold = document.querySelector("strong");
    expect(bold).toBeInTheDocument();
    expect(bold?.textContent).toBe("bold text");
  });

  it("renders a bulleted list from markdown", () => {
    render(<MarkdownContent content={"- item one\n- item two"} />);
    expect(screen.getByText("item one")).toBeInTheDocument();
    expect(screen.getByText("item two")).toBeInTheDocument();
    expect(document.querySelectorAll("li")).toHaveLength(2);
  });

  it("renders a heading from markdown", () => {
    render(<MarkdownContent content="## Section" />);
    expect(document.querySelector("h2")).toBeInTheDocument();
  });

  it("renders nothing when content is null", () => {
    const { container } = render(<MarkdownContent content={null} />);
    expect(container.firstChild).toBeNull();
  });
});
