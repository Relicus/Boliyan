"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import AdCard from "./AdCard";
import { CARD_SIZES, type ViewMode } from "@/lib/cardSizes";

interface AdSenseCardProps {
  id: string;
  viewMode?: ViewMode;
  adClient?: string;  // Your AdSense Publisher ID (ca-pub-XXXXXXXX)
  adSlot?: string;    // Your Ad Unit Slot ID
}

declare global {
  interface Window {
    adsbygoogle: object[];
  }
}

export default function AdSenseCard({ 
  id, 
  viewMode = 'compact',
  adClient,
  adSlot 
}: AdSenseCardProps) {
  const adRef = useRef<HTMLModElement>(null);
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);

  const sizes = CARD_SIZES[viewMode];

  useEffect(() => {
    // Check if AdSense script is loaded
    if (typeof window !== 'undefined' && window.adsbygoogle && adClient && adSlot) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        const timer = setTimeout(() => setAdLoaded(true), 0);
        return () => clearTimeout(timer);
      } catch (e) {
        console.warn('[AdSenseCard] AdSense push failed:', e);
        const timer = setTimeout(() => setAdError(true), 0);
        return () => clearTimeout(timer);
      }
    }

    if (typeof window !== 'undefined' && !window.adsbygoogle) {
      const timer = setTimeout(() => setAdError(true), 0);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [adClient, adSlot]);

  // Fallback to custom AdCard if AdSense fails or no credentials
  if (adError || !adClient || !adSlot) {
    return <AdCard id={id} viewMode={viewMode} />;
  }

  return (
    <Card 
      id={`adsense-card-${id}`}
      className={`relative flex flex-col overflow-hidden rounded-lg border-none bg-slate-50 shadow-sm ${sizes.minCardHeight} ${sizes.maxCardHeight}`}
    >
      {/* Google AdSense In-Feed Ad */}
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-format="fluid"
        data-ad-layout-key="-fb+5w+4e-db+86"
        data-ad-client={adClient}
        data-ad-slot={adSlot}
      />
      
      {/* Loading State (shown briefly before ad loads) */}
      {!adLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 animate-pulse">
          <span className="text-xs text-slate-400">Loading ad...</span>
        </div>
      )}
    </Card>
  );
}
