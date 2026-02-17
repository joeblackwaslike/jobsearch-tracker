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
import {
  useCreateEvent,
  useUpdateEvent,
  type Event,
} from "@/lib/queries/events";

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
  { value: "offer", label: "Offer" },
  { value: "rejection", label: "Rejection" },
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

const eventFormSchema = z.object({
  type: z.string().min(1, "Type is required"),
  status: z.string().default("scheduled"),
  title: z.string().default(""),
  date: z.string().default(""),
  time: z.string().default(""),
  duration_minutes: z.coerce.number().optional(),
  url: z.string().default(""),
  description: z.string().default(""),
});

type EventFormValues = z.infer<typeof eventFormSchema>;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AddEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationId: string;
  mode: "create" | "edit";
  event?: Event | null;
  onSuccess?: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function eventToFormValues(event: Event): EventFormValues {
  let date = "";
  let time = "";

  if (event.scheduled_at) {
    const dt = new Date(event.scheduled_at);
    // Format date as YYYY-MM-DD
    date = dt.toISOString().split("T")[0];
    // Format time as HH:MM
    const hours = dt.getHours().toString().padStart(2, "0");
    const minutes = dt.getMinutes().toString().padStart(2, "0");
    time = `${hours}:${minutes}`;
  }

  return {
    type: event.type,
    status: event.status,
    title: event.title ?? "",
    date,
    time,
    duration_minutes: event.duration_minutes ?? undefined,
    url: event.url ?? "",
    description: event.description ?? "",
  };
}

function formValuesToPayload(values: EventFormValues) {
  let scheduled_at: string | null = null;

  if (values.date) {
    if (values.time) {
      scheduled_at = new Date(`${values.date}T${values.time}`).toISOString();
    } else {
      scheduled_at = new Date(`${values.date}T00:00:00`).toISOString();
    }
  }

  return {
    type: values.type,
    status: values.status,
    title: values.title || null,
    description: values.description || null,
    url: values.url || null,
    scheduled_at,
    duration_minutes: values.duration_minutes || null,
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AddEventDialog({
  open,
  onOpenChange,
  applicationId,
  mode,
  event,
  onSuccess,
}: AddEventDialogProps) {
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EventFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(eventFormSchema as any),
    defaultValues: {
      type: "",
      status: "scheduled",
      title: "",
      date: "",
      time: "",
      duration_minutes: undefined,
      url: "",
      description: "",
    },
  });

  useEffect(() => {
    if (open) {
      if (mode === "edit" && event) {
        reset(eventToFormValues(event));
      } else {
        reset({
          type: "",
          status: "scheduled",
          title: "",
          date: "",
          time: "",
          duration_minutes: undefined,
          url: "",
          description: "",
        });
      }
    }
  }, [open, mode, event, reset]);

  const onSubmit = async (values: EventFormValues) => {
    const payload = formValuesToPayload(values);

    if (mode === "edit" && event) {
      await updateEvent.mutateAsync({
        id: event.id,
        applicationId,
        ...payload,
      });
    } else {
      await createEvent.mutateAsync({
        application_id: applicationId,
        ...payload,
      });
    }

    onSuccess?.();
    onOpenChange(false);
  };

  const isCreate = mode === "create";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isCreate ? "Add Event" : "Edit Event"}
          </DialogTitle>
          <DialogDescription>
            {isCreate
              ? "Add a new event to this application timeline."
              : "Update event details."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 py-4">
            {/* Type */}
            <div className="space-y-2">
              <Label>Type *</Label>
              <Select
                value={watch("type") ?? ""}
                onValueChange={(v) => setValue("type", v, { shouldValidate: true })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select event type" />
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
              <Label htmlFor="event-title">Title</Label>
              <Input
                id="event-title"
                placeholder="e.g. Phone screen with recruiter"
                {...register("title")}
              />
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event-date">Date</Label>
                <Input
                  id="event-date"
                  type="date"
                  {...register("date")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-time">Time</Label>
                <Input
                  id="event-time"
                  type="time"
                  {...register("time")}
                />
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label htmlFor="event-duration">Duration (minutes)</Label>
              <Input
                id="event-duration"
                type="number"
                placeholder="e.g. 30"
                {...register("duration_minutes", { valueAsNumber: true })}
              />
            </div>

            {/* URL */}
            <div className="space-y-2">
              <Label htmlFor="event-url">Meeting URL</Label>
              <Input
                id="event-url"
                placeholder="https://..."
                {...register("url")}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="event-description">Description</Label>
              <textarea
                id="event-description"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Notes about this event..."
                {...register("description")}
              />
            </div>
          </div>

          <DialogFooter>
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
                  ? "Add Event"
                  : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
