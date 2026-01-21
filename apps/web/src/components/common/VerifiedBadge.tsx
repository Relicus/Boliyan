import React from 'react';
import { BadgeCheck } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface VerifiedBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showTooltip?: boolean;
}

export function VerifiedBadge({ 
  size = 'md', 
  className, 
  showTooltip = true 
}: VerifiedBadgeProps) {
  const iconSizes = {
    sm: 14,
    md: 20,
    lg: 24
  };

  const badge = (
    <div
      className={cn(
        "relative inline-flex items-center justify-center text-blue-600",
        className
      )}
    >
      <BadgeCheck 
        size={iconSizes[size]} 
        fill="currentColor" 
        className="text-blue-600" 
        stroke="white" 
        strokeWidth={1.5}
      />
    </div>
  );

  if (!showTooltip) return badge;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-slate-900 text-white border-none text-[10px] font-bold px-2 py-1">
          Verified User
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
