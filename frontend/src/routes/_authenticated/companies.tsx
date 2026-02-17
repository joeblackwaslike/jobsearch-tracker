import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";
import { CompanyDirectory } from "@/components/companies/company-directory";

interface CompaniesSearch {
  search?: string;
  view?: string;
}

export const Route = createFileRoute("/_authenticated/companies")({
  validateSearch: (search: Record<string, unknown>): CompaniesSearch => ({
    search: (search.search as string) || undefined,
    view: (search.view as string) || undefined,
  }),
  component: CompaniesPage,
});

function CompaniesPage() {
  const { search, view } = Route.useSearch();
  const navigate = useNavigate();

  const handleSearchChange = useCallback(
    (value: string) => {
      navigate({
        to: ".",
        search: (prev: CompaniesSearch) => ({
          ...prev,
          search: value || undefined,
        }),
        replace: true,
      });
    },
    [navigate]
  );

  const handleViewChange = useCallback(
    (value: string) => {
      navigate({
        to: ".",
        search: (prev: CompaniesSearch) => ({
          ...prev,
          view: value === "cards" ? undefined : value,
        }),
        replace: true,
      });
    },
    [navigate]
  );

  return (
    <CompanyDirectory
      searchParam={search ?? ""}
      viewParam={view ?? "cards"}
      onSearchChange={handleSearchChange}
      onViewChange={handleViewChange}
    />
  );
}
