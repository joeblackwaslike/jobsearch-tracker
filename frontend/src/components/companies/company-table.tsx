import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Company } from "@/lib/queries/companies";

interface CompanyTableProps {
  data: Company[];
  onEdit: (company: Company) => void;
}

export function CompanyTable({ data, onEdit }: CompanyTableProps) {
  return (
    <div className="overflow-x-auto rounded-md border w-full">
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
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
