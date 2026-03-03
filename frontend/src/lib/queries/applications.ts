import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/lib/supabase/types";
import type { Company } from "./companies";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Application = Tables<"applications">;
type ApplicationInsert = TablesInsert<"applications">;
type ApplicationUpdate = TablesUpdate<"applications">;

export type ApplicationWithCompany = Application & {
  company: Company;
};

export type ApplicationListItem = Application & {
  company: Pick<Company, "name">;
};

export type { Application };

// ---------------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------------

export interface ApplicationsFilters {
  search?: string;
  status?: string;
  interest?: string;
  workType?: string;
  employmentType?: string;
  companyId?: string;
  includeArchived?: boolean;
  page?: number;
  pageSize?: number;
  sort?: { column: string; direction: "asc" | "desc" };
}

// ---------------------------------------------------------------------------
// Query-option factories
// ---------------------------------------------------------------------------

export function applicationsQueryOptions(filters: ApplicationsFilters = {}) {
  const supabase = createClient();
  const {
    search,
    status,
    interest,
    workType,
    employmentType,
    companyId,
    includeArchived = false,
    page = 1,
    pageSize = 25,
    sort = { column: "created_at", direction: "desc" },
  } = filters;

  return queryOptions({
    queryKey: [
      "applications",
      {
        search,
        status,
        interest,
        workType,
        employmentType,
        companyId,
        includeArchived,
        page,
        pageSize,
        sort,
      },
    ],
    queryFn: async () => {
      let query = supabase
        .from("applications")
        .select("*, company:companies(name)", { count: "exact" })
        .order(sort.column, { ascending: sort.direction === "asc" });

      if (!includeArchived) {
        query = query.is("archived_at", null);
      }

      if (search) {
        query = query.ilike("position", `%${search}%`);
      }

      if (status) {
        query = query.eq("status", status);
      }

      if (interest) {
        query = query.eq("interest", interest);
      }

      if (workType) {
        query = query.eq("work_type", workType);
      }

      if (employmentType) {
        query = query.eq("employment_type", employmentType);
      }

      if (companyId) {
        query = query.eq("company_id", companyId);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;
      return { data: data as ApplicationListItem[], count: count ?? 0 };
    },
  });
}

export function applicationQueryOptions(id: string) {
  const supabase = createClient();

  return queryOptions({
    queryKey: ["applications", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("*, company:companies(*)")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as ApplicationWithCompany;
    },
    enabled: !!id,
  });
}

// ---------------------------------------------------------------------------
// Hooks — queries
// ---------------------------------------------------------------------------

export function useApplications(filters: ApplicationsFilters = {}) {
  return useQuery(applicationsQueryOptions(filters));
}

export function useApplicationsByCompany(companyId: string) {
  return useQuery({
    ...applicationsQueryOptions({ companyId, pageSize: 100 }),
    enabled: !!companyId,
  });
}

export function useApplication(id: string) {
  return useQuery(applicationQueryOptions(id));
}

// ---------------------------------------------------------------------------
// Hooks — mutations
// ---------------------------------------------------------------------------

export function useCreateApplication() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      input: Omit<ApplicationInsert, "user_id" | "status"> & { status?: string },
    ) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("applications")
        .insert({
          ...input,
          user_id: user.id,
          status: input.status ?? "bookmarked",
        })
        .select()
        .single();
      if (error) throw error;
      return data as Application;
    },
    onSuccess: (data) => {
      toast.success(data.status === "bookmarked" ? "Bookmarked." : "Application added.");
    },
    onError: () => {
      toast.error("Failed to add application.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });
}

export function useUpdateApplication() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: ApplicationUpdate & { id: string }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("applications")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();
      if (error) throw error;
      return data as Application;
    },
    onSuccess: () => {
      toast.success("Application updated.");
    },
    onError: () => {
      toast.error("Failed to update application.");
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      if (variables?.id) {
        queryClient.invalidateQueries({
          queryKey: ["applications", variables.id],
        });
      }
    },
  });
}

export function useArchiveApplication() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, archived_reason }: { id: string; archived_reason?: string }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("applications")
        .update({
          archived_at: new Date().toISOString(),
          archived_reason: archived_reason ?? null,
          status: "archived",
        })
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();
      if (error) throw error;
      return data as Application;
    },
    onSuccess: () => {
      toast.success("Application archived.");
    },
    onError: () => {
      toast.error("Failed to archive application.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });
}
