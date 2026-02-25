import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { UniversalTable } from "../universal-table";

const mockSchema = {
  columns: [
    { id: "name", header: "Name", type: "text" as const, sortable: true, minWidth: 150 },
    { id: "value", header: "Value", type: "number" as const, sortable: false, minWidth: 100 },
  ],
} as const;

const mockData = [
  { id: "1", name: "Item 1", value: 10 },
  { id: "2", name: "Item 2", value: 20 },
];

describe("UniversalTable", () => {
  it("renders table with schema", () => {
    render(<UniversalTable data={mockData} schema={mockSchema} />);
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Value")).toBeInTheDocument();
  });

  it("renders rows from data", () => {
    render(<UniversalTable data={mockData} schema={mockSchema} />);
    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Item 2")).toBeInTheDocument();
  });

  it("calls onRowClick when row clicked", () => {
    const onRowClick = vi.fn();
    render(<UniversalTable data={mockData} schema={mockSchema} onRowClick={onRowClick} />);
    fireEvent.click(screen.getByText("Item 1"));
    expect(onRowClick).toHaveBeenCalledWith(mockData[0]);
  });

  it("highlights selected row", () => {
    render(<UniversalTable data={mockData} schema={mockSchema} selectedId="1" />);
    const row1 = screen.getByText("Item 1").closest("tr");
    const row2 = screen.getByText("Item 2").closest("tr");
    if (row1) {
      expect(row1).toHaveClass("bg-muted");
    }
    if (row2) {
      expect(row2).not.toHaveClass("bg-muted");
    }
  });

  it("shows empty state when no data", () => {
    render(<UniversalTable data={[]} schema={mockSchema} />);
    expect(screen.getByText("No records found")).toBeInTheDocument();
  });
});
