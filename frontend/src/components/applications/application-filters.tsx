import type { VisibilityState } from "@tanstack/react-table";
import { ColumnsIcon, FilterIcon, SearchIcon, XIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_OPTIONS = [
  { value: "bookmarked", label: "Bookmarked" },
  { value: "applied", label: "Applied" },
  { value: "interviewing", label: "Interviewing" },
  { value: "offer", label: "Offer" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
] as const;

const INTEREST_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "dream", label: "Dream" },
] as const;

const WORK_TYPE_OPTIONS = [
  { value: "remote", label: "Remote" },
  { value: "Hybrid (1 day)", label: "Hybrid (1 day)" },
  { value: "Hybrid (2 day)", label: "Hybrid (2 day)" },
  { value: "Hybrid (3 day)", label: "Hybrid (3 day)" },
  { value: "Hybrid (4 day)", label: "Hybrid (4 day)" },
  { value: "onsite", label: "Onsite" },
] as const;

const EMPLOYMENT_TYPE_OPTIONS = [
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
] as const;

const COLUMN_OPTIONS = [
  { id: "position", label: "Position" },
  { id: "company", label: "Company" },
  { id: "status", label: "Status" },
  { id: "interest", label: "Interest" },
  { id: "location", label: "Location" },
  { id: "salary", label: "Salary" },
  { id: "applied_at", label: "Applied" },
  { id: "updated_at", label: "Updated" },
] as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ApplicationFiltersState {
  search?: string;
  status?: string[];
  interest?: string[];
  workType?: string[];
  employmentType?: string[];
}

interface ApplicationFiltersProps {
  filters: ApplicationFiltersState;
  onFiltersChange: (filters: ApplicationFiltersState) => void;
  columnVisibility: VisibilityState;
  onColumnVisibilityChange: (visibility: VisibilityState) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function MultiSelectFilter({
  label,
  options,
  selected,
  onSelectionChange,
}: {
  label: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  selected: string[];
  onSelectionChange: (selected: string[]) => void;
}) {
  const count = selected.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1">
          <FilterIcon className="size-3" />
          {label}
          {count > 0 && (
            <span className="ml-1 rounded-full bg-primary px-1.5 text-[10px] font-medium text-primary-foreground">
              {count}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2" align="start">
        <div className="flex flex-col gap-1">
          {options.map((option) => {
            const isChecked = selected.includes(option.value);
            return (
              // biome-ignore lint/a11y/noLabelWithoutControl: custom checkbox component
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
              >
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onSelectionChange([...selected, option.value]);
                    } else {
                      onSelectionChange(selected.filter((v) => v !== option.value));
                    }
                  }}
                />
                {option.label}
              </label>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ApplicationFilters({
  filters,
  onFiltersChange,
  columnVisibility,
  onColumnVisibilityChange,
}: ApplicationFiltersProps) {
  const [searchValue, setSearchValue] = useState(filters.search ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Sync search input when filters.search changes externally (e.g. clear)
  useEffect(() => {
    setSearchValue(filters.search ?? "");
  }, [filters.search]);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchValue(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onFiltersChange({ ...filters, search: value || undefined });
      }, 300);
    },
    [filters, onFiltersChange],
  );

  const hasActiveFilters =
    !!filters.search ||
    (filters.status && filters.status.length > 0) ||
    (filters.interest && filters.interest.length > 0) ||
    (filters.workType && filters.workType.length > 0) ||
    (filters.employmentType && filters.employmentType.length > 0);

  const handleClearFilters = () => {
    setSearchValue("");
    onFiltersChange({});
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Search */}
      <div className="relative w-full sm:w-64">
        <SearchIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search applications..."
          value={searchValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="h-8 pl-8"
        />
      </div>

      {/* Filter dropdowns */}
      <MultiSelectFilter
        label="Status"
        options={STATUS_OPTIONS}
        selected={filters.status ?? []}
        onSelectionChange={(status) =>
          onFiltersChange({
            ...filters,
            status: status.length > 0 ? status : undefined,
          })
        }
      />

      <MultiSelectFilter
        label="Interest"
        options={INTEREST_OPTIONS}
        selected={filters.interest ?? []}
        onSelectionChange={(interest) =>
          onFiltersChange({
            ...filters,
            interest: interest.length > 0 ? interest : undefined,
          })
        }
      />

      <MultiSelectFilter
        label="Work Type"
        options={WORK_TYPE_OPTIONS}
        selected={filters.workType ?? []}
        onSelectionChange={(workType) =>
          onFiltersChange({
            ...filters,
            workType: workType.length > 0 ? workType : undefined,
          })
        }
      />

      <MultiSelectFilter
        label="Employment"
        options={EMPLOYMENT_TYPE_OPTIONS}
        selected={filters.employmentType ?? []}
        onSelectionChange={(employmentType) =>
          onFiltersChange({
            ...filters,
            employmentType: employmentType.length > 0 ? employmentType : undefined,
          })
        }
      />

      {/* Column visibility */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="ml-auto h-8 gap-1">
            <ColumnsIcon className="size-3" />
            Columns
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-2" align="end">
          <div className="flex flex-col gap-1">
            {COLUMN_OPTIONS.map((col) => {
              const isVisible = columnVisibility[col.id] !== false;
              return (
                // biome-ignore lint/a11y/noLabelWithoutControl: custom checkbox component
                <label
                  key={col.id}
                  className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                >
                  <Checkbox
                    checked={isVisible}
                    onCheckedChange={(checked) => {
                      onColumnVisibilityChange({
                        ...columnVisibility,
                        [col.id]: !!checked,
                      });
                    }}
                  />
                  {col.label}
                </label>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>

      {/* Clear filters */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" className="h-8 gap-1" onClick={handleClearFilters}>
          <XIcon className="size-3" />
          Clear filters
        </Button>
      )}
    </div>
  );
}
