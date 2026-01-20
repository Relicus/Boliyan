"use client";

import { useState, useCallback, useEffect } from "react";
import confetti from "canvas-confetti";
import { useApp } from "@/lib/store";
import { Item, User } from "@/types";
import { getSmartStep, getMinimumAllowedBid } from "@/lib/bidding";

import { toast } from "sonner";

export function useBidding(item: Item, seller: User, onBidSuccess?: () => void) {
  const { placeBid, user, bids } = useApp();

  const [warning, setWarning] = useState<{ type: 'double_bid' | 'high_bid', message: string } | null>(null);

  // Initialize with Ask Price (70% allowed on first bid) or Current High Bid
  const initialBid = item.isPublicBid && item.currentHighBid
    ? item.currentHighBid + getSmartStep(item.currentHighBid)
    : Math.ceil(getMinimumAllowedBid(item.askPrice) / 100) * 100; // Round up to nearest 100

  const [bidAmount, setBidAmount] = useState<string>(initialBid.toLocaleString());
  const [error, setError] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [animTrigger, setAnimTrigger] = useState(0);

  // Sync bid amount when external minimum bid updates (e.g. someone else bids)
  useEffect(() => {
    const minBid = item.isPublicBid && item.currentHighBid
      ? item.currentHighBid + getSmartStep(item.currentHighBid)
      : getMinimumAllowedBid(item.askPrice);

    if (!isSuccess) {
      setBidAmount(prev => {
        const currentNumericAmount = parseFloat(prev.replace(/,/g, ''));
        if (currentNumericAmount < minBid && item.currentHighBid) {
          return minBid.toLocaleString();
        }
        return prev;
      });
    }
  }, [item.currentHighBid, item.askPrice, item.isPublicBid, isSuccess]); 

  const handleSmartAdjust = useCallback((e: React.MouseEvent | React.TouchEvent, direction: 1 | -1) => {
    e.stopPropagation();
    const current = parseFloat(bidAmount.replace(/,/g, '')) || 0;
    const step = getSmartStep(current);
    const delta = step * direction;
    
    // Calculate minimum allowed bid based on item state
    const minBid = item.isPublicBid && item.currentHighBid
      ? item.currentHighBid + getSmartStep(item.currentHighBid)
      : getMinimumAllowedBid(item.askPrice);

    // If attempting to go below minimum, show error and block
    if (current + delta < minBid) {
      setError(true);
      setTimeout(() => setError(false), 1000);
      return;
    }
    
    // Otherwise allow update
    const newValue = Math.max(0, current + delta);
    
    setBidAmount(newValue.toLocaleString());
    setAnimTrigger(prev => prev + 1);
  }, [bidAmount, item]);

  const executeBid = useCallback((amount: number, e?: React.MouseEvent | React.TouchEvent | any) => {
    // Place bid logic via store
    placeBid(item.id, amount, item.isPublicBid ? 'public' : 'private');
    setIsSuccess(true);

    // Automatically increase the bid price in input box by 1 step for the "Next Bid"
    const nextAmount = amount + getSmartStep(amount);
    setBidAmount(nextAmount.toLocaleString());

    // Confetti Effect: Targeted to the source button or touch point
    let x = 0.5;
    let y = 0.5;

    if (e) {
      // If it's a mouse/touch event with coordinates
      if ('clientX' in e && e.clientX !== 0) {
        x = e.clientX / window.innerWidth;
        y = e.clientY / window.innerHeight;
      } 
      // Fallback: Use the center of the element that triggered the event
      else if (e.currentTarget instanceof HTMLElement) {
        const rect = e.currentTarget.getBoundingClientRect();
        x = (rect.left + rect.width / 2) / window.innerWidth;
        y = (rect.top + rect.height / 2) / window.innerHeight;
      }
    }

    // Two bursts for a more "directional" feel from the button
    const commonConfig = {
      origin: { x, y },
      particleCount: 80,
      spread: 60,
      gravity: 1.1,
      scalar: 0.8,
      zIndex: 9999,
      colors: ['#fbbf24', '#f59e0b', '#d97706', '#ffffff'],
    };

    try {
      // Shoot slightly left and right UPWARDS
      confetti({
        ...commonConfig,
        angle: 60,
      });
      confetti({
        ...commonConfig,
        angle: 120,
      });
    } catch (err) {
      console.warn('[useBidding] Confetti failed (likely headless env):', err);
    }


    // Handle success transition
    if (onBidSuccess) {
      setTimeout(() => {
        onBidSuccess();
        setIsSuccess(false); // RESTORED
      }, 1500);
    } else {
      setTimeout(() => setIsSuccess(false), 1500); // RESTORED
    }
  }, [item, placeBid, onBidSuccess]);

  const attemptBid = useCallback((e?: React.MouseEvent | React.TouchEvent) => {
    e?.stopPropagation();
    const amount = parseFloat(bidAmount.replace(/,/g, ''));
    
    // Minimum bid logic
    let minBid = getMinimumAllowedBid(item.askPrice);
    let referencePrice = item.askPrice;

    if (item.isPublicBid && item.currentHighBid) {
      minBid = item.currentHighBid + getSmartStep(item.currentHighBid);
      referencePrice = item.currentHighBid;
    }

    if (isNaN(amount) || amount < minBid) {
      setError(true);
      setTimeout(() => setError(false), 2000);
      return;
    }

    if (!user) {
      toast.error("Please login to place a bid");
      // Should ideally redirect to login, but for now just return to prevent crash
      // The UI should handle showing the sign-in state usually
      return;
    }

    // Safety Check 1: Previous Bid Check
    if (item.isPublicBid) {
      // For Public auctions, warn if they are already the high bidder
      if (item.currentHighBidderId === user.id) {
        console.log('[useBidding] attemptBid: user is high bidder. Showing warning.');
        setWarning({
          type: 'double_bid',
          message: "You are already the highest bidder. Do you want to increase your bid?"
        });
        return;
      }
    } else {
      // For Secret/Sealed auctions, warn if they have bid at all
      // We rely on MarketplaceContext to have loaded the bids for this item
      // Note: 'bids' is now destructured at top level to avoid hook rule violation
      const hasAlreadyBid = bids.some(b => b.itemId === item.id && b.bidderId === user.id);
      
      if (hasAlreadyBid) {
        setWarning({
          type: 'double_bid',
          message: "You have already placed a bid for this item. Do you want to update it?"
        });
        return;
      }
    }

    // Safety Check 2: High Bid (20% above reference)
    // We use a 20% buffer. If they bid 20% MORE than the reference price, we warn.
    const safetyThreshold = referencePrice * 1.2;
    if (amount > safetyThreshold) {
      const percentOver = Math.round(((amount - referencePrice) / referencePrice) * 100);
      setWarning({
        type: 'high_bid',
        message: `Your bid is ${percentOver}% higher than required. Are you sure?`
      });
      return;
    }

    // If no warnings, execute immediately
    executeBid(amount, e);
  }, [bidAmount, item, user?.id, executeBid]);

  const confirmBid = useCallback((e?: React.MouseEvent | React.TouchEvent | any) => {
    if (!warning) return;
    const amount = parseFloat(bidAmount.replace(/,/g, ''));
    executeBid(amount, e); 
    setWarning(null);
  }, [warning, bidAmount, executeBid]);


  const clearWarning = useCallback(() => {
    setWarning(null);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    // Prevent 'e', 'E', '+', '-'
    if (['e', 'E', '+', '-'].includes(e.key)) {
      e.preventDefault();
    }
    if (e.key === 'Enter') {
      attemptBid();
    }
  }, [attemptBid]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/,/g, '');
    if (raw === '') {
      setBidAmount('');
      setError(false);
      return;
    }
    if (/^\d+$/.test(raw)) {
      setBidAmount(parseInt(raw, 10).toLocaleString());
      setError(false);
    }
  }, []);

  return {
    bidAmount,
    setBidAmount,
    error,
    isSuccess,
    animTrigger,
    handleSmartAdjust,
    handleBid: attemptBid, // Renamed exposed Prop for compat
    confirmBid,
    clearWarning,
    warning,
    handleKeyDown,
    handleInputChange,
    getSmartStep
  };
}
