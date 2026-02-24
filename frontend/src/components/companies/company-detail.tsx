import { Globe, Mail, MapPin, Tag, Users } from "lucide-react";
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
        {company.website && (
          <a
            href={company.website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <Globe className="size-3" />
            <span>{company.website}</span>
          </a>
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

          <Separator />

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Research Status</p>
            <Badge variant={company.researched ? "secondary" : "outline"}>
              {company.researched ? "Researched" : "Not Researched"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {(company.email || company.phone) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {company.email && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Email</p>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="size-4 text-muted-foreground" />
                  <a href={`mailto:${company.email}`} className="text-primary hover:underline">
                    {company.email}
                  </a>
                </div>
              </div>
            )}
            {company.phone && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="text-sm">{company.phone}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span
                        key={i}
                        className={`size-4 ${i < Number(value) ? "text-yellow-500" : "text-gray-300"}`}
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

      {company.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{company.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
