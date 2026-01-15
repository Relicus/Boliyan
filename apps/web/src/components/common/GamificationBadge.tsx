import React from 'react';
import { Badge } from '@/types';
import { cn } from '@/lib/utils';
import { Handshake, ShoppingBag, ShieldCheck, Zap, BadgeCheck, Trophy, Star } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface GamificationBadgeProps {
  badge: Badge;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  className?: string;
}

const iconMap: Record<string, any> = {
  Handshake,
  ShoppingBag,
  ShieldCheck,
  Zap,
  BadgeCheck,
  Trophy,
  Star
};

export function GamificationBadge({ 
  badge, 
  size = 'md', 
  showTooltip = true, 
  className 
}: GamificationBadgeProps) {
  const Icon = iconMap[badge.icon] || Star;

  const tierStyles = {
    bronze: "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100/80",
    silver: "bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-100/80",
    gold: "bg-yellow-100 text-yellow-800 border-yellow-300 ring-1 ring-yellow-400/50 hover:bg-yellow-100/80",
    diamond: "bg-cyan-50 text-cyan-900 border-cyan-200 ring-1 ring-cyan-400/50 hover:bg-cyan-50/80"
  };

  const sizeStyles = {
    sm: "h-6 px-1.5 text-[10px] gap-1",
    md: "h-8 px-2.5 text-xs gap-1.5",
    lg: "h-10 px-3 text-sm gap-2"
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16
  };

  const BadgeContent = (
    <div className={cn(
      "inline-flex items-center justify-center rounded-full border transition-all duration-200 cursor-default font-medium",
      tierStyles[badge.tier],
      sizeStyles[size],
      className
    )}>
      <Icon size={iconSizes[size]} strokeWidth={2.5} />
      <span>{badge.name}</span>
    </div>
  );

  if (!showTooltip) return BadgeContent;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {BadgeContent}
      </TooltipTrigger>
      <TooltipContent className="max-w-[200px]" side="top">
        <div className="flex flex-col gap-1">
          <p className="font-semibold capitalize text-xs">{badge.tier} Tier</p>
          <p className="text-[11px] text-muted-foreground leading-tight">{badge.description}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
