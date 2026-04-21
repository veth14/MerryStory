import { SupabaseClient, createClient } from "@supabase/supabase-js";

let supabaseServerClient: SupabaseClient | undefined;

function getSupabaseServerConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Missing Supabase server config. Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.");
  }

  return { url, serviceRoleKey };
}

export function getSupabaseServerClient(): SupabaseClient {
  if (!supabaseServerClient) {
    const { url, serviceRoleKey } = getSupabaseServerConfig();

    supabaseServerClient = createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return supabaseServerClient;
}
