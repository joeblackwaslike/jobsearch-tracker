import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import type { ApplicationListItem } from "@/lib/queries/applications";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";
import { useNewRows } from "./new-rows-context";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type EventType = "INSERT" | "UPDATE" | "DELETE";

interface RealtimePayload {
  eventType: EventType;
  new: Record<string, unknown>;
  old: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useRealtimeSync() {
  const queryClient = useQueryClient();
  const { addNewId } = useNewRows();

  const dashboardTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const supabase = createClient();

    // Trailing-edge debounce: coalesces rapid bursts into a single invalidation.
    function invalidateDashboard() {
      if (dashboardTimerRef.current) clearTimeout(dashboardTimerRef.current);
      dashboardTimerRef.current = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      }, 200);
    }

    // -----------------------------------------------------------------------
    // Applications
    // -----------------------------------------------------------------------

    async function handleApplicationInsert(payload: RealtimePayload) {
      const id = payload.new.id as string;

      // Check if this window already has the row (e.g. the tab that made the insert)
      const cached = queryClient.getQueriesData<{
        data: ApplicationListItem[];
        count: number;
      }>({
        queryKey: ["applications"],
        exact: false,
      });
      const alreadyInCache = cached.some(([, d]) => d?.data?.some((item) => item.id === id));

      const { data } = await supabase
        .from("applications")
        .select("*, company:companies(name)")
        .eq("id", id)
        .single();
      if (!data) return;

      if (!alreadyInCache) {
        // Cross-tab insert — show toast and flash the row
        const item = data as ApplicationListItem;
        toast.success(`${item.position} at ${item.company?.name ?? "Unknown"}`, {
          description: "New application added",
        });
        addNewId(id);

        queryClient.setQueriesData<{
          data: ApplicationListItem[];
          count: number;
        }>({ queryKey: ["applications"], exact: false }, (old) => {
          if (!old) return old;
          return { data: [item, ...old.data], count: old.count + 1 };
        });
      }

      invalidateDashboard();
    }

    async function handleApplicationUpdate(payload: RealtimePayload) {
      const id = payload.new.id as string;
      const { data } = await supabase
        .from("applications")
        .select("*, company:companies(name)")
        .eq("id", id)
        .single();
      if (!data) return;

      queryClient.setQueriesData<{
        data: ApplicationListItem[];
        count: number;
      }>({ queryKey: ["applications"], exact: false }, (old) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.map((item) => (item.id === id ? (data as ApplicationListItem) : item)),
        };
      });
      invalidateDashboard();
    }

    function handleApplicationDelete(payload: RealtimePayload) {
      const id = payload.old.id as string;
      queryClient.setQueriesData<{
        data: ApplicationListItem[];
        count: number;
      }>({ queryKey: ["applications"], exact: false }, (old) => {
        if (!old) return old;
        return {
          data: old.data.filter((item) => item.id !== id),
          count: old.count - 1,
        };
      });
      invalidateDashboard();
    }

    // -----------------------------------------------------------------------
    // Events
    // -----------------------------------------------------------------------

    function handleEventChange(payload: RealtimePayload) {
      const applicationId = (payload.new.application_id ?? payload.old.application_id) as
        | string
        | undefined;

      // Direct cache update for the per-application event list (no joins needed)
      if (applicationId) {
        const qKey = ["events", { applicationId }];
        if (payload.eventType === "INSERT") {
          queryClient.setQueryData<Tables<"events">[]>(qKey, (old = []) => [
            payload.new as Tables<"events">,
            ...old,
          ]);
        } else if (payload.eventType === "UPDATE") {
          const id = payload.new.id as string;
          queryClient.setQueryData<Tables<"events">[]>(qKey, (old = []) =>
            old.map((e) => (e.id === id ? (payload.new as Tables<"events">) : e)),
          );
        } else if (payload.eventType === "DELETE") {
          const id = payload.old.id as string;
          queryClient.setQueryData<Tables<"events">[]>(qKey, (old = []) =>
            old.filter((e) => e.id !== id),
          );
        }
      }

      // Global event lists include deep joins — invalidate rather than patch
      queryClient.invalidateQueries({ queryKey: ["events", "upcoming"] });
      queryClient.invalidateQueries({ queryKey: ["events", "past"] });
      queryClient.invalidateQueries({
        queryKey: ["dashboard", "recent-activity"],
      });
    }

    // -----------------------------------------------------------------------
    // Companies
    // -----------------------------------------------------------------------

    function handleCompanyInsert(payload: RealtimePayload) {
      queryClient.setQueriesData<{
        data: Tables<"companies">[];
        count: number;
      }>({ queryKey: ["companies"], exact: false }, (old) => {
        if (!old) return old;
        return {
          data: [payload.new as Tables<"companies">, ...old.data],
          count: old.count + 1,
        };
      });
    }

    function handleCompanyUpdate(payload: RealtimePayload) {
      const id = payload.new.id as string;
      queryClient.setQueriesData<{
        data: Tables<"companies">[];
        count: number;
      }>({ queryKey: ["companies"], exact: false }, (old) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.map((c) => (c.id === id ? (payload.new as Tables<"companies">) : c)),
        };
      });
    }

    function handleCompanyDelete(payload: RealtimePayload) {
      const id = payload.old.id as string;
      queryClient.setQueriesData<{
        data: Tables<"companies">[];
        count: number;
      }>({ queryKey: ["companies"], exact: false }, (old) => {
        if (!old) return old;
        return {
          data: old.data.filter((c) => c.id !== id),
          count: old.count - 1,
        };
      });
      invalidateDashboard();
    }

    // -----------------------------------------------------------------------
    // Channel
    // -----------------------------------------------------------------------

    const channel = supabase
      .channel("db-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "applications" },
        (payload) => {
          const p = payload as unknown as RealtimePayload;
          if (p.eventType === "INSERT") handleApplicationInsert(p);
          else if (p.eventType === "UPDATE") handleApplicationUpdate(p);
          else if (p.eventType === "DELETE") handleApplicationDelete(p);
        },
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, (payload) => {
        handleEventChange(payload as unknown as RealtimePayload);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "companies" }, (payload) => {
        const p = payload as unknown as RealtimePayload;
        if (p.eventType === "INSERT") handleCompanyInsert(p);
        else if (p.eventType === "UPDATE") handleCompanyUpdate(p);
        else if (p.eventType === "DELETE") handleCompanyDelete(p);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "contacts" }, () => {
        queryClient.invalidateQueries({ queryKey: ["contacts"] });
        invalidateDashboard();
      })
      .subscribe();

    return () => {
      if (dashboardTimerRef.current) clearTimeout(dashboardTimerRef.current);
      supabase.removeChannel(channel);
    };
  }, [queryClient, addNewId]);
}
