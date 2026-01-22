import { Badge } from "@/components/ui/badge";
import { BadgeCheck, Lock } from "lucide-react";
import { Item, User } from "@/types";
import { CategoryBadge } from "@/components/common/CategoryBadge";
import { ConditionBadge } from "@/components/common/ConditionBadge";

interface ListingBadgesProps {
  item: Item;
  seller: User;
}

export function ListingBadges({ item, seller }: ListingBadgesProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {/* Condition & Category Side-by-Side */}
      <ConditionBadge condition={item.condition} variant="outline" />
      <CategoryBadge category={item.category} variant="outline" />

      {/* Verified Badge */}

      {seller.isVerified && (
        <Badge variant="outline" className="font-bold bg-blue-50 text-blue-700 border-blue-100 flex items-center gap-1">
          <BadgeCheck className="h-3.5 w-3.5 fill-current text-blue-700 stroke-white" />
          Verified Listing
        </Badge>
      )}

      {/* Secret Bidding Badge */}
      {!item.isPublicBid && (
        <Badge variant="secondary" className="font-bold bg-amber-500 text-white border-none shadow-sm flex items-center gap-1">
          <Lock className="h-3.5 w-3.5" />
          Secret Bidding
        </Badge>
      )}
    </div>
  );
}
