"use client";

import { useState, useEffect } from "react";

/**
 * Hook that detects user's motion preference (prefers-reduced-motion).
 * Returns true if user prefers reduced motion, false otherwise.
 * SSR-safe: defaults to false during hydration.
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return prefersReducedMotion;
}

/**
 * Returns true if the device is likely low-performance.
 * Checks for: < 4 cores, or deviceMemory < 4GB
 */
export function useLowPerformanceDevice(): boolean {
  return useState(() => {
    if (typeof navigator === 'undefined') {
      return false;
    }

    const cores = navigator.hardwareConcurrency || 4;
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory || 4;
    return cores < 4 || memory < 4;
  })[0];
}

/**
 * Combined hook: returns true if animations should be simplified.
 */
export function useShouldReduceAnimations(): boolean {
  const prefersReduced = useReducedMotion();
  const isLowPerf = useLowPerformanceDevice();
  
  return prefersReduced || isLowPerf;
}
