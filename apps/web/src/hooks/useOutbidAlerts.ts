import { useEffect, useRef } from 'react';
import { Bid, User } from '@/types';
import { toast } from 'sonner';

export function useOutbidAlerts(bids: Bid[], user: User | null) {
  const processedBidsRef = useRef<Set<string>>(new Set());
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    // 1. Initial Load: Just mark existing bids as seen to avoid flood
    if (!hasLoadedRef.current) {
        if (bids.length > 0) {
            bids.forEach(b => processedBidsRef.current.add(b.id));
            hasLoadedRef.current = true;
        }
        return;
    }

    // 2. Check for New Bids
    bids.forEach(bid => {
        if (!processedBidsRef.current.has(bid.id)) {
            // It's a new bid
            if (user && bid.bidderId !== user.id) {
                // Check if I have previously bid on this item
                // (i.e. am I an interested party?)
                const myParticipation = bids.some(b => b.itemId === bid.itemId && b.bidderId === user.id);
                
                if (myParticipation) {
                     toast.warning(`You've been outbid! New bid of Rs. ${bid.amount.toLocaleString()}`, {
                         duration: 5000,
                         action: {
                             label: 'View',
                             onClick: () => window.location.href = `/product/${bid.itemId}`
                         }
                     });
                }
            }
            // Mark as processed
            processedBidsRef.current.add(bid.id);
        }
    });
  }, [bids, user]);
}
