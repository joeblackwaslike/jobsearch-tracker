import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { CityCombobox } from "@/components/applications/city-combobox";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StarRating } from "@/components/ui/star-rating";
import { TagInput } from "@/components/ui/tag-input";
import { UrlInput } from "@/components/ui/url-input";
import { type Company, useCreateCompany, useUpdateCompany } from "@/lib/queries/companies";
import { CompanyContacts } from "./company-contacts";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const linksSchema = z.object({
  website: z.string().default(""),
  careers: z.string().default(""),
  linkedin: z.string().default(""),
  glassdoor: z.string().default(""),
  news: z.string().default(""),
  crunchbase: z.string().default(""),
});

const ratingsSchema = z.object({
  overall: z.string().default(""),
  workLifeBalance: z.string().default(""),
  compensation: z.string().default(""),
  careerGrowth: z.string().default(""),
  management: z.string().default(""),
  culture: z.string().default(""),
});

const companyFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().default(""),
  links: linksSchema.default({
    website: "",
    careers: "",
    linkedin: "",
    glassdoor: "",
    news: "",
    crunchbase: "",
  }),
  industry: z.string().default(""),
  size: z.string().default(""),
  location: z.string().default(""),
  founded: z.string().default(""),
  culture: z.string().default(""),
  benefits: z.string().default(""),
  pros: z.string().default(""),
  cons: z.string().default(""),
  tech_stack: z.string().default(""),
  ratings: ratingsSchema.default({
    overall: "",
    workLifeBalance: "",
    compensation: "",
    careerGrowth: "",
    management: "",
    culture: "",
  }),
  tags: z.array(z.string()).default([]),
  researched: z.boolean().default(false),
});

type CompanyFormValues = z.infer<typeof companyFormSchema>;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SIZE_OPTIONS = [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "501-1000",
  "1001-5000",
  "5000+",
] as const;

const INDUSTRY_OPTIONS = [
  "Analytics",
  "Engineering, Product and Design",
  "Finance and Accounting",
  "Human Resources",
  "Infrastructure",
  "Legal",
  "Marketing",
  "Office Management",
  "Operations",
  "Productivity",
  "Recruiting and Talent",
  "Retail",
  "Sales",
  "Security",
  "Supply Chain and Logistics",
  "Asset Management",
  "Banking and Exchange",
  "Consumer Finance",
  "Credit and Lending",
  "Insurance",
  "Payments",
  "Apparel and Cosmetics",
  "Consumer Electronics",
  "Content",
  "Food and Beverage",
  "Gaming",
  "Home and Personal",
  "Job and Career Services",
  "Social",
  "Transportation Services",
  "Travel, Leisure and Tourism",
  "Virtual and Augmented Reality",
  "Consumer Health and Wellness",
  "Diagnostics",
  "Drug Discovery and Delivery",
  "Healthcare IT",
  "Healthcare Services",
  "Industrial Bio",
  "Medical Devices",
  "Therapeutics",
  "Education",
  "Agriculture",
  "Automotive",
  "Aviation and Space",
  "Climate",
  "Defense",
  "Drones",
  "Energy",
  "Manufacturing and Robotics",
  "Construction",
  "Housing and Real Estate",
  "Government",
] as const;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CompanyFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  company?: Company | null;
  onSuccess?: (company: Company) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function companyToFormValues(company: Company): CompanyFormValues {
  const links = (company.links ?? {}) as Record<string, string>;
  const ratings = (company.ratings ?? {}) as Record<string, string>;

  return {
    name: company.name,
    description: company.description ?? "",
    links: {
      website: links.website ?? "",
      careers: links.careers ?? "",
      linkedin: links.linkedin ?? "",
      glassdoor: links.glassdoor ?? "",
      news: links.news ?? "",
      crunchbase: links.crunchbase ?? "",
    },
    industry: company.industry ?? "",
    size: company.size ?? "",
    location: company.location ?? "",
    founded: company.founded ? company.founded.slice(0, 4) : "",
    culture: company.culture ?? "",
    benefits: company.benefits ?? "",
    pros: company.pros ?? "",
    cons: company.cons ?? "",
    tech_stack: company.tech_stack ?? "",
    ratings: {
      overall: ratings.overall ?? "",
      workLifeBalance: ratings.workLifeBalance ?? ratings.work_life ?? "",
      compensation: ratings.compensation ?? "",
      careerGrowth: ratings.careerGrowth ?? ratings.growth ?? "",
      management: ratings.management ?? "",
      culture: ratings.culture ?? "",
    },
    tags: Array.isArray(company.tags) ? (company.tags as string[]) : [],
    researched: company.researched ?? false,
  };
}

