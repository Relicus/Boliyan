import { Badge } from "@/components/ui/badge";
import { BadgeCheck, Lock } from "lucide-react";
import { Item, User } from "@/types";
import { CategoryBadge } from "@/components/common/CategoryBadge";
import { ConditionBadge } from "@/components/common/ConditionBadge";
import { TimerBadge } from "@/components/common/TimerBadge";

interface ListingBadgesProps {
  item: Item;
  seller: User;
  showTimer?: boolean;
  className?: string;
  onConditionClick?: (condition: string) => void;
  onCategoryClick?: (category: string) => void;
}

export function ListingBadges({ 
  item, 
  seller, 
  showTimer = true, 
  className,
  onConditionClick,
  onCategoryClick 
}: ListingBadgesProps) {
  const badgeStyle = "px-3 py-1.5";
  const itemId = item.id;
  
  return (
    <div id={`listing-badges-${itemId}`} className={`flex flex-wrap gap-2 ${className}`}>
      {/* Primary Status Row */}
      <ConditionBadge 
        id={`condition-badge-${itemId}`} 
        condition={item.condition} 
        variant="outline" 
        className={badgeStyle} 
        onClick={onConditionClick ? () => onConditionClick(item.condition) : undefined}
      />
      <CategoryBadge 
        id={`category-badge-${itemId}`} 
        category={item.category} 
        variant="outline" 
        className={badgeStyle} 
        onClick={onCategoryClick ? () => onCategoryClick(item.category) : undefined}
      />
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

