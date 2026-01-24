import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Bid } from '@/types';
import { transformBidToHydratedBid, BidWithProfile } from '@/lib/transform';
import type { Database } from '@/types/database.types';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { handleRealtimeBidDOM } from '@/lib/realtime-dom';

export function useBidRealtime(
  onBid: (bid: Bid) => void, 
  activeIds: Set<string>,
  userId?: string
) {
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
        const bidderId = newBidRaw.bidder_id;
        if (!listingId || !bidderId) return;
        
        // --- DIRECT DOM UPDATE START ---
        // We perform this BEFORE checking activeIds to ensure instant visual feedback
        // for any visible item, even if React state hasn't caught up.
        if (payload.eventType === 'INSERT') {
          handleRealtimeBidDOM({
            itemId: listingId,
            newAmount: newBidRaw.amount,
            bidderId: bidderId,
            isNewHighBid: true // We assume true for instant update, server/state will correct if wrong
          }, userId);
        }
        // --- DIRECT DOM UPDATE END ---

        if (!activeIds.has(listingId)) {
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
  }, [onBid, activeIds, userId]);
}
