import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/lib/supabase/types";

type Company = Tables<"companies">;
type CompanyInsert = TablesInsert<"companies">;
type CompanyUpdate = TablesUpdate<"companies">;

export type { Company };

// ---------------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------------

export interface CompaniesFilters {
  search?: string;
  researched?: boolean | null;
  page?: number;
  pageSize?: number;
}

// ---------------------------------------------------------------------------
// Query-option factories
// ---------------------------------------------------------------------------

export function companiesQueryOptions(filters: CompaniesFilters = {}) {
  const supabase = createClient();
  const { search, researched, page = 1, pageSize = 20 } = filters;

  return queryOptions({
    queryKey: ["companies", { search, researched, page, pageSize }],
    queryFn: async () => {
      let query = supabase
        .from("companies")
        .select("*", { count: "exact" })
        .is("archived_at", null)
        .order("created_at", { ascending: false });

      if (search) {
        query = query.ilike("name", `%${search}%`);
      }

      if (researched === true) {
        query = query.eq("researched", true);
      } else if (researched === false) {
        query = query.eq("researched", false);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;
      return { data: data as Company[], count: count ?? 0 };
    },
  });
}

export function companyQueryOptions(id: string) {
  const supabase = createClient();

  return queryOptions({
    queryKey: ["companies", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("companies").select("*").eq("id", id).single();
      if (error) throw error;
      return data as Company;
    },
    enabled: !!id,
  });
}

// ---------------------------------------------------------------------------
// Hooks — queries
// ---------------------------------------------------------------------------

export function useCompanies(filters: CompaniesFilters = {}) {
  return useQuery(companiesQueryOptions(filters));
}

export function useCompany(id: string) {
  return useQuery(companyQueryOptions(id));
}

export function useSearchCompanies(term: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["companies", "search", term],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name")
        .ilike("name", `%${term}%`)
        .is("archived_at", null)
        .limit(10);
      if (error) throw error;
      return data as Pick<Company, "id" | "name">[];
    },
    enabled: term.length >= 2,
  });
}

// ---------------------------------------------------------------------------
// Hooks — mutations
// ---------------------------------------------------------------------------

export function useCreateCompany() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Omit<CompanyInsert, "user_id">) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("companies")
        .insert({ ...input, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data as Company;
    },
    onSuccess: () => {
      toast.success("Company added.");
    },
    onError: () => {
      toast.error("Failed to add company.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
  });
}

export function useUpdateCompany() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: CompanyUpdate & { id: string }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("companies")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();
      if (error) throw error;
      return data as Company;
    },
    onSuccess: () => {
      toast.success("Company updated.");
    },
    onError: () => {
      toast.error("Failed to update company.");
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      if (variables?.id) {
        queryClient.invalidateQueries({
          queryKey: ["companies", variables.id],
        });
      }
    },
  });
}

export function useArchiveCompany() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("companies")
        .update({ archived_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();
      if (error) throw error;
      return data as Company;
    },
    onSuccess: () => {
      toast.success("Company archived.");
    },
    onError: () => {
      toast.error("Failed to archive company.");
    },
    onSettled: (_data, _error, id) => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      queryClient.invalidateQueries({ queryKey: ["companies", id] });
    },
  });
}
