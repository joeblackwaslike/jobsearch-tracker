import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ApplicationDocument = Tables<"application_documents">;
export type { ApplicationDocument };

// ---------------------------------------------------------------------------
// Query-option factories
// ---------------------------------------------------------------------------

export function applicationDocumentsQueryOptions(applicationId: string) {
  const supabase = createClient();

  return queryOptions({
    queryKey: ["application_documents", { applicationId }],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("application_documents")
        .select("*")
        .eq("application_id", applicationId)
        .order("linked_at", { ascending: false });
      if (error) throw error;
      return data as ApplicationDocument[];
    },
    enabled: !!applicationId,
  });
}

// ---------------------------------------------------------------------------
// Hooks — queries
// ---------------------------------------------------------------------------

export function useApplicationDocuments(applicationId: string) {
  return useQuery(applicationDocumentsQueryOptions(applicationId));
}

// ---------------------------------------------------------------------------
// Hooks — mutations
// ---------------------------------------------------------------------------

export function useDetachDocument() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, applicationId }: { id: string; applicationId: string }) => {
      const { error } = await supabase.from("application_documents").delete().eq("id", id);
      if (error) throw error;
      return { id, applicationId };
    },
    onSettled: (_data, _error, variables) => {
      if (variables?.applicationId) {
        queryClient.invalidateQueries({
          queryKey: ["application_documents", { applicationId: variables.applicationId }],
        });
      }
    },
  });
}
