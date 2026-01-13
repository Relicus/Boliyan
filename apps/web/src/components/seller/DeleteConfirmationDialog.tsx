"use client";

import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, X } from "lucide-react";
import { motion } from "framer-motion";

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemTitle: string;
}

export default function DeleteConfirmationDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  itemTitle 
}: DeleteConfirmationDialogProps) {
  const [confirmationText, setConfirmationText] = useState("");
  const isConfirmed = confirmationText === "DELETE";

  // Reset text when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      setConfirmationText("");
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent showCloseButton={false} className="sm:max-w-[425px] border-none shadow-2xl overflow-visible">
        {/* Custom Close Button - Premium Style */}
        <DialogClose asChild>
          <motion.button
            className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 z-[60] p-2 bg-white rounded-full shadow-xl text-slate-400 hover:text-red-500 border border-slate-100 group"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </motion.button>
        </DialogClose>

        <DialogHeader>
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="text-red-600 h-6 w-6" />
          </div>
          <DialogTitle className="text-center text-xl font-bold text-slate-900">Delete Listing?</DialogTitle>
          <DialogDescription className="text-center pt-2">
            Are you sure you want to delete <span className="font-bold text-slate-900">"{itemTitle}"</span>? 
            This action is permanent and all associated bids will be lost.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6 space-y-4">
          <p className="text-sm text-center text-slate-500">
            To confirm, please type <span className="font-mono font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">DELETE</span> in the box below:
          </p>
          <Input
            id="delete-confirmation-input"
            value={confirmationText}
            onChange={(e) => setConfirmationText(e.target.value)}
            placeholder="TYPE DELETE"
            className={`text-center font-bold tracking-widest uppercase h-12 border-2 transition-all ${
              confirmationText === "" 
                ? "border-slate-200" 
                : isConfirmed 
                  ? "border-green-500 bg-green-50/30 text-green-700" 
                  : "border-red-200 bg-red-50/30 text-red-600"
            }`}
            autoFocus
          />
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="w-full sm:flex-1 h-11 border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={onConfirm}
            disabled={!isConfirmed}
            className={`w-full sm:flex-1 h-11 font-bold shadow-lg transition-all ${
              isConfirmed 
                ? "bg-red-600 hover:bg-red-700 opacity-100" 
                : "bg-slate-200 text-slate-400 hover:bg-slate-200 cursor-not-allowed opacity-50"
            }`}
          >
            Delete Listing
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
