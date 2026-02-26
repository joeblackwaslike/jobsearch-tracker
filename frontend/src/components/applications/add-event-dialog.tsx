import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ContactCombobox } from "@/components/events/contact-combobox";
import { DurationCombobox } from "@/components/events/duration-combobox";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Contact } from "@/lib/queries/contacts";
import {
  useAddEventContact,
  useEventContacts,
  useRemoveEventContact,
} from "@/lib/queries/event-contacts";
import { type Event, useCreateEvent, useUpdateEvent } from "@/lib/queries/events";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EVENT_TYPE_OPTIONS = [
  { value: "screening-interview", label: "Screening Interview" },
  { value: "technical-interview", label: "Technical Interview" },
  { value: "behavioral-interview", label: "Behavioral Interview" },
  { value: "online-test", label: "Online Test" },
  { value: "take-home", label: "Take Home" },
  { value: "onsite", label: "Onsite" },
  { value: "received-offer", label: "Received Offer" },
  { value: "accepted-offer", label: "Accepted Offer" },
  { value: "rejected-offer", label: "Rejected Offer" },
  { value: "offer-withdrawn", label: "Offer Withdrawn" },
  { value: "follow-up", label: "Follow Up" },
  { value: "hiring-manager", label: "Hiring Manager" },
  { value: "peer-interview", label: "Peer Interview" },
] as const;

const EVENT_STATUS_OPTIONS = [
  { value: "availability-requested", label: "Availability Requested" },
  { value: "availability-submitted", label: "Availability Submitted" },
  { value: "scheduled", label: "Scheduled" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "rescheduled", label: "Rescheduled" },
  { value: "no-show", label: "No Show" },
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
  companyId?: string;
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
  companyId,
  mode,
  event,
  onSuccess,
}: AddEventDialogProps) {
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const addContact = useAddEventContact();
  const removeContact = useRemoveEventContact();

  // For create mode: track contacts locally until event is created
  const [selectedContacts, setSelectedContacts] = useState<Pick<Contact, "id" | "name">[]>([]);

  // For edit mode: load existing contacts from the server
  const { data: existingContacts } = useEventContacts(event?.id ?? "");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EventFormValues>({
    // biome-ignore lint/suspicious/noExplicitAny: type mismatch between zod versions
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
        setSelectedContacts([]);
      }
    }
  }, [open, mode, event, reset]);

  const handleAddContact = (contact: Pick<Contact, "id" | "name">) => {
    if (mode === "edit" && event) {
      addContact.mutateAsync({ eventId: event.id, contactId: contact.id });
    } else {
      setSelectedContacts((prev) => [...prev, contact]);
    }
  };

  const handleRemoveContact = (contactId: string) => {
    if (mode === "edit" && event) {
      removeContact.mutateAsync({ eventId: event.id, contactId });
    } else {
      setSelectedContacts((prev) => prev.filter((c) => c.id !== contactId));
    }
  };

  const onSubmit = async (values: EventFormValues) => {
    const payload = formValuesToPayload(values);

    if (mode === "edit" && event) {
      await updateEvent.mutateAsync({
        id: event.id,
        applicationId,
        ...payload,
      });
    } else {
      const newEvent = await createEvent.mutateAsync({
        application_id: applicationId,
        ...payload,
      });

      // Link selected contacts to the newly created event
      if (selectedContacts.length > 0 && newEvent?.id) {
        await Promise.all(
          selectedContacts.map((c) =>
            addContact.mutateAsync({
              eventId: newEvent.id,
              contactId: c.id,
            }),
          ),
        );
      }
    }

    onSuccess?.();
    onOpenChange(false);
  };

  const isCreate = mode === "create";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>{isCreate ? "Add Event" : "Edit Event"}</DialogTitle>
          <DialogDescription>
            {isCreate ? "Add a new event to this application timeline." : "Update event details."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <ScrollArea className="max-h-[70vh] pr-4">
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
                {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
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
                  <Input id="event-date" type="date" {...register("date")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="event-time">Time</Label>
                  <Input id="event-time" type="time" {...register("time")} />
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
                <Label htmlFor="event-url">Meeting URL</Label>
                <Input id="event-url" placeholder="https://..." {...register("url")} />
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

              {/* Contacts */}
              {companyId && (
                <div className="space-y-2">
                  <Label>Contacts</Label>
                  <ContactCombobox
                    companyId={companyId}
                    selectedContactIds={
                      mode === "edit"
                        ? (existingContacts?.map((ec) => ec.contact.id) ?? [])
                        : selectedContacts.map((c) => c.id)
                    }
                    selectedContacts={
                      mode === "edit"
                        ? (existingContacts?.map((ec) => ({
                            id: ec.contact.id,
                            name: ec.contact.name,
                          })) ?? [])
                        : selectedContacts
                    }
                    onAdd={handleAddContact}
                    onRemove={handleRemoveContact}
                  />
                </div>
              )}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : isCreate ? "Add Event" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
