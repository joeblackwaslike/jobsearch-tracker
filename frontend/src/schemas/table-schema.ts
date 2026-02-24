import type * as React from "react";

export type ColumnType = "text" | "number" | "date" | "datetime" | "enum" | "relation";

export interface ColumnSchema<T> {
  id: string;
  header: string;
  type: ColumnType;
  sortable: boolean;
  minWidth: number;
  grow?: number;
  align?: "left" | "center" | "right";
  cell?: (row: T) => React.ReactNode;
  options?: string[];
}

export interface TableSchema<T> {
  readonly columns: ReadonlyArray<ColumnSchema<T>>;
}

export type SchemaData<T> = T extends TableSchema<infer U> ? U : never;