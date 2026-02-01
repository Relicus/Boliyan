import MarketplaceGrid from "@/components/marketplace/MarketplaceGrid";

// HMR Stability Check - 2026-01-30
// Marketplace main page - now in route group for parallel routes support
export default function Home() {
  return (
    <div className="">
      <MarketplaceGrid />
    </div>
  );
}
