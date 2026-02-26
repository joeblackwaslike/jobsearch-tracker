import {
  Briefcase,
  Building2,
  ExternalLink,
  Globe,
  Link2,
  MapPin,
  Newspaper,
  Star,
  TrendingUp,
} from "lucide-react";
import type React from "react";
import { useApplicationsByCompany } from "@/lib/queries/applications";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DetailLayout } from "@/components/shared/detail-layout";
import { formatDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { Company } from "@/lib/queries/companies";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CompanyDetailProps {
  company: Company;
}

type CompanyLink = { type: string; name: string; url: string };

type DetailMeta = {
  icon: React.ReactNode;
  text: string;
  href?: string;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseList(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function calcCompleteness(c: Company): number {
  const fields = [
    c.name,
    c.industry,
    c.location,
    c.size,
    c.founded,
    c.description,
    c.culture,
    c.tech_stack,
    c.benefits,
    c.pros,
    c.cons,
    c.researched,
  ];
  const filled = fields.filter((f) => f !== null && f !== undefined && f !== "").length;
  return Math.round((filled / fields.length) * 100);
}

function qualityLabel(pct: number): { label: string; color: string } {
  if (pct >= 90) return { label: "Excellent", color: "bg-green-500 text-white" };
  if (pct >= 70) return { label: "Good", color: "bg-blue-500 text-white" };
  if (pct >= 50) return { label: "Fair", color: "bg-amber-500 text-white" };
  return { label: "Needs Work", color: "bg-red-500 text-white" };
}

// ---------------------------------------------------------------------------
// Link icon map
// ---------------------------------------------------------------------------

const LINK_TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  website: Globe,
  careers: Briefcase,
  "news/blog": Newspaper,
  linkedin: Link2,
  glassdoor: Star,
  crunchbase: TrendingUp,
};

// ---------------------------------------------------------------------------
// Tab components
// ---------------------------------------------------------------------------

function OverviewTab({ company }: { company: Company }) {
  const pct = calcCompleteness(company);
  const quality = qualityLabel(pct);
  const ratingsRaw = company.ratings as Record<string, unknown> | null;
  const ratings = ratingsRaw
    ? (Object.fromEntries(
        Object.entries(ratingsRaw).map(([k, v]) => [k, Number(v)]),
      ) as Record<string, number>)
    : null;

  return (
    <div className="space-y-6">
      {/* Data Quality */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Data Quality</span>
          <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", quality.color)}>
            {quality.label}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Completeness</span>
          <span>{pct}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted">
          <div
            className="h-2 rounded-full bg-foreground transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Key-value grid */}
      {(company.industry || company.size || company.founded) && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          {company.industry && (
            <div>
              <p className="text-xs text-muted-foreground">Industry</p>
              <p className="text-sm font-medium">{company.industry}</p>
            </div>
          )}
          {company.size && (
            <div>
              <p className="text-xs text-muted-foreground">Company Size</p>
              <p className="text-sm font-medium">{company.size}</p>
            </div>
          )}
          {company.founded && (
            <div>
              <p className="text-xs text-muted-foreground">Founded</p>
              <p className="text-sm font-medium">{company.founded}</p>
            </div>
          )}
        </div>
      )}

      {/* Ratings */}
      {ratings && Object.keys(ratings).length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Ratings</p>
          {ratings.overall != null && (
            <div className="flex items-center justify-between">
              <span className="text-sm">Overall</span>
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn(
                        "size-3.5",
                        star <= Math.round(ratings.overall)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground",
                      )}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">{ratings.overall.toFixed(1)}</span>
              </div>
            </div>
          )}
          {(
            [
              ["Work-Life Balance", "work_life_balance"],
              ["Compensation", "compensation"],
              ["Career Growth", "career_growth"],
              ["Management", "management"],
            ] as [string, string][]
          ).map(([label, key]) =>
            ratings[key] != null ? (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className="text-sm">{(ratings[key] as number).toFixed(1)}</span>
              </div>
            ) : null,
          )}
        </div>
      )}

      {/* Description */}
      {company.description && (
        <div className="space-y-1">
          <p className="text-sm font-medium">Description</p>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{company.description}</p>
        </div>
      )}
    </div>
  );
}

