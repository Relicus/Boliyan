"use client";

import { useEffect } from "react";
import { sonic } from "@/lib/sonic";

// PERF: Check if sonic is enabled before registering click listeners
const SONIC_ENABLED = false; // Must match sonic.ts

export default function GlobalSonic() {
  useEffect(() => {
    // Skip entirely if sound is disabled - no point processing clicks
    if (!SONIC_ENABLED) return;

    const handleClick = (e: MouseEvent) => {
      // Find closest interactive element
      const target = e.target as HTMLElement;
      const interactive = target.closest('button, a, [role="button"], input[type="submit"], input[type="button"]');

      if (interactive) {
        // Play click sound
        // Note: sonic.ts handles initialization on first user interaction automatically
        sonic.click().catch(() => {});
      }
    };

    // Capture phase ensures we catch it before stopPropagation might happen in bubbling phase?
    // Actually, React events bubble. Native events bubble. 
    // If a button calls e.stopPropagation(), it stops bubbling up to document.
    // So we want to listen on the capture phase to ensure we ALWAYS hear it?
    // NO. The user explicitly said "matching the current used ones... now for any other button".
    // "Current used ones" (like Stepper) call stopPropagation to PREVENT bubbling.
    // If I use capture phase, I will hear the Stepper click TWICE (once from my global listener, once from its internal logic).
    // So I MUST use the BUBBLE phase (default), so that if a component calls stopPropagation, 
    // it effectively "opts out" of the global click sound because it handled it itself.
    
    window.addEventListener("click", handleClick);

    return () => {
      window.removeEventListener("click", handleClick);
    };
  }, []);

  return null;
}
