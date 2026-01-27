"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import confetti from "canvas-confetti";
import { useApp } from "@/lib/store";
import { Item, User } from "@/types";
import { useRouter } from "next/navigation";
import { getSmartStep, getMinimumAllowedBid, getMaximumAllowedBid, MAX_BID_ATTEMPTS, roundToReasonablePrice } from "@/lib/bidding";
import { formatPrice } from "@/lib/utils";
import { sonic } from "@/lib/sonic";

// Cooldown between bids (must match server trigger)
const BID_COOLDOWN_MS = 3000;

export function useBidding(item: Item, seller: User, onBidSuccess?: () => void) {
  const { placeBid, user, bids, openAuthModal, lastBidTimestamp } = useApp();
  const router = useRouter();

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
  const minBid = useMemo(() => getMinimumAllowedBid(item.askPrice), [item.askPrice]);
  const maxBid = useMemo(() => getMaximumAllowedBid(item.askPrice), [item.askPrice]);

  const formatBoundMessage = useCallback((bound: 'min' | 'max') => {
    const value = bound === 'min' ? minBid : maxBid;
    return `${bound === 'min' ? 'Min' : 'Max'} Rs. ${formatPrice(value)}`;
  }, [minBid, maxBid]);

  const clampBid = useCallback((amount: number) => {
    const rounded = roundToReasonablePrice(amount);
    return Math.min(maxBid, Math.max(minBid, rounded));
  }, [minBid, maxBid]);

  const initialBid = useMemo(() => {
    // All programmatic anchors should be auto-rounded to nearest 10s
    // This prevents validation errors on first load when askPrice isn't a multiple of 10
    if (userBid) {
        const nextStep = getSmartStep(userBid.amount);
        const aggressiveAnchor = userBid.amount + nextStep;
        return roundToReasonablePrice(Math.min(aggressiveAnchor, maxBid));
    }

    if (item.isPublicBid) {
        const anchor = Math.max(item.askPrice, item.currentHighBid || 0);
        return roundToReasonablePrice(Math.min(anchor, maxBid));
    }

    return roundToReasonablePrice(item.askPrice);
  }, [item.askPrice, item.isPublicBid, item.currentHighBid, userBid, maxBid]);

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
    
    const raw = bidAmount.replace(/[^0-9.]/g, '');
    const current = parseFloat(raw) || 0;
    
    // Check bounds
    if (current > maxBid) {
       return { type: 'error', message: "Above Max" } as const;
    }

    if (current < minBid && raw !== '') {
       return { type: 'error', message: "Below Min" } as const;
    }

    if (userBid && current <= userBid.amount && raw !== '') {
      return { type: 'error', message: "Bid Higher" } as const;
    }

    // Check rounding (10 Rs rule) - only show error if they've typed enough to be a real number
    if (current > 0 && current % 10 !== 0 && !bidAmount.endsWith('.')) {
      return { type: 'error', message: "Use 10s (e.g. 50, 60)" } as const;
    }

    return null;
  }, [remainingAttempts, bidAmount, userBid, maxBid, minBid]);

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

  // Auto-Step Up Logic (Only when userBid changes, not while typing)
  const lastUserBidAmountRef = useRef<number | null>(userBid?.amount || null);
  useEffect(() => {
    if (userBid && userBid.amount !== lastUserBidAmountRef.current) {
        lastUserBidAmountRef.current = userBid.amount;
        const step = getSmartStep(userBid.amount);
        const nextAmount = Math.min(userBid.amount + step, maxBid);
        // We use toLocaleString here as this is a programmatic update, not user typing
        setBidAmount(nextAmount.toLocaleString());
        setAnimTrigger(prev => prev + 1);
    }
  }, [userBid, maxBid]);

  useEffect(() => {
    return () => {
      if (confirmationTimeoutRef.current) clearTimeout(confirmationTimeoutRef.current);
      if (deltaTimeoutRef.current) clearTimeout(deltaTimeoutRef.current);
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    };
  }, []);

  const handleSmartAdjust = useCallback((e: React.MouseEvent | React.TouchEvent, direction: 1 | -1) => {
    e.stopPropagation();
    
    const raw = bidAmount.replace(/[^0-9.]/g, '');
    const current = parseFloat(raw) || 0;
    
    // Programmatic adjustment logic (+/- buttons)
    // 1. If we are currently below the floor (typed manually), jump straight to the floor
    if (current < minBid && direction === 1) {
       setBidAmount(minBid.toLocaleString());
       setAnimTrigger(prev => prev + 1);
       sonic.tick();
       return;
    }

    // 2. Do not allow minus button to go below floor
    if (current <= minBid && direction === -1) {
       sonic.thud();
       setTemporaryError(formatBoundMessage('min'), 1000);
       return;
    }

    const step = getSmartStep(current);
    const delta = step * direction;
    const target = current + delta;
    
    // 3. Apply strict bounds to programmatic stepping
    const clamped = Math.min(maxBid, Math.max(minBid, target));
    const rounded = roundToReasonablePrice(clamped);
    
    if (rounded !== current) {
      setBidAmount(rounded.toLocaleString());
      setAnimTrigger(prev => prev + 1);
      
      if (target < minBid) setTemporaryError(formatBoundMessage('min'), 1200);
      else if (target > maxBid) setTemporaryError(formatBoundMessage('max'), 1200);
      else {
        sonic.tick();
        setLastDelta(delta);
        setShowDelta(true);
        if (deltaTimeoutRef.current) clearTimeout(deltaTimeoutRef.current);
        deltaTimeoutRef.current = setTimeout(() => setShowDelta(false), 800);
      }
    } else {
       sonic.thud();
    }
  }, [bidAmount, formatBoundMessage, maxBid, minBid, setTemporaryError]);

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

      // Setup next suggested bid
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

    const raw = bidAmount.replace(/[^0-9.]/g, '');
    const rawAmount = parseFloat(raw);
    if (isNaN(rawAmount)) return;

    // Smart Finalization on Bid Attempt
    const amount = clampBid(rawAmount);
    
    // If the amount was invalid and we had to clamp it, 
    // update the UI and show an error instead of placing the bid immediately.
    // This prevents accidental bids of "7,000" when the user typed "1".
    if (amount !== rawAmount || rawAmount % 10 !== 0) {
        setBidAmount(amount.toLocaleString());
        if (rawAmount < minBid) setTemporaryError(formatBoundMessage('min'));
        else if (rawAmount > maxBid) setTemporaryError(formatBoundMessage('max'));
        else if (rawAmount % 10 !== 0) setTemporaryError("Rounded to nearest 10");
        return;
    }

    if (!user) {
      openAuthModal();
      return;
    }

    if (!user.emailVerified || !user.profileComplete) {
        router.push(`/complete-profile?redirect=${encodeURIComponent(window.location.pathname)}`);
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

  }, [bidAmount, clampBid, formatBoundMessage, maxBid, minBid, user, userBid, executeBid, pendingConfirmation, isSubmitting, cooldownRemaining, setTemporaryError, openAuthModal]);

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
    // Completely dumb input - let the user type whatever they want.
    // We will sanitize and format it only on Blur or Action (Enter/Bid).
    setBidAmount(e.target.value);
    setError(false);
  }, []);

  const handleInputBlur = useCallback(() => {
    const raw = bidAmount.replace(/[^0-9.]/g, '');
    const amount = parseFloat(raw);
    
    if (!isNaN(amount) && amount > 0) {
      const clamped = clampBid(amount);
      // Format with commas and clamp only on blur
      setBidAmount(clamped.toLocaleString());
      
      if (clamped !== amount) {
        if (clamped === minBid) setTemporaryError(formatBoundMessage('min'), 1200);
        else if (clamped === maxBid) setTemporaryError(formatBoundMessage('max'), 1200);
      }
    } else {
      // Revert to initial bid if empty or invalid
      setBidAmount(initialBid.toLocaleString());
    }
  }, [bidAmount, clampBid, initialBid, minBid, maxBid, formatBoundMessage, setTemporaryError]);

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
    derivedStatus,
    minBid,
    maxBid
  };
}
