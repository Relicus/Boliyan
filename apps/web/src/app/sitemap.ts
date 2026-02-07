import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

const baseUrl = "https://boliyan.pk";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const staticRoutes = [
  "",
  "/categories",
  "/list",
  "/dashboard",
  "/inbox",
  "/profile",
  "/privacy-policy",
  "/terms-of-service",
  "/data-deletion",
];

async function fetchProductSlugs(): Promise<
  { slug: string; updatedAt: string }[]
> {
  if (!supabaseUrl || !supabaseAnonKey) return [];

  try {
    const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    });

    const { data, error } = await supabase
      .from("marketplace_listings")
      .select("slug, id, created_at")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(5000);

    if (error || !data) return [];

    return data.map((row) => ({
      slug: (row.slug as string) || (row.id as string),
      updatedAt: (row.created_at as string) || new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "hourly" : "weekly",
    priority: route === "" ? 1.0 : 0.5,
  }));

  const products = await fetchProductSlugs();

  const productEntries: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${baseUrl}/product/${p.slug}`,
    lastModified: new Date(p.updatedAt),
    changeFrequency: "daily",
    priority: 0.8,
  }));

  return [...staticEntries, ...productEntries];
}
