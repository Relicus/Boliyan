"use client";

import React, { useMemo } from 'react';
import { User } from '@/types';
import { calculateProfileCompleteness } from '@/lib/profileScore';
import { CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface ProfileCompletenessProps {
  user: User;
  className?: string;
}

export default function ProfileCompleteness({ user, className }: ProfileCompletenessProps) {
  const { score, items } = useMemo(() => calculateProfileCompleteness(user), [user]);

  if (score === 100) return null; // Don't show if already complete

  return (
    <div className={cn("bg-card border rounded-xl p-4 shadow-sm space-y-4", className)} id="profile-completeness-card">
      <div className="space-y-1">
        <h3 className="font-semibold text-sm flex justify-between">
          <span>Profile Strength</span>
          <span className={cn(
            "text-xs font-bold",
            score < 50 ? "text-red-500" : score < 80 ? "text-amber-500" : "text-green-500"
          )}>{score}%</span>
        </h3>
        
        {/* Progress Bar */}
        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
          <div 
            className={cn(
               "h-full transition-all duration-500 ease-out rounded-full",
               score < 50 ? "bg-red-500" : score < 80 ? "bg-amber-500" : "bg-green-500"
            )}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.name} className="flex items-center gap-2 text-sm">
            {item.completed ? (
              <CheckCircle2 size={16} className="text-green-500 fill-green-500/10" />
            ) : (
              <Circle size={16} className="text-muted-foreground" />
            )}
            <span className={item.completed ? "text-muted-foreground line-through" : "text-foreground"}>
              {item.name}
            </span>
            {!item.completed && (
                 <span className="text-[10px] text-green-600 font-medium ml-auto">+{item.weight}%</span>
            )}
          </div>
        ))}
      </div>

      <Button asChild variant="outline" size="sm" className="w-full text-xs h-8">
        <Link href={`/complete-profile?redirect=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : '/profile')}`}>Complete Profile</Link>
      </Button>
    </div>
  );
}
