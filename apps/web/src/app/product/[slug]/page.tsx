import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import ProductPageClient from "./ProductPageClient";

const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://boliyan.pk").replace(/\/$/, "");
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

const resolveImageUrl = (image?: string | null) => {
  if (!image) return undefined;
  if (image.startsWith("http")) return image;
  const trimmed = image.startsWith("/") ? image : `/${image}`;
  return `${baseUrl}${trimmed}`;
};

const fetchListingMeta = async (slugOrId: string) => {
  if (!supabaseUrl || !supabaseAnonKey) return null;

  const supabaseServer = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false }
  });

  let query = supabaseServer
    .from("marketplace_listings")
    .select("id, slug, title, description, images");

  if (isUuid(slugOrId)) {
    query = query.eq("id", slugOrId);
  } else {
    query = query.eq("slug", slugOrId);
  }

  const { data } = await query.maybeSingle();
  if (data) return data;

  let fallbackQuery = supabaseServer
    .from("listings")
    .select("id, slug, title, description, images");

  if (isUuid(slugOrId)) {
    fallbackQuery = fallbackQuery.eq("id", slugOrId);
  } else {
    fallbackQuery = fallbackQuery.eq("slug", slugOrId);
  }

  const { data: fallbackData } = await fallbackQuery.maybeSingle();
  return fallbackData || null;
};

export async function generateMetadata({
  params
}: {
  params: Promise<{ id?: string; slug?: string }>;
}): Promise<Metadata> {
  const { id, slug } = await params;
  const slugOrId = slug || id || "";
  if (!slugOrId) {
    return {
      title: "Product | Boliyan",
      openGraph: { title: "Product | Boliyan", url: `${baseUrl}/product` }
    };
  }

  const listing = (await fetchListingMeta(slugOrId)) as any;
  const title = listing?.title ? `${listing.title} | Boliyan` : "Product | Boliyan";
  const description = listing?.description || "Discover listings on Boliyan.";
  const productSlug = listing?.slug || listing?.id || slugOrId;
  const productUrl = `${baseUrl}/product/${productSlug}`;
  const imageUrl = resolveImageUrl(listing?.images?.[0]);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: productUrl,
      images: imageUrl ? [{ url: imageUrl, width: 1200, height: 630, alt: listing?.title || "Boliyan product" }] : []
    },
    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title,
      description,
      images: imageUrl ? [imageUrl] : []
    }
  };
}

export default async function ProductPage({ params }: { params: Promise<{ id?: string; slug?: string }> }) {
  const resolvedParams = await params;
  return <ProductPageClient params={resolvedParams} />;
}
