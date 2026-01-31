"use client";

import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Check, X, Package, Clock, CheckCircle, XCircle } from "lucide-react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import type { Database } from "@/types/database.types";

interface Listing {
  id: string;
  title: string;
  asked_price: number;
  category: string | null;
  condition: string | null;
  images: string[];
  created_at: string;
  moderation_status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  seller_id: string;
  seller: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

type TabFilter = "pending" | "approved" | "rejected";

const REJECTION_REASONS = [
  { id: "inappropriate_image", label: "Inappropriate Image" },
  { id: "misleading_content", label: "Misleading Title/Description" },
  { id: "spam_scam", label: "Spam / Scam" },
  { id: "prohibited_item", label: "Prohibited Item" },
  { id: "other", label: "Other" },
];

export default function AdminListingsPage() {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabFilter>("pending");
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0 });
  
  // Rejection modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from("listings")
      .select(`
        id, title, asked_price, category, condition, images, created_at,
        moderation_status, rejection_reason, seller_id,
        seller:profiles!seller_id(full_name, avatar_url)
      `)
      .eq("moderation_status", activeTab)
      .order("created_at", { ascending: activeTab === "pending" });

    if (!error && data) {
      setListings(data as unknown as Listing[]);
    }
    setLoading(false);
  }, [activeTab]);

  const fetchCounts = useCallback(async () => {
    const [pending, approved, rejected] = await Promise.all([
      supabase.from("listings").select("*", { count: "exact", head: true }).eq("moderation_status", "pending"),
      supabase.from("listings").select("*", { count: "exact", head: true }).eq("moderation_status", "approved"),
      supabase.from("listings").select("*", { count: "exact", head: true }).eq("moderation_status", "rejected"),
    ]);
    setCounts({
      pending: pending.count ?? 0,
      approved: approved.count ?? 0,
      rejected: rejected.count ?? 0,
    });
  }, []);

  useEffect(() => {
    void (async () => {
      await fetchListings();
      await fetchCounts();
    })();
  }, [fetchListings, fetchCounts]);

  const handleApprove = async (listingId: string) => {
    const updates: Database["public"]["Tables"]["listings"]["Update"] = {
      moderation_status: "approved",
      moderated_by: user?.id ?? null,
    };

    const { error } = await supabase
      .from("listings")
      .update(updates)
      .eq("id", listingId);

    if (!error) {
      setListings((prev) => prev.filter((l) => l.id !== listingId));
      fetchCounts();
    }
  };

  const openRejectModal = (listing: Listing, presetReason?: string) => {
    setSelectedListing(listing);
    setSelectedReason(presetReason || "");
    setCustomReason("");
    setRejectModalOpen(true);
  };

  const handleReject = async () => {
    if (!selectedListing || !selectedReason) return;
    setSubmitting(true);

    const reason = selectedReason === "other" 
      ? customReason 
      : REJECTION_REASONS.find(r => r.id === selectedReason)?.label || selectedReason;

    const updates: Database["public"]["Tables"]["listings"]["Update"] = {
      moderation_status: "rejected",
      rejection_reason: reason,
      rejected_at: new Date().toISOString(),
      moderated_by: user?.id ?? null,
    };

    const { error } = await supabase
      .from("listings")
      .update(updates)
      .eq("id", selectedListing.id);

    if (!error) {
      setListings((prev) => prev.filter((l) => l.id !== selectedListing.id));
      fetchCounts();
      setRejectModalOpen(false);
    }
    setSubmitting(false);
  };

  const tabs: { id: TabFilter; label: string; icon: React.ElementType }[] = [
    { id: "pending", label: "Pending", icon: Clock },
    { id: "approved", label: "Approved", icon: CheckCircle },
    { id: "rejected", label: "Rejected", icon: XCircle },
  ];

  return (
    <div id="admin-listings" className="space-y-6">
      <h2 className="text-2xl font-black text-slate-900">Listing Moderation</h2>

      {/* Tabs */}
      <div id="admin-listings-tabs" className="flex gap-2 border-b border-slate-200 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            id={`admin-listings-tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-semibold text-sm transition-all ${
              activeTab === tab.id
                ? "bg-amber-100 text-amber-800 border-b-2 border-amber-600"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
            <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
              activeTab === tab.id ? "bg-amber-200" : "bg-slate-200"
            }`}>
              {counts[tab.id]}
            </span>
          </button>
        ))}
      </div>

      {/* Listings Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="aspect-video bg-slate-200 rounded-lg mb-3" />
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-slate-200 rounded w-1/2" />
            </Card>
          ))}
        </div>
      ) : listings.length === 0 ? (
        <Card className="p-8 text-center">
          <Package className="h-12 w-12 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">No {activeTab} listings</p>
        </Card>
      ) : (
        <div id="admin-listings-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              activeTab={activeTab}
              onApprove={handleApprove}
              onReject={openRejectModal}
            />
          ))}
        </div>
      )}

      {/* Rejection Modal */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent id="reject-listing-modal" className="p-0 gap-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>Reject Listing</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-slate-600 px-6">
              Select a reason for rejecting &quot;{selectedListing?.title}&quot;
            </p>
            <RadioGroup value={selectedReason} onValueChange={setSelectedReason} className="gap-0">
              {REJECTION_REASONS.map((reason) => (
                <div 
                  key={reason.id} 
                  className={`flex items-center space-x-2 px-6 py-3 transition-colors cursor-pointer ${
                    selectedReason === reason.id ? 'bg-blue-50' : 'hover:bg-slate-50'
                  }`}
                  onClick={() => setSelectedReason(reason.id)}
                >
                  <RadioGroupItem value={reason.id} id={`reason-${reason.id}`} className="mt-0.5" />
                  <Label htmlFor={`reason-${reason.id}`} className="flex-1 cursor-pointer font-normal text-slate-700">
                    {reason.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            {selectedReason === "other" && (
              <div className="px-6 pb-2">
                <Textarea
                  id="custom-rejection-reason"
                  placeholder="Describe the issue..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="resize-none"
                />
              </div>
            )}
          </div>
          <DialogFooter className="p-6 pt-2 bg-slate-50 border-t border-slate-100">
            <Button variant="outline" onClick={() => setRejectModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={!selectedReason || (selectedReason === "other" && !customReason) || submitting}
            >
              {submitting ? "Rejecting..." : "Reject Listing"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Listing Card Component
function ListingCard({ 
  listing, 
  activeTab,
  onApprove, 
  onReject 
}: { 
  listing: Listing; 
  activeTab: TabFilter;
  onApprove: (id: string) => void; 
  onReject: (listing: Listing, presetReason?: string) => void;
}) {
  // Transform images to URLs
  const storageUrl = process.env.NEXT_PUBLIC_R2_DOMAIN || '';
  const images = (listing.images || []).map(img => {
    if (img.startsWith('http')) return img;
    if (!storageUrl) return img;
    return `${storageUrl}/${img}`;
  });

  return (
    <Card id={`listing-card-${listing.id}`} className="overflow-hidden border-slate-200">
      {/* Image Carousel */}
      <div className="relative bg-slate-100 p-2">
        {images.length > 0 ? (
          <div className="grid grid-cols-4 gap-2">
            {images.slice(0, 4).map((imgUrl, i) => (
              <div key={i} className="relative aspect-square rounded-md overflow-hidden bg-white border border-slate-200 group">
                <Image
                  src={imgUrl}
                  alt={`${listing.title} - ${i + 1}`}
                  fill
                  className="object-cover"
                />
                <button
                   onClick={() => onReject(listing, "inappropriate_image")}
                   className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
                   title="Reject as Inappropriate Image"
                >
                   <span className="bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded font-bold shadow-sm">
                     Reject Img
                   </span>
                </button>
              </div>
            ))}
            {images.length > 4 && (
               <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                 +{images.length - 4}
               </div>
            )}
          </div>
        ) : (
          <div className="aspect-video flex items-center justify-center">
            <Package className="h-8 w-8 text-slate-300" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-bold text-slate-900 line-clamp-1">{listing.title}</h3>
          <p className="text-sm text-slate-500">
            Rs. {listing.asked_price?.toLocaleString()} • {listing.category || "Uncategorized"}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>By {listing.seller?.full_name || "Unknown"}</span>
          <span>•</span>
          <span>{new Date(listing.created_at).toLocaleDateString()}</span>
        </div>

        {/* Rejection reason if rejected */}
        {activeTab === "rejected" && listing.rejection_reason && (
          <div className="p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
            <strong>Reason:</strong> {listing.rejection_reason}
          </div>
        )}

        {/* Actions */}
        {activeTab === "pending" && (
          <div className="flex gap-2 pt-2">
            <Button
              id={`approve-${listing.id}`}
              size="sm"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              onClick={() => onApprove(listing.id)}
            >
              <Check className="h-4 w-4 mr-1" />
              Approve
            </Button>
            <Button
              id={`reject-${listing.id}`}
              size="sm"
              variant="destructive"
              className="flex-1"
              onClick={() => onReject(listing)}
            >
              <X className="h-4 w-4 mr-1" />
              Reject
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
