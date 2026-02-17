import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CompanyCombobox } from "./company-combobox";
import {
  useCreateApplication,
  useUpdateApplication,
  type ApplicationWithCompany,
} from "@/lib/queries/applications";
import type { Company } from "@/lib/queries/companies";

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

const WORK_TYPE_OPTIONS = ["remote", "hybrid", "onsite"] as const;

const EMPLOYMENT_TYPE_OPTIONS = [
  "full-time",
  "part-time",
  "contract",
  "internship",
] as const;

const INTEREST_OPTIONS = ["low", "medium", "high", "dream"] as const;

const SALARY_PERIOD_OPTIONS = ["yearly", "monthly", "hourly"] as const;

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
  status: z.string().default("bookmarked"),
  work_type: z.string().default(""),
  employment_type: z.string().default(""),
  location: z.string().default(""),
  salary: salarySchema.default({ currency: "USD", period: "yearly" }),
  job_description: z.string().default(""),
  interest: z.string().default("medium"),
  source: z.string().default(""),
  tags: z.string().default(""),
});

type ApplicationFormValues = z.infer<typeof applicationFormSchema>;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ApplicationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  application?: ApplicationWithCompany | null;
  onSuccess?: () => void;
  /** URL search params for pre-filling create form */
  prefill?: {
    company?: string;
    position?: string;
    url?: string;
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function applicationToFormValues(
  app: ApplicationWithCompany
): ApplicationFormValues {
  const salary = (app.salary ?? {}) as Record<string, unknown>;
  const tags = Array.isArray(app.tags)
    ? (app.tags as string[]).join(", ")
    : "";

  return {
    company_id: app.company_id,
    company_name: app.company?.name ?? "",
    position: app.position,
    url: app.url ?? "",
    status: app.status,
    work_type: app.work_type ?? "",
    employment_type: app.employment_type ?? "",
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
    tags,
  };
}

function formValuesToPayload(values: ApplicationFormValues) {
  const tags = values.tags
    ? values.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  const salary: Record<string, string | number> = {};
  if (values.salary.min !== undefined && values.salary.min !== 0)
    salary.min = values.salary.min;
  if (values.salary.max !== undefined && values.salary.max !== 0)
    salary.max = values.salary.max;
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
    tags: tags.length > 0 ? tags : null,
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ApplicationForm({
  open,
  onOpenChange,
  mode,
  application,
  onSuccess,
  prefill,
}: ApplicationFormProps) {
  const createApplication = useCreateApplication();
  const updateApplication = useUpdateApplication();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ApplicationFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(applicationFormSchema as any),
    defaultValues: {
      company_id: "",
      company_name: "",
      position: prefill?.position ?? "",
      url: prefill?.url ?? "",
      status: "bookmarked",
      work_type: "",
      employment_type: "",
      location: "",
      salary: { currency: "USD", period: "yearly" },
      job_description: "",
      interest: "medium",
      source: "",
      tags: "",
    },
  });

  // Reset form when dialog opens or mode/application changes
  useEffect(() => {
    if (open) {
      if (mode === "edit" && application) {
        reset(applicationToFormValues(application));
      } else {
        reset({
          company_id: "",
          company_name: "",
          position: prefill?.position ?? "",
          url: prefill?.url ?? "",
          status: "bookmarked",
          work_type: "",
          employment_type: "",
          location: "",
          salary: { currency: "USD", period: "yearly" },
          job_description: "",
          interest: "medium",
          source: "",
          tags: "",
        });
      }
    }
  }, [open, mode, application, reset, prefill]);

  const selectedCompany = watch("company_id")
    ? { id: watch("company_id"), name: watch("company_name") }
    : null;

  const handleCompanySelect = (company: Pick<Company, "id" | "name">) => {
    setValue("company_id", company.id, { shouldValidate: true });
    setValue("company_name", company.name);
  };

  const onSubmit = async (values: ApplicationFormValues) => {
    const payload = formValuesToPayload(values);

    if (mode === "edit" && application) {
      await updateApplication.mutateAsync({
        id: application.id,
        ...payload,
      });
    } else {
      await createApplication.mutateAsync(payload);
    }

    onSuccess?.();
    onOpenChange(false);
  };

  const isCreate = mode === "create";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={isCreate ? "sm:max-w-md" : "sm:max-w-2xl max-h-[90vh]"}
      >
        <DialogHeader>
          <DialogTitle>
            {isCreate ? "New Application" : "Edit Application"}
          </DialogTitle>
          <DialogDescription>
            {isCreate
              ? "Add a new job application to track."
              : "Update application details."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          {isCreate ? (
            /* ---- Create mode: minimal fields ---- */
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Company *</Label>
                <CompanyCombobox
                  value={selectedCompany}
                  onSelect={handleCompanySelect}
                  initialSearchText={prefill?.company ?? ""}
                />
                {errors.company_id && (
                  <p className="text-sm text-destructive">
                    {errors.company_id.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-position">Position *</Label>
                <Input
                  id="create-position"
                  placeholder="e.g. Senior Software Engineer"
                  {...register("position")}
                />
                {errors.position && (
                  <p className="text-sm text-destructive">
                    {errors.position.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-url">URL</Label>
                <Input
                  id="create-url"
                  placeholder="https://..."
                  {...register("url")}
                />
              </div>
            </div>
          ) : (
            /* ---- Edit mode: all fields ---- */
            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="space-y-6 py-4">
                {/* Company (read-only in edit mode) */}
                <fieldset className="space-y-4">
                  <legend className="text-sm font-semibold text-muted-foreground">
                    Basic Information
                  </legend>

                  <div className="space-y-2">
                    <Label>Company</Label>
                    <Input
                      value={watch("company_name")}
                      disabled
                      readOnly
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-position">Position *</Label>
                    <Input
                      id="edit-position"
                      {...register("position")}
                    />
                    {errors.position && (
                      <p className="text-sm text-destructive">
                        {errors.position.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={watch("status") ?? "bookmarked"}
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
                        value={watch("employment_type") ?? ""}
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
                    <Label htmlFor="edit-location">Location</Label>
                    <Input
                      id="edit-location"
                      placeholder="e.g. San Francisco, CA"
                      {...register("location")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-url">URL</Label>
                    <Input
                      id="edit-url"
                      placeholder="https://..."
                      {...register("url")}
                    />
                  </div>
                </fieldset>

                {/* Salary */}
                <fieldset className="space-y-4">
                  <legend className="text-sm font-semibold text-muted-foreground">
                    Salary
                  </legend>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-salary-min">Min</Label>
                      <Input
                        id="edit-salary-min"
                        type="number"
                        placeholder="0"
                        {...register("salary.min", { valueAsNumber: true })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-salary-max">Max</Label>
                      <Input
                        id="edit-salary-max"
                        type="number"
                        placeholder="0"
                        {...register("salary.max", { valueAsNumber: true })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-salary-currency">Currency</Label>
                      <Input
                        id="edit-salary-currency"
                        placeholder="USD"
                        {...register("salary.currency")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Period</Label>
                      <Select
                        value={watch("salary.period") ?? "yearly"}
                        onValueChange={(v) => setValue("salary.period", v)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                        <SelectContent>
                          {SALARY_PERIOD_OPTIONS.map((p) => (
                            <SelectItem key={p} value={p}>
                              {p.charAt(0).toUpperCase() + p.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </fieldset>

                {/* Details */}
                <fieldset className="space-y-4">
                  <legend className="text-sm font-semibold text-muted-foreground">
                    Details
                  </legend>

                  <div className="space-y-2">
                    <Label htmlFor="edit-job-description">
                      Job Description
                    </Label>
                    <textarea
                      id="edit-job-description"
                      className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...register("job_description")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-source">Source</Label>
                    <Input
                      id="edit-source"
                      placeholder="e.g. LinkedIn, referral"
                      {...register("source")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-tags">Tags (comma-separated)</Label>
                    <Input
                      id="edit-tags"
                      placeholder="e.g. react, typescript, startup"
                      {...register("tags")}
                    />
                  </div>
                </fieldset>
              </div>
            </ScrollArea>
          )}

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Saving..."
                : isCreate
                  ? "Add Application"
                  : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
