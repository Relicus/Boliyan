import { createBrowserClient } from '@supabase/ssr';
import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';
import { createNativeBackedStorage } from '@/lib/nativeStorage';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const hasSupabaseEnv = Boolean(supabaseUrl && supabaseAnonKey);
const resolvedSupabaseUrl = supabaseUrl || "http://localhost:54321";
const resolvedSupabaseAnonKey = supabaseAnonKey || "public-anon-key";
export const supabaseStorageKey = (() => {
  try {
    const host = new URL(resolvedSupabaseUrl).hostname;
    const ref = host.split('.')[0];
    return ref ? `sb-${ref}-auth-token` : 'sb-auth-token';
  } catch {
    return 'sb-auth-token';
  }
})();

if (!hasSupabaseEnv) {
  console.warn('Missing Supabase URL or Anon Key. Check .env.local');
}

export const supabase: SupabaseClient<Database> = createBrowserClient<Database>(
  resolvedSupabaseUrl,
  resolvedSupabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: true,
      persistSession: true,
      storage: typeof window !== "undefined" ? createNativeBackedStorage() : undefined,
      storageKey: supabaseStorageKey,
    },
  }
);
