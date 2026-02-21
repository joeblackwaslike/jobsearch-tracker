import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { DocumentTypePicker } from "@/components/documents/document-type-picker";
import { Button } from "@/components/ui/button";
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
import { SalaryRangeSlider } from "@/components/ui/salary-range-slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TagInput } from "@/components/ui/tag-input";
import { useCreateApplication } from "@/lib/queries/applications";
import type { Company } from "@/lib/queries/companies";
import { useSnapshotDocument } from "@/lib/queries/documents";
import { CityCombobox } from "./city-combobox";
import { CompanyCombobox } from "./company-combobox";
import { SourceCombobox } from "./source-combobox";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_OPTIONS = [
  "bookmarked",
  "applied",
  "interviewing",
  "offer",
  "accepted",
  "rejected",
  "archived",
] as const;

const WORK_TYPE_OPTIONS = [
  "remote",
  "Hybrid (1 day)",
  "Hybrid (2 day)",
  "Hybrid (3 day)",
  "Hybrid (4 day)",
  "onsite",
] as const;

const EMPLOYMENT_TYPE_OPTIONS = ["full-time", "part-time", "contract", "internship"] as const;

const INTEREST_OPTIONS = ["low", "medium", "high", "dream"] as const;

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const salarySchema = z.object({
  min: z.coerce.number().optional(),
  max: z.coerce.number().optional(),
  currency: z.string().default("USD"),
  period: z.string().default("yearly"),
});

const fullApplicationSchema = z.object({
  company_id: z.string().min(1, "Company is required"),
  company_name: z.string().default(""),
  position: z.string().min(1, "Position is required"),
  url: z.string().default(""),
  status: z.string().default("applied"),
  work_type: z.string().default(""),
  employment_type: z.string().default("full-time"),
  location: z.string().default(""),
  salary: salarySchema.default({ currency: "USD", period: "yearly" }),
  job_description: z.string().default(""),
  interest: z.string().default("medium"),
  source: z.string().default(""),
  tags: z.array(z.string()).default([]),
  notes: z.string().default(""),
});

