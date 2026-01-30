import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

const redirectToProduct = (requestUrl: string, target: string) =>
  NextResponse.redirect(new URL(`/product/${target}`, requestUrl));

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code: rawCode } = await params;
  const code = rawCode?.trim();
  if (!code) return NextResponse.redirect(new URL("/", request.url));

  if (code.includes("-") || isUuid(code)) {
    return redirectToProduct(request.url, code);
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false }
  });

  const { data } = await supabase
    .from("marketplace_listings")
    .select("slug, id")
    .ilike("slug", `%-${code}`)
    .limit(1);

  const listing = Array.isArray(data) ? (data[0] as any) : null;
  const target = listing?.slug || listing?.id;

  if (!target) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return redirectToProduct(request.url, target);
}
