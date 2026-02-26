import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { SortingState } from "@tanstack/react-table";
import { ChevronLeftIcon, ChevronRightIcon, PencilIcon, PlusIcon, ZapIcon } from "lucide-react";
import { useCallback, useState } from "react";
import { z } from "zod";
import { ApplicationDetail } from "@/components/applications/application-detail";
import {
  ApplicationFilters,
  type ApplicationFiltersState,
} from "@/components/applications/application-filters";
import { ApplicationForm } from "@/components/applications/application-form";
import { ApplicationStats } from "@/components/applications/application-stats";
import { ArchiveDialog } from "@/components/applications/archive-dialog";
import { EasyAddForm } from "@/components/applications/easy-add-form";
import { FullApplicationForm } from "@/components/applications/full-application-form";
import { PageLayout } from "@/components/shared/page-layout";
import { UniversalTable } from "@/components/shared/universal-table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ApplicationListItem, ApplicationWithCompany } from "@/lib/queries/applications";
import { useApplication, useApplications } from "@/lib/queries/applications";
import type { TableSchema } from "@/schemas/table-schema";
import { applicationTableSchema } from "@/schemas/table-schemas";

// ---------------------------------------------------------------------------
// Search params schema
// ---------------------------------------------------------------------------

const applicationsSearchSchema = z.object({
  search: z.string().optional().catch(undefined),
  status: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .catch(undefined),
  interest: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .catch(undefined),
  workType: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .catch(undefined),
  employmentType: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .catch(undefined),
  sort: z.string().optional().catch(undefined),
  page: z.coerce.number().optional().catch(1),
  pageSize: z.coerce.number().optional().catch(25),
  detail: z.string().optional().catch(undefined),
});

type ApplicationsSearch = z.infer<typeof applicationsSearchSchema>;

// ---------------------------------------------------------------------------
// Route definition
// ---------------------------------------------------------------------------

