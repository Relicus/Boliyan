'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/lib/store';
import { DashboardState, ManagedListing, SellerMetric } from '@/types/dashboard';
import { Item } from '@/types';

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
      const listings: ManagedListing[] = (listingsData || []).map((item: any) => ({
        ...item,
        images: item.images || [], // Ensure array
        seller: user, // user is seller
        bidCount: item.bids?.[0]?.count || 0,
        views: item.view_count || Math.floor(Math.random() * 50) + 10, // Mock if missing
        unreadBids: 0, // TODO: Implement unread logic with notifications
        lastActivity: item.created_at, // separate activity field later?
      }));

      // 2. Calculate Metrics
      const activeListings = listings.filter(l => l.status === 'active');
      const soldListings = listings.filter(l => l.status === 'completed');
      
      const totalBids = listings.reduce((acc, curr) => acc + (curr.bidCount || 0), 0);
      const totalRevenue = soldListings.reduce((acc, curr) => acc + (curr.currentHighBid || curr.askPrice), 0); // Simplified revenue

      const metrics: SellerMetric[] = [
        { label: 'Active Listings', value: activeListings.length, icon: 'Package', color: 'text-blue-500' },
        { label: 'Total Bids', value: totalBids, icon: 'Gavel', color: 'text-orange-500' },
        { label: 'Items Sold', value: soldListings.length, icon: 'CheckCircle', color: 'text-green-500' },
        { label: 'Est. Revenue', value: totalRevenue, icon: 'DollarSign', color: 'text-emerald-400' },
      ];

      setState({
        listings,
        metrics,
        isLoading: false,
        error: null,
      });

    } catch (err: any) {
      console.error('Error loading dashboard:', err);
      setState(prev => ({ ...prev, isLoading: false, error: err.message }));
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
      const { error } = await (supabase.from('listings') as any)
        .update({ status })
        .eq('id', itemId);

      if (error) throw error;
      
      // Optimistic update
      setState(prev => ({
        ...prev,
        listings: prev.listings.map(l => l.id === itemId ? { ...l, status } : l)
      }));
      
      // Refresh to confirm and update metrics
      fetchDashboardData();

    } catch (error: any) {
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
