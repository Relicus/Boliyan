'use client';

import { createContext, useContext, useCallback, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Review, UserReputation } from '@/types/review';
import type { Database } from '@/types/database.types';

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

  type ReviewRow = Database['public']['Tables']['reviews']['Row'];
  type ReviewInsert = Database['public']['Tables']['reviews']['Insert'];
  type ProfileRow = Database['public']['Tables']['profiles']['Row'];

  const submitReview = useCallback(async (data: SubmitReviewData) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    const reviewPayload: ReviewInsert = {
      reviewer_id: user.id,
      reviewed_id: data.reviewedId,
      listing_id: data.listingId,
      conversation_id: data.conversationId,
      rating: data.rating,
      content: data.content,
      role: data.role,
    };

    const { error } = await (supabase.from('reviews') as any).insert(reviewPayload);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  }, [user]);

  const fetchUserReviews = useCallback(async (userId: string): Promise<Review[]> => {
    const { data, error } = await supabase
      .from('reviews')
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

    type ReviewWithRelations = ReviewRow & {
      reviewer?: { name?: string | null; avatar_url?: string | null } | null;
      listing?: { title?: string | null } | null;
    };

    return (data as ReviewWithRelations[]).map((row) => ({
      id: row.id,
      reviewerId: row.reviewer_id || '',
      reviewerName: row.reviewer?.name || undefined,
      reviewerAvatar: row.reviewer?.avatar_url || undefined,
      reviewedId: row.reviewed_id || '',
      listingId: row.listing_id || '',
      listingTitle: row.listing?.title || undefined,
      conversationId: row.conversation_id || undefined,
      rating: row.rating || 0,
      content: row.content || undefined,
      role: (row.role || 'buyer') as Review['role'],
      createdAt: row.created_at || new Date().toISOString(),
    }));
  }, []);

  const fetchUserReputation = useCallback(async (userId: string): Promise<UserReputation | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('avg_rating, review_count')
      .eq('id', userId)
      .single();

    if (error || !data) return null;

    // Get breakdown by role
    const { data: breakdown } = await supabase
      .from('reviews')
      .select('role, rating')
      .eq('reviewed_id', userId);

    type ReviewRatingRow = Pick<ReviewRow, 'role' | 'rating'>;
    const breakdownRows = (breakdown as ReviewRatingRow[]) || [];
    const asBuyer = breakdownRows.filter((r) => r.role === 'seller'); // Reviews they received AS buyer
    const asSeller = breakdownRows.filter((r) => r.role === 'buyer'); // Reviews they received AS seller

    const profile = data as ProfileRow & { avg_rating?: number | null; review_count?: number | null };

    return {
      avgRating: profile.avg_rating || 0,
      reviewCount: profile.review_count || 0,
      asBuyer: {
        avgRating: asBuyer.length ? asBuyer.reduce((s, r) => s + (r.rating || 0), 0) / asBuyer.length : 0,
        count: asBuyer.length,
      },
      asSeller: {
        avgRating: asSeller.length ? asSeller.reduce((s, r) => s + (r.rating || 0), 0) / asSeller.length : 0,
        count: asSeller.length,
      },
    };
  }, []);

  const canReview = useCallback(async (listingId: string, role: 'buyer' | 'seller'): Promise<boolean> => {
    if (!user) return false;

    // Check if already reviewed
    const { data } = await supabase
      .from('reviews')
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