function formValuesToPayload(values: CompanyFormValues) {
  // Filter out empty rating values
  const ratings: Record<string, string> = {};
  if (values.ratings) {
    for (const [k, v] of Object.entries(values.ratings)) {
      if (v) ratings[k] = v;
    }
  }

  // Filter out empty link values
  const links: Record<string, string> = {};
  if (values.links) {
    for (const [k, v] of Object.entries(values.links)) {
      if (v) links[k] = v;
    }
  }

  return {
    name: values.name,
    description: values.description || null,
    links: Object.keys(links).length > 0 ? links : null,
    industry: values.industry || null,
    size: values.size || null,
    location: values.location || null,
    founded: values.founded ? `${values.founded}-01-01` : null,
    culture: values.culture || null,
    benefits: values.benefits || null,
    pros: values.pros || null,
    cons: values.cons || null,
    tech_stack: values.tech_stack || null,
    ratings: Object.keys(ratings).length > 0 ? ratings : null,
    tags: values.tags.length > 0 ? values.tags : null,
    researched: values.researched ?? false,
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CompanyForm({ open, onOpenChange, mode, company, onSuccess }: CompanyFormProps) {
  const createCompany = useCreateCompany();
  const updateCompany = useUpdateCompany();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CompanyFormValues>({
    // biome-ignore lint/suspicious/noExplicitAny: type mismatch between zod versions
    resolver: zodResolver(companyFormSchema as any),
    defaultValues:
      mode === "edit" && company ? companyToFormValues(company) : { name: "", researched: false },
  });

  // Reset form when company or mode changes
  useEffect(() => {
    if (open) {
      if (mode === "edit" && company) {
        reset(companyToFormValues(company));
      } else {
        reset({ name: "", researched: false });
      }
    }
  }, [open, mode, company, reset]);

  const onSubmit = async (values: CompanyFormValues) => {
    const payload = formValuesToPayload(values);

    if (mode === "edit" && company) {
      const result = await updateCompany.mutateAsync({
        id: company.id,
        ...payload,
      });
      onSuccess?.(result);
    } else {
      const result = await createCompany.mutateAsync(payload);
      onSuccess?.(result);
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add Company" : "Edit Company"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Add a new company to your directory."
              : "Update company details and research notes."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <ScrollArea className="max-h-[calc(85vh-8rem)] pr-4">
            <div className="space-y-6 py-4">
              {/* Basic Information */}
              <fieldset className="space-y-4">
                <legend className="text-sm font-semibold text-muted-foreground">
                  Basic Information
                </legend>

                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input id="name" {...register("name")} />
                  {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    {...register("description")}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Industry</Label>
                    <Select
                      value={watch("industry") ?? ""}
                      onValueChange={(v) => setValue("industry", v)}
                    >
                      <SelectTrigger className="w-full" aria-label="Industry">
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        {INDUSTRY_OPTIONS.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Size</Label>
                    <Select value={watch("size") ?? ""} onValueChange={(v) => setValue("size", v)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        {SIZE_OPTIONS.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <CityCombobox
                      value={watch("location") ?? ""}
                      onChange={(v) => setValue("location", v)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="founded">Founded (year)</Label>
                    <Input
                      id="founded"
                      type="number"
                      placeholder="e.g. 2012"
                      min={1800}
                      max={2099}
                      {...register("founded")}
                    />
                  </div>
                </div>
              </fieldset>

              {/* Company Links */}
              <fieldset className="space-y-4">
                <legend className="text-sm font-semibold text-muted-foreground">
                  Company Links
                </legend>
                <div className="grid grid-cols-2 gap-4">
                  {(
                    [
                      ["links.website", "Website"],
                      ["links.careers", "Careers Page"],
                      ["links.linkedin", "LinkedIn"],
                      ["links.glassdoor", "Glassdoor"],
                      ["links.news", "News"],
                      ["links.crunchbase", "Crunchbase"],
                    ] as const
                  ).map(([field, label]) => (
                    <div key={field} className="space-y-2">
                      <Label>{label}</Label>
                      <Controller
                        name={field}
                        control={control}
                        render={({ field: f }) => (
                          <UrlInput value={f.value} onChange={f.onChange} />
                        )}
                      />
                    </div>
                  ))}
                </div>
              </fieldset>

              {/* Company Ratings */}
              <fieldset className="space-y-4">
                <legend className="text-sm font-semibold text-muted-foreground">
                  Company Ratings
                </legend>
                <div className="grid grid-cols-2 gap-4">
                  {(
                    [
                      ["ratings.overall", "Overall"],
                      ["ratings.workLifeBalance", "Work-Life Balance"],
                      ["ratings.compensation", "Compensation"],
                      ["ratings.careerGrowth", "Career Growth"],
                      ["ratings.management", "Management"],
                      ["ratings.culture", "Culture"],
                    ] as const
                  ).map(([field, label]) => (
                    <div key={field} className="space-y-2">
                      <Label>{label}</Label>
                      <StarRating
                        aria-label={label}
                        value={watch(field) ? Number(watch(field)) : null}
                        onChange={(v) => setValue(field, v != null ? String(v) : "")}
                      />
                    </div>
                  ))}
                </div>
              </fieldset>

              {/* Research Notes */}
              <fieldset className="space-y-4">
                <legend className="text-sm font-semibold text-muted-foreground">
                  Research Notes
                </legend>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="culture">Culture</Label>
                    <textarea
                      id="culture"
                      className="flex min-h-[90px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...register("culture")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="benefits">Benefits</Label>
                    <textarea
                      id="benefits"
                      className="flex min-h-[90px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...register("benefits")}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pros">Pros</Label>
                    <textarea
                      id="pros"
                      className="flex min-h-[90px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...register("pros")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cons">Cons</Label>
                    <textarea
                      id="cons"
                      className="flex min-h-[90px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...register("cons")}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tech_stack">Tech Stack</Label>
                  <Input
                    id="tech_stack"
                    placeholder="React, Node.js, PostgreSQL..."
                    {...register("tech_stack")}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tags</Label>
                  <TagInput
                    value={watch("tags") ?? []}
                    onChange={(tags) => setValue("tags", tags)}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="researched"
                    checked={watch("researched") ?? false}
                    onCheckedChange={(checked) => setValue("researched", checked === true)}
                  />
                  <Label htmlFor="researched">Researched</Label>
                </div>
              </fieldset>

              {/* Contacts (edit mode only) */}
              {mode === "edit" && company?.id && (
                <fieldset className="space-y-4">
                  <legend className="text-sm font-semibold text-muted-foreground">Contacts</legend>
                  <CompanyContacts companyId={company.id} />
                </fieldset>
              )}

              <DialogFooter className="mt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : mode === "create" ? "Add Company" : "Save Changes"}
                </Button>
              </DialogFooter>
            </div>
          </ScrollArea>
        </form>
      </DialogContent>
    </Dialog>
  );
}
