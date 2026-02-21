import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/lib/supabase/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Document = Tables<"documents">;
type DocumentInsert = TablesInsert<"documents">;
type DocumentUpdate = TablesUpdate<"documents">;

export type { Document };

// ---------------------------------------------------------------------------
// Query-option factories
// ---------------------------------------------------------------------------

export function documentsQueryOptions(type?: string) {
  const supabase = createClient();

  return queryOptions({
    queryKey: ["documents", { type }],
    queryFn: async () => {
      let query = supabase
        .from("documents")
        .select("*")
        .is("archived_at", null)
        .order("updated_at", { ascending: false });

      if (type) {
        query = query.eq("type", type);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Document[];
    },
  });
}

export function documentQueryOptions(id: string) {
  const supabase = createClient();

  return queryOptions({
    queryKey: ["documents", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("documents").select("*").eq("id", id).single();
      if (error) throw error;
      return data as Document;
    },
    enabled: !!id,
  });
}

// ---------------------------------------------------------------------------
// Hooks — queries
// ---------------------------------------------------------------------------

export function useDocuments(type?: string) {
  return useQuery(documentsQueryOptions(type));
}

export function useDocument(id: string) {
  return useQuery(documentQueryOptions(id));
}

// ---------------------------------------------------------------------------
// Hooks — mutations
// ---------------------------------------------------------------------------

export function useCreateDocument() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Omit<DocumentInsert, "user_id">) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("documents")
        .insert({ ...input, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data as Document;
    },
    onSuccess: () => {
      toast.success("Document saved.");
    },
    onError: () => {
      toast.error("Failed to save document.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}

export function useUpdateDocument() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: DocumentUpdate & { id: string }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("documents")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();
      if (error) throw error;
      return data as Document;
    },
    onSuccess: () => {
      toast.success("Document updated.");
    },
    onError: () => {
      toast.error("Failed to update document.");
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      if (variables?.id) {
        queryClient.invalidateQueries({
          queryKey: ["documents", variables.id],
        });
      }
    },
  });
}

export function useUploadDocument() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, name, type }: { file: File; name: string; type: string }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const docId = crypto.randomUUID();
      const path = `${user.id}/${docId}/${file.name}`;

      const { error: uploadError } = await supabase.storage.from("documents").upload(path, file);

      if (uploadError) throw uploadError;

      const { data, error } = await supabase
        .from("documents")
        .insert({
          id: docId,
          user_id: user.id,
          name,
          type,
          uri: path,
          mime_type: file.type,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Document;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}

export function useDeleteDocument() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Fetch the document to check for storage file
      const { data: doc, error: fetchError } = await supabase
        .from("documents")
        .select("uri")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();
      if (fetchError) throw fetchError;

      // Delete storage file if it exists
      if (doc?.uri) {
        await supabase.storage.from("documents").remove([doc.uri]);
      }

      // Delete the document record
      const { error } = await supabase
        .from("documents")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}

export function useSnapshotDocument() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      applicationId,
      documentId,
    }: {
      applicationId: string;
      documentId: string;
    }) => {
      // Fetch the source document
      const { data: doc, error: fetchError } = await supabase
        .from("documents")
        .select("*")
        .eq("id", documentId)
        .single();
      if (fetchError) throw fetchError;

      // Create a snapshot in application_documents
      const { data, error } = await supabase
        .from("application_documents")
        .insert({
          application_id: applicationId,
          document_id: documentId,
          name: doc.name,
          type: doc.type,
          content: doc.content,
          uri: doc.uri,
          mime_type: doc.mime_type,
          revision: doc.revision,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["application_documents"],
      });
    },
  });
}