export const Route = createFileRoute("/_authenticated/applications")({
  validateSearch: (search: Record<string, unknown>): ApplicationsSearch =>
    applicationsSearchSchema.parse(search),
  component: ApplicationsPage,
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toArray(value: string | string[] | undefined): string[] | undefined {
  if (!value) return undefined;
  if (Array.isArray(value)) return value.length > 0 ? value : undefined;
  return [value];
}

function parseSortParam(
  sort: string | undefined,
): { column: string; direction: "asc" | "desc" } | undefined {
  if (!sort) return undefined;
  const parts = sort.split(".");
  if (parts.length !== 2) return undefined;
  const [column, dir] = parts;
  if (dir !== "asc" && dir !== "desc") return undefined;
  return { column, direction: dir };
}

function sortingStateToParam(sorting: SortingState): string | undefined {
  if (sorting.length === 0) return undefined;
  const s = sorting[0];
  return `${s.id}.${s.desc ? "desc" : "asc"}`;
}

function sortParamToState(sort: string | undefined): SortingState {
  const parsed = parseSortParam(sort);
  if (!parsed) return [];
  return [{ id: parsed.column, desc: parsed.direction === "desc" }];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function ApplicationsPage() {
  const searchParams = Route.useSearch();
  const navigate = useNavigate();

  const [formOpen, setFormOpen] = useState(false);
  const [easyAddOpen, setEasyAddOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<ApplicationListItem | null>(null);
  const [editingSelectedApp, setEditingSelectedApp] = useState<ApplicationWithCompany | null>(null);

  // Derive state from URL params
  const page = searchParams.page ?? 1;
  const pageSize = searchParams.pageSize ?? 25;
  const sorting = sortParamToState(searchParams.sort);

  const filtersState: ApplicationFiltersState = {
    search: searchParams.search,
    status: toArray(searchParams.status),
    interest: toArray(searchParams.interest),
    workType: toArray(searchParams.workType),
    employmentType: toArray(searchParams.employmentType),
  };

  const queryFilters = {
    search: searchParams.search,
    status: toArray(searchParams.status)?.[0],
    interest: toArray(searchParams.interest)?.[0],
    workType: toArray(searchParams.workType)?.[0],
    employmentType: toArray(searchParams.employmentType)?.[0],
    page,
    pageSize,
    sort: parseSortParam(searchParams.sort) ?? {
      column: "created_at",
      direction: "desc" as const,
    },
  };

  const { data: result, isLoading } = useApplications(queryFilters);
  const { data: selectedApp } = useApplication(searchParams.detail ?? "");

  const applications = result?.data ?? [];
  const totalCount = result?.count ?? 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  // Navigation helpers
  const updateSearch = useCallback(
    (updates: Partial<ApplicationsSearch>) => {
      navigate({
        to: ".",
        search: (prev: ApplicationsSearch) => ({
          ...prev,
          ...updates,
        }),
        replace: true,
      });
    },
    [navigate],
  );

  const handleFiltersChange = useCallback(
    (filters: ApplicationFiltersState) => {
      updateSearch({
        search: filters.search,
        status: filters.status,
        interest: filters.interest,
        workType: filters.workType,
        employmentType: filters.employmentType,
        page: 1,
      });
    },
    [updateSearch],
  );

  const handleSortingChange = useCallback(
    (newSorting: SortingState) => {
      updateSearch({
        sort: sortingStateToParam(newSorting),
        page: 1,
      });
    },
    [updateSearch],
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      updateSearch({ page: newPage });
    },
    [updateSearch],
  );

  const handlePageSizeChange = useCallback(
    (newPageSize: string) => {
      updateSearch({ pageSize: Number(newPageSize), page: 1 });
    },
    [updateSearch],
  );

  return (
    <PageLayout
      detailPanel={selectedApp ? <ApplicationDetail application={selectedApp} /> : null}
      onDetailClose={() =>
        navigate({ to: "/applications", search: (prev: ApplicationsSearch) => ({ ...prev, detail: undefined }), replace: true })
      }
      detailWidth="lg"
      detailHeaderActions={
        selectedApp ? (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Edit application"
            onClick={() => setEditingSelectedApp(selectedApp)}
          >
            <PencilIcon className="size-4" />
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Applications</h1>
            <p className="text-sm text-muted-foreground">
              {isLoading ? "Loading..." : `${totalCount} application${totalCount !== 1 ? "s" : ""}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setEasyAddOpen(true)}>
              <ZapIcon className="size-4" />
              Easy Add
            </Button>
            <Button onClick={() => setFormOpen(true)}>
              <PlusIcon className="size-4" />
              New Application
            </Button>
          </div>
        </div>

        {/* Application Stats */}
        <ApplicationStats />

        {/* Filters */}
        <ApplicationFilters
          filters={filtersState}
          onFiltersChange={handleFiltersChange}
          columnVisibility={{}}
          onColumnVisibilityChange={() => {}}
        />

        {/* Table */}
        <UniversalTable
          data={applications}
          schema={applicationTableSchema as unknown as TableSchema<ApplicationListItem>}
          sorting={sorting}
          onSortingChange={handleSortingChange}
          onRowClick={(app) =>
            navigate({ to: "/applications", search: (prev: ApplicationsSearch) => ({ ...prev, detail: (app as ApplicationListItem).id }) })
          }
          selectedId={searchParams.detail ?? null}
          rowActions={(app) => (
            <ArchiveDialog
              applicationId={(app as ApplicationListItem).id}
              onArchived={() =>
                navigate({ to: "/applications", search: (prev: ApplicationsSearch) => ({ ...prev, detail: undefined }), replace: true })
              }
            />
          )}
        />

        {/* Pagination */}
        {totalCount > 0 && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Rows per page</span>
              <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages || 1}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon-sm"
                  disabled={page <= 1}
                  onClick={() => handlePageChange(page - 1)}
                >
                  <ChevronLeftIcon className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon-sm"
                  disabled={page >= totalPages}
                  onClick={() => handlePageChange(page + 1)}
                >
                  <ChevronRightIcon className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Dialogs */}
        <FullApplicationForm open={formOpen} onOpenChange={setFormOpen} />
        <EasyAddForm open={easyAddOpen} onOpenChange={setEasyAddOpen} />
        <ApplicationForm
          open={!!editingApp}
          onOpenChange={(open) => {
            if (!open) setEditingApp(null);
          }}
          application={editingApp as ApplicationWithCompany | null}
        />
        <ApplicationForm
          open={!!editingSelectedApp}
          onOpenChange={(open) => {
            if (!open) setEditingSelectedApp(null);
          }}
          application={editingSelectedApp}
        />
      </div>
    </PageLayout>
  );
}
