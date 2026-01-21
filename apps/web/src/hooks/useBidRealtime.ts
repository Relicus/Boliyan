import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Bid } from '@/types';
import { transformBidToHydratedBid, BidWithProfile } from '@/lib/transform';
import type { Database } from '@/types/database.types';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export function useBidRealtime(onBid: (bid: Bid) => void) {
  useEffect(() => {
    // Use a shared channel name so Supabase client can potentially multiplex
    const channel = supabase
      .channel('shared-bids-channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bids' }, async (payload: RealtimePostgresChangesPayload<Database['public']['Tables']['bids']['Row']>) => {
        const newBidRaw = payload.new;
        if (!newBidRaw || !('bidder_id' in newBidRaw)) return;
        
        // Fetch profile to hydrate the bid
        // Note: In high volume, this might be a bottleneck. 
        // Future optimization: Include bidder info in the bid payload via webhook or denormalization
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', newBidRaw.bidder_id)
          .single();

        const newBid = transformBidToHydratedBid({
          ...newBidRaw,
          profiles: profile
        } as unknown as BidWithProfile);

        onBid(newBid);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onBid]);
}
