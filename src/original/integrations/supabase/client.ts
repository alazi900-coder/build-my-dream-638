import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const hasSupabaseConfig = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);

export function getSupabaseFunctionRequest(functionName: string) {
  if (!hasSupabaseConfig) return undefined;

  return {
    url: `${SUPABASE_URL}/functions/v1/${functionName}`,
    headers: {
      Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
    },
  };
}

function createSupabaseBrowserClient() {
  if (!hasSupabaseConfig) {
    throw new Error("Supabase client configuration is missing.");
  }

  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      storage: typeof window !== "undefined" ? localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

let supabaseClient: ReturnType<typeof createSupabaseBrowserClient> | undefined;

export const supabase = new Proxy({} as ReturnType<typeof createSupabaseBrowserClient>, {
  get(_, prop, receiver) {
    if (!supabaseClient) supabaseClient = createSupabaseBrowserClient();
    return Reflect.get(supabaseClient, prop, receiver);
  },
});
