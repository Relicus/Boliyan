"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { MapPin, Lock, ExternalLink, Bookmark } from "lucide-react";
import { Item, User } from "@/types";
import { DialogTitle } from "@/components/ui/dialog";
import { getFuzzyLocationString } from "@/lib/utils";

interface ProductInfoProps {
  item: Item;
  seller: User;
  isOutside: boolean;
  duration: number;
  distance: number;
  isWatched: boolean;
  onToggleWatch: (id: string) => void;
}

export function ProductInfo({
  item,
  seller,
  isOutside,
  duration,
  distance,
  isWatched,
  onToggleWatch
}: ProductInfoProps) {
  return (
    <div id={`product-details-left-${item.id}`} className="flex flex-col gap-3 min-w-0 h-full">
      <div className="flex justify-between items-start gap-2">
        <div className="min-w-0">
          <DialogTitle className="text-xl sm:text-2xl font-black text-slate-900 leading-tight mb-2 line-clamp-2">
            {item.title}
          </DialogTitle>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="font-bold bg-blue-50 text-blue-700 border-blue-100">Verified Listing</Badge>
            {!item.isPublicBid && (
              <Badge variant="secondary" className="font-bold bg-amber-500 text-white border-none shadow-sm">
                <Lock className="h-3.5 w-3.5 mr-1" />
                Secret Bidding
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Description - Compact */}
      <div className="space-y-1">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description</h4>
        <p className="text-[13px] sm:text-sm text-slate-700 leading-relaxed line-clamp-3 md:line-clamp-4">
          {item.description}
        </p>
      </div>

      <div className="mt-auto pt-2">
          {/* Seller Info Compact Card */}
          <div className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-2.5">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-full bg-slate-200 overflow-hidden shrink-0">
                <img src={seller.avatar} alt={seller.name} className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0 flex flex-col justify-center">
                <div className="flex items-center gap-2">
                  <div className="font-bold text-slate-900 text-sm truncate">{seller.name}</div>
                  <Badge variant="outline" className="font-bold bg-white text-yellow-700 border-yellow-200 py-0 px-1.5 text-[10px] shrink-0 shadow-sm h-5">
                    ⭐ {seller.rating} <span className="text-yellow-600/70 ml-0.5">({seller.reviewCount})</span>
                  </Badge>
                </div>
                <div className="text-[11px] text-slate-500 flex items-center gap-1 leading-none mt-1">
                  <MapPin className="h-3 w-3 text-red-500" />
                  <span className="truncate">{getFuzzyLocationString(seller.location.address)}</span>
                  {!isOutside && (
                     <span className="font-medium text-slate-600 border-l border-slate-300 pl-1 ml-1">
                       {duration} min ({distance} km)
                     </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
               <button
                  id={`toggle-watch-btn-${item.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleWatch(item.id);
                  }}
                  className={`h-9 w-9 flex items-center justify-center rounded-full border transition-all duration-300 shadow-sm
                    ${isWatched 
                      ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100' 
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  title={isWatched ? "Remove from watchlist" : "Add to watchlist"}
                >
                  <Bookmark className={`h-4 w-4 ${isWatched ? 'fill-current' : ''}`} />
                </button>
                <Link
                  id={`view-details-btn-${item.id}`}
                  href={`/product/${item.id}`}
                  className="flex items-center justify-center gap-2 h-9 px-3 rounded-full border border-slate-900 bg-slate-900 text-white hover:bg-slate-800 transition-all duration-300 font-bold text-[11px] shadow-sm"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Details</span>
                </Link>
            </div>
          </div>
      </div>
    </div>
  );
}
