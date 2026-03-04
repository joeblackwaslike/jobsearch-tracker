import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/types"

type Client = SupabaseClient<Database>

export async function findOrCreateCompany(
  client: Client,
  userId: string,
  companyName: string,
): Promise<string> {
  const { data } = await client
    .from("companies")
    .select("id")
    .eq("user_id", userId)
    .ilike("name", companyName)
    .maybeSingle()

  if (data?.id) return data.id

  const { data: created, error } = await client
    .from("companies")
    .insert({ user_id: userId, name: companyName })
    .select("id")
    .single()

  if (error || !created?.id) {
    throw new Error(`Failed to create company: ${error?.message}`)
  }
  return created.id
}

export async function checkRecentDuplicate(
  client: Client,
  userId: string,
  companyId: string,
  position: string,
): Promise<string | null> {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { data } = await client
    .from("applications")
    .select("id")
    .eq("user_id", userId)
    .eq("company_id", companyId)
    .eq("position", position)
    .gte("applied_at", cutoff)
    .maybeSingle()

  return data?.id ?? null
}

export async function createApplication(
  client: Client,
  userId: string,
  companyId: string,
  position: string,
  url: string,
): Promise<string> {
  const { data, error } = await client
    .from("applications")
    .insert({
      user_id: userId,
      company_id: companyId,
      position,
      url,
      status: "applied",
      applied_at: new Date().toISOString(),
    })
    .select("id")
    .single()

  if (error || !data?.id) {
    throw new Error(`Failed to create application: ${error?.message}`)
  }
  return data.id
}
