import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  BarChart3,
  Building2,
  CheckCircle,
  ChevronLeftIcon,
  ChevronRightIcon,
  Plus,
  Search,
  Star,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { CompanyDetail } from "@/components/companies/company-detail";
import { CompanyForm } from "@/components/companies/company-form";
import { PageLayout } from "@/components/shared/page-layout";
import { UniversalTable } from "@/components/shared/universal-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { type Company, useCompanies, useCompany } from "@/lib/queries/companies";
import type { TableSchema } from "@/schemas/table-schema";
import { companyTableSchema } from "@/schemas/table-schemas";

// ---------------------------------------------------------------------------
// Search params schema
// ---------------------------------------------------------------------------

interface CompaniesSearch {
  search?: string;
}

const PAGE_SIZE = 20;

// ---------------------------------------------------------------------------
// Route definition
// ---------------------------------------------------------------------------

export const Route = createFileRoute("/_authenticated/companies")({
  validateSearch: (search: Record<string, unknown>): CompaniesSearch => ({
    search: (search.search as string) || undefined,
  }),
  component: CompaniesPage,
});

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function CompaniesPage() {
  const searchParams = Route.useSearch();
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState(searchParams.search ?? "");
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Debounce search input → URL
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate({
        to: ".",
        search: (prev: CompaniesSearch) => ({
          ...prev,
          search: searchInput || undefined,
        }),
        replace: true,
      });
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, navigate]);

  // Sync URL search param → local input
  useEffect(() => {
    setSearchInput(searchParams.search ?? "");
  }, [searchParams.search]);

  const { data, isLoading } = useCompanies({
    search: searchParams.search || undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  const { data: selectedCompany } = useCompany(selectedId ?? "");

  const companies = data?.data ?? [];
  const totalCount = data?.count ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // Stats computed from current page data
  const researchedCount = companies.filter((c) => c.researched).length;
  const researchedPct =
    companies.length > 0 ? Math.round((researchedCount / companies.length) * 100) : 0;

  const avgRating = (() => {
    let sum = 0;
    let count = 0;
    for (const c of companies) {
      const ratings = c.ratings as Record<string, string> | null;
      if (ratings?.overall) {
        sum += Number(ratings.overall);
        count++;
      }
    }
    return count > 0 ? (sum / count).toFixed(1) : "--";
  })();

  const handleOpenCreate = useCallback(() => {
    setFormMode("create");
    setEditingCompany(null);
    setFormOpen(true);
  }, []);

  return (
    <PageLayout
      detailPanel={selectedCompany ? <CompanyDetail company={selectedCompany} /> : null}
      onDetailClose={() => setSelectedId(null)}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Companies</h1>
            <p className="text-sm text-muted-foreground">
              {isLoading ? "Loading..." : `${totalCount} compan${totalCount !== 1 ? "ies" : "y"}`}
            </p>
          </div>
          <Button onClick={handleOpenCreate}>
            <Plus className="size-4" />
            New Company
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Building2 className="size-4" />
                Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{totalCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <CheckCircle className="size-4" />
                Researched
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{researchedPct}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <BarChart3 className="size-4" />
                Open Apps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">0</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Star className="size-4" />
                Avg Rating
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{avgRating}</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search companies..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Table */}
        <UniversalTable
          data={companies}
          schema={companyTableSchema as unknown as TableSchema<Company>}
          onRowClick={(company) => setSelectedId((company as Company).id)}
          selectedId={selectedId}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeftIcon className="size-4" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
              <ChevronRightIcon className="size-4" />
            </Button>
          </div>
        )}

        {/* Form Dialog */}
        <CompanyForm
          open={formOpen}
          onOpenChange={setFormOpen}
          mode={formMode}
          company={editingCompany}
        />
      </div>
    </PageLayout>
  );
}