function ResearchTab({ company }: { company: Company }) {
  const techStack = parseList(company.tech_stack);
  const benefits = parseList(company.benefits);
  const pros = parseList(company.pros);
  const cons = parseList(company.cons);

  const hasContent =
    company.culture || techStack.length || benefits.length || pros.length || cons.length;

  if (!hasContent) {
    return <p className="text-sm text-muted-foreground">No research data yet.</p>;
  }

  return (
    <div className="space-y-5">
      {company.culture && (
        <div className="space-y-1">
          <p className="text-sm font-medium">Culture</p>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{company.culture}</p>
        </div>
      )}

      {techStack.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-sm font-medium">Tech Stack</p>
          <div className="flex flex-wrap gap-1.5">
            {techStack.map((item) => (
              <span
                key={item}
                className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      {benefits.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-sm font-medium">Benefits</p>
          <div className="flex flex-wrap gap-1.5">
            {benefits.map((item) => (
              <span
                key={item}
                className="rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      {(pros.length > 0 || cons.length > 0) && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-green-600">Pros</p>
            <ul className="space-y-0.5">
              {pros.map((item) => (
                <li key={item} className="flex items-start gap-1.5 text-sm text-muted-foreground">
                  <span className="mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-red-600">Cons</p>
            <ul className="space-y-0.5">
              {cons.map((item) => (
                <li key={item} className="flex items-start gap-1.5 text-sm text-muted-foreground">
                  <span className="mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function AppsTab({ companyId }: { companyId: string }) {
  const { data: result } = useApplicationsByCompany(companyId);
  const apps = result?.data ?? [];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {apps.length} application{apps.length !== 1 ? "s" : ""}
        </span>
        <Button variant="outline" size="sm" asChild>
          <a href="/applications">
            <Link2 className="size-3.5" />
            All Applications
          </a>
        </Button>
      </div>

      {apps.length === 0 && (
        <p className="text-sm text-muted-foreground">No applications linked to this company.</p>
      )}

      <div className="space-y-2">
        {apps.map((app) => (
          <div key={app.id} className="rounded-md border p-3">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium">{app.position}</p>
              <Badge variant="secondary" className="shrink-0 text-xs">
                {app.status}
              </Badge>
            </div>
            {app.applied_at && (
              <p className="mt-1 text-xs text-muted-foreground">
                Applied {formatDate(app.applied_at)}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function LinksTab({ links }: { links: CompanyLink[] }) {
  if (links.length === 0) {
    return <p className="text-sm text-muted-foreground">No links added.</p>;
  }

  return (
    <div className="space-y-2">
      {links.map((link, i) => {
        const Icon = LINK_TYPE_ICONS[link.type] ?? Globe;
        return (
          <a
            key={i}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-md border p-3 transition-colors hover:bg-muted/50"
          >
            <Icon className="size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{link.name}</p>
              <p className="truncate text-xs text-muted-foreground">{link.url}</p>
            </div>
            <ExternalLink className="size-4 shrink-0 text-muted-foreground" />
          </a>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function CompanyDetail({ company }: CompanyDetailProps) {
  const LINK_NAMES: Record<string, string> = {
    website: "Website",
    careers: "Careers Page",
    news: "News",
    linkedin: "LinkedIn",
    glassdoor: "Glassdoor",
    crunchbase: "Crunchbase",
  };
  const rawLinks = (company.links as Record<string, string> | null) ?? {};
  const links: CompanyLink[] = Object.entries(rawLinks)
    .filter(([, url]) => Boolean(url))
    .map(([type, url]) => ({ type, name: LINK_NAMES[type] ?? type, url }));
  const websiteLink = links.find((l) => l.type === "website");
  const tags = Array.isArray(company.tags) ? (company.tags as string[]) : [];

  const meta = [
    company.location && { icon: <MapPin className="size-3.5" />, text: company.location },
    websiteLink && {
      icon: <Globe className="size-3.5" />,
      text: websiteLink.url,
      href: websiteLink.url,
    },
  ].filter(Boolean) as DetailMeta[];

  const badges = (
    <>
      {company.researched && (
        <Badge variant="default" className="text-xs">
          Researched
        </Badge>
      )}
      {tags.map((tag) => (
        <Badge key={tag} variant="outline" className="text-xs">
          {tag}
        </Badge>
      ))}
    </>
  );

  const tabs = [
    {
      id: "overview",
      label: "Overview",
      content: <OverviewTab company={company} />,
    },
    {
      id: "research",
      label: "Research",
      content: <ResearchTab company={company} />,
    },
    {
      id: "apps",
      label: "Apps",
      content: <AppsTab companyId={company.id} />,
    },
    {
      id: "links",
      label: "Links",
      content: <LinksTab links={links} />,
    },
  ];

  return (
    <DetailLayout
      icon={<Building2 className="size-5" />}
      name={company.name}
      meta={meta}
      badges={badges}
      tabs={tabs}
      defaultTab="overview"
    />
  );
}
