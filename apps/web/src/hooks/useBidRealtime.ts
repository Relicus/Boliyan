import { useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Bid } from '@/types';
import { transformBidToHydratedBid, BidWithProfile } from '@/lib/transform';
import type { Database } from '@/types/database.types';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export function useBidRealtime(onBid: (bid: Bid) => void, activeIds: Set<string>) {
  useEffect(() => {
    // Use a shared channel name so Supabase client can potentially multiplex
    const channel = supabase
      .channel('shared-bids-channel')
      .on('postgres_changes', { 
        event: '*', // Listen to ALL changes (INSERT, UPDATE, DELETE)
        schema: 'public', 
        table: 'bids' 
      }, async (payload: RealtimePostgresChangesPayload<Database['public']['Tables']['bids']['Row']>) => {
        const newBidRaw = payload.new;
        if (!newBidRaw || !('listing_id' in newBidRaw)) return;
        
        const listingId = newBidRaw.listing_id;
        if (!listingId || !activeIds.has(listingId)) {
           // Skip updates for items we aren't tracking (not in viewport and not involved)
           return;
        }

        const bidRow = newBidRaw as Database['public']['Tables']['bids']['Row'];
        if (!bidRow.bidder_id) return;
        
        // Fetch profile to hydrate the bid
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', bidRow.bidder_id)
          .single();

        const newBid = transformBidToHydratedBid({
          ...bidRow,
          profiles: profile
        } as unknown as BidWithProfile);

        onBid(newBid);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onBid, activeIds]);
}
