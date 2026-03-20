import { act, renderHook } from "@testing-library/react";
import { useTableState } from "./use-table-state";

describe("useTableState", () => {
  it("should initialize with default values", () => {
    const { result } = renderHook(() => useTableState());

    expect(result.current.filters).toEqual({});
    expect(result.current.sorting).toEqual([]);
    expect(result.current.page).toBe(1);
    expect(result.current.pageSize).toBe(25);
    expect(result.current.selectedId).toBeNull();
  });

  it("should initialize with custom initial values", () => {
    const initialFilters = { status: "active", priority: "high" };
    const initialSorting = [{ id: "date", desc: true }];
    const initialPageSize = 50;
    const initialPage = 2;

    const { result } = renderHook(() =>
      useTableState({
        initialFilters,
        initialSorting,
        initialPageSize,
        initialPage,
      }),
    );

    expect(result.current.filters).toEqual(initialFilters);
    expect(result.current.sorting).toEqual(initialSorting);
    expect(result.current.page).toBe(initialPage);
    expect(result.current.pageSize).toBe(initialPageSize);
    expect(result.current.selectedId).toBeNull();
  });

  it("should update filters with setFilters", () => {
    const { result } = renderHook(() => useTableState());

    act(() => {
      result.current.setFilters({ status: "active", priority: "high" });
    });

    expect(result.current.filters).toEqual({
      status: "active",
      priority: "high",
    });
  });

  it("should update filters with updateFilter", () => {
    const { result } = renderHook(() => useTableState());

    act(() => {
      result.current.updateFilter("status", "active");
      result.current.updateFilter("priority", "high");
    });

    expect(result.current.filters).toEqual({
      status: "active",
      priority: "high",
    });
  });

  it("should update sorting with setSorting", () => {
    const { result } = renderHook(() => useTableState());

    act(() => {
      result.current.setSorting([{ id: "date", desc: true }]);
    });

    expect(result.current.sorting).toEqual([{ id: "date", desc: true }]);
  });

  it("should update page and pageSize", () => {
    const { result } = renderHook(() => useTableState());

    act(() => {
      result.current.setPage(3);
      result.current.setPageSize(100);
    });

    expect(result.current.page).toBe(3);
    expect(result.current.pageSize).toBe(100);
  });

  it("should update selectedId", () => {
    const { result } = renderHook(() => useTableState());

    act(() => {
      result.current.setSelectedId("123-abc");
    });

    expect(result.current.selectedId).toBe("123-abc");
  });

  it("should reset filters and reset page to 1", () => {
    const { result } = renderHook(() =>
      useTableState({
        initialFilters: { status: "active" },
        initialPage: 5,
      }),
    );

    // Set some filters and navigate to page 5
    act(() => {
      result.current.setFilters({ status: "inactive" });
      result.current.setPage(5);
    });

    expect(result.current.filters).toEqual({ status: "inactive" });
    expect(result.current.page).toBe(5);

    // Reset filters
    act(() => {
      result.current.resetFilters();
    });

    expect(result.current.filters).toEqual({});
    expect(result.current.page).toBe(1);
  });

  it("should reset sorting and reset page to 1", () => {
    const { result } = renderHook(() =>
      useTableState({
        initialSorting: [{ id: "date", desc: true }],
        initialPage: 3,
      }),
    );

    // Set sorting and navigate to page 3
    act(() => {
      result.current.setSorting([{ id: "name", desc: false }]);
      result.current.setPage(3);
    });

    expect(result.current.sorting).toEqual([{ id: "name", desc: false }]);
    expect(result.current.page).toBe(3);

    // Reset sorting
    act(() => {
      result.current.resetSorting();
    });

    expect(result.current.sorting).toEqual([]);
    expect(result.current.page).toBe(1);
  });

  it("should reset all state (filters, sorting, page, selectedId)", () => {
    const { result } = renderHook(() =>
      useTableState({
        initialFilters: { status: "active" },
        initialSorting: [{ id: "date", desc: true }],
        initialPage: 2,
        initialPageSize: 10,
      }),
    );

    // Modify all state
    act(() => {
      result.current.setFilters({ status: "inactive" });
      result.current.setSorting([{ id: "name", desc: false }]);
      result.current.setPage(5);
      result.current.setPageSize(20);
      result.current.setSelectedId("123-abc");
    });

    // Reset all
    act(() => {
      result.current.resetAll();
    });

    expect(result.current.filters).toEqual({});
    expect(result.current.sorting).toEqual([]);
    expect(result.current.page).toBe(1);
    expect(result.current.pageSize).toBe(25); // Should reset to default, not initial value
    expect(result.current.selectedId).toBeNull();
  });

  it("should work with generic filter types", () => {
    const { result } = renderHook(() => useTableState<{ status?: string; priority?: string }>());

    act(() => {
      result.current.updateFilter("status", "active");
      result.current.updateFilter("priority", "high");
    });

    expect(result.current.filters).toEqual({
      status: "active",
      priority: "high",
    });
  });

  it("should preserve existing filters when updating single filter", () => {
    const { result } = renderHook(() => useTableState());

    // Set multiple filters
    act(() => {
      result.current.setFilters({
        status: "active",
        priority: "high",
        location: "NYC",
      });
    });

    // Update only one filter
    act(() => {
      result.current.updateFilter("status", "inactive");
    });

    expect(result.current.filters).toEqual({
      status: "inactive",
      priority: "high",
      location: "NYC",
    });
  });

  it("should handle null/undefined in filter values", () => {
    const { result } = renderHook(() => useTableState());

    act(() => {
      result.current.updateFilter("status", null);
      result.current.updateFilter("priority", undefined);
    });

    expect(result.current.filters).toEqual({
      status: null,
      priority: undefined,
    });
  });
});
