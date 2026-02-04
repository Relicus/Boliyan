"use client";

import { useState, useEffect } from "react";

/**
 * Hook that detects user's motion preference (prefers-reduced-motion).
 * Returns true if user prefers reduced motion, false otherwise.
 * SSR-safe: defaults to false during hydration.
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPrefersReducedMotion(mediaQuery.matches);

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
  const [isLowPerf, setIsLowPerf] = useState(false);

  useEffect(() => {
    const cores = navigator.hardwareConcurrency || 4;
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory || 4;
    setIsLowPerf(cores < 4 || memory < 4);
  }, []);

  return isLowPerf;
}

/**
 * Combined hook: returns true if animations should be simplified.
 */
export function useShouldReduceAnimations(): boolean {
  const prefersReduced = useReducedMotion();
  const isLowPerf = useLowPerformanceDevice();
  
  return prefersReduced || isLowPerf;
}
