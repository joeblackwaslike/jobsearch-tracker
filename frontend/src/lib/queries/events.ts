import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/lib/supabase/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Event = Tables<"events">;
type EventInsert = TablesInsert<"events">;
type EventUpdate = TablesUpdate<"events">;

export type EventWithApplication = Event & {
  application: {
    id: string;
    position: string;
    status: string;
    company: { id: string; name: string };
  };
};

export type { Event };

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const INTERVIEW_TYPES = [
  "screening-interview",
  "technical-interview",
  "behavioral-interview",
  "online-test",
  "take-home",
  "onsite",
] as const;

// ---------------------------------------------------------------------------
// Query-option factories
// ---------------------------------------------------------------------------

export function eventsQueryOptions(applicationId: string) {
  const supabase = createClient();

  return queryOptions({
    queryKey: ["events", { applicationId }],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("application_id", applicationId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Event[];
    },
    enabled: !!applicationId,
  });
}

// ---------------------------------------------------------------------------
// Hooks — queries
// ---------------------------------------------------------------------------

export function useEvents(applicationId: string) {
  return useQuery(eventsQueryOptions(applicationId));
}

export function useUpcomingEvents() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["events", "upcoming"],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("events")
        .select("*, application:applications(id, position, status, company:companies(id, name))")
        .in("type", INTERVIEW_TYPES as unknown as string[])
        .or(`scheduled_at.gt.${now},scheduled_at.is.null`)
        .order("scheduled_at", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data as unknown as EventWithApplication[];
    },
  });
}

export function usePastEvents() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["events", "past"],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("events")
        .select("*, application:applications(id, position, status, company:companies(id, name))")
        .in("type", INTERVIEW_TYPES as unknown as string[])
        .lte("scheduled_at", now)
        .not("scheduled_at", "is", null)
        .order("scheduled_at", { ascending: false });
      if (error) throw error;
      return data as unknown as EventWithApplication[];
    },
  });
}

// ---------------------------------------------------------------------------
// Hooks — mutations
// ---------------------------------------------------------------------------

export function useCreateEvent() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Omit<EventInsert, "user_id"> & { application_id: string }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("events")
        .insert({
          ...input,
          user_id: user.id,
        })
        .select()
        .single();
      if (error) throw error;

      // Auto-transition application status
      const eventType = input.type;

      if ((INTERVIEW_TYPES as readonly string[]).includes(eventType)) {
        const { data: app } = await supabase
          .from("applications")
          .select("status")
          .eq("id", input.application_id)
          .single();
        if (app?.status === "applied") {
          await supabase
            .from("applications")
            .update({ status: "interviewing" })
            .eq("id", input.application_id);
        }
      }

      if (eventType === "offer") {
        const { data: app } = await supabase
          .from("applications")
          .select("status")
          .eq("id", input.application_id)
          .single();
        if (app?.status === "interviewing") {
          await supabase
            .from("applications")
            .update({ status: "offer" })
            .eq("id", input.application_id);
        }
      }

      return data as Event;
    },
    onSuccess: () => {
      toast.success("Event scheduled.");
    },
    onError: () => {
      toast.error("Failed to schedule event.");
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["events", { applicationId: variables?.application_id }],
      });
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["events", "upcoming"] });
      queryClient.invalidateQueries({ queryKey: ["events", "past"] });
    },
  });
}

export function useUpdateEvent() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      applicationId,
      ...updates
    }: EventUpdate & { id: string; applicationId: string }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("events")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();
      if (error) throw error;
      return data as Event;
    },
    onSuccess: () => {
      toast.success("Event updated.");
    },
    onError: () => {
      toast.error("Failed to update event.");
    },
    onSettled: (_data, _error, variables) => {
      if (variables?.applicationId) {
        queryClient.invalidateQueries({
          queryKey: ["events", { applicationId: variables.applicationId }],
        });
      }
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["events", "upcoming"] });
      queryClient.invalidateQueries({ queryKey: ["events", "past"] });
    },
  });
}

export function useDeleteEvent() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, applicationId }: { id: string; applicationId: string }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("events").delete().eq("id", id).eq("user_id", user.id);
      if (error) throw error;
      return { id, applicationId };
    },
    onSuccess: () => {
      toast.success("Event deleted.");
    },
    onError: () => {
      toast.error("Failed to delete event.");
    },
    onSettled: (_data, _error, variables) => {
      if (variables?.applicationId) {
        queryClient.invalidateQueries({
          queryKey: ["events", { applicationId: variables.applicationId }],
        });
      }
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["events", "upcoming"] });
      queryClient.invalidateQueries({ queryKey: ["events", "past"] });
    },
  });
}
