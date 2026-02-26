import { describe, expect, it } from "vitest";
import { applicationTableSchema, companyTableSchema, eventTableSchema } from "./table-schemas";

describe("table-schemas", () => {
  describe("applicationTableSchema", () => {
    it("has expected columns count", () => {
      expect(applicationTableSchema.columns).toHaveLength(8);
    });

    it("position column has correct config", () => {
      const posCol = applicationTableSchema.columns.find((c) => c.id === "position");
      expect(posCol?.id).toBe("position");
      expect(posCol?.header).toBe("Position");
      expect(posCol?.type).toBe("text");
      expect(posCol?.sortable).toBe(true);
      expect(posCol?.minWidth).toBe(200);
      expect(posCol?.grow).toBe(2);
    });

    it("company.name column has correct config", () => {
      const col = applicationTableSchema.columns.find((c) => c.id === "company.name");
      expect(col?.id).toBe("company.name");
      expect(col?.header).toBe("Company");
      expect(col?.type).toBe("relation");
      expect(col?.minWidth).toBe(150);
      expect(col?.grow).toBe(1.5);
    });

    it("status column is enum type with options", () => {
      const col = applicationTableSchema.columns.find((c) => c.id === "status");
      expect(col?.id).toBe("status");
      expect(col?.type).toBe("enum");
      expect(col?.options).toContain("applied");
      expect(col?.options).toContain("interviewing");
      expect(col?.options).toContain("offer");
    });

    it("interest column is enum type with options", () => {
      const col = applicationTableSchema.columns.find((c) => c.id === "interest");
      expect(col?.id).toBe("interest");
      expect(col?.type).toBe("enum");
      expect(col?.options).toContain("low");
      expect(col?.options).toContain("medium");
      expect(col?.options).toContain("high");
      expect(col?.options).toContain("dream");
    });

    it("has cell renderer for status column", () => {
      const col = applicationTableSchema.columns.find((c) => c.id === "status");
      expect(col?.cell).toBeDefined();
      expect(typeof col?.cell).toBe("function");
    });

    it("has cell renderer for interest column", () => {
      const col = applicationTableSchema.columns.find((c) => c.id === "interest");
      expect(col?.cell).toBeDefined();
      expect(typeof col?.cell).toBe("function");
    });

    it("location column has correct config", () => {
      const col = applicationTableSchema.columns.find((c) => c.id === "location");
      expect(col?.id).toBe("location");
      expect(col?.header).toBe("Location");
      expect(col?.type).toBe("text");
      expect(col?.minWidth).toBe(150);
      expect(col?.grow).toBe(1);
    });

    it("applied_at column is date type", () => {
      const col = applicationTableSchema.columns.find((c) => c.id === "applied_at");
      expect(col?.id).toBe("applied_at");
      expect(col?.header).toBe("Applied Date");
      expect(col?.type).toBe("date");
      expect(col?.sortable).toBe(true);
      expect(col?.minWidth).toBe(130);
    });

    it("updated_at column is datetime type", () => {
      const col = applicationTableSchema.columns.find((c) => c.id === "updated_at");
      expect(col?.id).toBe("updated_at");
      expect(col?.header).toBe("Updated Date");
      expect(col?.type).toBe("datetime");
      expect(col?.sortable).toBe(true);
      expect(col?.minWidth).toBe(140);
    });
  });

  describe("companyTableSchema", () => {
    it("has expected columns count", () => {
      expect(companyTableSchema.columns).toHaveLength(6);
    });

    it("name column has correct config", () => {
      const col = companyTableSchema.columns.find((c) => c.id === "name");
      expect(col?.id).toBe("name");
      expect(col?.header).toBe("Name");
      expect(col?.type).toBe("text");
      expect(col?.grow).toBe(2);
      expect(col?.minWidth).toBe(200);
    });

    it("industry column has correct config", () => {
      const col = companyTableSchema.columns.find((c) => c.id === "industry");
      expect(col?.id).toBe("industry");
      expect(col?.header).toBe("Industry");
      expect(col?.type).toBe("text");
      expect(col?.minWidth).toBe(150);
    });

    it("location column has correct config", () => {
      const col = companyTableSchema.columns.find((c) => c.id === "location");
      expect(col?.id).toBe("location");
      expect(col?.header).toBe("Location");
      expect(col?.type).toBe("text");
      expect(col?.minWidth).toBe(150);
    });

    it("size column has correct config", () => {
      const col = companyTableSchema.columns.find((c) => c.id === "size");
      expect(col?.id).toBe("size");
      expect(col?.header).toBe("Size");
      expect(col?.type).toBe("text");
      expect(col?.minWidth).toBe(120);
      expect(col?.grow).toBe(0.5);
    });

    it("researched column is enum with centered alignment", () => {
      const col = companyTableSchema.columns.find((c) => c.id === "researched");
      expect(col?.id).toBe("researched");
      expect(col?.header).toBe("Researched");
      expect(col?.type).toBe("enum");
      expect(col?.align).toBe("center");
      expect(col?.minWidth).toBe(100);
    });

    it("does not include a tags column", () => {
      const ids = companyTableSchema.columns.map((c) => c.id);
      expect(ids).not.toContain("tags");
    });
  });

  describe("eventTableSchema", () => {
    it("has expected columns count", () => {
      expect(eventTableSchema.columns).toHaveLength(5);
    });

    it("application.company.name column has correct config", () => {
      const col = eventTableSchema.columns.find((c) => c.id === "application.company.name");
      expect(col?.id).toBe("application.company.name");
      expect(col?.header).toBe("Company");
      expect(col?.type).toBe("relation");
      expect(col?.minWidth).toBe(180);
      expect(col?.grow).toBe(1.5);
    });

    it("application.position column has correct config", () => {
      const col = eventTableSchema.columns.find((c) => c.id === "application.position");
      expect(col?.id).toBe("application.position");
      expect(col?.header).toBe("Position");
      expect(col?.type).toBe("relation");
      expect(col?.minWidth).toBe(200);
      expect(col?.grow).toBe(2);
    });

    it("type column is enum type", () => {
      const col = eventTableSchema.columns.find((c) => c.id === "type");
      expect(col?.id).toBe("type");
      expect(col?.header).toBe("Type");
      expect(col?.type).toBe("enum");
      expect(col?.minWidth).toBe(120);
    });

    it("status column is enum type", () => {
      const col = eventTableSchema.columns.find((c) => c.id === "status");
      expect(col?.id).toBe("status");
      expect(col?.header).toBe("Status");
      expect(col?.type).toBe("enum");
      expect(col?.minWidth).toBe(140);
    });

    it("scheduled_at column is datetime type", () => {
      const col = eventTableSchema.columns.find((c) => c.id === "scheduled_at");
      expect(col?.id).toBe("scheduled_at");
      expect(col?.header).toBe("Date");
      expect(col?.type).toBe("datetime");
      expect(col?.sortable).toBe(true);
      expect(col?.minWidth).toBe(180);
    });
  });
});
