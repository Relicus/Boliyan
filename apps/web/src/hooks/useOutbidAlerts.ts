import { useEffect, useRef, useState } from 'react';
import { Bid, User } from '@/types';
import { toast } from 'sonner';

export interface Notification {
  id: string;
  type: 'outbid';
  title: string;
  message: string;
  timestamp: number;
  isRead: boolean;
  link: string;
  itemId: string;
}

export function useOutbidAlerts(bids: Bid[], user: User | null) {
  const processedBidsRef = useRef<Set<string>>(new Set());
  const hasLoadedRef = useRef(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

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
                     const message = `New bid of Rs. ${bid.amount.toLocaleString()}`;
                     
                     // 1. Trigger Toast
                     toast.warning(`You've been outbid! ${message}`, {
                         duration: 5000,
                         action: {
                             label: 'View',
                             onClick: () => window.location.href = `/product/${bid.itemId}`
                         }
                     });

                     // 2. Add to History
                     const newNotification: Notification = {
                         id: `notif-${bid.id}-${Date.now()}`,
                         type: 'outbid',
                         title: "You've been outbid!",
                         message,
                         timestamp: Date.now(),
                         isRead: false,
                         link: `/product/${bid.itemId}`,
                         itemId: bid.itemId
                     };
                     
                     setNotifications(prev => [newNotification, ...prev]);
                }
            }
            // Mark as processed
            processedBidsRef.current.add(bid.id);
        }
    });
  }, [bids, user]);

  const markAllAsRead = () => {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return { notifications, markAllAsRead, unreadCount };
}
