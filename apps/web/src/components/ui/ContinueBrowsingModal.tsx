'use client';

/**
 * ContinueBrowsingModal - Netflix-style "Are you still watching?" prompt
 * 
 * Appears after 5 minutes of user inactivity to prevent zombie tabs
 * from continuously polling the server.
 */

import { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Eye, Pause } from 'lucide-react';

interface ContinueBrowsingModalProps {
  open: boolean;
  onContinue: () => void;
  onPause: () => void;
}

export function ContinueBrowsingModal({
  open,
  onContinue,
  onPause,
}: ContinueBrowsingModalProps) {
  // Auto-dismiss if user becomes active (handled by hook, but also escape key)
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onContinue(); // Escape = continue watching
      }
    };

    if (open) {
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [open, onContinue]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onContinue()}>
      <DialogContent 
        id="continue-browsing-modal"
        className="sm:max-w-md"
        aria-describedby="continue-browsing-description"
      >
        <DialogHeader>
          <DialogTitle id="continue-browsing-title" className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            Still browsing?
          </DialogTitle>
          <DialogDescription id="continue-browsing-description">
            You&apos;ve been inactive for a while. Live feed updates are paused to save resources.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 text-sm text-muted-foreground">
          <p>
            Click <strong>&quot;Keep Live&quot;</strong> to continue receiving new listings in real-time,
            or <strong>&quot;Pause&quot;</strong> to stop updates until you refresh.
          </p>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button
            id="continue-browsing-pause-btn"
            variant="outline"
            onClick={onPause}
            className="flex items-center gap-2"
          >
            <Pause className="h-4 w-4" />
            Pause Updates
          </Button>
          <Button
            id="continue-browsing-continue-btn"
            onClick={onContinue}
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            Keep Live
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
