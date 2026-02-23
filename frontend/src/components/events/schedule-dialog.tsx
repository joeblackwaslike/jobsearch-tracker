import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { DurationCombobox } from "@/components/events/duration-combobox";
import { ContactCombobox } from "@/components/events/contact-combobox";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { UrlInput } from "@/components/ui/url-input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type ApplicationListItem, useApplications } from "@/lib/queries/applications";
import type { Contact } from "@/lib/queries/contacts";
import { useAddEventContact } from "@/lib/queries/event-contacts";
import { useCreateEvent } from "@/lib/queries/events";
import { cn } from "@/lib/utils";

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
  status: z.string().default("availability_requested"),
  title: z.string().default(""),
  date: z.string().default(""),
  time: z.string().default(""),
  duration_minutes: z.coerce.number().optional(),
  url: z.string().default(""),
  description: z.string().default(""),
  notes: z.string().default(""),
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

export function ScheduleDialog({ open, onOpenChange, onSuccess }: ScheduleDialogProps) {
  const createEvent = useCreateEvent();
  const addInterviewer = useAddEventContact();
  const [appSearch, setAppSearch] = useState("");
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedInterviewers, setSelectedInterviewers] = useState<Pick<Contact, "id" | "name">[]>(
    [],
  );

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
    control,
    formState: { errors, isSubmitting },
  } = useForm<ScheduleFormValues>({
    // biome-ignore lint/suspicious/noExplicitAny: type mismatch between zod versions
    resolver: zodResolver(scheduleFormSchema as any),
    defaultValues: {
      application_id: "",
      type: "screening_interview",
      status: "availability_requested",
      title: "",
      date: "",
      time: "",
      duration_minutes: undefined,
      url: "",
      description: "",
      notes: "",
    },
  });

  const selectedAppId = watch("application_id");
  const selectedApp = applications.find((a: ApplicationListItem) => a.id === selectedAppId);
  const companyId = selectedApp?.company_id ?? "";

  const selectedType = watch("type");
  const titlePlaceholder =
    EVENT_TYPE_OPTIONS.find((o) => o.value === selectedType)?.label ?? "Interview";

  const watchedDate = watch("date");
  const watchedTime = watch("time");

  useEffect(() => {
    const currentStatus = watch("status");
    if (watchedDate && watchedTime) {
      if (currentStatus === "availability_requested") {
        setValue("status", "scheduled");
      }
    } else {
      if (currentStatus === "scheduled") {
        setValue("status", "availability_requested");
      }
    }
  }, [watchedDate, watchedTime, setValue, watch]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddInterviewer = (contact: Pick<Contact, "id" | "name">) => {
    setSelectedInterviewers((prev) => [...prev, contact]);
  };

  const handleRemoveInterviewer = (contactId: string) => {
    setSelectedInterviewers((prev) => prev.filter((c) => c.id !== contactId));
  };

  const onSubmit = async (values: ScheduleFormValues) => {
    let scheduled_at: string | null = null;
    if (values.date) {
      if (values.time) {
        scheduled_at = new Date(`${values.date}T${values.time}`).toISOString();
      } else {
        scheduled_at = new Date(`${values.date}T00:00:00`).toISOString();
      }
    }

    const effectiveTitle = values.title.trim() || titlePlaceholder;

    const newEvent = await createEvent.mutateAsync({
      application_id: values.application_id,
      type: values.type,
      status: values.status,
      title: effectiveTitle,
      description: values.description || null,
      url: values.url || null,
      scheduled_at,
      duration_minutes: values.duration_minutes || null,
      notes: values.notes || "",
    });

    // Link selected contacts to the newly created event
    if (selectedInterviewers.length > 0 && newEvent?.id) {
      await Promise.all(
        selectedInterviewers.map((c) =>
          addInterviewer.mutateAsync({
            eventId: newEvent.id,
            contactId: c.id,
          }),
        ),
      );
    }

    reset();
    setSelectedInterviewers([]);
    setSelectedDate(undefined);
    onSuccess?.();
    onOpenChange(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      reset();
      setSelectedInterviewers([]);
      setSelectedDate(undefined);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Event</DialogTitle>
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
                    type="button"
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
                                selectedAppId === app.id ? "opacity-100" : "opacity-0",
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
                <p className="text-sm text-destructive">{errors.application_id.message}</p>
              )}
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label>Type *</Label>
              <Select
                value={watch("type") ?? "screening_interview"}
                onValueChange={(v) => setValue("type", v, { shouldValidate: true })}
              >
                <SelectTrigger className="w-full" aria-label="Type">
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
              {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={watch("status") ?? "availability_requested"}
                onValueChange={(v) => setValue("status", v)}
              >
                <SelectTrigger className="w-full" aria-label="Status">
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
              <Input id="schedule-title" placeholder={titlePlaceholder} {...register("title")} />
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground",
                      )}
                      aria-label="Pick a date"
                    >
                      <CalendarIcon className="mr-2 size-4" />
                      {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        setSelectedDate(date);
                        setValue("date", date ? format(date, "yyyy-MM-dd") : "", {
                          shouldValidate: true,
                        });
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="schedule-time">Time</Label>
                <Input id="schedule-time" type="time" {...register("time")} />
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label>Duration</Label>
              <DurationCombobox
                value={watch("duration_minutes")}
                onChange={(v) => setValue("duration_minutes", v)}
              />
            </div>

            {/* URL */}
            <div className="space-y-2">
              <Label>Meeting URL</Label>
              <Controller
                name="url"
                control={control}
                render={({ field }) => (
                  <UrlInput
                    id="schedule-url"
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="https://..."
                  />
                )}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="schedule-description">Description</Label>
              <Input
                id="schedule-description"
                placeholder="Description of interview"
                {...register("description")}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="schedule-notes">Notes</Label>
              <textarea
                id="schedule-notes"
                className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Notes about this interview..."
                {...register("notes")}
              />
            </div>

            {/* Interviewers */}
            {companyId && (
              <div className="space-y-2">
                <Label>Interviewers</Label>
                <ContactCombobox
                  companyId={companyId}
                  selectedContactIds={selectedInterviewers.map((c) => c.id)}
                  selectedContacts={selectedInterviewers}
                  onAdd={handleAddInterviewer}
                  onRemove={handleRemoveInterviewer}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Scheduling..." : "Add Event"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
