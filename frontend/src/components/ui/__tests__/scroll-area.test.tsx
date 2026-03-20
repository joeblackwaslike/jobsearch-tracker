import { describe, expect, it } from "vitest";
import { render } from "@/test/test-utils";
import { ScrollArea } from "../scroll-area";

describe("ScrollArea", () => {
  it("root has overflow-hidden class", () => {
    render(
      <ScrollArea>
        <div>content</div>
      </ScrollArea>,
    );
    const root = document.querySelector('[data-slot="scroll-area"]');
    expect(root).toHaveClass("overflow-hidden");
  });

  it("viewport has max-height inherit style", () => {
    render(
      <ScrollArea>
        <div>content</div>
      </ScrollArea>,
    );
    const viewport = document.querySelector('[data-slot="scroll-area-viewport"]');
    expect(viewport).toHaveStyle({ maxHeight: "inherit" });
  });

  it("renders children inside viewport when max-h set on root", () => {
    render(
      <ScrollArea className="max-h-[100px]">
        <div data-testid="tall-content" style={{ height: "500px" }}>
          tall content
        </div>
      </ScrollArea>,
    );
    const viewport = document.querySelector('[data-slot="scroll-area-viewport"]');
    const content = document.querySelector('[data-testid="tall-content"]');
    expect(viewport).toContainElement(content as HTMLElement);
  });
});
