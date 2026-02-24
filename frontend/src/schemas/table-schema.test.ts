import { describe, it, expect } from 'vitest';
import type { TableSchema, ColumnSchema, ColumnType, SchemaData } from './table-schema';

describe('TableSchema Types', () => {
  it('should allow valid schema definition with columns array', () => {
    const schema: TableSchema<{ id: string; name: string; status: string }> = {
      columns: [
        {
          id: 'id',
          header: 'ID',
          type: 'text',
          sortable: true,
          minWidth: 100,
        },
        {
          id: 'name',
          header: 'Name',
          type: 'text',
          sortable: true,
          minWidth: 200,
        },
        {
          id: 'status',
          header: 'Status',
          type: 'enum',
          sortable: true,
          minWidth: 150,
          options: ['active', 'inactive', 'pending'],
        },
      ],
    };

    expect(schema).toBeDefined();
    expect(schema.columns).toHaveLength(3);
    expect(schema.columns[0].id).toBe('id');
    expect(schema.columns[0].header).toBe('ID');
    expect(schema.columns[0].type).toBe('text');
    expect(schema.columns[0].sortable).toBe(true);
    expect(schema.columns[0].minWidth).toBe(100);
  });

  it('should support all column types', () => {
    const schema: TableSchema<any> = {
      columns: [
        { id: 'textCol', header: 'Text', type: 'text', sortable: true, minWidth: 100 },
        { id: 'numberCol', header: 'Number', type: 'number', sortable: true, minWidth: 100 },
        { id: 'dateCol', header: 'Date', type: 'date', sortable: true, minWidth: 100 },
        { id: 'datetimeCol', header: 'DateTime', type: 'datetime', sortable: true, minWidth: 100 },
        { id: 'enumCol', header: 'Enum', type: 'enum', sortable: true, minWidth: 100, options: ['a', 'b'] },
        { id: 'relationCol', header: 'Relation', type: 'relation', sortable: true, minWidth: 100 },
      ],
    };

    expect(schema.columns).toHaveLength(6);
    expect(schema.columns[0].type).toBe('text');
    expect(schema.columns[1].type).toBe('number');
    expect(schema.columns[2].type).toBe('date');
    expect(schema.columns[3].type).toBe('datetime');
    expect(schema.columns[4].type).toBe('enum');
    expect(schema.columns[5].type).toBe('relation');
  });

  it('should type-level test for SchemaData type extraction', () => {
    // This test verifies the SchemaData<T> type can extract the data type
    const schema = {
      columns: [
        { id: 'name', header: 'Name', type: 'text', sortable: true, minWidth: 100 },
        { id: 'age', header: 'Age', type: 'number', sortable: true, minWidth: 100 },
      ],
    } as const satisfies TableSchema<{ name: string; age: number }>;

    type ExtractedType = SchemaData<typeof schema>;
    // This should be equivalent to { name: string; age: number }
    const testData: ExtractedType = { name: 'John', age: 30 };

    expect(testData).toEqual({ name: 'John', age: 30 });
  });

  it('should schema has expected properties (id, header, type, sortable, minWidth)', () => {
    const column: ColumnSchema<{ id: string }> = {
      id: 'test',
      header: 'Test Column',
      type: 'text',
      sortable: true,
      minWidth: 120,
    };

    expect(column.id).toBe('test');
    expect(column.header).toBe('Test Column');
    expect(column.type).toBe('text');
    expect(column.sortable).toBe(true);
    expect(column.minWidth).toBe(120);
  });

  it('should optional properties (grow, align, cell, options) work correctly', () => {
    const columnWithAllOptions: ColumnSchema<{ id: string; value: number }> = {
      id: 'col',
      header: 'Column',
      type: 'text',
      sortable: true,
      minWidth: 100,
      grow: 2,
      align: 'center',
      cell: (row) => row.value,
      options: ['opt1', 'opt2'], // This should not cause error even for non-enum type
    };

    expect(columnWithAllOptions.grow).toBe(2);
    expect(columnWithAllOptions.align).toBe('center');
    expect(columnWithAllOptions.cell).toBeDefined();
    expect(columnWithAllOptions.options).toBeDefined();

    // Test with minimal optional properties
    const columnWithMinOptions: ColumnSchema<{ id: string }> = {
      id: 'col',
      header: 'Column',
      type: 'text',
      sortable: true,
      minWidth: 100,
      // No optional properties
    };

    expect(columnWithMinOptions).toBeDefined();

    // Test with grow only
    const columnWithGrow: ColumnSchema<{ id: string }> = {
      id: 'col',
      header: 'Column',
      type: 'text',
      sortable: true,
      minWidth: 100,
      grow: 1,
    };

    expect(columnWithGrow.grow).toBe(1);

    // Test with align only
    const columnWithAlign: ColumnSchema<{ id: string }> = {
      id: 'col',
      header: 'Column',
      type: 'text',
      sortable: true,
      minWidth: 100,
      align: 'right',
    };

    expect(columnWithAlign.align).toBe('right');

    // Test with cell only
    const columnWithCell: ColumnSchema<{ id: string; text: string }> = {
      id: 'col',
      header: 'Column',
      type: 'text',
      sortable: true,
      minWidth: 100,
      cell: (row) => row.text,
    };

    expect(columnWithCell.cell).toBeDefined();

    // Test with options only (for enum type)
    const columnWithOptions: ColumnSchema<{ id: string; status: string }> = {
      id: 'col',
      header: 'Column',
      type: 'enum',
      sortable: true,
      minWidth: 100,
      options: ['active', 'inactive'],
    };

    expect(columnWithOptions.options).toEqual(['active', 'inactive']);
  });

  it('should work with complex data types', () => {
    const complexSchema: TableSchema<{
      id: string;
      name: string;
      createdAt: Date;
      updatedAt: Date;
      status: 'active' | 'inactive';
      priority: number;
      tags: string[];
    }> = {
      columns: [
        {
          id: 'id',
          header: 'ID',
          type: 'text',
          sortable: true,
          minWidth: 100,
        },
        {
          id: 'name',
          header: 'Name',
          type: 'text',
          sortable: true,
          minWidth: 200,
          grow: 2,
        },
        {
          id: 'createdAt',
          header: 'Created At',
          type: 'datetime',
          sortable: true,
          minWidth: 150,
        },
        {
          id: 'status',
          header: 'Status',
          type: 'enum',
          sortable: true,
          minWidth: 120,
          options: ['active', 'inactive'],
        },
        {
          id: 'priority',
          header: 'Priority',
          type: 'number',
          sortable: true,
          minWidth: 100,
          align: 'right',
        },
        {
          id: 'actions',
          header: 'Actions',
          type: 'text',
          sortable: false,
          minWidth: 150,
          cell: (row) => `actions:${row.id}`,
        },
      ],
    };

    expect(complexSchema.columns).toHaveLength(6);
    expect(complexSchema.columns.some(col => col.grow === 2)).toBe(true);
    expect(complexSchema.columns.some(col => col.align === 'right')).toBe(true);
    expect(complexSchema.columns.some(col => col.cell)).toBe(true);
    expect(complexSchema.columns.some(col => col.options)).toBe(true);
  });
});