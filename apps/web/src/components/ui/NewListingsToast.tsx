'use client';

/**
 * NewListingsToast - Floating notification for batched new listings
 * 
 * Shows when new listings are available during live polling.
 * User clicks "Load Now" to prepend them to the feed (prevents jarring scroll jumps).
 */

import { Button } from '@/components/ui/button';
import { Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NewListingsToastProps {
  count: number;
  onLoad: () => void;
  onDismiss: () => void;
}

export function NewListingsToast({ count, onLoad, onDismiss }: NewListingsToastProps) {
  if (count === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        id="new-listings-toast"
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className="fixed top-20 left-1/2 -translate-x-1/2 z-50"
      >
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-primary text-primary-foreground shadow-lg border border-primary/20">
          <Sparkles className="h-4 w-4 animate-pulse" />
          <span className="text-sm font-medium">
            {count} new listing{count !== 1 ? 's' : ''} available
          </span>
          <Button
            id="new-listings-load-btn"
            size="sm"
            variant="secondary"
            onClick={onLoad}
            className="h-7 px-3 text-xs font-semibold"
          >
            Load Now
          </Button>
          <button
            id="new-listings-dismiss-btn"
            onClick={onDismiss}
            className="ml-1 p-1 rounded-full hover:bg-primary-foreground/20 transition-colors"
            aria-label="Dismiss notification"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
