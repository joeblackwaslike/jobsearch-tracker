import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ChevronsUpDownIcon, CheckIcon } from "lucide-react";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { useApplications, type ApplicationListItem } from "@/lib/queries/applications";
import { useCreateEvent } from "@/lib/queries/events";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EVENT_TYPE_OPTIONS = [
  { value: "screening_interview", label: "Screening Interview" },
  { value: "technical_interview", label: "Technical Interview" },
  { value: "behavioral_interview", label: "Behavioral Interview" },
  { value: "online_test", label: "Online Test" },
  { value: "take_home", label: "Take Home" },
  { value: "onsite", label: "Onsite" },
] as const;

const EVENT_STATUS_OPTIONS = [
  { value: "availability_requested", label: "Availability Requested" },
  { value: "availability_submitted", label: "Availability Submitted" },
  { value: "scheduled", label: "Scheduled" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "rescheduled", label: "Rescheduled" },
  { value: "no_show", label: "No Show" },
] as const;

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const scheduleFormSchema = z.object({
  application_id: z.string().min(1, "Application is required"),
  type: z.string().min(1, "Type is required"),
  status: z.string().default("scheduled"),
  title: z.string().default(""),
  date: z.string().default(""),
  time: z.string().default(""),
  duration_minutes: z.coerce.number().optional(),
  url: z.string().default(""),
  description: z.string().default(""),
});

type ScheduleFormValues = z.infer<typeof scheduleFormSchema>;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ScheduleDialog({
  open,
  onOpenChange,
  onSuccess,
}: ScheduleDialogProps) {
  const createEvent = useCreateEvent();
  const [appSearch, setAppSearch] = useState("");
  const [comboboxOpen, setComboboxOpen] = useState(false);

  const { data: applicationsData } = useApplications({
    search: appSearch || undefined,
    pageSize: 50,
  });
  const applications = applicationsData?.data ?? [];

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ScheduleFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(scheduleFormSchema as any),
    defaultValues: {
      application_id: "",
      type: "screening_interview",
      status: "scheduled",
      title: "",
      date: "",
      time: "",
      duration_minutes: undefined,
      url: "",
      description: "",
    },
  });

  const selectedAppId = watch("application_id");
  const selectedApp = applications.find(
    (a: ApplicationListItem) => a.id === selectedAppId
  );

  const onSubmit = async (values: ScheduleFormValues) => {
    let scheduled_at: string | null = null;
    if (values.date) {
      if (values.time) {
        scheduled_at = new Date(
          `${values.date}T${values.time}`
        ).toISOString();
      } else {
        scheduled_at = new Date(
          `${values.date}T00:00:00`
        ).toISOString();
      }
    }

    await createEvent.mutateAsync({
      application_id: values.application_id,
      type: values.type,
      status: values.status,
      title: values.title || null,
      description: values.description || null,
      url: values.url || null,
      scheduled_at,
      duration_minutes: values.duration_minutes || null,
    });

    reset();
    onSuccess?.();
    onOpenChange(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) reset();
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule Interview</DialogTitle>
          <DialogDescription>
            Schedule a new interview for an existing application.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 py-4">
            {/* Application selector */}
            <div className="space-y-2">
              <Label>Application *</Label>
              <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={comboboxOpen}
                    className="w-full justify-between font-normal"
                  >
                    {selectedApp
                      ? `${selectedApp.company?.name} - ${selectedApp.position}`
                      : "Select application..."}
                    <ChevronsUpDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Search by position or company..."
                      value={appSearch}
                      onValueChange={setAppSearch}
                    />
                    <CommandList>
                      <CommandEmpty>No applications found.</CommandEmpty>
                      <CommandGroup>
                        {applications.map((app: ApplicationListItem) => (
                          <CommandItem
                            key={app.id}
                            value={app.id}
                            onSelect={(val) => {
                              setValue("application_id", val, {
                                shouldValidate: true,
                              });
                              setComboboxOpen(false);
                            }}
                          >
                            <CheckIcon
                              className={cn(
                                "mr-2 size-4",
                                selectedAppId === app.id
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            <span className="truncate">
                              {app.company?.name} - {app.position}
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {errors.application_id && (
                <p className="text-sm text-destructive">
                  {errors.application_id.message}
                </p>
              )}
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label>Type *</Label>
              <Select
                value={watch("type") ?? "screening_interview"}
                onValueChange={(v) =>
                  setValue("type", v, { shouldValidate: true })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select interview type" />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-sm text-destructive">
                  {errors.type.message}
                </p>
              )}
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={watch("status") ?? "scheduled"}
                onValueChange={(v) => setValue("status", v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="schedule-title">Title</Label>
              <Input
                id="schedule-title"
                placeholder="e.g. Phone screen with recruiter"
                {...register("title")}
              />
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="schedule-date">Date</Label>
                <Input
                  id="schedule-date"
                  type="date"
                  {...register("date")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="schedule-time">Time</Label>
                <Input
                  id="schedule-time"
                  type="time"
                  {...register("time")}
                />
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label htmlFor="schedule-duration">Duration (minutes)</Label>
              <Input
                id="schedule-duration"
                type="number"
                placeholder="e.g. 30"
                {...register("duration_minutes", { valueAsNumber: true })}
              />
            </div>

            {/* URL */}
            <div className="space-y-2">
              <Label htmlFor="schedule-url">Meeting URL</Label>
              <Input
                id="schedule-url"
                placeholder="https://..."
                {...register("url")}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="schedule-description">Description</Label>
              <textarea
                id="schedule-description"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Notes about this interview..."
                {...register("description")}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Scheduling..." : "Schedule Interview"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
