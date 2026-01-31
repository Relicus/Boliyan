import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

const redirectToInbox = (requestUrl: string, id?: string) => {
  const target = id ? `/inbox?id=${id}` : "/inbox";
  return NextResponse.redirect(new URL(target, requestUrl));
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await params;
  const id = rawId?.trim();
  
  if (!id) return redirectToInbox(request.url);

  // If it's a UUID, it's a direct ID
  if (isUuid(id)) {
    return redirectToInbox(request.url, id);
  }

  // Otherwise, it's a short_code. Lookup in DB.
  if (!supabaseUrl || !supabaseAnonKey) {
    return redirectToInbox(request.url);
  }

  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false }
  });

  const { data } = await supabase
    .from("conversations")
    .select("id")
    .eq("short_code", id)
    .maybeSingle();

  return redirectToInbox(request.url, data?.id ?? undefined);
}
