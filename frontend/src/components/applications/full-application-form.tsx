import { zodResolver } from "@hookform/resolvers/zod";
import { BookmarkIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
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
import { UrlInput } from "@/components/ui/url-input";
import type { ApplicationWithCompany } from "@/lib/queries/applications";
import { useCreateApplication, useUpdateApplication } from "@/lib/queries/applications";
import type { Company } from "@/lib/queries/companies";
import { useCreateCompany } from "@/lib/queries/companies";
import { useSnapshotDocument } from "@/lib/queries/documents";
import { type ExtractedJobData, getSourceFromUrl } from "@/lib/url-import";
import { CityMultiCombobox } from "./city-multi-combobox";
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
  locations: z.array(z.string()).default([]),
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
  importData?: ExtractedJobData;
  defaultStatus?: string;
  application?: ApplicationWithCompany | null;
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
    locations: values.locations ?? [],
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
  importData,
  defaultStatus,
  application,
}: FullApplicationFormProps) {
  const createApplication = useCreateApplication();
  const updateApplication = useUpdateApplication();
  const snapshotDocument = useSnapshotDocument();
  const createCompany = useCreateCompany();
  const isBookmarkedEdit = !!application && application.status === "bookmarked";
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FullApplicationValues>({
    // biome-ignore lint/suspicious/noExplicitAny: zod version mismatch
    resolver: zodResolver(fullApplicationSchema as any),
    defaultValues: {
      company_id: "",
      company_name: "",
      position: prefill?.position ?? "",
      url: prefill?.url ?? "",
      status: defaultStatus ?? "applied",
      work_type: "",
      employment_type: "full-time",
      locations: importData?.locations ?? [],
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
        company_name: importData?.companyName ?? prefill?.company ?? "",
        position: importData?.position ?? prefill?.position ?? "",
        url: importData?.jobUrl ?? prefill?.url ?? "",
        status: defaultStatus ?? "applied",
        work_type: importData?.workType ?? "",
        employment_type: importData?.employmentType ?? "full-time",
        locations: importData?.locations ?? [],
        salary: {
          min: importData?.salaryMin,
          max: importData?.salaryMax,
          currency: importData?.salaryCurrency ?? "USD",
          period: "yearly",
        },
        job_description: importData?.jobDescription ?? "",
        interest: "medium",
        source: importData?.source ?? (prefill?.url ? getSourceFromUrl(prefill.url) : ""),
        tags: [],
        notes: "",
      });
      setSelectedResumeId(localStorage.getItem("tracker:default_resume_id"));
    }
  }, [open, reset, prefill, importData, defaultStatus]);

  // Auto-create company when form opens with importData.companyName
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally omit createCompany/setValue — stable refs, re-running on every render would cause infinite loops
  useEffect(() => {
    if (!open || !importData?.companyName) return;

    let cancelled = false;

    async function autoCreate() {
      try {
        const result = await createCompany.mutateAsync({ name: importData?.companyName ?? "" });
        if (!cancelled) {
          setValue("company_id", result.id, { shouldValidate: true });
          setValue("company_name", result.name);
        }
      } catch {
        // Company may already exist or creation failed — user can manually select/create via combobox
      }
    }

    autoCreate();
    return () => {
      cancelled = true;
    };
  }, [open, importData?.companyName]);

  const selectedCompany = watch("company_id")
    ? { id: watch("company_id"), name: watch("company_name") }
    : null;

  const handleCompanySelect = (company: Pick<Company, "id" | "name">) => {
    setValue("company_id", company.id, { shouldValidate: true });
    setValue("company_name", company.name);
  };

  const handleBookmark = async () => {
    const values = watch();
    if (!values.company_id || !values.position) return;
    await createApplication.mutateAsync({
      company_id: values.company_id,
      position: values.position,
      url: values.url || null,
      status: "bookmarked",
      employment_type: "full-time",
      applied_at: null,
    });
    onSuccess?.();
    onOpenChange(false);
  };

  const handleSetApplied = async () => {
    if (!application) return;
    await updateApplication.mutateAsync({
      id: application.id,
      status: "applied",
      applied_at: new Date().toISOString(),
    });
    onSuccess?.();
    onOpenChange(false);
  };

  const onSubmit = async (values: FullApplicationValues) => {
    const payload = formValuesToPayload(values);
    const newApp = await createApplication.mutateAsync(payload);

    if (selectedResumeId && newApp?.id) {
      await snapshotDocument.mutateAsync({
        applicationId: newApp.id,
        documentId: selectedResumeId,
      });
      localStorage.setItem("tracker:default_resume_id", selectedResumeId);
    } else {
      localStorage.removeItem("tracker:default_resume_id");
    }

    onSuccess?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>New Application</DialogTitle>
          <DialogDescription>Add a new job application with full details.</DialogDescription>
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
                  <Label>Company *</Label>
                  <CompanyCombobox
                    value={selectedCompany}
                    onSelect={handleCompanySelect}
                    initialSearchText={watch("company_name") || prefill?.company || ""}
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <CityMultiCombobox
                      value={watch("locations") ?? []}
                      onChange={(v) => setValue("locations", v)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Source</Label>
                    <SourceCombobox
                      value={watch("source") ?? ""}
                      onChange={(v) => setValue("source", v)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="full-url">URL</Label>
                  <Controller
                    name="url"
                    control={control}
                    render={({ field }) => (
                      <UrlInput id="full-url" value={field.value} onChange={field.onChange} />
                    )}
                  />
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
                  <DocumentTypePicker
                    type="resume"
                    value={selectedResumeId}
                    onChange={(doc) => setSelectedResumeId(doc?.id ?? null)}
                  />
                </div>
              </fieldset>

              {isBookmarkedEdit ? (
                <DialogFooter className="mt-4">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button type="button" onClick={handleSetApplied}>
                    Set to Applied
                  </Button>
                </DialogFooter>
              ) : (
                <DialogFooter className="mt-4">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    disabled={
                      !watch("company_id") || !watch("position") || createApplication.isPending
                    }
                    onClick={handleBookmark}
                    aria-label="Bookmark for later"
                    title="Bookmark for later"
                  >
                    <BookmarkIcon className="size-4" />
                  </Button>
                  <Button type="submit" disabled={isSubmitting} autoFocus={!!importData}>
                    {isSubmitting ? "Saving..." : "New Application"}
                  </Button>
                </DialogFooter>
              )}
            </div>
          </ScrollArea>
        </form>
      </DialogContent>
    </Dialog>
  );
}
