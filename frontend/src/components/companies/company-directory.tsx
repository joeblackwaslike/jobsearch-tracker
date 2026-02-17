import { useState, useCallback, useEffect } from "react";
import {
  Search,
  Plus,
  LayoutGrid,
  List,
  Building2,
  BarChart3,
  CheckCircle,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CompanyCard } from "./company-card";
import { CompanyForm } from "./company-form";
import { useCompanies, type Company } from "@/lib/queries/companies";

const PAGE_SIZE = 20;

interface CompanyDirectoryProps {
  searchParam?: string;
  viewParam?: string;
  onSearchChange: (search: string) => void;
  onViewChange: (view: string) => void;
}

export function CompanyDirectory({
  searchParam = "",
  viewParam = "cards",
  onSearchChange,
  onViewChange,
}: CompanyDirectoryProps) {
  // Local search state for debouncing
  const [searchInput, setSearchInput] = useState(searchParam);
  const [page, setPage] = useState(1);

  // Dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, onSearchChange]);

  // Sync external search param changes
  useEffect(() => {
    setSearchInput(searchParam);
  }, [searchParam]);

  const { data, isLoading } = useCompanies({
    search: searchParam || undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  const companies = data?.data ?? [];
  const totalCount = data?.count ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // Stats
  const researchedCount = companies.filter((c) => c.researched).length;
  const researchedPct =
    companies.length > 0
      ? Math.round((researchedCount / companies.length) * 100)
      : 0;

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

  const handleOpenEdit = useCallback((company: Company) => {
    setFormMode("edit");
    setEditingCompany(company);
    setFormOpen(true);
  }, []);

  const view = viewParam === "table" ? "table" : "cards";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Companies</h1>
          <p className="text-sm text-muted-foreground">
            Your company directory
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="gap-2">
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

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search companies..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={view === "cards" ? "default" : "outline"}
            size="sm"
            onClick={() => onViewChange("cards")}
          >
            <LayoutGrid className="size-4" />
          </Button>
          <Button
            variant={view === "table" ? "default" : "outline"}
            size="sm"
            onClick={() => onViewChange("table")}
          >
            <List className="size-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading companies...</p>
        </div>
      ) : companies.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <Building2 className="mb-4 size-12 text-muted-foreground" />
          <h3 className="text-lg font-semibold">No companies yet</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Start building your company directory.
          </p>
          <Button onClick={handleOpenCreate} className="gap-2">
            <Plus className="size-4" />
            Add Your First Company
          </Button>
        </div>
      ) : view === "cards" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => (
            <CompanyCard
              key={company.id}
              company={company}
              onClick={() => handleOpenEdit(company)}
            />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Researched</TableHead>
                <TableHead>Tags</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.map((company) => {
                const tags = Array.isArray(company.tags)
                  ? (company.tags as string[])
                  : [];
                return (
                  <TableRow
                    key={company.id}
                    className="cursor-pointer"
                    onClick={() => handleOpenEdit(company)}
                  >
                    <TableCell className="font-medium">
                      {company.name}
                    </TableCell>
                    <TableCell>{company.industry || "--"}</TableCell>
                    <TableCell>{company.location || "--"}</TableCell>
                    <TableCell>{company.size || "--"}</TableCell>
                    <TableCell>
                      {company.researched ? (
                        <Badge variant="secondary" className="gap-1 text-xs">
                          <CheckCircle className="size-3" />
                          Yes
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">No</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {tags.slice(0, 2).map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                        {tags.length > 2 && (
                          <span className="text-xs text-muted-foreground">
                            +{tags.length - 2}
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
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
  );
}
