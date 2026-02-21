import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { DocumentTypePicker } from "@/components/documents/document-type-picker";
import { Badge } from "@/components/ui/badge";
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
import { useApplicationDocuments, useDetachDocument } from "@/lib/queries/application-documents";
import {
  type ApplicationWithCompany,
  useUpdateApplication,
} from "@/lib/queries/applications";
import { useSnapshotDocument } from "@/lib/queries/documents";
import { CityCombobox } from "./city-combobox";
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

const SALARY_PERIOD_OPTIONS = ["yearly", "hourly"] as const;

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const salarySchema = z.object({
  min: z.coerce.number().optional(),
  max: z.coerce.number().optional(),
  currency: z.string().default("USD"),
  period: z.string().default("yearly"),
});

const applicationFormSchema = z.object({
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
});

type ApplicationFormValues = z.infer<typeof applicationFormSchema>;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ApplicationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application?: ApplicationWithCompany | null;
  onSuccess?: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function applicationToFormValues(app: ApplicationWithCompany): ApplicationFormValues {
  const salary = (app.salary ?? {}) as Record<string, unknown>;

  return {
    company_id: app.company_id,
    company_name: app.company?.name ?? "",
    position: app.position,
    url: app.url ?? "",
    status: app.status,
    work_type: app.work_type ?? "",
    employment_type: app.employment_type ?? "full-time",
    location: app.location ?? "",
    salary: {
      min: salary.min ? Number(salary.min) : undefined,
      max: salary.max ? Number(salary.max) : undefined,
      currency: (salary.currency as string) ?? "USD",
      period: (salary.period as string) ?? "yearly",
    },
    job_description: app.job_description ?? "",
    interest: app.interest ?? "medium",
    source: app.source ?? "",
    tags: Array.isArray(app.tags) ? (app.tags as string[]) : [],
  };
}

function formValuesToPayload(values: ApplicationFormValues) {
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

export function ApplicationForm({
  open,
  onOpenChange,
  application,
  onSuccess,
}: ApplicationFormProps) {
  const updateApplication = useUpdateApplication();

  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);

  const { data: attachedDocs = [] } = useApplicationDocuments(application?.id ?? "");
  const detachDocument = useDetachDocument();
  const snapshotDocument = useSnapshotDocument();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ApplicationFormValues>({
    // biome-ignore lint/suspicious/noExplicitAny: type mismatch between zod versions
    resolver: zodResolver(applicationFormSchema as any),
    defaultValues: {
      company_id: "",
      company_name: "",
      position: "",
      url: "",
      status: "applied",
      work_type: "",
      employment_type: "full-time",
      location: "",
      salary: { currency: "USD", period: "yearly" },
      job_description: "",
      interest: "medium",
      source: "",
      tags: [],
    },
  });

  useEffect(() => {
    if (open && application) {
      reset(applicationToFormValues(application));
      setSelectedResumeId(null);
    }
  }, [open, application, reset]);

  const onSubmit = async (values: ApplicationFormValues) => {
    if (!application) return;
    const payload = formValuesToPayload(values);
    await updateApplication.mutateAsync({ id: application.id, ...payload });
    if (selectedResumeId) {
      await snapshotDocument.mutateAsync({
        applicationId: application.id,
        documentId: selectedResumeId,
      });
    }
    onSuccess?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Edit Application</DialogTitle>
          <DialogDescription>Update application details.</DialogDescription>
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
                  <Label>Company</Label>
                  <Input value={watch("company_name")} disabled readOnly />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-position">Position *</Label>
                  <Input id="edit-position" {...register("position")} />
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
                  <Label htmlFor="edit-url">URL</Label>
                  <Input id="edit-url" placeholder="https://..." {...register("url")} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-job-description">Job Description</Label>
                  <textarea
                    id="edit-job-description"
                    className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    {...register("job_description")}
                  />
                </div>
              </fieldset>

              {/* Salary */}
              <fieldset className="space-y-4">
                <legend className="text-sm font-semibold text-muted-foreground">Salary</legend>
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

                {attachedDocs.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {attachedDocs.map((doc) => (
                      <Badge key={doc.id} variant="secondary" className="gap-1">
                        {doc.name}
                        <button
                          type="button"
                          onClick={() =>
                            detachDocument.mutateAsync({
                              id: doc.id,
                              applicationId: application?.id ?? "",
                            })
                          }
                        >
                          <X className="size-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </fieldset>
            </div>
          </ScrollArea>

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
