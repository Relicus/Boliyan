import { Badge } from "@/components/ui/badge";
import { BadgeCheck, Lock, MapPin, Sparkles } from "lucide-react";
import { Item, User } from "@/types";
import { CategoryBadge } from "@/components/common/CategoryBadge";
import { ConditionBadge } from "@/components/common/ConditionBadge";
import { TimerBadge } from "@/components/common/TimerBadge";
import { getFuzzyLocationString } from "@/lib/utils";

// Helper function to check if item was listed within last 24 hours
function checkIsJustListed(createdAt: string | null | undefined): boolean {
  if (!createdAt) return false;
  const createdTime = new Date(createdAt).getTime();
  const now = Date.now();
  return (now - createdTime) < 24 * 60 * 60 * 1000;
}

interface ListingBadgesProps {
  item: Item;
  seller: User;
  showTimer?: boolean;
  showLocation?: boolean;
  className?: string;
  onCategoryClick?: () => void;
  onConditionClick?: () => void;
  onLocationClick?: () => void;
}

export function ListingBadges({ 
  item, 
  seller, 
  showTimer = true, 
  showLocation = false, 
  className,
  onCategoryClick,
  onConditionClick,
  onLocationClick
}: ListingBadgesProps) {
  const badgeStyle = "px-3 py-1.5";
  const itemId = item.id;
  
  // Check if item was listed within the last 24 hours
  const isJustListed = checkIsJustListed(item.createdAt);
  
  return (
    <div id={`listing-badges-${itemId}`} className={`flex flex-wrap gap-2 ${className}`}>
      {/* New Badge */}
      {isJustListed && (
        <Badge id={`new-badge-${itemId}`} variant="outline" className={`font-bold bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1.5 ${badgeStyle}`}>
          <Sparkles className="h-3.5 w-3.5" />
          New
        </Badge>
      )}

      {/* Primary Status Row */}
      <ConditionBadge 
        id={`condition-badge-${itemId}`} 
        condition={item.condition} 
        variant="outline" 
        className={badgeStyle} 
        onClick={onConditionClick}
      />
      <CategoryBadge 
        id={`category-badge-${itemId}`} 
        category={item.category} 
        variant="outline" 
        className={badgeStyle} 
        onClick={onCategoryClick}
      />
      
      {/* Location Badge */}
      {showLocation && seller?.location && (
        <Badge 
          id={`location-badge-${itemId}`} 
          variant="outline" 
          className={`font-bold bg-slate-50 text-slate-700 border-slate-200 flex items-center gap-1.5 ${badgeStyle} ${onLocationClick ? 'cursor-pointer hover:scale-105 hover:shadow-md active:scale-95 transition-all' : ''}`}
          onClick={onLocationClick ? (e) => { e.stopPropagation(); onLocationClick(); } : undefined}
        >
          <MapPin className="h-3.5 w-3.5" />
          {getFuzzyLocationString(seller.location.address)}
        </Badge>
      )}

      {/* Timer Badge */}
      {showTimer && (
        <TimerBadge
          id={`timer-badge-${itemId}`}
          expiryAt={item.expiryAt}
          variant="outline"
          className={`${badgeStyle} bg-red-600 text-white border-transparent hover:bg-red-700`}
        />
      )}

      {/* Verified Badge */}
      {seller.isVerified && (
        <Badge id={`verified-badge-${itemId}`} variant="outline" className={`font-bold bg-blue-50 text-blue-700 border-blue-100 flex items-center gap-1.5 ${badgeStyle}`}>
          <BadgeCheck className="h-3.5 w-3.5 fill-current text-blue-700 stroke-white" />
          Verified Listing
        </Badge>
      )}

      {/* Hidden Bidding Badge */}
      {!item.isPublicBid && (
        <Badge id={`hidden-bidding-badge-${itemId}`} variant="secondary" className={`font-bold bg-amber-500 text-white border-none shadow-sm flex items-center gap-1.5 ${badgeStyle}`}>
          <Lock className="h-3.5 w-3.5" />
          Hidden Bidding
        </Badge>
      )}
    </div>
  );
}


