import { useCallback, useState } from "react";

// Define types based on the interface
export type SortingState = Array<{ id: string; desc: boolean }>;

interface UseTableStateOptions<TFilter = Record<string, unknown>> {
  initialFilters?: TFilter;
  initialSorting?: SortingState;
  initialPageSize?: number;
  initialPage?: number;
}

interface UseTableStateReturn<TFilter = Record<string, unknown>> {
  // Filter state
  filters: TFilter;
  setFilters: React.Dispatch<React.SetStateAction<TFilter>>;
  updateFilter: <K extends keyof TFilter>(key: K, value: TFilter[K]) => void;

  // Sorting state
  sorting: SortingState;
  setSorting: React.Dispatch<React.SetStateAction<SortingState>>;

  // Pagination
  page: number;
  pageSize: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  setPageSize: React.Dispatch<React.SetStateAction<number>>;

  // Selection
  selectedId: string | null;
  setSelectedId: React.Dispatch<React.SetStateAction<string | null>>;

  // Reset helpers
  resetFilters: () => void;
  resetSorting: () => void;
  resetAll: () => void;
}

export function useTableState<TFilter = Record<string, unknown>>(
  options: UseTableStateOptions<TFilter> = {},
): UseTableStateReturn<TFilter> {
  const {
    initialFilters = {} as TFilter,
    initialSorting = [],
    initialPageSize = 25,
    initialPage = 1,
  } = options;

  // State declarations
  const [filters, setFilters] = useState<TFilter>(initialFilters);
  const [sorting, setSorting] = useState<SortingState>(initialSorting);
  const [page, setPage] = useState<number>(initialPage);
  const [pageSize, setPageSize] = useState<number>(initialPageSize);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Callbacks wrapped with useCallback for optimization
  const updateFilter = useCallback(<K extends keyof TFilter>(key: K, value: TFilter[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({} as TFilter);
    setPage(1);
  }, []);

  const resetSorting = useCallback(() => {
    setSorting([]);
    setPage(1);
  }, []);

  const resetAll = useCallback(() => {
    setFilters({} as TFilter);
    setSorting([]);
    setPage(1);
    setPageSize(25); // Reset to default, not initial value
    setSelectedId(null);
  }, []);

  return {
    filters,
    setFilters,
    updateFilter,
    sorting,
    setSorting,
    page,
    pageSize,
    setPage,
    setPageSize,
    selectedId,
    setSelectedId,
    resetFilters,
    resetSorting,
    resetAll,
  };
}
