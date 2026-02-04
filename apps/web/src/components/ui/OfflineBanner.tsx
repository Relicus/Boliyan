"use client";

import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, RefreshCw } from "lucide-react";
import { useNetworkState } from "@/hooks/useNetworkState";

interface OfflineBannerProps {
  /** Custom message to display */
  message?: string;
  /** Whether to show a retry button */
  showRetry?: boolean;
  /** Retry callback */
  onRetry?: () => void;
}

/**
 * OfflineBanner - Floating notification when device goes offline
 * 
 * Features:
 * - Smooth entrance/exit animation
 * - Optional retry button
 * - Uses native bridge network detection when in mobile app
 */
export function OfflineBanner({
  message = "You're offline. Some features may be unavailable.",
  showRetry = true,
  onRetry,
}: OfflineBannerProps) {
  const { isOnline, isInitialized } = useNetworkState();
  
  // Don't render anything until we know the network state
  // and only show when offline
  const shouldShow = isInitialized && !isOnline;

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      // Default: reload the page
      window.location.reload();
    }
  };

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          id="offline-banner"
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 400, 
            damping: 30 
          }}
          className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-center px-4 py-3 bg-amber-500 text-white shadow-lg"
          role="alert"
          aria-live="polite"
        >
          <div className="flex items-center gap-3 max-w-lg">
            <WifiOff className="h-5 w-5 shrink-0" aria-hidden="true" />
            
            <span className="text-sm font-medium">{message}</span>
            
            {showRetry && (
              <button
                id="offline-banner-retry-btn"
                onClick={handleRetry}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-md text-sm font-semibold transition-colors"
                aria-label="Retry connection"
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Retry
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
