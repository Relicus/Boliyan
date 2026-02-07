import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import ProductPageClient from "./ProductPageClient";

const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://boliyan.pk").replace(/\/$/, "");
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

type ListingMeta = {
  id: string | null;
  slug: string | null;
  title: string | null;
  description: string | null;
  images: string[] | null;
  asked_price?: number | null;
  condition?: string | null;
  category?: string | null;
  seller_name?: string | null;
  status?: string | null;
};

const resolveImageUrl = (image?: string | null) => {
  if (!image) return undefined;
  if (image.startsWith("http")) return image;
  const trimmed = image.startsWith("/") ? image : `/${image}`;
  return `${baseUrl}${trimmed}`;
};

const fetchListingMeta = async (slugOrId: string): Promise<ListingMeta | null> => {
  if (!supabaseUrl || !supabaseAnonKey) return null;

  const supabaseServer = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false }
  });

  let query = supabaseServer
    .from("marketplace_listings")
    .select("id, slug, title, description, images, asked_price, condition, category, seller_name, status");

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

  const listing = await fetchListingMeta(slugOrId);
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

/** Map DB condition values to schema.org OfferItemCondition */
function mapConditionToSchema(condition?: string | null): string {
  switch (condition) {
    case "new": return "https://schema.org/NewCondition";
    case "like_new": return "https://schema.org/UsedCondition";
    case "used": return "https://schema.org/UsedCondition";
    case "fair": return "https://schema.org/UsedCondition";
    default: return "https://schema.org/UsedCondition";
  }
}

function buildProductJsonLd(listing: ListingMeta) {
  const productSlug = listing.slug || listing.id || "";
  const productUrl = `${baseUrl}/product/${productSlug}`;
  const imageUrl = resolveImageUrl(listing.images?.[0]);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: listing.title || "Listing",
    description: listing.description || undefined,
    url: productUrl,
    image: imageUrl || undefined,
    category: listing.category || undefined,
    offers: {
      "@type": "Offer",
      price: listing.asked_price ?? undefined,
      priceCurrency: "PKR",
      availability: listing.status === "active"
        ? "https://schema.org/InStock"
        : "https://schema.org/SoldOut",
      itemCondition: mapConditionToSchema(listing.condition),
      seller: listing.seller_name ? {
        "@type": "Person",
        name: listing.seller_name,
      } : undefined,
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ id?: string; slug?: string }> }) {
  const resolvedParams = await params;
  const slugOrId = resolvedParams.slug || resolvedParams.id || "";

  // Fetch listing for JSON-LD (the client component fetches its own data too)
  const listing = slugOrId ? await fetchListingMeta(slugOrId) : null;

  return (
    <>
      {listing && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(buildProductJsonLd(listing)) }}
        />
      )}
      <ProductPageClient params={resolvedParams} />
    </>
  );
}
