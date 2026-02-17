import {
  queryOptions,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type { Tables, TablesInsert, TablesUpdate } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Event = Tables<"events">;
type EventInsert = TablesInsert<"events">;
type EventUpdate = TablesUpdate<"events">;

export type { Event };

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const INTERVIEW_TYPES = [
  "screening_interview",
  "technical_interview",
  "behavioral_interview",
  "online_test",
  "take_home",
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

// ---------------------------------------------------------------------------
// Hooks — mutations
// ---------------------------------------------------------------------------

export function useCreateEvent() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      input: Omit<EventInsert, "user_id"> & { application_id: string }
    ) => {
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

      if (
        (INTERVIEW_TYPES as readonly string[]).includes(eventType)
      ) {
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
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["events", { applicationId: variables?.application_id }],
      });
      queryClient.invalidateQueries({ queryKey: ["applications"] });
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
    onSettled: (_data, _error, variables) => {
      if (variables?.applicationId) {
        queryClient.invalidateQueries({
          queryKey: ["events", { applicationId: variables.applicationId }],
        });
      }
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });
}

export function useDeleteEvent() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      applicationId,
    }: {
      id: string;
      applicationId: string;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) throw error;
      return { id, applicationId };
    },
    onSettled: (_data, _error, variables) => {
      if (variables?.applicationId) {
        queryClient.invalidateQueries({
          queryKey: ["events", { applicationId: variables.applicationId }],
        });
      }
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });
}
