"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import confetti from "canvas-confetti";
import { useApp } from "@/lib/store";
import { Item, User, Bid } from "@/types";
import { getSmartStep, getMinimumAllowedBid, getMaximumAllowedBid, WARNING_PERCENTAGE, MAX_BID_ATTEMPTS } from "@/lib/bidding";
import { sonic } from "@/lib/sonic";

export function useBidding(item: Item, seller: User, onBidSuccess?: () => void) {
  const { placeBid, user, bids, openAuthModal } = useApp();

  // Get current user's active bid on this item - MOVED UP for initialization use
  const userBid = useMemo(() => {
    return user ? bids.find(b => b.itemId === item.id && b.bidderId === user.id) : null;
  }, [user, bids, item.id]);

  // Pending confirmation for dual-tap pattern
  const [pendingConfirmation, setPendingConfirmation] = useState<{ type: 'double_bid' | 'high_bid' | 'out_of_bids', message: string } | null>(null);
  const confirmationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize with Smart Anchor Logic:
  // 1. Existing Bid -> Bid + Step (Encourage update)
  // 2. Market Peak -> MAX(Ask, High)
  // 3. Ask Price (Default/Secret)
  const initialBid = useMemo(() => {
    // Priority 1: User's existing bid + Step (Aggressive Anchor)
    if (userBid) {
        const nextStep = getSmartStep(userBid.amount);
        const aggressiveAnchor = userBid.amount + nextStep;
        return Math.min(aggressiveAnchor, getMaximumAllowedBid(item.askPrice));
    }

    // Priority 2: Public Market Peak
    if (item.isPublicBid) {
        // Start at higher of Ask or High Bid to be competitive immediately
        const anchor = Math.max(item.askPrice, item.currentHighBid || 0);
        // Clamp to Max Allowed
        return Math.min(anchor, getMaximumAllowedBid(item.askPrice));
    }

    // Priority 3: Secret / Default -> Ask Price
    return item.askPrice;
  }, [item.askPrice, item.isPublicBid, item.currentHighBid, userBid]);

  const [bidAmount, setBidAmount] = useState<string>(initialBid.toLocaleString());
  const [error, setError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [animTrigger, setAnimTrigger] = useState(0);
  const [lastDelta, setLastDelta] = useState<number | null>(null);
  const [showDelta, setShowDelta] = useState<boolean>(false);

  // Calculate Remaining Attempts
  const remainingAttempts = useMemo(() => {
    if (!userBid) return MAX_BID_ATTEMPTS; // 3
    const updatesUsed = userBid.update_count || 0;
    // 1 initial + 2 updates = 3 total. 
    // If update_count is 0, they used 1 attempt (the insert). Remaining: 2.
    return Math.max(0, (MAX_BID_ATTEMPTS - 1) - updatesUsed);
  }, [userBid]);

  const isQuotaReached = remainingAttempts === 0;

  // Clear confirmation timeout on unmount
  useEffect(() => {
    return () => {
      if (confirmationTimeoutRef.current) {
        clearTimeout(confirmationTimeoutRef.current);
      }
    };
  }, []);

  // Sync logic removed: We no longer auto-update bid amount to match high bid. 
  // User is free to bid anywhere in range [70%, 150%].

  const handleSmartAdjust = useCallback((e: React.MouseEvent | React.TouchEvent, direction: 1 | -1) => {
    e.stopPropagation();
    if (isQuotaReached) {
        setError(true);
        setErrorMessage("Out of Bids");
        sonic.thud();
        return;
    }

    const current = parseFloat(bidAmount.replace(/,/g, '')) || 0;
    const step = getSmartStep(current);
    const delta = step * direction;
    
    const minBid = getMinimumAllowedBid(item.askPrice);
    const maxBid = getMaximumAllowedBid(item.askPrice);

    // Check Floor
    if (current + delta < minBid) {
      setError(true);
      setErrorMessage("Minimum Bid Reached");
      sonic.thud();
      setTimeout(() => { setError(false); setErrorMessage(null); }, 1000);
      return;
    }

    // Check Ceiling
    if (current + delta > maxBid) {
       setError(true);
       setErrorMessage("Maximum Limit Reached");
       sonic.thud(); // Haptic feedback for ceiling
       setTimeout(() => { setError(false); setErrorMessage(null); }, 1000);
       return;
    }
    
    // Allow update
    const newValue = Math.max(0, current + delta);
    sonic.tick();
    
    setLastDelta(delta);
    setShowDelta(true);
    setTimeout(() => setShowDelta(false), 800);

    setBidAmount(newValue.toLocaleString());
    setAnimTrigger(prev => prev + 1);
  }, [bidAmount, item.askPrice, isQuotaReached]);

  type BidEvent = React.MouseEvent | React.TouchEvent | React.KeyboardEvent;

  const executeBid = useCallback(async (amount: number, e?: BidEvent) => {
    let confettiX = 0.5;
    let confettiY = 0.5;

    if (e) {
      const targetElement = e.currentTarget instanceof HTMLElement 
        ? e.currentTarget 
        : (e.target instanceof HTMLElement ? e.target.closest('button') : null);
      
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        confettiX = (rect.left + rect.width / 2) / window.innerWidth;
        confettiY = (rect.top + rect.height) / window.innerHeight;
      } 
      else if ('clientX' in e && e.clientX !== 0) {
        confettiX = e.clientX / window.innerWidth;
        confettiY = e.clientY / window.innerHeight;
      }
    }

    // Place/Update bid logic via store
    // Await the result to ensure we don't show false success
    const success = await placeBid(item.id, amount, item.isPublicBid ? 'public' : 'private');
    
    if (!success) {
        setError(true);
        setErrorMessage("Bid Failed");
        sonic.thud();
        setTimeout(() => { setError(false); setErrorMessage(null); }, 2000);
        return;
    }
    
    setIsSuccess(true);
    sonic.chime();

    const nextAmount = amount + getSmartStep(amount);
    // Don't auto-increment if it exceeds max
    if (nextAmount <= getMaximumAllowedBid(item.askPrice)) {
        setBidAmount(nextAmount.toLocaleString());
    }

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
      confetti({ ...commonConfig, angle: 60 });
      confetti({ ...commonConfig, angle: 120 });
    } catch (err) {
      console.warn('[useBidding] Confetti failed:', err);
    }

    if (onBidSuccess) {
      setTimeout(() => {
        onBidSuccess();
        setIsSuccess(false);
      }, 1500);
    } else {
      setTimeout(() => setIsSuccess(false), 1500);
    }
  }, [item, placeBid, onBidSuccess]);

  const attemptBid = useCallback((e?: React.MouseEvent | React.TouchEvent) => {
    e?.stopPropagation();
    const amount = parseFloat(bidAmount.replace(/,/g, ''));
    
    // 1. Quota Check (Client Side)
    if (isQuotaReached) {
        setError(true);
        setErrorMessage("Out of Bids");
        sonic.thud();
        setTimeout(() => { setError(false); setErrorMessage(null); }, 2000);
        return;
    }

    // 2. Range Check
    const minBid = getMinimumAllowedBid(item.askPrice);
    const maxBid = getMaximumAllowedBid(item.askPrice);

    if (isNaN(amount) || amount < minBid || amount > maxBid) {
      setError(true);
      setErrorMessage(amount < minBid ? "Below Minimum" : "Above Maximum");
      sonic.thud();
      setTimeout(() => { setError(false); setErrorMessage(null); }, 2000);
      return;
    }

    // 3. Auth Check
    if (!user) {
      openAuthModal();
      return;
    }

    // 4. Duplicate Amount Check
    if (userBid && userBid.amount === amount) {
        setError(true);
        setErrorMessage("Already Bid This Amount");
        sonic.thud();
        setTimeout(() => { setError(false); setErrorMessage(null); }, 2000);
        return;
    }

    // 5. Dual-Tap Confirmation Logic
    if (pendingConfirmation) {
      if (confirmationTimeoutRef.current) {
        clearTimeout(confirmationTimeoutRef.current);
        confirmationTimeoutRef.current = null;
      }
      executeBid(amount, e);
      setPendingConfirmation(null);
      return;
    }

    // Safety Warning: High Bid (140% of ask price)
    // Using WARNING_PERCENTAGE (1.4)
    const safetyThreshold = item.askPrice * WARNING_PERCENTAGE;
    
    if (amount >= safetyThreshold) {
      const percentOver = Math.round(((amount - item.askPrice) / item.askPrice) * 100);
      setPendingConfirmation({
        type: 'high_bid',
        message: `High Bid (+${percentOver}%) - Tap to Confirm`
      });
      confirmationTimeoutRef.current = setTimeout(() => {
        setPendingConfirmation(null);
      }, 3000);
      return;
    }

    // If no warnings, execute immediately
    executeBid(amount, e);
  }, [bidAmount, item.askPrice, user, userBid, executeBid, pendingConfirmation, openAuthModal, isQuotaReached]);

  const clearPendingConfirmation = useCallback(() => {
    if (confirmationTimeoutRef.current) {
      clearTimeout(confirmationTimeoutRef.current);
      confirmationTimeoutRef.current = null;
    }
    setPendingConfirmation(null);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
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
    errorMessage,
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
    showDelta,
    remainingAttempts,
    isQuotaReached,
    userBid
  };
}
