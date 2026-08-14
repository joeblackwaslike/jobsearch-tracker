import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { generateCompanyResearch } from "@/lib/ai/company-research";
import { approveTask, refineDocument, terminateTask } from "@/lib/ai/task-actions";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";

type Task = Tables<"tasks">;

export type TaskWithApplication = Task & {
  application: {
    id: string;
    position: string;
    company: { id: string; name: string } | null;
  };
};

export type { Task };

export const taskKeys = {
  all: ["tasks"] as const,
  inbox: ["tasks", "inbox"] as const,
  forApplication: (applicationId: string) => ["tasks", { applicationId }] as const,
  pendingCount: ["tasks", "pending-count"] as const,
};

export function tasksForApplicationQueryOptions(applicationId: string) {
  const supabase = createClient();

  return queryOptions({
    queryKey: taskKeys.forApplication(applicationId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("application_id", applicationId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Task[];
    },
    enabled: !!applicationId,
  });
}

export function pendingTaskCountQueryOptions() {
  const supabase = createClient();

  return queryOptions({
    queryKey: taskKeys.pendingCount,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("status", "awaiting_approval");
      if (error) throw error;
      return count ?? 0;
    },
  });
}

export function inboxTasksQueryOptions() {
  const supabase = createClient();

  return queryOptions({
    queryKey: taskKeys.inbox,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*, application:applications(id, position, company:companies(id, name))")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as TaskWithApplication[];
    },
  });
}

export function useInboxTasks() {
  return useQuery(inboxTasksQueryOptions());
}

export function useTasksForApplication(applicationId: string) {
  return useQuery(tasksForApplicationQueryOptions(applicationId));
}

export function usePendingTaskCount() {
  return useQuery(pendingTaskCountQueryOptions());
}

export function useGenerateResearch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (applicationId: string) => {
      return generateCompanyResearch({ data: { applicationId } });
    },
    onSuccess: () => {
      toast.success("Company research generated. Review it in documents.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to generate research.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}

export function useApproveTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      return approveTask({ data: { taskId } });
    },
    onSuccess: () => {
      toast.success("Document approved.");
    },
    onError: () => {
      toast.error("Failed to approve task.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}

export function useTerminateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, reason }: { taskId: string; reason: string }) => {
      return terminateTask({ data: { taskId, reason } });
    },
    onSuccess: () => {
      toast.success("Task terminated.");
    },
    onError: () => {
      toast.error("Failed to terminate task.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

export function useRefineDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, feedback }: { taskId: string; feedback: string }) => {
      return refineDocument({ data: { taskId, feedback } });
    },
    onSuccess: () => {
      toast.success("Document revision generated.");
    },
    onError: () => {
      toast.error("Failed to refine document.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}
