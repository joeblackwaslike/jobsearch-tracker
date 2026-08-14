import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";

type Integration = Tables<"user_integrations">;

export type { Integration };

export function integrationsQueryOptions() {
  const supabase = createClient();

  return queryOptions({
    queryKey: ["user_integrations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_integrations")
        .select("*")
        .order("provider");
      if (error) throw error;
      return data as Integration[];
    },
  });
}

export function integrationQueryOptions(provider: string) {
  const supabase = createClient();

  return queryOptions({
    queryKey: ["user_integrations", { provider }],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_integrations")
        .select("*")
        .eq("provider", provider)
        .maybeSingle();
      if (error) throw error;
      return data as Integration | null;
    },
    enabled: !!provider,
  });
}

export function useIntegrations() {
  return useQuery(integrationsQueryOptions());
}

export function useIntegration(provider: string) {
  return useQuery(integrationQueryOptions(provider));
}

export function useUpsertIntegration() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (integration: Partial<Integration> & { provider: string }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("user_integrations")
        .upsert({ ...integration, user_id: user.id }, { onConflict: "user_id,provider" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Integration saved");
    },
    onError: (error) => {
      toast.error(`Failed to save integration: ${error.message}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["user_integrations"] });
    },
  });
}

export function useDeleteIntegration() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("user_integrations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Integration removed");
    },
    onError: (error) => {
      toast.error(`Failed to remove integration: ${error.message}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["user_integrations"] });
    },
  });
}
