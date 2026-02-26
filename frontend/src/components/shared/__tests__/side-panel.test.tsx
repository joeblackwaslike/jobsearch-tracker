import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SidePanel } from "../side-panel";

describe("SidePanel", () => {
  beforeEach(() => {
    vi.stubGlobal("window", { innerWidth: 1024 });
  });

  it("does not render when closed", () => {
    const { container } = render(
      <SidePanel isOpen={false} onClose={vi.fn()}>
        <div>Content</div>
      </SidePanel>,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders when open", () => {
    render(
      <SidePanel isOpen={true} onClose={vi.fn()}>
        <div>Content</div>
      </SidePanel>,
    );
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("calls onClose when backdrop clicked", () => {
    const onClose = vi.fn();
    render(
      <SidePanel isOpen={true} onClose={onClose}>
        <div>Content</div>
      </SidePanel>,
    );
    const backdrop = screen.getByTestId("side-panel-backdrop");
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when close button clicked", () => {
    const onClose = vi.fn();
    render(
      <SidePanel isOpen={true} onClose={onClose}>
        <div>Content</div>
      </SidePanel>,
    );
    const closeButton = screen.getByRole("button", { name: /close/i });
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders headerActions to the left of the close button", () => {
    render(
      <SidePanel
        isOpen={true}
        onClose={vi.fn()}
        headerActions={<button type="button">Edit</button>}
      >
        <div>Content</div>
      </SidePanel>,
    );
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
  });

  it("does not render a 'Details' heading", () => {
    render(
      <SidePanel isOpen={true} onClose={vi.fn()}>
        <div>Content</div>
      </SidePanel>,
    );
    expect(screen.queryByText("Details")).not.toBeInTheDocument();
  });
});
