import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageLayout } from "../page-layout";

describe("PageLayout", () => {
  it("renders children without detail panel", () => {
    render(
      <PageLayout detailPanel={null} onDetailClose={() => {}}>
        <div>Main Content</div>
      </PageLayout>,
    );
    expect(screen.getByText("Main Content")).toBeInTheDocument();
  });

  it("renders children with detail panel", () => {
    render(
      <PageLayout detailPanel={<div>Detail Content</div>} onDetailClose={() => {}}>
        <div>Main Content</div>
      </PageLayout>,
    );
    expect(screen.getByText("Main Content")).toBeInTheDocument();
    expect(screen.getByText("Detail Content")).toBeInTheDocument();
  });

  it("accepts detailHeaderActions and passes to panel", () => {
    render(
      <PageLayout
        detailPanel={<div>Panel content</div>}
        detailHeaderActions={<button type="button">Edit</button>}
        showDetailPanel={true}
      >
        <div>Main</div>
      </PageLayout>,
    );
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
  });
});
