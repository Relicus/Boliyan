'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/lib/store';
import { DashboardState, ManagedListing, SellerMetric } from '@/types/dashboard';
import type { Database } from '@/types/database.types';

interface DashboardContextType extends DashboardState {
  refreshDashboard: () => Promise<void>;
  updateListingStatus: (itemId: string, status: 'active' | 'completed' | 'cancelled') => Promise<void>;
  deleteListing: (itemId: string) => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const { user } = useApp();
  const [state, setState] = useState<DashboardState>({
    metrics: [],
    listings: [],
    isLoading: true,
    error: null,
  });

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // 1. Fetch Seller's Listings
      const { data: listingsData, error: listingsError } = await supabase
        .from('listings')
        .select(`
          *,
          bids:bids(count)
        `)
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      if (listingsError) throw listingsError;

      // Transform to ManagedListing
      // Note: view_count might not exist yet in DB, defaulting to mock random for demo if missing
      type ListingRow = Database['public']['Tables']['listings']['Row'];
      type ListingWithBidCount = ListingRow & { bids?: { count: number }[]; view_count?: number | null };

      const isValidCondition = (value: string | null | undefined): value is ManagedListing['condition'] =>
        value === 'new' || value === 'like_new' || value === 'used' || value === 'fair';

      const isValidStatus = (value: string | null | undefined): value is ManagedListing['status'] =>
        value === 'active' || value === 'completed' || value === 'cancelled' || value === 'hidden';

      const listings: ManagedListing[] = (listingsData as any[] || []).map((item) => ({
        ...item,
        // Manual mapping from Snake Case (DB) to Camel Case (App)
        sellerId: item.seller_id || '',
        askPrice: item.asked_price,
        isPublicBid: item.auction_mode === 'visible',
        createdAt: item.created_at || new Date().toISOString(),
        category: item.category || 'Other',
        listingDuration: 720, // Default to 30 days
        expiryAt: new Date(Date.now() + 2592000000).toISOString(), // 30 day mock expiry
        description: item.description || '', // Ensure string
        condition: isValidCondition(item.condition) ? item.condition : 'used',
        status: isValidStatus(item.status) ? item.status : 'active',
        goLiveAt: item.go_live_at || undefined,
        lastEditedAt: item.last_edited_at || undefined,
        slug: item.slug ?? undefined,
        
        images: item.images || [], // Ensure array
        seller: user, // user is seller
        bidCount: item.bids?.[0]?.count || 0,
        bidAttemptsCount: item.bids?.[0]?.count || 0,
        views: item.view_count ?? Math.floor(Math.random() * 50) + 10, // Mock if missing
        unreadBids: 0, // TODO: Implement unread logic with notifications
        lastActivity: item.created_at || new Date().toISOString(), // separate activity field later?
        
        // Moderation fields for rejection badge
        moderationStatus: (item as { moderation_status?: string }).moderation_status as ManagedListing['moderationStatus'],
        rejectionReason: (item as { rejection_reason?: string }).rejection_reason || undefined,
      }));

      // 2. Calculate Metrics
      const activeListings = listings.filter(l => l.status === 'active');
      const soldListings = listings.filter(l => l.status === 'completed');
      
      const totalBids = listings.reduce((acc, curr) => acc + ((curr.bidAttemptsCount ?? curr.bidCount) || 0), 0);
      
      const successRate = user.sellerSuccessRate ?? 100;

      const metrics: SellerMetric[] = [
        { label: 'Success Rate', value: successRate, icon: 'ShieldCheck', color: successRate >= 90 ? 'text-emerald-500' : 'text-amber-500' },
        { label: 'Active Listings', value: activeListings.length, icon: 'Package', color: 'text-blue-500' },
        { label: 'Total Bids', value: totalBids, icon: 'Gavel', color: 'text-orange-500' },
        { label: 'Items Sold', value: soldListings.length, icon: 'CheckCircle', color: 'text-green-500' },
      ];

      setState({
        listings,
        metrics,
        isLoading: false,
        error: null,
      });

    } catch (err: unknown) {
      console.error('Error loading dashboard:', err);
      const message = err instanceof Error ? err.message : 'Unknown error';
      setState(prev => ({ ...prev, isLoading: false, error: message }));
    }
  }, [user]);

  // Initial fetch
  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user, fetchDashboardData]);

  const updateListingStatus = async (itemId: string, status: 'active' | 'completed' | 'cancelled') => {
    try {
      const { error } = await supabase.rpc('update_listing_fields', {
        p_listing_id: itemId,
        p_status: status,
        p_title: null
      });

      if (error) throw error;
      
      // Optimistic update
      setState(prev => ({
        ...prev,
        listings: prev.listings.map(l => l.id === itemId ? { ...l, status } : l)
      }));
      
      // Refresh to confirm and update metrics
      fetchDashboardData();

    } catch (error: unknown) {
      console.error('Failed to update status:', error);
      // Revert or show toast (for now just log)
    }
  };

  const deleteListing = async (itemId: string) => {
     // Soft delete as cancelled
     await updateListingStatus(itemId, 'cancelled');
  };


  return (
    <DashboardContext.Provider value={{ 
      ...state, 
      refreshDashboard: fetchDashboardData,
      updateListingStatus,
      deleteListing
    }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}
