'use client';

import { createContext, useContext, useCallback, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Review, UserReputation } from '@/types/review';

interface ReviewContextType {
  submitReview: (data: SubmitReviewData) => Promise<{ success: boolean; error?: string }>;
  fetchUserReviews: (userId: string) => Promise<Review[]>;
  fetchUserReputation: (userId: string) => Promise<UserReputation | null>;
  canReview: (listingId: string, role: 'buyer' | 'seller') => Promise<boolean>;
}

interface SubmitReviewData {
  reviewedId: string;
  listingId: string;
  conversationId?: string;
  rating: number;
  content?: string;
  role: 'buyer' | 'seller';
}

const ReviewContext = createContext<ReviewContextType | undefined>(undefined);

export function ReviewProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const submitReview = useCallback(async (data: SubmitReviewData) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    const { error } = await (supabase.from('reviews') as any).insert({
      reviewer_id: user.id,
      reviewed_id: data.reviewedId,
      listing_id: data.listingId,
      conversation_id: data.conversationId,
      rating: data.rating,
      content: data.content,
      role: data.role,
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  }, [user]);

  const fetchUserReviews = useCallback(async (userId: string): Promise<Review[]> => {
    const { data, error } = await (supabase
      .from('reviews') as any)
      .select(`
        *,
        reviewer:profiles!reviewer_id(name, avatar_url),
        listing:listings!listing_id(title)
      `)
      .eq('reviewed_id', userId)
      .order('created_at', { ascending: false });

    if (error || !data) {
        console.error("Error fetching reviews:", error);
        return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as any[]).map((row) => ({
      id: row.id,
      reviewerId: row.reviewer_id,
      reviewerName: row.reviewer?.name,
      reviewerAvatar: row.reviewer?.avatar_url, // Adjusted to match profile schema usually avatar_url
      reviewedId: row.reviewed_id,
      listingId: row.listing_id,
      listingTitle: row.listing?.title,
      conversationId: row.conversation_id,
      rating: row.rating,
      content: row.content,
      role: row.role,
      createdAt: row.created_at,
    }));
  }, []);

  const fetchUserReputation = useCallback(async (userId: string): Promise<UserReputation | null> => {
    const { data, error } = await (supabase
      .from('profiles') as any)
      .select('avg_rating, review_count')
      .eq('id', userId)
      .single();

    if (error || !data) return null;

    // Get breakdown by role
    const { data: breakdown } = await (supabase
      .from('reviews') as any)
      .select('role, rating')
      .eq('reviewed_id', userId);

    const asBuyer = (breakdown as any[])?.filter((r: any) => r.role === 'seller') || []; // Reviews they received AS buyer
    const asSeller = (breakdown as any[])?.filter((r: any) => r.role === 'buyer') || []; // Reviews they received AS seller

    return {
      avgRating: data.avg_rating || 0,
      reviewCount: data.review_count || 0,
      asBuyer: {
        avgRating: asBuyer.length ? asBuyer.reduce((s, r) => s + r.rating, 0) / asBuyer.length : 0,
        count: asBuyer.length,
      },
      asSeller: {
        avgRating: asSeller.length ? asSeller.reduce((s, r) => s + r.rating, 0) / asSeller.length : 0,
        count: asSeller.length,
      },
    };
  }, []);

  const canReview = useCallback(async (listingId: string, role: 'buyer' | 'seller'): Promise<boolean> => {
    if (!user) return false;

    // Check if already reviewed
    const { data } = await (supabase
      .from('reviews') as any)
      .select('id')
      .eq('reviewer_id', user.id)
      .eq('listing_id', listingId)
      .eq('role', role)
      .single();

    return !data; // Can review if no existing review
  }, [user]);

  return (
    <ReviewContext.Provider value={{ submitReview, fetchUserReviews, fetchUserReputation, canReview }}>
      {children}
    </ReviewContext.Provider>
  );
}

export function useReviews() {
  const context = useContext(ReviewContext);
  if (!context) throw new Error('useReviews must be used within ReviewProvider');
  return context;
}