type FullApplicationValues = z.infer<typeof fullApplicationSchema>;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface FullApplicationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  prefill?: { company?: string; position?: string; url?: string };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formValuesToPayload(values: FullApplicationValues) {
  const salary: Record<string, string | number> = {};
  if (values.salary.min !== undefined && values.salary.min !== 0) salary.min = values.salary.min;
  if (values.salary.max !== undefined && values.salary.max !== 0) salary.max = values.salary.max;
  if (values.salary.currency) salary.currency = values.salary.currency;
  if (values.salary.period) salary.period = values.salary.period;

  return {
    company_id: values.company_id,
    position: values.position,
    url: values.url || null,
    status: values.status,
    work_type: values.work_type || null,
    employment_type: values.employment_type || null,
    location: values.location || null,
    salary: Object.keys(salary).length > 0 ? (salary as Record<string, string | number>) : null,
    job_description: values.job_description || null,
    interest: values.interest || null,
    source: values.source || null,
    tags: values.tags.length > 0 ? values.tags : null,
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FullApplicationForm({
  open,
  onOpenChange,
  onSuccess,
  prefill,
}: FullApplicationFormProps) {
  const createApplication = useCreateApplication();
  const snapshotDocument = useSnapshotDocument();
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FullApplicationValues>({
    // biome-ignore lint/suspicious/noExplicitAny: zod version mismatch
    resolver: zodResolver(fullApplicationSchema as any),
    defaultValues: {
      company_id: "",
      company_name: "",
      position: prefill?.position ?? "",
      url: prefill?.url ?? "",
      status: "applied",
      work_type: "",
      employment_type: "full-time",
      location: "",
      salary: { currency: "USD", period: "yearly" },
      job_description: "",
      interest: "medium",
      source: "",
      tags: [],
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        company_id: "",
        company_name: "",
        position: prefill?.position ?? "",
        url: prefill?.url ?? "",
        status: "applied",
        work_type: "",
        employment_type: "full-time",
        location: "",
        salary: { currency: "USD", period: "yearly" },
        job_description: "",
        interest: "medium",
        source: "",
        tags: [],
        notes: "",
      });
      const savedId = localStorage.getItem("thrive:default_resume_id");
      setSelectedResumeId(savedId ?? null);
    }
  }, [open, reset, prefill]);

  const selectedCompany = watch("company_id")
    ? { id: watch("company_id"), name: watch("company_name") }
    : null;

  const handleCompanySelect = (company: Pick<Company, "id" | "name">) => {
    setValue("company_id", company.id, { shouldValidate: true });
    setValue("company_name", company.name);
  };

  const onSubmit = async (values: FullApplicationValues) => {
    const payload = formValuesToPayload(values);
    const newApp = await createApplication.mutateAsync(payload);

    if (selectedResumeId && newApp?.id) {
      await snapshotDocument.mutateAsync({
        applicationId: newApp.id,
        documentId: selectedResumeId,
      });
      localStorage.setItem("thrive:default_resume_id", selectedResumeId);
    } else {
      localStorage.removeItem("thrive:default_resume_id");
    }

    onSuccess?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>New Application</DialogTitle>
          <DialogDescription>Add a new job application with full details.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <ScrollArea className="max-h-[70vh] pr-4">
            <div className="space-y-6 py-4">
              {/* Basic Information */}
              <fieldset className="space-y-4">
                <legend className="text-sm font-semibold text-muted-foreground">
                  Basic Information
                </legend>

                <div className="space-y-2">
                  <Label>Company *</Label>
                  <CompanyCombobox
                    value={selectedCompany}
                    onSelect={handleCompanySelect}
                    initialSearchText={prefill?.company ?? ""}
                  />
                  {errors.company_id && (
                    <p className="text-sm text-destructive">{errors.company_id.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="full-position">Position *</Label>
                  <Input
                    id="full-position"
                    placeholder="e.g. Senior Software Engineer"
                    {...register("position")}
                  />
                  {errors.position && (
                    <p className="text-sm text-destructive">{errors.position.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={watch("status") ?? "applied"}
                      onValueChange={(v) => setValue("status", v)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Interest</Label>
                    <Select
                      value={watch("interest") ?? "medium"}
                      onValueChange={(v) => setValue("interest", v)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select interest" />
                      </SelectTrigger>
                      <SelectContent>
                        {INTEREST_OPTIONS.map((i) => (
                          <SelectItem key={i} value={i}>
                            {i.charAt(0).toUpperCase() + i.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </fieldset>

              {/* Job Details */}
              <fieldset className="space-y-4">
                <legend className="text-sm font-semibold text-muted-foreground">Job Details</legend>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Work Type</Label>
                    <Select
                      value={watch("work_type") ?? ""}
                      onValueChange={(v) => setValue("work_type", v)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select work type" />
                      </SelectTrigger>
                      <SelectContent>
                        {WORK_TYPE_OPTIONS.map((w) => (
                          <SelectItem key={w} value={w}>
                            {w.charAt(0).toUpperCase() + w.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Employment Type</Label>
                    <Select
                      value={watch("employment_type") ?? "full-time"}
                      onValueChange={(v) => setValue("employment_type", v)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {EMPLOYMENT_TYPE_OPTIONS.map((e) => (
                          <SelectItem key={e} value={e}>
                            {e.charAt(0).toUpperCase() + e.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Location</Label>
                  <CityCombobox
                    value={watch("location") ?? ""}
                    onChange={(v) => setValue("location", v)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="full-url">URL</Label>
                  <Input id="full-url" placeholder="https://..." {...register("url")} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="full-job-description">Job Description</Label>
                  <textarea
                    id="full-job-description"
                    className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    {...register("job_description")}
                  />
                </div>
              </fieldset>

              {/* Salary Information */}
              <fieldset className="space-y-4">
                <legend className="text-sm font-semibold text-muted-foreground">
                  Salary Information
                </legend>
                <SalaryRangeSlider
                  period={watch("salary.period") ?? "yearly"}
                  currency={watch("salary.currency") ?? "USD"}
                  min={watch("salary.min") ?? 0}
                  max={watch("salary.max") ?? 0}
                  onChange={({ period, currency, min, max }) => {
                    setValue("salary.period", period);
                    setValue("salary.currency", currency);
                    setValue("salary.min", min);
                    setValue("salary.max", max);
                  }}
                />
              </fieldset>

              {/* Additional Information */}
              <fieldset className="space-y-4">
                <legend className="text-sm font-semibold text-muted-foreground">
                  Additional Information
                </legend>

                <div className="space-y-2">
                  <Label>Source</Label>
                  <SourceCombobox
                    value={watch("source") ?? ""}
                    onChange={(v) => setValue("source", v)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tags</Label>
                  <TagInput
                    value={watch("tags") ?? []}
                    onChange={(tags) => setValue("tags", tags)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="full-notes">Notes</Label>
                  <textarea
                    id="full-notes"
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Any additional notes..."
                    {...register("notes")}
                  />
                </div>
              </fieldset>

              {/* Documents */}
              <fieldset className="space-y-4">
                <legend className="text-sm font-semibold text-muted-foreground">Documents</legend>
                <div className="space-y-2">
                  <Label>Resume</Label>
                  <DocumentTypePicker
                    type="resume"
                    value={selectedResumeId}
                    onChange={(doc) => setSelectedResumeId(doc?.id ?? null)}
                  />
                </div>
              </fieldset>
            </div>
          </ScrollArea>

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Add Application"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
