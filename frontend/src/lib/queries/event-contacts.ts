import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";
import type { Contact } from "./contacts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type EventContact = Tables<"event_contacts">;

export type EventContactWithDetails = EventContact & {
  contact: Contact;
};

// ---------------------------------------------------------------------------
// Query-option factories
// ---------------------------------------------------------------------------

export function eventContactsQueryOptions(eventId: string) {
  const supabase = createClient();

  return queryOptions({
    queryKey: ["event_contacts", { eventId }],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_contacts")
        .select("*, contact:contacts(*)")
        .eq("event_id", eventId);
      if (error) throw error;
      return data as unknown as EventContactWithDetails[];
    },
    enabled: !!eventId,
  });
}

// ---------------------------------------------------------------------------
// Hooks — queries
// ---------------------------------------------------------------------------

export function useEventContacts(eventId: string) {
  return useQuery(eventContactsQueryOptions(eventId));
}

// ---------------------------------------------------------------------------
// Hooks — mutations
// ---------------------------------------------------------------------------

export function useAddInterviewer() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventId, contactId }: { eventId: string; contactId: string }) => {
      const { data, error } = await supabase
        .from("event_contacts")
        .insert({ event_id: eventId, contact_id: contactId })
        .select("*, contact:contacts(*)")
        .single();
      if (error) throw error;
      return data as unknown as EventContactWithDetails;
    },
    onSettled: (_data, _error, variables) => {
      if (variables?.eventId) {
        queryClient.invalidateQueries({
          queryKey: ["event_contacts", { eventId: variables.eventId }],
        });
      }
    },
  });
}

export function useRemoveInterviewer() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventId, contactId }: { eventId: string; contactId: string }) => {
      const { error } = await supabase
        .from("event_contacts")
        .delete()
        .eq("event_id", eventId)
        .eq("contact_id", contactId);
      if (error) throw error;
    },
    onSettled: (_data, _error, variables) => {
      if (variables?.eventId) {
        queryClient.invalidateQueries({
          queryKey: ["event_contacts", { eventId: variables.eventId }],
        });
      }
    },
  });
}
