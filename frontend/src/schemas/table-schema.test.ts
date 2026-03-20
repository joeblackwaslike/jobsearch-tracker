import { describe, expect, it } from "vitest";
import type { ColumnSchema, SchemaData, TableSchema } from "./table-schema";

describe("TableSchema Types", () => {
  it("allows valid schema definition with columns array", () => {
    const schema: TableSchema<{ id: string; name: string; status: string }> = {
      columns: [
        { id: "id", header: "ID", type: "text", sortable: true, minWidth: 100 },
        {
          id: "name",
          header: "Name",
          type: "text",
          sortable: true,
          minWidth: 200,
        },
        {
          id: "status",
          header: "Status",
          type: "enum",
          sortable: true,
          minWidth: 150,
          options: ["active", "inactive", "pending"],
        },
      ],
    };

    expect(schema).toBeDefined();
    expect(schema.columns).toHaveLength(3);
  });

  it("supports all column types", () => {
    const validTypes = ["text", "number", "date", "datetime", "enum", "relation"] as const;
    const schema: TableSchema<{ id: string }> = {
      columns: validTypes.map((type, i) => ({
        id: `col${i}`,
        header: type.charAt(0).toUpperCase() + type.slice(1),
        type,
        sortable: true,
        minWidth: 100,
      })),
    };

    expect(schema.columns).toHaveLength(6);
    schema.columns.forEach((col, i) => {
      expect(col.type).toBe(validTypes[i]);
    });
  });

  it("type-level test for SchemaData type extraction", () => {
    const schema: TableSchema<{ name: string; age: number }> = {
      columns: [
        {
          id: "name",
          header: "Name",
          type: "text",
          sortable: true,
          minWidth: 100,
        },
        {
          id: "age",
          header: "Age",
          type: "number",
          sortable: true,
          minWidth: 100,
        },
      ],
    };

    type ExtractedType = SchemaData<typeof schema>;

    // Type-level assertion - if this compiles without error, it works
    const testData: ExtractedType = { name: "John", age: 30 };
    expect(testData.name).toBe("John");
    expect(testData.age).toBe(30);
  });

  it("schema has expected properties (id, header, type, sortable, minWidth)", () => {
    const column: ColumnSchema<{ id: string }> = {
      id: "test",
      header: "Test Column",
      type: "text",
      sortable: true,
      minWidth: 120,
    };

    expect(column.id).toBe("test");
    expect(column.header).toBe("Test Column");
    expect(column.type).toBe("text");
    expect(column.sortable).toBe(true);
    expect(column.minWidth).toBe(120);
  });

  it("optional properties (grow, align, cell, options) work correctly", () => {
    const columnWithAllOptions: ColumnSchema<{ id: string; value: number }> = {
      id: "col",
      header: "Column",
      type: "text",
      sortable: true,
      minWidth: 100,
      grow: 2,
      align: "center",
      cell: (row) => row.value,
      options: ["opt1", "opt2"],
    };

    expect(columnWithAllOptions.grow).toBe(2);
    expect(columnWithAllOptions.align).toBe("center");
    expect(columnWithAllOptions.cell).toBeDefined();
    expect(columnWithAllOptions.options).toEqual(["opt1", "opt2"]);
  });

  it("schema works with minimal optional properties", () => {
    const columnWithMinOptions: ColumnSchema<{ id: string }> = {
      id: "col",
      header: "Column",
      type: "text",
      sortable: true,
      minWidth: 100,
    };

    expect(columnWithMinOptions).toBeDefined();
    expect(columnWithMinOptions.grow).toBeUndefined();
    expect(columnWithMinOptions.align).toBeUndefined();
    expect(columnWithMinOptions.cell).toBeUndefined();
    expect(columnWithMinOptions.options).toBeUndefined();
  });

  it("schema works with grow only", () => {
    const columnWithGrow: ColumnSchema<{ id: string }> = {
      id: "col",
      header: "Column",
      type: "text",
      sortable: true,
      minWidth: 100,
      grow: 1,
    };

    expect(columnWithGrow.grow).toBe(1);
  });

  it("schema works with align only", () => {
    const columnWithAlign: ColumnSchema<{ id: string }> = {
      id: "col",
      header: "Column",
      type: "text",
      sortable: true,
      minWidth: 100,
      align: "right",
    };

    expect(columnWithAlign.align).toBe("right");
  });

  it("schema works with cell only", () => {
    const columnWithCell: ColumnSchema<{ id: string; text: string }> = {
      id: "col",
      header: "Column",
      type: "text",
      sortable: true,
      minWidth: 100,
      cell: (row) => row.text,
    };

    expect(columnWithCell.cell).toBeDefined();
  });

  it("schema works with options only (for enum type)", () => {
    const columnWithOptions: ColumnSchema<{ id: string; status: string }> = {
      id: "col",
      header: "Column",
      type: "enum",
      sortable: true,
      minWidth: 100,
      options: ["active", "inactive"],
    };

    expect(columnWithOptions.options).toEqual(["active", "inactive"]);
  });

  it("works with complex data types", () => {
    const complexSchema: TableSchema<{
      id: string;
      name: string;
      createdAt: Date;
      updatedAt: Date;
      status: "active" | "inactive";
      priority: number;
      tags: string[];
    }> = {
      columns: [
        { id: "id", header: "ID", type: "text", sortable: true, minWidth: 100 },
        {
          id: "name",
          header: "Name",
          type: "text",
          sortable: true,
          minWidth: 200,
          grow: 2,
        },
        {
          id: "createdAt",
          header: "Created At",
          type: "datetime",
          sortable: true,
          minWidth: 150,
        },
        {
          id: "status",
          header: "Status",
          type: "enum",
          sortable: true,
          minWidth: 120,
          options: ["active", "inactive"],
        },
        {
          id: "priority",
          header: "Priority",
          type: "number",
          sortable: true,
          minWidth: 100,
          align: "right",
        },
        {
          id: "actions",
          header: "Actions",
          type: "text",
          sortable: false,
          minWidth: 150,
          cell: (row) => `actions:${row.id}`,
        },
      ],
    };

    expect(complexSchema.columns).toHaveLength(6);
    expect(complexSchema.columns.some((col) => col.grow === 2)).toBe(true);
    expect(complexSchema.columns.some((col) => col.align === "right")).toBe(true);
    expect(complexSchema.columns.some((col) => col.cell)).toBe(true);
    expect(complexSchema.columns.some((col) => col.options)).toBe(true);
  });
});
