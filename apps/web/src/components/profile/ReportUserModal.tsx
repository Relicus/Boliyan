"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { Flag, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReportUserModalProps {
  userId: string;
  userName: string;
  trigger?: React.ReactNode;
  className?: string;
}

const REPORT_REASONS = [
  "Fake contact information",
  "Scam or fraud attempt",
  "Spam or promotional content",
  "Abusive behavior",
  "Other",
];

export function ReportUserModal({ userId, userName, trigger, className }: ReportUserModalProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!reason) return;
    
    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      setSubmitting(false);
      return;
    }

    await supabase.from("reports").insert({
      reporter_id: user.id,
      reported_user_id: userId,
      reason,
      details: details || null,
    });

    setSuccess(true);
    setTimeout(() => {
      setOpen(false);
      setSuccess(false);
      setReason("");
      setDetails("");
    }, 1500);
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            id="report-user-btn"
            variant="ghost"
            size="sm"
            className={cn("text-slate-500 hover:text-red-600 hover:bg-red-50", className)}
          >
            <Flag className="h-4 w-4 mr-1" />
            Report
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        {success ? (
          <div className="py-8 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Flag className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Report Submitted</h3>
            <p className="text-slate-500 text-sm mt-1">Thank you for helping keep Boliyan safe.</p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Report {userName}
              </DialogTitle>
              <DialogDescription>
                Help us understand what happened. Your report will be reviewed by our team.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 py-4 px-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Reason</Label>
                <div className="flex flex-wrap gap-2">
                  {REPORT_REASONS.map((r) => (
                    <Button
                      key={r}
                      id={`reason-${r.toLowerCase().replace(/\s/g, "-")}`}
                      type="button"
                      variant={reason === r ? "default" : "outline"}
                      size="sm"
                      onClick={() => setReason(r)}
                    >
                      {r}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="report-details" className="text-sm font-semibold">
                  Additional Details (Optional)
                </Label>
                <Textarea
                  id="report-details"
                  placeholder="Provide any additional context that might help us investigate..."
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                id="submit-report-btn"
                onClick={handleSubmit}
                disabled={!reason || submitting}
                className="bg-red-600 hover:bg-red-700"
              >
                {submitting ? "Submitting..." : "Submit Report"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
