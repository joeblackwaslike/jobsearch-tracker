import { MapPin, Tag, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Company } from "@/lib/queries/companies";

interface CompanyDetailProps {
  company: Company;
}

export function CompanyDetail({ company }: CompanyDetailProps) {
  const tags = Array.isArray(company.tags) ? (company.tags as string[]) : [];
  const ratings = company.ratings as Record<string, string> | null;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{company.name}</h3>
        {company.researched && (
          <Badge variant="secondary" className="text-xs">
            Researched
          </Badge>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Company Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {company.industry && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Industry</p>
              <p className="text-sm">{company.industry}</p>
            </div>
          )}

          {company.location && (
            <>
              <Separator />
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Location</p>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="size-4 text-muted-foreground" />
                  <span>{company.location}</span>
                </div>
              </div>
            </>
          )}

          {company.size && (
            <>
              <Separator />
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Company Size</p>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="size-4 text-muted-foreground" />
                  <span>{company.size}</span>
                </div>
              </div>
            </>
          )}

          {company.founded && (
            <>
              <Separator />
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Founded</p>
                <p className="text-sm">{company.founded}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {tags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Tag className="size-4" />
              Tags
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {ratings && Object.keys(ratings).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ratings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(ratings).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground capitalize">{key}</p>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <span
                        key={n}
                        className={`size-4 ${n <= Number(value) ? "text-yellow-500" : "text-gray-300"}`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {company.description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {company.description}
            </p>
          </CardContent>
        </Card>
      )}

      {company.culture && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Culture</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{company.culture}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
