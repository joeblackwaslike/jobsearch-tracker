import { Archive, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Company } from "@/lib/queries/companies";
import { useArchiveCompany } from "@/lib/queries/companies";

interface CompanyTableProps {
  data: Company[];
  onEdit: (company: Company) => void;
}

export function CompanyTable({ data, onEdit }: CompanyTableProps) {
  const archiveCompany = useArchiveCompany();

  return (
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
            <TableHead className="w-24" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((company) => {
            const tags = Array.isArray(company.tags) ? (company.tags as string[]) : [];
            return (
              <TableRow key={company.id} className="cursor-pointer" onClick={() => onEdit(company)}>
                <TableCell className="font-medium">{company.name}</TableCell>
                <TableCell>{company.industry || "--"}</TableCell>
                <TableCell>{company.location || "--"}</TableCell>
                <TableCell>{company.size || "--"}</TableCell>
                <TableCell>
                  {company.researched ? (
                    <Badge variant="secondary" className="text-xs">
                      Yes
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">No</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {tags.length > 2 && (
                      <span className="text-xs text-muted-foreground">+{tags.length - 2}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      title="Edit company"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(company);
                      }}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive hover:text-destructive"
                      title="Archive company"
                      onClick={(e) => {
                        e.stopPropagation();
                        archiveCompany.mutate(company.id);
                      }}
                    >
                      <Archive className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
