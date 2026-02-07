import MarketplaceGrid from "@/components/marketplace/MarketplaceGrid";

const siteUrl = "https://boliyan.pk";

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Boliyan",
  url: siteUrl,
  description:
    "Pakistan's bid-first classifieds marketplace. Place bids on electronics, vehicles, property, and more — no chat before deal.",
  potentialAction: {
    "@type": "SearchAction",
    target: `${siteUrl}/?search={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export default function Home() {
  return (
    <div id="home-page-01">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />

      {/* SEO-visible heading — visually hidden but crawlable */}
      <div className="sr-only" aria-hidden="false">
        <h1>Boliyan — Sell Fast. Buy Fair.</h1>
        <p>
          Pakistan&apos;s bid-first classifieds marketplace. Browse electronics,
          vehicles, property, and services. Place competitive bids — no chat
          before deal.
        </p>
      </div>

      <MarketplaceGrid />
    </div>
  );
}
