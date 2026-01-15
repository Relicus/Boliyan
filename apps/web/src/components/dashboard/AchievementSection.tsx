import React from 'react';
import { User, Badge } from '@/types';
import { GamificationBadge } from '@/components/common/GamificationBadge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Medal } from 'lucide-react';

interface AchievementSectionProps {
  user: User;
}

export function AchievementSection({ user }: AchievementSectionProps) {
  // Sort badges: Diamond > Gold > Silver > Bronze, then by Name
  const sortBadges = (badges: Badge[]) => {
    const tierOrder = { diamond: 3, gold: 2, silver: 1, bronze: 0 };
    return [...badges].sort((a, b) => {
      const tierDiff = tierOrder[b.tier] - tierOrder[a.tier];
      if (tierDiff !== 0) return tierDiff;
      return a.name.localeCompare(b.name);
    });
  };

  const sellerBadges = sortBadges(user.badges.filter(b => b.category === 'seller'));
  const buyerBadges = sortBadges(user.badges.filter(b => b.category === 'buyer'));
  const specialBadges = sortBadges(user.badges.filter(b => b.category === 'special'));

  const renderBadgeGrid = (title: string, badges: Badge[], emptyText: string) => (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
        {title}
        <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-foreground/80 font-normal normal-case">
          {badges.length} Unlocked
        </span>
      </h3>
      {badges.length > 0 ? (
        <div className="flex flex-wrap gap-3">
          {badges.map(badge => (
            <GamificationBadge key={badge.id} badge={badge} size="md" />
          ))}
        </div>
      ) : (
        <div className="text-xs text-muted-foreground italic pl-1 border-l-2 border-muted">
          {emptyText}
        </div>
      )}
    </div>
  );

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Medal className="h-5 w-5 text-primary" />
          <div>
            <CardTitle className="text-lg">Achievements & Badges</CardTitle>
            <CardDescription>
              Track your journey as a trusted deal maker and serious buyer.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Deal Stats Summary (Private View) */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-3 bg-muted/50 rounded-lg text-center border">
            <div className="text-2xl font-bold text-foreground">{user.stats?.bidsAcceptedByMe || 0}</div>
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Bids Accepted</div>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg text-center border">
            <div className="text-2xl font-bold text-foreground">{user.stats?.myBidsAccepted || 0}</div>
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Offers Accepted</div>
          </div>
        </div>

        {renderBadgeGrid("Seller Badges", sellerBadges, "No seller badges earned yet. Start accepting bids!")}
        {renderBadgeGrid("Buyer Badges", buyerBadges, "No buyer badges earned yet. Make serious offers!")}
        
        {specialBadges.length > 0 && (
          <>
            <div className="h-px bg-border my-2" />
            {renderBadgeGrid("Special Recognition", specialBadges, "")}
          </>
        )}
      </CardContent>
    </Card>
  );
}
