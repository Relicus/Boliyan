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
  const [pendingConfirmation, setPendingConfirmation] = useState<{ type: 'double_bid' | 'high_bid' | 'out_of_bids' | 'confirm_bid', message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { now, lastBidTimestamp } = useApp(); // Need global heartbeat and cooldown
  const confirmationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const deltaTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const cooldownRemaining = useMemo(() => {
    if (!lastBidTimestamp) return 0;
    const diff = Math.ceil((lastBidTimestamp + 15000 - now) / 1000);
    return Math.max(0, diff);
  }, [lastBidTimestamp, now]);

  const cooldownProgress = useMemo(() => {
    if (!lastBidTimestamp) return 0;
    const elapsed = now - lastBidTimestamp;
    const progress = Math.min(1, elapsed / 15000);
    return progress;
  }, [lastBidTimestamp, now]);

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

  // Calculate derived sticky status
  const derivedStatus = useMemo(() => {
    // 1. Quota Check (Indefinite)
    if (remainingAttempts === 0) {
      return { type: 'error', message: "Out of Bids" } as const;
    }
    
    // Parse current input
    const current = parseFloat(bidAmount.replace(/,/g, '')) || 0;
    const maxBid = getMaximumAllowedBid(item.askPrice);
    
    // 2. Max Limit Reached (Indefinite)
    // If input is at or above max, OR user's existing bid is already maxed out
    if (current >= maxBid || (userBid && userBid.amount >= maxBid)) {
       return { type: 'error', message: "Max Reached" } as const;
    }

    // 3. Bid Higher (Indefinite)
    // If we have a bid, and the input is less than or equal to it
    if (userBid && current <= userBid.amount) {
      return { type: 'error', message: "Bid Higher" } as const;
    }

    return null;
  }, [remainingAttempts, bidAmount, userBid, item.askPrice]);

  // Auto-Step Up Logic: If input matches current bid exactly, push it up.
  useEffect(() => {
    if (!userBid) return;
    
    const amount = parseFloat(bidAmount.replace(/,/g, ''));
    if (amount === userBid.amount) {
        const step = getSmartStep(amount);
        const maxBid = getMaximumAllowedBid(item.askPrice);
        
        if (amount + step <= maxBid) {
            setBidAmount((amount + step).toLocaleString());
            setAnimTrigger(prev => prev + 1);
        }
    }
    // Clear confirmation if we enter a blocking state
    if (derivedStatus && pendingConfirmation) {
        setPendingConfirmation(null);
    }
  }, [bidAmount, userBid, item.askPrice, derivedStatus, pendingConfirmation]);

  // Clear timeouts on unmount
  const setTemporaryError = useCallback((msg: string, duration: number = 2000) => {
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    
    setError(true);
    setErrorMessage(msg);
    sonic.thud();
    
    errorTimeoutRef.current = setTimeout(() => {
      setError(false);
      setErrorMessage(null);
    }, duration);
  }, []);

  // Clear timeouts on unmount
  useEffect(() => {
    return () => {
      if (confirmationTimeoutRef.current) clearTimeout(confirmationTimeoutRef.current);
      if (deltaTimeoutRef.current) clearTimeout(deltaTimeoutRef.current);
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    };
  }, []);

  // Sync logic removed: We no longer auto-update bid amount to match high bid. 
  // User is free to bid anywhere in range [70%, 150%].

  const handleSmartAdjust = useCallback((e: React.MouseEvent | React.TouchEvent, direction: 1 | -1) => {
    e.stopPropagation();
    
    // Allow adjustment even if "Out of Bids" so user can see what they *could* have bid
    // But block if already at absolute limits logic handles below

    const current = parseFloat(bidAmount.replace(/,/g, '')) || 0;
    const step = getSmartStep(current);
    const delta = step * direction;
    
    const minBid = getMinimumAllowedBid(item.askPrice);
    const maxBid = getMaximumAllowedBid(item.askPrice);

    // Check Floor
    if (current + delta < minBid) {
      setTemporaryError("Below Min", 1000);
      return;
    }

    // Check Ceiling
    if (current + delta > maxBid) {
       setTemporaryError("Max Reached", 1000);
       return;
    }
    
    // Allow update
    const newValue = Math.max(0, current + delta);
    sonic.tick();
    
    setLastDelta(delta);
    setShowDelta(true);
    
    if (deltaTimeoutRef.current) clearTimeout(deltaTimeoutRef.current);
    deltaTimeoutRef.current = setTimeout(() => setShowDelta(false), 800);

    setBidAmount(newValue.toLocaleString());
    setAnimTrigger(prev => prev + 1);
  }, [bidAmount, item.askPrice, isQuotaReached]);

  type BidEvent = React.MouseEvent | React.TouchEvent | React.KeyboardEvent;

  const executeBid = useCallback(async (amount: number, e?: BidEvent) => {
    if (isSubmitting || cooldownRemaining > 0) return;
    
    setIsSubmitting(true);
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

    try {
      // Place/Update bid logic via store
      const success = await placeBid(item.id, amount, item.isPublicBid ? 'public' : 'private');
      
      if (!success) {
          setTemporaryError("Bid Failed");
          return;
      }
      
      // Cooldown is now handled globally via MarketplaceContext.placeBid
      
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
    } finally {
      setIsSubmitting(false);
    }
  }, [item, placeBid, onBidSuccess, isSubmitting, cooldownRemaining]);

  const attemptBid = useCallback((e?: React.MouseEvent | React.TouchEvent) => {
    e?.stopPropagation();
    
    if (isSubmitting) return;
    
    // 0. Cooldown Check (Transient)
    if (cooldownRemaining > 0) {
        setTemporaryError(`Wait ${cooldownRemaining}s`, 2000);
        return;
    }

    // 1. Sticky Status Blocking (Immediate Derived Check)
    if (derivedStatus) {
        // Pulse the error but don't set a transient one
        sonic.thud();
        return; 
    }

    const amount = parseFloat(bidAmount.replace(/,/g, ''));
    
    // 2. Range Check (Transient Logic)
    const minBid = getMinimumAllowedBid(item.askPrice);
    const maxBid = getMaximumAllowedBid(item.askPrice);

    if (isNaN(amount) || amount < minBid || amount > maxBid) {
      setTemporaryError(amount < minBid ? "Below Min" : "Above Max", 2000);
      return;
    }

    // 3. Auth Check
    if (!user) {
      openAuthModal();
      return;
    }

    // 4. Duplicate/Lower Amount Check (Redundant due to derivedStatus but kept for safety)
    if (userBid && amount <= userBid.amount) {
        // Should be caught by derivedStatus, but just in case
        sonic.thud();
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

    // MANDATORY Confirmation for every bid
    setPendingConfirmation({
      type: 'confirm_bid',
      message: 'Confirm?'
    });
    
    confirmationTimeoutRef.current = setTimeout(() => {
      setPendingConfirmation(null);
    }, 3000);

  }, [bidAmount, item.askPrice, user, userBid, executeBid, pendingConfirmation, openAuthModal, isQuotaReached, isSubmitting, cooldownRemaining]);

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
    isSubmitting,
    cooldownRemaining,
    cooldownProgress,
    handleKeyDown,
    handleInputChange,
    getSmartStep,
    lastDelta,
    showDelta,
    remainingAttempts,
    isQuotaReached,
    userBid,
    initialBid,
    derivedStatus // Export new sticky status
  };
}
