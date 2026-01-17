"use client";

import React, { useEffect, useState } from 'react';
import { useReviews } from '@/context/ReviewContext';
import type { Review } from '@/types/review';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import StarRating from './StarRating';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

interface ReviewListProps {
  userId: string;
  className?: string;
}

export default function ReviewList({ userId, className }: ReviewListProps) {
  const { fetchUserReviews } = useReviews();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const loadIds = async () => {
      setLoading(true);
      try {
        const data = await fetchUserReviews(userId);
        if (mounted) setReviews(data);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadIds();
    return () => { mounted = false; };
  }, [userId, fetchUserReviews]);

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  if (reviews.length === 0) {
    return (
      <div className={cn("text-center py-8 text-neutral-500", className)} id="review-list-empty">
        <p className="text-sm">No reviews yet.</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)} id={`review-list-${userId}`}>
      {reviews.map((review) => (
        <div key={review.id} className="border-b border-border pb-6 last:border-0 last:pb-0">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border border-border/50">
                <AvatarImage src={review.reviewerAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${review.reviewerId}`} alt={review.reviewerName} />
                <AvatarFallback>{review.reviewerName?.[0] || 'U'}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-neutral-900">{review.reviewerName || 'Anonymous'}</span>
                    <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal text-muted-foreground">
                        {review.role === 'buyer' ? 'Seller Review' : 'Buyer Review'}
                    </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <StarRating rating={review.rating} size={12} readonly />
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}</span>
                </div>
              </div>
            </div>
          </div>
          
          {review.content && (
            <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed mt-2">
              {review.content}
            </p>
          )}

          {review.listingTitle && (
             <div className="mt-3 text-xs text-muted-foreground bg-secondary/30 inline-block px-2 py-1 rounded">
                Item: {review.listingTitle}
             </div>
          )}
        </div>
      ))}
    </div>
  );
}
