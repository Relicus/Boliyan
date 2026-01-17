"use client";

import React, { useState } from 'react';
import { useReviews } from '@/context/ReviewContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import StarRating from './StarRating';
import { toast } from 'sonner';

interface ReviewFormProps {
  isOpen: boolean;
  onClose: () => void;
  reviewedId: string;
  listingId: string;
  conversationId?: string;
  role: 'buyer' | 'seller'; // Role of the person LEAVING the review
  reviewedName: string; // Name of person being reviewed, for UI
}

export default function ReviewForm({
  isOpen,
  onClose,
  reviewedId,
  listingId,
  conversationId,
  role,
  reviewedName,
}: ReviewFormProps) {
  const { submitReview } = useReviews();
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please select a star rating");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitReview({
        reviewedId,
        listingId,
        conversationId,
        rating,
        content,
        role,
      });

      if (result.success) {
        toast.success("Review submitted successfully");
        onClose();
      } else {
        toast.error(result.error || "Failed to submit review");
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-md" id="review-form-modal">
        <DialogHeader>
          <DialogTitle>Rate your experience with {reviewedName}</DialogTitle>
          <DialogDescription>
            How was your transaction? This feedback helps build trust in the community.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-6 py-4">
          <div className="flex flex-col items-center gap-2">
            <Label className="text-sm font-medium text-muted-foreground">Rating</Label>
            <StarRating 
              rating={rating} 
              onRatingChange={setRating} 
              size={32} 
              className="gap-2"
            />
            <span className="text-xs text-muted-foreground h-4">
                {rating === 1 && "Poor"}
                {rating === 2 && "Fair"}
                {rating === 3 && "Good"}
                {rating === 4 && "Very Good"}
                {rating === 5 && "Excellent"}
            </span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="review-content">Comments (Optional)</Label>
            <Textarea
              id="review-content"
              placeholder="Describe your experience..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="resize-none h-24"
            />
          </div>
        </div>

        <DialogFooter className="sm:justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting || rating === 0} id="submit-review-btn">
            {isSubmitting ? "Submitting..." : "Submit Review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
