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
import { useCreateApplication } from "@/lib/queries/applications";
import type { Company } from "@/lib/queries/companies";
import { useSnapshotDocument } from "@/lib/queries/documents";
import { CompanyCombobox } from "./company-combobox";

const easyAddSchema = z.object({
  company_id: z.string().min(1, "Company is required"),
  company_name: z.string().default(""),
  position: z.string().min(1, "Position is required"),
  url: z.string().default(""),
});

type EasyAddValues = z.infer<typeof easyAddSchema>;

interface EasyAddFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  prefill?: { company?: string; position?: string; url?: string };
}

export function EasyAddForm({ open, onOpenChange, onSuccess, prefill }: EasyAddFormProps) {
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
  } = useForm<EasyAddValues>({
    // biome-ignore lint/suspicious/noExplicitAny: zod version mismatch
    resolver: zodResolver(easyAddSchema as any),
    defaultValues: {
      company_id: "",
      company_name: "",
      position: prefill?.position ?? "",
      url: prefill?.url ?? "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        company_id: "",
        company_name: "",
        position: prefill?.position ?? "",
        url: prefill?.url ?? "",
      });
      const savedId = localStorage.getItem("tracker:default_resume_id");
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

  const onSubmit = async (values: EasyAddValues) => {
    const newApp = await createApplication.mutateAsync({
      company_id: values.company_id,
      position: values.position,
      url: values.url || null,
      status: "applied",
      employment_type: "full-time",
    });

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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Easy Add Application</DialogTitle>
          <DialogDescription>Quickly log a new job application.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 py-4">
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
              <Label htmlFor="easy-position">Position *</Label>
              <Input
                id="easy-position"
                placeholder="e.g. Senior Software Engineer"
                {...register("position")}
              />
              {errors.position && (
                <p className="text-sm text-destructive">{errors.position.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="easy-url">URL</Label>
              <Input id="easy-url" placeholder="https://..." {...register("url")} />
            </div>

            <div className="space-y-2">
              <Label>Resume</Label>
              <DocumentTypePicker
                type="resume"
                value={selectedResumeId}
                onChange={(doc) => setSelectedResumeId(doc?.id ?? null)}
              />
            </div>
          </div>

          <DialogFooter>
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
