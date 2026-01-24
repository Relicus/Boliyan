"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import confetti from "canvas-confetti";
import { useApp } from "@/lib/store";
import { Item, User } from "@/types";
import { getSmartStep, getMinimumAllowedBid, getMaximumAllowedBid, MAX_BID_ATTEMPTS, roundToReasonablePrice } from "@/lib/bidding";
import { sonic } from "@/lib/sonic";

// Cooldown between bids (must match server trigger)
const BID_COOLDOWN_MS = 3000;

export function useBidding(item: Item, seller: User, onBidSuccess?: () => void) {
  const { placeBid, user, bids, openAuthModal, lastBidTimestamp } = useApp();

  // Get current user's active bid on this item
  const userBid = useMemo(() => {
    return user ? bids.find(b => b.itemId === item.id && b.bidderId === user.id) : null;
  }, [user, bids, item.id]);

  // Pending confirmation for dual-tap pattern
  const [pendingConfirmation, setPendingConfirmation] = useState<{ type: 'double_bid' | 'high_bid' | 'out_of_bids' | 'confirm_bid', message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Local cooldown state to avoid global heartbeat re-renders
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  useEffect(() => {
    if (!lastBidTimestamp) {
      setCooldownRemaining(0);
      return;
    }

    const updateCooldown = () => {
      const now = Date.now();
      const diff = Math.ceil((lastBidTimestamp + BID_COOLDOWN_MS - now) / 1000);
      const remaining = Math.max(0, diff);
      setCooldownRemaining(remaining);
      return remaining;
    };

    const remaining = updateCooldown();
    if (remaining > 0) {
      const interval = setInterval(() => {
        const current = updateCooldown();
        if (current <= 0) clearInterval(interval);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [lastBidTimestamp]);

  const cooldownProgress = useMemo(() => {
    if (!lastBidTimestamp || cooldownRemaining === 0) return 0;
    const elapsed = Date.now() - lastBidTimestamp;
    return Math.min(1, elapsed / BID_COOLDOWN_MS);
  }, [lastBidTimestamp, cooldownRemaining]);

  const confirmationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const deltaTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize with Smart Anchor Logic
  const initialBid = useMemo(() => {
    if (userBid) {
        const nextStep = getSmartStep(userBid.amount);
        const aggressiveAnchor = userBid.amount + nextStep;
        return Math.min(aggressiveAnchor, getMaximumAllowedBid(item.askPrice));
    }

    if (item.isPublicBid) {
        const anchor = Math.max(item.askPrice, item.currentHighBid || 0);
        return Math.min(anchor, getMaximumAllowedBid(item.askPrice));
    }

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
    if (!userBid) return MAX_BID_ATTEMPTS;
    const updatesUsed = userBid.update_count || 0;
    return Math.max(0, (MAX_BID_ATTEMPTS - 1) - updatesUsed);
  }, [userBid]);

  const isQuotaReached = remainingAttempts === 0;

  // Calculate derived sticky status
  const derivedStatus = useMemo(() => {
    if (remainingAttempts === 0) {
      return { type: 'error', message: "Out of Bids" } as const;
    }
    
    const current = parseFloat(bidAmount.replace(/,/g, '')) || 0;
    const maxBid = getMaximumAllowedBid(item.askPrice);
    
    if (current >= maxBid || (userBid && userBid.amount >= maxBid)) {
       return { type: 'error', message: "Max Reached" } as const;
    }

    if (userBid && current <= userBid.amount) {
      return { type: 'error', message: "Bid Higher" } as const;
    }

    return null;
  }, [remainingAttempts, bidAmount, userBid, item.askPrice]);

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

  // Auto-Step Up Logic
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
    if (derivedStatus && pendingConfirmation) {
        setPendingConfirmation(null);
    }
  }, [bidAmount, userBid, item.askPrice, derivedStatus, pendingConfirmation]);

  useEffect(() => {
    return () => {
      if (confirmationTimeoutRef.current) clearTimeout(confirmationTimeoutRef.current);
      if (deltaTimeoutRef.current) clearTimeout(deltaTimeoutRef.current);
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    };
  }, []);

  const handleSmartAdjust = useCallback((e: React.MouseEvent | React.TouchEvent, direction: 1 | -1) => {
    e.stopPropagation();
    
    const current = parseFloat(bidAmount.replace(/,/g, '')) || 0;
    const step = getSmartStep(current);
    const delta = step * direction;
    
    const minBid = getMinimumAllowedBid(item.askPrice);
    const maxBid = getMaximumAllowedBid(item.askPrice);

    if (current + delta < minBid) {
      setTemporaryError("Below Min", 1000);
      return;
    }

    if (current + delta > maxBid) {
       setTemporaryError("Max Reached", 1000);
       return;
    }
    
    const newValue = Math.max(0, current + delta);
    sonic.tick();
    
    setLastDelta(delta);
    setShowDelta(true);
    
    if (deltaTimeoutRef.current) clearTimeout(deltaTimeoutRef.current);
    deltaTimeoutRef.current = setTimeout(() => setShowDelta(false), 800);

    setBidAmount(newValue.toLocaleString());
    setAnimTrigger(prev => prev + 1);
  }, [bidAmount, item.askPrice, setTemporaryError]);

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
      const success = await placeBid(item.id, amount, item.isPublicBid ? 'public' : 'private');
      if (!success) {
          setTemporaryError("Bid Failed");
          return;
      }
      
      setIsSuccess(true);
      sonic.chime();

      const nextAmount = amount + getSmartStep(amount);
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
  }, [item, placeBid, onBidSuccess, isSubmitting, cooldownRemaining, setTemporaryError]);

  const attemptBid = useCallback((e?: React.MouseEvent | React.TouchEvent) => {
    e?.stopPropagation();
    
    if (isSubmitting) return;
    if (cooldownRemaining > 0) {
        setTemporaryError(`Wait ${cooldownRemaining}s`, 2000);
        return;
    }

    if (derivedStatus) {
        sonic.thud();
        return; 
    }

    const rawAmount = parseFloat(bidAmount.replace(/,/g, ''));
    if (isNaN(rawAmount)) return;

    // Enforce reasonable rounding on attempt (handles edge case where blur hasn't fired)
    const amount = roundToReasonablePrice(rawAmount);
    
    // Sync UI if rounding adjusted the value
    if (amount !== rawAmount) {
        setBidAmount(amount.toLocaleString());
    }

    const minBid = getMinimumAllowedBid(item.askPrice);
    const maxBid = getMaximumAllowedBid(item.askPrice);

    if (amount < minBid || amount > maxBid) {
      setTemporaryError(amount < minBid ? "Below Min" : "Above Max", 2000);
      return;
    }

    if (!user) {
      openAuthModal();
      return;
    }

    if (userBid && amount <= userBid.amount) {
        sonic.thud();
        return;
    }

    if (pendingConfirmation) {
      if (confirmationTimeoutRef.current) {
        clearTimeout(confirmationTimeoutRef.current);
        confirmationTimeoutRef.current = null;
      }
      executeBid(amount, e);
      setPendingConfirmation(null);
      return;
    }

    setPendingConfirmation({
      type: 'confirm_bid',
      message: 'Confirm?'
    });
    
    confirmationTimeoutRef.current = setTimeout(() => {
      setPendingConfirmation(null);
    }, 3000);

  }, [bidAmount, item.askPrice, user, userBid, executeBid, pendingConfirmation, isSubmitting, cooldownRemaining, derivedStatus, setTemporaryError, openAuthModal]);

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

  const handleInputBlur = useCallback(() => {
    const amount = parseFloat(bidAmount.replace(/,/g, ''));
    if (!isNaN(amount) && amount > 0) {
      const rounded = roundToReasonablePrice(amount);
      if (rounded !== amount) {
        setBidAmount(rounded.toLocaleString());
      }
    }
  }, [bidAmount]);

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
    handleInputBlur,
    getSmartStep,
    lastDelta,
    showDelta,
    remainingAttempts,
    isQuotaReached,
    userBid,
    initialBid,
    derivedStatus
  };
}
