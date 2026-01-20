"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";
import { SafeImage } from "@/components/ui/SafeImage";
import { 
  CARD_SIZES, 
  CARD_TYPOGRAPHY, 
  type ViewMode 
} from "@/lib/cardSizes";

interface AdCardProps {
  id: string;
  viewMode?: ViewMode;
}

export default function AdCard({ id, viewMode = 'compact' }: AdCardProps) {
  const sizes = CARD_SIZES[viewMode];
  const typography = CARD_TYPOGRAPHY[viewMode];

  return (
    <Card 
      id={`ad-card-${id}`}
      className="group relative flex flex-col overflow-hidden rounded-lg border-none bg-slate-50 shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Image Section - Same as ItemCard */}
      <div className={`relative ${sizes.imageHeight} w-full overflow-hidden bg-slate-100 shrink-0`}>
        <SafeImage
          src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1000&auto=format&fit=crop"
          alt="Ad Content"
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Sponsored Badge - Top Left like ItemCard location badge */}
        <div className="absolute top-2 left-2 z-20 bg-black/60 backdrop-blur-md text-white px-2 py-1 rounded-md flex items-center gap-1.5 shadow-lg border border-white/20">
          <span className="text-[10px] font-black tracking-tight leading-none">Sponsored</span>
        </div>
      </div>

      {/* Content Section - Matches ItemCard structure exactly */}
      <CardContent className="p-2 flex flex-col gap-1.5 flex-1">
        {/* Title - Fixed height to accommodate 2 lines */}
        <div className="min-h-[2.5rem] flex items-start">
          <h3 className={`font-bold ${typography.title} text-slate-900 leading-tight line-clamp-2 transition-all`}>
            Unlimited Entertainment
          </h3>
        </div>

        {/* Seller Info Row - Matches ItemCard spacing */}
        {(viewMode === 'spacious' || viewMode === 'comfortable') && (
          <div className={`flex items-center gap-2 mb-2 animate-in fade-in duration-300 ${viewMode === 'comfortable' ? 'mt-0.5' : 'mt-1'}`}>
            <span className={`text-[10px] font-bold text-slate-500 truncate leading-none ${viewMode === 'comfortable' ? 'max-w-[80px]' : ''}`}>
              Streaming Service
            </span>
          </div>
        )}

        {/* Price Row - Same height as ItemCard price row */}
        <div className="flex items-end justify-between transition-all min-h-[2.25rem]">
          <div className="flex flex-col">
            <span className={`${typography.label} text-slate-600 font-bold uppercase tracking-wider`}>Starting</span>
            <span className={`${typography.price} font-black text-slate-800 leading-none`}>Free Trial</span>
          </div>
          <div className="flex flex-col items-end">
            <span className={`${typography.label} text-slate-600 font-bold uppercase tracking-wider`}>Then</span>
            <span className={`${typography.price} font-black text-indigo-600 leading-none`}>$9.99/mo</span>
          </div>
        </div>

        {/* Spacious Mode Description - Same as ItemCard */}
        {viewMode === 'spacious' && (
          <div className="mt-2 mb-1">
            <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed font-medium">
              Stream your favorite movies, TV shows, and exclusives. Start your free trial today.
            </p>
          </div>
        )}

        {/* Input + Button Row - Matches ItemCard height */}
        <div className="flex flex-col gap-2 mt-1">
          {/* Fake Input Row - Same height as ItemCard stepper (h-9) */}
          <div className="flex h-9 w-full">
            <div className="flex-1 border border-slate-200 rounded-md bg-slate-50 flex items-center justify-center">
              <span className="text-xs font-medium text-slate-400">Watch anytime, anywhere</span>
            </div>
          </div>

          {/* CTA Button - Same height as Place Bid (h-9) */}
          <a 
            href="#" 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full h-9 rounded-md flex items-center justify-center shadow-sm transition-all duration-300 active:scale-95 font-bold text-sm tracking-wide bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white gap-1.5"
          >
            Learn More
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
