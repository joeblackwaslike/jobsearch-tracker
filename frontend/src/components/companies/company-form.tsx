import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
});

const ratingsSchema = z.object({
  overall: z.string().default(""),
  work_life: z.string().default(""),
  compensation: z.string().default(""),
  growth: z.string().default(""),
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
    work_life: "",
    compensation: "",
    growth: "",
    management: "",
    culture: "",
  }),
  tags: z.string().default(""),
  researched: z.boolean().default(false),
});

type CompanyFormValues = z.infer<typeof companyFormSchema>;

// ---------------------------------------------------------------------------
// Size options
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

const RATING_OPTIONS = ["1", "2", "3", "4", "5"] as const;

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
  const tags = Array.isArray(company.tags) ? (company.tags as string[]).join(", ") : "";

  return {
    name: company.name,
    description: company.description ?? "",
    links: {
      website: links.website ?? "",
      careers: links.careers ?? "",
      linkedin: links.linkedin ?? "",
      glassdoor: links.glassdoor ?? "",
      news: links.news ?? "",
    },
    industry: company.industry ?? "",
    size: company.size ?? "",
    location: company.location ?? "",
    founded: company.founded ?? "",
    culture: company.culture ?? "",
    benefits: company.benefits ?? "",
    pros: company.pros ?? "",
    cons: company.cons ?? "",
    tech_stack: company.tech_stack ?? "",
    ratings: {
      overall: ratings.overall ?? "",
      work_life: ratings.work_life ?? "",
      compensation: ratings.compensation ?? "",
      growth: ratings.growth ?? "",
      management: ratings.management ?? "",
      culture: ratings.culture ?? "",
    },
    tags,
    researched: company.researched ?? false,
  };
}

function formValuesToPayload(values: CompanyFormValues) {
  const tags = values.tags
    ? values.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

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
    founded: values.founded || null,
    culture: values.culture || null,
    benefits: values.benefits || null,
    pros: values.pros || null,
    cons: values.cons || null,
    tech_stack: values.tech_stack || null,
    ratings: Object.keys(ratings).length > 0 ? ratings : null,
    tags: tags.length > 0 ? tags : null,
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
              {/* Basic Info */}
              <fieldset className="space-y-4">
                <legend className="text-sm font-semibold text-muted-foreground">
                  Basic Information
                </legend>

                <div className="space-y-2">
                  <Label htmlFor="edit-name">Name *</Label>
                  <Input id="edit-name" {...register("name")} />
                  {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <textarea
                    id="edit-description"
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    {...register("description")}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-industry">Industry</Label>
                    <Input id="edit-industry" {...register("industry")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-size">Size</Label>
                    <Select
                      value={watch("size") ?? ""}
                      onValueChange={(value) => setValue("size", value)}
                    >
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
                    <Label htmlFor="edit-location">Location</Label>
                    <Input id="edit-location" {...register("location")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-founded">Founded</Label>
                    <Input id="edit-founded" type="date" {...register("founded")} />
                  </div>
                </div>
              </fieldset>

              {/* Links */}
              <fieldset className="space-y-4">
                <legend className="text-sm font-semibold text-muted-foreground">Links</legend>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-website">Website</Label>
                    <Input
                      id="edit-website"
                      placeholder="https://..."
                      {...register("links.website")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-careers">Careers Page</Label>
                    <Input
                      id="edit-careers"
                      placeholder="https://..."
                      {...register("links.careers")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-linkedin">LinkedIn</Label>
                    <Input
                      id="edit-linkedin"
                      placeholder="https://..."
                      {...register("links.linkedin")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-glassdoor">Glassdoor</Label>
                    <Input
                      id="edit-glassdoor"
                      placeholder="https://..."
                      {...register("links.glassdoor")}
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="edit-news">News</Label>
                    <Input id="edit-news" placeholder="https://..." {...register("links.news")} />
                  </div>
                </div>
              </fieldset>

              {/* Research Notes */}
              <fieldset className="space-y-4">
                <legend className="text-sm font-semibold text-muted-foreground">
                  Research Notes
                </legend>

                <div className="space-y-2">
                  <Label htmlFor="edit-culture">Culture</Label>
                  <textarea
                    id="edit-culture"
                    className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    {...register("culture")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-benefits">Benefits</Label>
                  <textarea
                    id="edit-benefits"
                    className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    {...register("benefits")}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-pros">Pros</Label>
                    <textarea
                      id="edit-pros"
                      className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...register("pros")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-cons">Cons</Label>
                    <textarea
                      id="edit-cons"
                      className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...register("cons")}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-tech_stack">Tech Stack</Label>
                  <textarea
                    id="edit-tech_stack"
                    className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    {...register("tech_stack")}
                  />
                </div>
              </fieldset>

              {/* Ratings */}
              <fieldset className="space-y-4">
                <legend className="text-sm font-semibold text-muted-foreground">
                  Ratings (1-5)
                </legend>
                <div className="grid grid-cols-2 gap-4">
                  {(
                    [
                      ["overall", "Overall"],
                      ["work_life", "Work-Life Balance"],
                      ["compensation", "Compensation"],
                      ["growth", "Growth"],
                      ["management", "Management"],
                      ["culture", "Culture"],
                    ] as const
                  ).map(([key, label]) => (
                    <div key={key} className="space-y-2">
                      <Label>{label}</Label>
                      <Select
                        value={watch(`ratings.${key}`) ?? ""}
                        onValueChange={(value) => setValue(`ratings.${key}`, value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="--" />
                        </SelectTrigger>
                        <SelectContent>
                          {RATING_OPTIONS.map((r) => (
                            <SelectItem key={r} value={r}>
                              {r}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </fieldset>

              {/* Tags & Researched */}
              <fieldset className="space-y-4">
                <legend className="text-sm font-semibold text-muted-foreground">
                  Tags & Status
                </legend>

                <div className="space-y-2">
                  <Label htmlFor="edit-tags">Tags (comma-separated)</Label>
                  <Input
                    id="edit-tags"
                    placeholder="e.g. remote, startup, AI"
                    {...register("tags")}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="edit-researched"
                    checked={watch("researched") ?? false}
                    onCheckedChange={(checked) => setValue("researched", checked === true)}
                  />
                  <Label htmlFor="edit-researched">Researched</Label>
                </div>
              </fieldset>

              {/* Contacts */}
              <fieldset className="space-y-4">
                <legend className="text-sm font-semibold text-muted-foreground">Contacts</legend>
                {company?.id && <CompanyContacts companyId={company.id} />}
              </fieldset>

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
