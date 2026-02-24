import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
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
});
