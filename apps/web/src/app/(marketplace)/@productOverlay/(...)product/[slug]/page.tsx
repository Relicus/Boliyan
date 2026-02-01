import { ProductOverlay } from "@/components/marketplace/ProductOverlay";

interface OverlayPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Intercept Route for Product Overlay
 * 
 * When clicking a product in the marketplace, this route intercepts
 * the navigation to /product/[slug] and shows an overlay instead.
 * 
 * The (...) prefix means "go to root" - this intercepts /product/[slug]
 * from anywhere in the app.
 */
export default async function ProductOverlayPage({ params }: OverlayPageProps) {
  const { slug } = await params;
  return <ProductOverlay slug={slug} />;
}
