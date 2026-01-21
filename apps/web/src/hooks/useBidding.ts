"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { useApp } from "@/lib/store";
import { Item, User } from "@/types";
import { getSmartStep, getMinimumAllowedBid } from "@/lib/bidding";

import { toast } from "sonner";

export function useBidding(item: Item, seller: User, onBidSuccess?: () => void) {
  const { placeBid, user, bids } = useApp();

  // Pending confirmation for dual-tap pattern (replaces dialog-based warning)
  const [pendingConfirmation, setPendingConfirmation] = useState<{ type: 'double_bid' | 'high_bid', message: string } | null>(null);
  const confirmationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize with Ask Price (70% allowed on first bid) or Current High Bid
  const initialBid = item.isPublicBid && item.currentHighBid
    ? item.currentHighBid + getSmartStep(item.currentHighBid)
    : Math.ceil(getMinimumAllowedBid(item.askPrice) / 100) * 100; // Round up to nearest 100

  const [bidAmount, setBidAmount] = useState<string>(initialBid.toLocaleString());
  const [error, setError] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [animTrigger, setAnimTrigger] = useState(0);
  const [lastDelta, setLastDelta] = useState<number | null>(null);
  const [showDelta, setShowDelta] = useState<boolean>(false);

  // Clear confirmation timeout on unmount
  useEffect(() => {
    return () => {
      if (confirmationTimeoutRef.current) {
        clearTimeout(confirmationTimeoutRef.current);
      }
    };
  }, []);

  // Sync bid amount when external minimum bid updates (e.g. someone else bids)
  useEffect(() => {
    const minBid = item.isPublicBid && item.currentHighBid
      ? item.currentHighBid + getSmartStep(item.currentHighBid)
      : getMinimumAllowedBid(item.askPrice);

    if (!isSuccess) {
      const timer = setTimeout(() => {
        setBidAmount(prev => {
          const currentNumericAmount = parseFloat(prev.replace(/,/g, ''));
          if (currentNumericAmount < minBid && item.currentHighBid) {
            return minBid.toLocaleString();
          }
          return prev;
        });
      }, 0);
      return () => clearTimeout(timer);
    }
    return undefined;
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
    
    setLastDelta(delta);
    setShowDelta(true);
    setTimeout(() => setShowDelta(false), 800);

    setBidAmount(newValue.toLocaleString());
    setAnimTrigger(prev => prev + 1);
  }, [bidAmount, item]);

  const executeBid = useCallback((amount: number, e?: React.MouseEvent | React.TouchEvent | any) => {
    // IMPORTANT: Capture button position IMMEDIATELY before any state updates
    // React's synthetic event nullifies currentTarget after the handler phase
    let confettiX = 0.5;
    let confettiY = 0.5;

    if (e) {
      // Try currentTarget first (the element with the event listener)
      const targetElement = e.currentTarget instanceof HTMLElement 
        ? e.currentTarget 
        : (e.target instanceof HTMLElement ? e.target.closest('button') : null);
      
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        confettiX = (rect.left + rect.width / 2) / window.innerWidth;
        // Use BOTTOM of button so confetti bursts UPWARD
        confettiY = (rect.top + rect.height) / window.innerHeight;
      } 
      // Fallback: Use mouse/touch coordinates
      else if ('clientX' in e && e.clientX !== 0) {
        confettiX = e.clientX / window.innerWidth;
        confettiY = e.clientY / window.innerHeight;
      }
    }

    // Place bid logic via store
    placeBid(item.id, amount, item.isPublicBid ? 'public' : 'private');
    setIsSuccess(true);

    // Automatically increase the bid price in input box by 1 step for the "Next Bid"
    const nextAmount = amount + getSmartStep(amount);
    setBidAmount(nextAmount.toLocaleString());

    // Two bursts for a more "directional" feel from the button
    const commonConfig = {
      origin: { x: confettiX, y: confettiY },
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
      return;
    }

    // DUAL-TAP PATTERN: If already pending confirmation, execute on second tap
    if (pendingConfirmation) {
      // Clear any existing timeout
      if (confirmationTimeoutRef.current) {
        clearTimeout(confirmationTimeoutRef.current);
        confirmationTimeoutRef.current = null;
      }
      executeBid(amount, e);
      setPendingConfirmation(null);
      return;
    }

    // Safety Check 1: Previous Bid Check
    if (item.isPublicBid) {
      // For Public auctions, warn if they are already the high bidder
      if (item.currentHighBidderId === user.id) {
        setPendingConfirmation({
          type: 'double_bid',
          message: "Already winning - tap to raise"
        });
        // Auto-clear after 3 seconds
        confirmationTimeoutRef.current = setTimeout(() => {
          setPendingConfirmation(null);
        }, 3000);
        return;
      }
    } else {
      // For Secret/Sealed auctions, warn if they have bid at all
      const hasAlreadyBid = bids.some(b => b.itemId === item.id && b.bidderId === user.id);
      
      if (hasAlreadyBid) {
        setPendingConfirmation({
          type: 'double_bid',
          message: "Bid exists - tap to update"
        });
        confirmationTimeoutRef.current = setTimeout(() => {
          setPendingConfirmation(null);
        }, 3000);
        return;
      }
    }

    // Safety Check 2: High Bid (20% above reference)
    const safetyThreshold = referencePrice * 1.2;
    if (amount > safetyThreshold) {
      const percentOver = Math.round(((amount - referencePrice) / referencePrice) * 100);
      setPendingConfirmation({
        type: 'high_bid',
        message: `${percentOver}% over - tap to confirm`
      });
      confirmationTimeoutRef.current = setTimeout(() => {
        setPendingConfirmation(null);
      }, 3000);
      return;
    }

    // If no warnings, execute immediately
    executeBid(amount, e);
  }, [bidAmount, item, user, bids, executeBid, pendingConfirmation]);

  const clearPendingConfirmation = useCallback(() => {
    if (confirmationTimeoutRef.current) {
      clearTimeout(confirmationTimeoutRef.current);
      confirmationTimeoutRef.current = null;
    }
    setPendingConfirmation(null);
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
    handleBid: attemptBid,
    clearPendingConfirmation,
    pendingConfirmation,
    handleKeyDown,
    handleInputChange,
    getSmartStep,
    lastDelta,
    showDelta
  };
}
