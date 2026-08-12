import { Building2, CheckCircle, MapPin, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Company } from "@/lib/queries/companies";

interface CompanyCardProps {
  company: Company;
  onClick?: () => void;
}

export function CompanyCard({ company, onClick }: CompanyCardProps) {
  const tags = Array.isArray(company.tags) ? (company.tags as string[]) : [];

  return (
    <Card className="cursor-pointer transition-shadow hover:shadow-md" onClick={onClick}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{company.name}</CardTitle>
          {company.researched && (
            <Badge variant="secondary" className="shrink-0 gap-1 text-xs">
              <CheckCircle className="size-3" />
              Researched
            </Badge>
          )}
        </div>
        <CardDescription className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          {company.industry && (
            <span className="flex items-center gap-1">
              <Building2 className="size-3" />
              {company.industry}
            </span>
          )}
          {(company.locations as string[] | undefined)?.length ? (
            <span className="flex items-center gap-1">
              <MapPin className="size-3" />
              {(company.locations as string[]).join(", ")}
            </span>
          ) : null}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex flex-wrap items-center gap-2">
          {company.size && (
            <Badge variant="outline" className="gap-1 text-xs">
              <Users className="size-3" />
              {company.size}
            </Badge>
          )}
          {tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {tags.length > 3 && (
            <span className="text-xs text-muted-foreground">+{tags.length - 3} more</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
