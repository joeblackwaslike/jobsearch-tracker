import {
  queryOptions,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables, TablesUpdate } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/client";

type UserSettings = Tables<"user_settings">;
type UserSettingsUpdate = TablesUpdate<"user_settings">;

export function settingsQueryOptions(
  supabase: SupabaseClient<Database>
) {
  return queryOptions({
    queryKey: ["user_settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .single();
      if (error) throw error;
      return data as UserSettings;
    },
  });
}

export function useSettings() {
  const supabase = createClient();
  return useQuery(settingsQueryOptions(supabase));
}

export function useUpdateSettings() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: UserSettingsUpdate) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("user_settings")
        .update(updates)
        .eq("user_id", user.id)
        .select()
        .single();
      if (error) throw error;
      return data as UserSettings;
    },
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: ["user_settings"] });
      const previous = queryClient.getQueryData<UserSettings>([
        "user_settings",
      ]);
      if (previous) {
        queryClient.setQueryData<UserSettings>(["user_settings"], {
          ...previous,
          ...updates,
        });
      }
      return { previous };
    },
    onError: (_err, _updates, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["user_settings"], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["user_settings"] });
    },
  });
}
