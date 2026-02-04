"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Gavel, EyeOff, Camera, Image as ImageIcon, X, Save, Check, Loader2, ArrowLeft, ArrowRight, Star, Calendar, DollarSign, CreditCard, Clock, Calculator, Plus, Minus, Tag, Shapes, BadgeCheck, AlignLeft, Phone, RotateCcw } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { CATEGORIES, LISTING_IMAGE_ACCEPT, LISTING_LIMITS, isAllowedListingImageInput } from "@/lib/constants";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import confetti from "canvas-confetti";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { uploadListingImage } from "@/lib/uploadImage";
import { isNativeImagePickerAvailable, pickNativeImages } from "@/lib/nativeImages";
import { supabase } from "@/lib/supabase";
import { generateSlug, formatPrice, formatCountdown } from "@/lib/utils";
import { toast } from "sonner";
import { sonic } from "@/lib/sonic";
import { transformListingToItem, ListingWithSeller } from "@/lib/transform";
import { Item } from "@/types";
import { roundToReasonablePrice } from "@/lib/bidding";
import { calculateDepreciation, formatPriceEstimate, getPurchaseYearOptions, getPurchaseMonthOptions, DepreciationResult } from "@/lib/depreciation";
import { processListingImage } from "@/lib/processListingImage";
import { MapPicker } from "@/components/common/MapPicker";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTime } from "@/context/TimeContext";
import { MapPin } from "lucide-react";
import type { Database } from "@/types/database.types";

const EDIT_WARNING_TITLE = "Editing resets bids";
const EDIT_WARNING_DESCRIPTION = "Saving changes will delete all bids and relaunch this listing in 1 hour.";
const EDIT_WARNING_CONFIRM = "Save & Reset Bids";
const EDIT_WARNING_CANCEL = "Keep Editing";
const GO_LIVE_NOTE = "Goes live in 1 hour after saving.";
const EDIT_COOLDOWN_TOAST = "You can edit this listing again in";
const MAX_IMAGES = 5;
const DRAFT_KEY = "boliyan_listing_draft";
const NATIVE_IMAGE_PICK_FAILED = "Unable to open photo library.";
const NATIVE_IMAGE_PICK_OPTIONS = {
  allowsMultiple: true,
  quality: 0.9,
  source: "library"
} as const;

function ListForm() {
  const draftToastShownRef = React.useRef(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");
  const { items, user, myLocation, isLoading: isAuthLoading } = useApp();
  const { now } = useTime();
  
  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.replace('/signin?redirect=/list');
      return;
    }
    
    if (user && (!user.emailVerified || !user.profileComplete)) {
      router.push(`/complete-profile?redirect=${encodeURIComponent(window.location.pathname)}`);
    }
  }, [user, isAuthLoading, router]);
  
  const [fetchedItem, setFetchedItem] = useState<Item | null>(null);
  const [isLoadingItem, setIsLoadingItem] = useState(!!editId);
  
  const editingItem = (editId ? items.find(i => i.id === editId) : null) || fetchedItem;

  const lastEditedAtMs = editingItem?.lastEditedAt ? new Date(editingItem.lastEditedAt).getTime() : null;
  const editCooldownUntil = lastEditedAtMs ? lastEditedAtMs + 60 * 60 * 1000 : null;
  const isEditCooldown = editCooldownUntil !== null && now < editCooldownUntil;
  const editCooldownLabel = isEditCooldown && editCooldownUntil ? formatCountdown(editCooldownUntil, now) : null;

  // Fetch Item details if not in global state
  useEffect(() => {
    if (!editId || (editId && items.find(i => i.id === editId))) {
      setIsLoadingItem(false);
      return;
    }

    const fetchItem = async () => {
      setIsLoadingItem(true);
      try {
        const { data, error } = await supabase
          .from('marketplace_listings')
          .select('*')
          .eq('id', editId)
          .single();

        if (error) throw error;
        if (data) {
          setFetchedItem(transformListingToItem(data as unknown as ListingWithSeller));
        }
      } catch (err) {
        console.error("Error fetching item for edit:", err);
        toast.error("Failed to load item details");
      } finally {
        setIsLoadingItem(false);
      }
    };

    fetchItem();
  }, [editId, items]);
  
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>("");
  const [askPrice, setAskPrice] = useState<string>("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [duration, setDuration] = useState<"24" | "168" | "720">("720");
  const [condition, setCondition] = useState<'new' | 'like_new' | 'used' | 'fair'>("used");
  const [purchasePrice, setPurchasePrice] = useState<string>("");
  const [purchaseYear, setPurchaseYear] = useState<string>("");
  const [purchaseMonth, setPurchaseMonth] = useState<string>("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactWhatsapp, setContactWhatsapp] = useState("");
  const [isWhatsappSameAsPhone, setIsWhatsappSameAsPhone] = useState(true);
  const [showPriceEstimator, setShowPriceEstimator] = useState(false);
  const [location, setLocation] = useState<{lat: number, lng: number, address: string, city?: string} | null>(null);
  const [isMapGeocoding, setIsMapGeocoding] = useState(false);
  const [isDraftRestored, setIsDraftRestored] = useState(false);

  // Sync WhatsApp with Phone if enabled
  useEffect(() => {
    if (isWhatsappSameAsPhone) {
      setContactWhatsapp(contactPhone);
    }
  }, [contactPhone, isWhatsappSameAsPhone]);

  // Restore Draft from LocalStorage
  useEffect(() => {
    if (editingItem || isAuthLoading || !user) return;
    // Guard: only show toast once using ref
    if (draftToastShownRef.current) return;

    const savedDraft = localStorage.getItem(DRAFT_KEY);
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        if (draft.title) setTitle(draft.title);
        if (draft.category) setCategory(draft.category);
        if (draft.askPrice) setAskPrice(draft.askPrice);
        if (draft.description) setDescription(draft.description);
        if (draft.contactPhone) setContactPhone(draft.contactPhone);
        if (draft.contactWhatsapp) {
            setContactWhatsapp(draft.contactWhatsapp);
            setIsWhatsappSameAsPhone(draft.contactWhatsapp === draft.contactPhone);
        }
        if (draft.location) setLocation(draft.location);
        if (draft.condition) setCondition(draft.condition);
        if (draft.isPublic !== undefined) setIsPublic(draft.isPublic);
        if (draft.duration) setDuration(draft.duration);
        
        setIsDraftRestored(true);
        draftToastShownRef.current = true;
        // Toast once
        toast.success("Draft restored", {
          description: "All text fields recovered. Please re-upload images."
        });
      } catch (err) {
        console.error("Failed to restore draft", err);
      }
    }
  }, [editingItem, isAuthLoading, user]);
  
  // Default to global myLocation for new listings if no location is set (e.g. from draft)
  useEffect(() => {
    if (editingItem || isAuthLoading) return;
    
    if (myLocation && !location) {
      setLocation(myLocation);
    }
  }, [editingItem, isAuthLoading, myLocation, location]);

  // Save Draft to LocalStorage
  useEffect(() => {
    if (editingItem || !user) return;

    const draft = {
      title,
      category,
      askPrice,
      description,
      contactPhone,
      contactWhatsapp,
      location,
      condition,
      isPublic,
      duration
    };
    
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [title, category, askPrice, description, contactPhone, contactWhatsapp, location, condition, isPublic, duration, editingItem, user]);
  
  // Computed price estimate
  const priceEstimate: DepreciationResult | null = React.useMemo(() => {
    const price = parseFloat(purchasePrice);
    const year = parseInt(purchaseYear);
    if (!category || !price || !year || isNaN(price) || isNaN(year)) return null;
    const month = parseInt(purchaseMonth);
    return calculateDepreciation({
      purchasePrice: price,
      purchaseYear: year,
      purchaseMonth: isNaN(month) ? undefined : month,
      category,
      condition,
    });
  }, [purchasePrice, purchaseYear, purchaseMonth, category, condition]);
  
  type ImageEntry = {
    id: string;
    url: string;
    file?: File;
    isNew: boolean;
  };

  const [imageEntries, setImageEntries] = useState<ImageEntry[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const [showEditWarning, setShowEditWarning] = useState(false);
  const [showImageSourceDialog, setShowImageSourceDialog] = useState(false);

  const [errors, setErrors] = useState<{
    title?: boolean;
    category?: boolean;
    askPrice?: boolean;
    description?: boolean;
    contactPhone?: boolean;
    images?: boolean;
    location?: boolean;
    purchasePrice?: boolean;
    purchaseYear?: boolean;
  }>({});

  useEffect(() => {
    if (editingItem) {
      setTitle(editingItem.title);
      setCategory(editingItem.category);
      setAskPrice(editingItem.askPrice.toString());
      setDescription(editingItem.description || "");
      setIsPublic(editingItem.isPublicBid);
      if (editingItem.location) {
        setLocation(editingItem.location);
      }
      setImageEntries(
        editingItem.images.map((url: string, index: number) => ({
          id: `existing-${index}`,
          url,
          isNew: false
        }))
      );
      setDuration(editingItem.listingDuration.toString() as "24" | "168" | "720");
      setCondition(editingItem.condition || "used");
      setContactPhone(editingItem.contactPhone || user?.phone || "");
      setContactWhatsapp(editingItem.contactWhatsapp || user?.whatsapp || editingItem.contactPhone || user?.phone || "");
      setIsWhatsappSameAsPhone(editingItem.contactWhatsapp === editingItem.contactPhone);
      return;
    }

    // New Listing defaults
    if (user) {
        if (user.phone && !contactPhone && !isDraftRestored) setContactPhone(user.phone);
        if (user.whatsapp && !contactWhatsapp && !isDraftRestored) {
            setContactWhatsapp(user.whatsapp);
            setIsWhatsappSameAsPhone(user.whatsapp === user.phone);
        }
    }
  }, [editingItem, user, contactPhone, contactWhatsapp, isDraftRestored]);

  const isValidPhone = (value: string) => value.replace(/\D/g, "").length >= 10;

  const addImagesFromFiles = async (files: File[]) => {
    if (files.length === 0) return;
    if (isProcessingImages) {
      toast.info("Please wait for image processing to finish.");
      return;
    }

    const allowedFiles = files.filter(isAllowedListingImageInput);
    const rejectedCount = files.length - allowedFiles.length;
    if (rejectedCount > 0) {
      toast.error("Only JPG, PNG, or iPhone HEIC/HEIF images are allowed.");
    }
    if (allowedFiles.length === 0) return;

    const remainingSlots = Math.max(0, MAX_IMAGES - imageEntries.length);
    if (remainingSlots === 0) {
      toast.error(`Image limit reached (max ${MAX_IMAGES}).`);
      return;
    }

    if (allowedFiles.length > remainingSlots) {
      toast.info(`Only ${remainingSlots} more image${remainingSlots === 1 ? "" : "s"} allowed.`);
    }

    const filesToProcess = allowedFiles.slice(0, remainingSlots);
    const processedEntries: ImageEntry[] = [];
    let rejectedOversize = 0;
    let rejectedProcessing = 0;

    setIsProcessingImages(true);
    try {
      for (const file of filesToProcess) {
        try {
          const processed = await processListingImage(file);
          processedEntries.push({
            id: `new-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            url: URL.createObjectURL(processed),
            file: processed,
            isNew: true
          });
        } catch (error) {
          if (error instanceof Error && error.message.includes("exceeds 1MB")) {
            rejectedOversize += 1;
          } else {
            rejectedProcessing += 1;
          }
        }
      }
    } finally {
      setIsProcessingImages(false);
    }

    if (rejectedOversize > 0) {
      toast.error("Some images exceed 1MB after compression.");
    }
    if (rejectedProcessing > 0) {
      toast.error("Some images could not be processed.");
    }

    if (processedEntries.length > 0) {
      setImageEntries(prev => [...prev, ...processedEntries]);
    } else {
      toast.error("No images were added.");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    await addImagesFromFiles(files);
    e.target.value = "";
  };

  const handleNativeImagePick = (event: React.MouseEvent<HTMLLabelElement>) => {
    if (!isNativeImagePickerAvailable()) return;
    event.preventDefault();
    setShowImageSourceDialog(true);
  };

  const handleNativeImageSourcePick = async (source: "camera" | "library") => {
    setShowImageSourceDialog(false);
    try {
      const files = await pickNativeImages({ ...NATIVE_IMAGE_PICK_OPTIONS, source });
      await addImagesFromFiles(files);
    } catch (error) {
      console.error(error);
      toast.error(NATIVE_IMAGE_PICK_FAILED);
    }
  };

  const removeImage = (index: number) => {
    setImageEntries(prev => {
      const entry = prev[index];
      if (entry?.file && entry.url.startsWith("blob:")) {
        URL.revokeObjectURL(entry.url);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const moveImage = (from: number, to: number) => {
    setImageEntries(prev => {
      if (to < 0 || to >= prev.length) return prev;
      const updated = [...prev];
      const [moved] = updated.splice(from, 1);
      updated.splice(to, 0, moved);
      return updated;
    });
  };

  const makeMainImage = (index: number) => {
    if (index === 0) return;
    moveImage(index, 0);
  };

  const submitListing = async () => {
    if (!user) {
        router.push('/signin');
        return;
    }

    if (isProcessingImages) {
      toast.info("Please wait for images to finish processing.");
      return;
    }

    const priceNum = parseFloat(askPrice);
    const roundedPrice = roundToReasonablePrice(priceNum);
    
    const newErrors = {
      title: title.length < LISTING_LIMITS.TITLE.MIN || title.length > LISTING_LIMITS.TITLE.MAX,
      category: !category,
      askPrice: isNaN(priceNum) || priceNum < LISTING_LIMITS.PRICE.MIN || priceNum > LISTING_LIMITS.PRICE.MAX,
      description: description.length < LISTING_LIMITS.DESCRIPTION.MIN || description.length > LISTING_LIMITS.DESCRIPTION.MAX,
      contactPhone: !isValidPhone(contactPhone),
      images: imageEntries.length < 1,
      location: !location,
      purchasePrice: false,
      purchaseYear: false
    };

    setErrors(newErrors);

    if (Object.values(newErrors).some(Boolean)) {
      if (newErrors.images) toast.error("At least one image is required");
      if (newErrors.location) toast.error("Location is required");
      toast.error("Please fix the highlighted fields.");
      return;
    }

    if (roundedPrice !== priceNum) {
      setAskPrice(roundedPrice.toString());
      toast.info(`Price rounded to Rs. ${roundedPrice.toLocaleString()} for better bidding.`);
    }

    setIsUploading(true);

    try {
        const updatedEntries = await Promise.all(
          imageEntries.map(async (entry) => {
            if (!entry.file) return entry;
            const uploadedUrl = await uploadListingImage(entry.file);
            return {
              ...entry,
              url: uploadedUrl,
              file: undefined,
              isNew: false
            };
          })
        );

        const orderedUrls = updatedEntries.map(entry => entry.url);
        const finalDurationNum = parseInt(duration) as 24 | 168 | 720;
        const endsAt = new Date(Date.now() + finalDurationNum * 60 * 60 * 1000).toISOString();

          const listingPayload = {
            title,
            category,
            asked_price: roundedPrice,
            description,
            contact_phone: contactPhone.trim(),
            contact_whatsapp: contactWhatsapp.trim(),
            auction_mode: (isPublic ? 'visible' : 'hidden') as 'visible' | 'hidden',
            images: orderedUrls,
            condition: condition,
            ends_at: endsAt,
            listing_duration: finalDurationNum,
            location_lat: location!.lat,
            location_lng: location!.lng,
            location_address: location!.address
          };

          if (editingItem) {
            const editArgs: Database["public"]["Functions"]["edit_listing_with_cooldown"]["Args"] & {
              p_contact_whatsapp: string | null;
              p_ends_at: string | null;
            } = {
              p_listing_id: editingItem.id,
              p_title: listingPayload.title,
              p_description: listingPayload.description,
              p_category: listingPayload.category,
              p_asked_price: listingPayload.asked_price,
              p_contact_phone: listingPayload.contact_phone,
              p_contact_whatsapp: listingPayload.contact_whatsapp,
              p_auction_mode: listingPayload.auction_mode,
              p_images: listingPayload.images,
              p_condition: listingPayload.condition,
              p_ends_at: listingPayload.ends_at,
              p_listing_duration: listingPayload.listing_duration,
              p_location_lat: location!.lat,
              p_location_lng: location!.lng,
              p_location_address: location!.address,
            };

            const { error } = await supabase.rpc('edit_listing_with_cooldown', editArgs);

          if (error) {
            if (error.message?.includes('COOLDOWN_ACTIVE')) {
              const label = editCooldownLabel ? ` ${editCooldownLabel}` : '';
              toast.error(`${EDIT_COOLDOWN_TOAST}${label}`);
              return;
            }
            throw error;
          }
          toast.success("Listing updated", {
            description: GO_LIVE_NOTE
          });
          
          // Celebration
          const btn = document.getElementById("post-listing-btn");
          const rect = btn?.getBoundingClientRect();
          const confettiX = rect ? (rect.left + rect.width / 2) / window.innerWidth : 0.5;
          const confettiY = rect ? (rect.top + rect.height / 2) / window.innerHeight : 0.5;
          
          sonic.confetti();
          confetti({
            origin: { x: confettiX, y: confettiY },
            particleCount: 100,
            spread: 70,
            gravity: 1.2,
            scalar: 0.8,
            zIndex: 9999,
            colors: ['#fbbf24', '#f59e0b', '#d97706', '#ffffff'],
          });

          localStorage.removeItem(DRAFT_KEY);
          setTimeout(() => router.push("/"), 800);
        } else {
          const createArgs: Database["public"]["Functions"]["create_listing"]["Args"] & {
            p_contact_whatsapp: string | null;
            p_ends_at: string | null;
            p_slug: string | null;
          } = {
            p_title: listingPayload.title,
            p_description: listingPayload.description,
            p_category: listingPayload.category,
            p_asked_price: listingPayload.asked_price,
            p_contact_phone: listingPayload.contact_phone,
            p_contact_whatsapp: listingPayload.contact_whatsapp,
            p_auction_mode: listingPayload.auction_mode,
            p_images: listingPayload.images,
            p_condition: listingPayload.condition,
            p_ends_at: listingPayload.ends_at,
            p_listing_duration: listingPayload.listing_duration,
            p_location_lat: location!.lat,
            p_location_lng: location!.lng,
            p_location_address: location!.address,
            p_slug: generateSlug(title),
          };

          const { error } = await supabase.rpc('create_listing', createArgs);

          if (error) throw error;
          toast.success("Listing created", {
            description: GO_LIVE_NOTE
          });
          
          // Celebration
          const btn = document.getElementById("post-listing-btn");
          const rect = btn?.getBoundingClientRect();
          const confettiX = rect ? (rect.left + rect.width / 2) / window.innerWidth : 0.5;
          const confettiY = rect ? (rect.top + rect.height / 2) / window.innerHeight : 0.5;
          
          sonic.confetti();
          confetti({
            origin: { x: confettiX, y: confettiY },
            particleCount: 100,
            spread: 70,
            gravity: 1.2,
            scalar: 0.8,
            zIndex: 9999,
            colors: ['#fbbf24', '#f59e0b', '#d97706', '#ffffff'],
          });

          localStorage.removeItem(DRAFT_KEY);
          setTimeout(() => router.push("/"), 800);
        }

    } catch (error) {
        console.error("Error creating listing:", error);
        const message = error instanceof Error ? error.message : "Please try again in a moment.";
        toast.error("Listing not saved", {
          description: message
        });
    } finally {
        setIsUploading(false);
    }
  };

  const handleSubmit = () => {
    if (editingItem) {
      if (isEditCooldown) {
        const label = editCooldownLabel ? ` ${editCooldownLabel}` : '';
        toast.error(`${EDIT_COOLDOWN_TOAST}${label}`);
        return;
      }
      setShowEditWarning(true);
      return;
    }

    submitListing();
  };

  const resetForm = () => {
    setTitle("");
    setCategory("");
    setAskPrice("");
    setDescription("");
    setCondition("used");
    setIsPublic(true);
    setDuration("720");
    setContactPhone(user?.phone || "");
    setContactWhatsapp(user?.whatsapp || user?.phone || "");
    setIsWhatsappSameAsPhone(true);
    setPurchasePrice("");
    setPurchaseYear("");
    setPurchaseMonth("");
    setShowPriceEstimator(false);
    setLocation(myLocation || null);
    // Revoke object URLs for blob images
    imageEntries.forEach(entry => {
      if (entry.url.startsWith("blob:")) {
        URL.revokeObjectURL(entry.url);
      }
    });
    setImageEntries([]);
    setErrors({});
    setIsDraftRestored(false);
    localStorage.removeItem(DRAFT_KEY);
    toast.success("Form reset");
  };

  // Auth guard: show loading spinner while checking or redirecting
  if (isAuthLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div id="list-page-container" className="container mx-auto max-w-2xl py-12 px-4">
      <Card id="list-item-card" className="border-none shadow-lg bg-white">
        <CardHeader id="list-item-header" className="space-y-1">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1">
              <CardTitle id="list-item-title-heading" className="text-2xl font-bold text-slate-900">
                {isLoadingItem ? "Loading..." : editingItem ? "Edit Listing" : "Create New Listing"}
              </CardTitle>
              <CardDescription id="list-item-description-text">
                {isLoadingItem ? "Fetching item details..." : editingItem ? "Update your item details and bidding strategy." : "Enter your item details and set a fair price to attract the best bids."}
              </CardDescription>
            </div>
            {!isLoadingItem && !editingItem && (
              <Button
                id="reset-form-btn"
                type="button"
                variant="ghost"
                size="sm"
                onClick={resetForm}
                className="shrink-0 text-slate-500 hover:text-red-600 hover:bg-red-50 gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">Reset All</span>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent id="list-item-form" className="space-y-6">
          <Dialog open={showEditWarning} onOpenChange={setShowEditWarning}>
            <DialogContent id="edit-warning-dialog">
              <DialogHeader id="edit-warning-header">
                <DialogTitle id="edit-warning-title">{EDIT_WARNING_TITLE}</DialogTitle>
                <DialogDescription id="edit-warning-description">
                  {EDIT_WARNING_DESCRIPTION}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter id="edit-warning-footer">
                <Button
                  id="edit-warning-cancel-btn"
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditWarning(false)}
                >
                  {EDIT_WARNING_CANCEL}
                </Button>
                <Button
                  id="edit-warning-confirm-btn"
                  type="button"
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => {
                    setShowEditWarning(false);
                    submitListing();
                  }}
                >
                  {EDIT_WARNING_CONFIRM}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={showImageSourceDialog} onOpenChange={setShowImageSourceDialog}>
            <DialogContent id="image-source-dialog">
              <DialogHeader id="image-source-header">
                <DialogTitle id="image-source-title">Add photo</DialogTitle>
              </DialogHeader>
              <div id="image-source-actions" className="grid grid-cols-2 gap-3 px-4 pb-4">
                <button
                  id="image-source-camera-btn"
                  type="button"
                  className="group w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
                  onClick={() => handleNativeImageSourcePick("camera")}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Camera className="h-5 w-5" />
                  </div>
                  <div className="mt-3 text-sm font-bold text-slate-900">Camera</div>
                  <div className="mt-1 text-[11px] font-medium text-slate-500">Take a new photo</div>
                </button>
                <button
                  id="image-source-gallery-btn"
                  type="button"
                  className="group w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
                  onClick={() => handleNativeImageSourcePick("library")}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                    <ImageIcon className="h-5 w-5" />
                  </div>
                  <div className="mt-3 text-sm font-bold text-slate-900">Gallery</div>
                  <div className="mt-1 text-[11px] font-medium text-slate-500">Choose existing</div>
                </button>
              </div>
            </DialogContent>
          </Dialog>
          {isLoadingItem ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 opacity-20" />
              <p className="text-slate-400 font-medium text-sm">Securing details...</p>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Image Section */}
              <div className="space-y-4">
                <Label id="images-label" className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                  <Camera className="h-3.5 w-3.5 text-slate-500" />
                  Product Images (Max {MAX_IMAGES})
                </Label>
                <div id="images-preview-container" className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                  {imageEntries.map((entry, index) => (
                    <div key={entry.id} id={`image-preview-${index}`} className="relative h-28 w-28 shrink-0 rounded-xl overflow-hidden border border-slate-100 shadow-sm group">
                      <img src={entry.url} alt="" className="h-full w-full object-cover" />
                      {index === 0 && (
                        <div id={`main-image-badge-${index}`} className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full bg-blue-600 text-white text-[9px] font-bold tracking-wide uppercase shadow-sm">
                          Main
                        </div>
                      )}
                      <div className="absolute bottom-1.5 left-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          id={`move-image-left-btn-${index}`}
                          type="button"
                          onClick={() => moveImage(index, index - 1)}
                          className="h-6 w-6 flex items-center justify-center rounded-full bg-white/90 text-slate-600 shadow-sm hover:text-blue-600 hover:bg-blue-50 transition-all disabled:opacity-30 disabled:pointer-events-none"
                          disabled={index === 0}
                        >
                          <ArrowLeft className="h-3 w-3" />
                        </button>
                        <button
                          id={`move-image-right-btn-${index}`}
                          type="button"
                          onClick={() => moveImage(index, index + 1)}
                          className="h-6 w-6 flex items-center justify-center rounded-full bg-white/90 text-slate-600 shadow-sm hover:text-blue-600 hover:bg-blue-50 transition-all disabled:opacity-30 disabled:pointer-events-none"
                          disabled={index === imageEntries.length - 1}
                        >
                          <ArrowRight className="h-3 w-3" />
                        </button>
                        <button
                          id={`make-main-image-btn-${index}`}
                          type="button"
                          onClick={() => makeMainImage(index)}
                          className="h-6 w-6 flex items-center justify-center rounded-full bg-white/90 text-slate-600 shadow-sm hover:text-amber-600 hover:bg-amber-50 transition-all disabled:opacity-30 disabled:pointer-events-none"
                          disabled={index === 0}
                        >
                          <Star className="h-3 w-3" />
                        </button>
                      </div>
                      <button 
                        id={`remove-image-btn-${index}`}
                        onClick={() => removeImage(index)}
                        className="absolute top-1.5 right-1.5 p-1.5 bg-white/90 rounded-full hover:bg-red-50 hover:text-red-500 shadow-sm transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  {imageEntries.length < MAX_IMAGES && (
                    <label 
                      id="add-image-label"
                      className="h-28 w-28 shrink-0 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all group"
                      onClick={handleNativeImagePick}
                    >
                      <Camera id="camera-icon" className="h-7 w-7 text-slate-400 mb-1 group-hover:text-blue-500 transition-colors" />
                      <span id="add-photo-text" className="text-[11px] text-slate-500 font-bold group-hover:text-blue-600">Add Photo</span>
                      <input id="image-upload-input" type="file" multiple accept={LISTING_IMAGE_ACCEPT} className="hidden" onChange={handleImageUpload} />
                    </label>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title" className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1">
                    <Tag className="h-3.5 w-3.5 text-slate-500" />
                    Item Title <span className="text-red-500">*</span>
                  </div>
                  <span className={cn(
                    "text-[10px] font-bold transition-colors",
                    title.length > LISTING_LIMITS.TITLE.MAX ? "text-red-500" : "text-slate-400"
                  )}>
                    {title.length} / {LISTING_LIMITS.TITLE.MAX}
                  </span>
                </Label>
                <Input 
                  id="title-input" 
                  placeholder="e.g. Sony Headphones, Wood Table..." 
                  className={`transition-all ${errors.title ? "border-red-500 bg-red-50/50 ring-red-500/20" : "bg-slate-50 border-slate-100"}`} 
                  value={title}
                  maxLength={LISTING_LIMITS.TITLE.MAX}
                  onChange={(e) => {
                    const val = e.target.value.slice(0, LISTING_LIMITS.TITLE.MAX);
                    setTitle(val);
                    if (errors.title) setErrors(prev => ({ ...prev, title: false }));
                  }}
                />
                <AnimatePresence>
                  {errors.title && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-[10px] font-bold text-red-500"
                    >
                      {title.length < LISTING_LIMITS.TITLE.MIN 
                        ? `Title must be at least ${LISTING_LIMITS.TITLE.MIN} characters` 
                        : `Title cannot exceed ${LISTING_LIMITS.TITLE.MAX} characters`}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Category + Condition Row */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Shapes className="h-3.5 w-3.5 text-slate-500" />
                    Category <span className="text-red-500">*</span>
                  </Label>
                  <Select 
                    value={category} 
                    onValueChange={(val) => {
                      setCategory(val);
                      if (errors.category) setErrors(prev => ({ ...prev, category: false }));
                    }}
                  >
                    <SelectTrigger 
                      id="category-select" 
                      className={`transition-all w-full h-10 ${errors.category ? "border-red-500 bg-red-50/50" : "bg-slate-50 border-slate-100"}`}
                    >
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent id="category-select-content">
                      {CATEGORIES.filter(c => c.label !== "All Items").map(cat => {
                        const Icon = cat.icon;
                        return (
                          <SelectItem key={cat.label} value={cat.label} className="py-2">
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              <span>{cat.label}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {errors.category && (
                    <p className="text-[10px] font-bold text-red-500">Required</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <BadgeCheck className="h-3.5 w-3.5 text-slate-500" />
                    Condition
                  </Label>
                  <Select 
                    value={condition} 
                    onValueChange={(val: 'new' | 'like_new' | 'used' | 'fair') => setCondition(val)}
                  >
                    <SelectTrigger id="condition-select" className="bg-slate-50 border-slate-100 h-10 w-full">
                      <SelectValue placeholder="Select Condition" />
                    </SelectTrigger>
                    <SelectContent id="condition-select-content">
                      <SelectItem value="new">🌟 New</SelectItem>
                      <SelectItem value="like_new">✨ Mint</SelectItem>
                      <SelectItem value="used">👌 Used</SelectItem>
                      <SelectItem value="fair">🔨 Fair</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Price Estimator Toggle */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setShowPriceEstimator(!showPriceEstimator)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all w-full md:w-auto justify-center ${
                    showPriceEstimator 
                      ? "bg-slate-100 text-slate-600 hover:bg-slate-200" 
                      : "bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200/50"
                  }`}
                >
                  <Calculator className="w-4 h-4" />
                  {showPriceEstimator ? "Hide Price Estimator" : "Help me price this item"}
                </button>

                <AnimatePresence>
                  {showPriceEstimator && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
                        
                        <div className="space-y-3">
                          {/* Paid Price */}
                          <div className="space-y-1">
                            <Label htmlFor="purchase-price-input" className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                              <CreditCard className="w-3 h-3" /> Purchase Price (Rs.)
                            </Label>
                            <Input 
                              id="purchase-price-input" 
                              type="number" 
                              placeholder="Purchase Price" 
                              value={purchasePrice}
                              onChange={(e) => {
                                setPurchasePrice(e.target.value);
                                if (errors.purchasePrice) setErrors(prev => ({ ...prev, purchasePrice: false }));
                              }}
                              className={`h-9 text-sm bg-white ${errors.purchasePrice ? "border-red-500" : "border-slate-200"}`} 
                            />
                          </div>
                          
                          {/* Date (Month + Year) */}
                          <div className="space-y-1">
                            <Label className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> Date
                            </Label>
                             <div className="flex gap-2 w-full">
                              <div className="flex-[2] min-w-[100px]">
                                <Select value={purchaseMonth} onValueChange={setPurchaseMonth}>
                                  <SelectTrigger id="purchase-month-select" className="h-9 text-xs bg-white border-slate-200 px-2 w-full min-w-[100px]">
                                    <SelectValue placeholder="Month" />
                                  </SelectTrigger>


                                   <SelectContent id="purchase-month-select-content">
                                    {getPurchaseMonthOptions().map(m => (
                                      <SelectItem key={m.value} value={m.value.toString()} className="text-xs">{m.label}</SelectItem>
                                    ))}
                                   </SelectContent>

                                </Select>
                              </div>
                              <div className="flex-[3] min-w-[110px]">
                                <Select 
                                  value={purchaseYear} 
                                  onValueChange={(val) => {
                                    setPurchaseYear(val);
                                    if (errors.purchaseYear) setErrors(prev => ({ ...prev, purchaseYear: false }));
                                  }}
                                >
                                  <SelectTrigger 
                                    id="purchase-year-select" 
                                    className={`h-9 text-xs bg-white px-2 w-full min-w-[110px] ${errors.purchaseYear ? "border-red-500" : "border-slate-200"}`}
                                  >
                                    <SelectValue placeholder="Year" />
                                  </SelectTrigger>
                                  <SelectContent id="purchase-year-select-content">
                                    {getPurchaseYearOptions().map(year => (
                                      <SelectItem key={year} value={year.toString()} className="text-xs">{year}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                        </div>

                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Price Suggestion + Ask Price in one block */}
              <AnimatePresence>
                {priceEstimate && (
                  <motion.div
                    id="price-estimate-suggestion"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3 rounded-lg bg-amber-50 border border-amber-200"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">💡</span>
                      <p className="text-sm font-bold text-amber-900">
                        Suggested: {formatPriceEstimate(priceEstimate)}
                      </p>
                      <span className="text-[10px] text-amber-600 ml-auto font-bold">
                        {priceEstimate.yearsOwned.toFixed(1)} years old
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Ask Price - Now after suggestion */}
              <div className="space-y-2">
                <Label htmlFor="price-input" className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5" />
                    Your Ask Price (Rs.) <span className="text-red-500">*</span>
                  </span>
                  {askPrice && !isNaN(parseFloat(askPrice)) && parseFloat(askPrice) >= 1000000 && (
                    <span className="text-[10px] font-bold text-blue-600">
                      Rs. {formatPrice(parseFloat(askPrice))}
                    </span>
                  )}
                </Label>
                
                <div className={`flex w-full h-14 rounded-xl relative transition-all ${
                  errors.askPrice 
                    ? "border border-red-500 bg-red-50/50" 
                    : "border border-slate-200 bg-white hover:border-blue-400 ring-4 ring-blue-500/5 focus-within:ring-blue-500/20 focus-within:border-blue-500"
                }`}>
                  {/* Decrement */}
                  <button
                    type="button"
                    onClick={() => {
                      const current = parseFloat(askPrice) || 0;
                      let step = 100;
                      if (current >= 100000) step = 5000;
                      else if (current >= 20000) step = 1000;
                      else if (current >= 5000) step = 500;
                      
                      const newVal = Math.max(0, current - step);
                      setAskPrice(newVal.toString());
                      if (errors.askPrice) setErrors(prev => ({ ...prev, askPrice: false }));
                    }}
                    className="w-14 flex items-center justify-center border-r border-slate-100 text-slate-400 hover:text-blue-600 hover:bg-slate-50 active:bg-slate-100 transition-colors rounded-l-xl"
                  >
                    <Minus className="h-5 w-5" />
                  </button>

                  <Input 
                    id="price-input" 
                    type="number" 
                    placeholder="0" 
                    value={askPrice}
                    onChange={(e) => {
                      setAskPrice(e.target.value);
                      if (errors.askPrice) setErrors(prev => ({ ...prev, askPrice: false }));
                    }}
                    onBlur={() => {
                      if (errors.askPrice) {
                        const num = parseFloat(askPrice);
                        if (!isNaN(num) && num >= LISTING_LIMITS.PRICE.MIN && num <= LISTING_LIMITS.PRICE.MAX) {
                          setErrors(prev => ({ ...prev, askPrice: false }));
                        }
                      }
                    }}
                    className="flex-1 h-full border-none shadow-none focus-visible:ring-0 text-center text-2xl font-bold bg-transparent"
                  />

                  {/* Increment */}
                  <button
                    type="button"
                    onClick={() => {
                      const current = parseFloat(askPrice) || 0;
                      let step = 100;
                      if (current >= 100000) step = 5000;
                      else if (current >= 20000) step = 1000;
                      else if (current >= 5000) step = 500;

                      const newVal = current + step;
                      setAskPrice(newVal.toString());
                      if (errors.askPrice) setErrors(prev => ({ ...prev, askPrice: false }));
                    }}
                    className="w-14 flex items-center justify-center border-l border-slate-100 text-slate-400 hover:text-blue-600 hover:bg-slate-50 active:bg-slate-100 transition-colors rounded-r-xl"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>

                {errors.askPrice && (
                  <p className="text-[10px] font-bold text-red-500">
                    Price must be Rs. {LISTING_LIMITS.PRICE.MIN.toLocaleString()} – {LISTING_LIMITS.PRICE.MAX.toLocaleString()}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description-textarea" className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1">
                    <AlignLeft className="h-3.5 w-3.5 text-slate-500" />
                    Description <span className="text-red-500">*</span>
                  </div>
                  <span className={cn(
                    "text-[10px] font-bold transition-colors",
                    description.length > LISTING_LIMITS.DESCRIPTION.MAX ? "text-red-500" : "text-slate-400"
                  )}>
                    {description.length} / {LISTING_LIMITS.DESCRIPTION.MAX}
                  </span>
                </Label>
                <Textarea 
                  id="description-textarea" 
                  placeholder="Tell buyers about condition, usage, and any defects..." 
                  className={`bg-slate-50 border-slate-100 min-h-[120px] transition-all ${errors.description ? "border-red-500 bg-red-50/50 ring-red-500/20" : ""}`}
                  value={description}
                  maxLength={LISTING_LIMITS.DESCRIPTION.MAX}
                  onChange={(e) => {
                    const val = e.target.value.slice(0, LISTING_LIMITS.DESCRIPTION.MAX);
                    setDescription(val);
                    if (errors.description) setErrors(prev => ({ ...prev, description: false }));
                  }}
                />
                <AnimatePresence>
                  {errors.description && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-[10px] font-bold text-red-500"
                    >
                      {description.length < LISTING_LIMITS.DESCRIPTION.MIN 
                        ? `Description must be at least ${LISTING_LIMITS.DESCRIPTION.MIN} characters` 
                        : `Description cannot exceed ${LISTING_LIMITS.DESCRIPTION.MAX} characters`}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="listing-phone-input" className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5 text-slate-500" />
                    Phone <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="listing-phone-input"
                    type="tel"
                    placeholder="Enter phone number"
                    value={contactPhone}
                    onChange={(e) => {
                      setContactPhone(e.target.value);
                      if (errors.contactPhone) setErrors(prev => ({ ...prev, contactPhone: false }));
                    }}
                    className={`transition-all ${errors.contactPhone ? "border-red-500 bg-red-50/50 ring-red-500/20" : "bg-slate-50 border-slate-100"}`}
                  />
                  {errors.contactPhone && (
                    <p className="text-[10px] font-bold text-red-500">Please enter a valid phone number</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="listing-whatsapp-input" className="flex items-center gap-1.5">
                      <svg className="h-3.5 w-3.5 text-slate-500" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.631 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      WhatsApp
                    </Label>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Same as Phone</span>
                      <Switch 
                        id="whatsapp-same-toggle"
                        checked={isWhatsappSameAsPhone}
                        onCheckedChange={setIsWhatsappSameAsPhone}
                      />
                    </div>
                  </div>
                  <Input
                    id="listing-whatsapp-input"
                    type="tel"
                    placeholder="Enter WhatsApp number"
                    value={contactWhatsapp}
                    disabled={isWhatsappSameAsPhone}
                    onChange={(e) => setContactWhatsapp(e.target.value)}
                    className="h-11 bg-slate-50 border-slate-100 disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Location Map Section */}
              <div className="space-y-4">
                <Label className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-slate-500" />
                  Location <span className="text-red-500">*</span>
                </Label>
                <div className={`h-[300px] rounded-xl overflow-hidden border ${errors.location ? 'border-red-500' : 'border-slate-200'} shadow-sm`}>
                  <MapPicker 
                    initialLocation={location}
                    onLocationSelect={setLocation}
                    onGeocodingChange={setIsMapGeocoding}
                    required
                  />
                </div>
                {errors.location && <p className="text-[10px] font-bold text-red-500">Location is required</p>}
              </div>

              <div className="space-y-4 pt-4">
                <h3 id="bidding-style-heading" className="text-sm font-semibold text-slate-900">Bidding Style</h3>
                
                <div 
                  id="public-auction-option"
                  className={`flex items-center justify-between p-3 border rounded-lg transition-colors cursor-pointer ${isPublic ? 'bg-blue-50 border-blue-200' : 'bg-slate-50'}`}
                  onClick={() => setIsPublic(true)}
                >
                  <div className="flex items-center gap-3">
                    <Gavel className={`h-4 w-4 ${isPublic ? 'text-blue-600' : 'text-slate-500'}`} />
                    <div>
                      <p className="text-sm font-medium">Public Auction</p>
                      <p className="text-[10px] text-muted-foreground">Everyone can see the highest bid</p>
                    </div>
                  </div>
                  <div className={`w-4 h-4 rounded-full border ${isPublic ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`} />
                </div>

                <div 
                  id="hidden-bids-option"
                  className={`flex items-center justify-between p-3 border rounded-lg transition-colors cursor-pointer ${!isPublic ? 'bg-blue-50 border-blue-200' : 'bg-slate-50'}`}
                  onClick={() => setIsPublic(false)}
                >
                  <div className="flex items-center gap-3">
                    <EyeOff className={`h-4 w-4 ${!isPublic ? 'text-blue-600' : 'text-slate-500'}`} />
                    <div>
                      <p className="text-sm font-medium">Hidden Bids Only</p>
                      <p className="text-[10px] text-muted-foreground">Only you see the bid amounts</p>
                    </div>
                  </div>
                  <div className={`w-4 h-4 rounded-full border ${!isPublic ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`} />
                </div>

                <div className="space-y-3 pt-2">
                  <Label className="text-sm font-semibold text-slate-900 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-slate-500" />
                    Listing Duration
                  </Label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['24', '168', '720'] as const).map((d) => (
                      <button
                        key={d}
                        id={`duration-btn-${d}`}
                        onClick={() => setDuration(d)}
                        className={`py-2 rounded-lg border font-bold text-sm transition-all ${
                          duration === d 
                            ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                            : 'bg-white border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600'
                        }`}
                      >
                        {d === '24' ? '24 Hours' : d === '168' ? '7 Days' : '30 Days'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          
          <div className="flex flex-row gap-3">
            <Button 
              id="cancel-listing-btn"
              type="button"
              variant="outline"
              className="flex-1 h-14 text-lg font-semibold border-slate-200 text-slate-600 hover:bg-slate-50"
              onClick={() => router.back()}
              disabled={isUploading || isLoadingItem}
            >
              <X className="h-5 w-5 mr-2" />
              {editingItem ? "Discard" : "Cancel"}
            </Button>
            <Button 
              id="post-listing-btn"
              className="flex-[2] bg-blue-600 hover:bg-blue-700 h-14 text-lg font-bold"
              onClick={handleSubmit}
              disabled={isUploading || isProcessingImages || isLoadingItem || isEditCooldown || isMapGeocoding}
            >
              {(isUploading || isProcessingImages || isMapGeocoding) ? (
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : editingItem ? (
                  <Save className="h-5 w-5 mr-2" />
              ) : (
                  <Check className="h-5 w-5 mr-2" />
              )}
              {isUploading
                ? "Uploading..."
                : isProcessingImages
                  ? "Processing images..."
                  : isMapGeocoding
                    ? "Locating..."
                    : editingItem
                      ? (isEditCooldown ? `Edit in ${editCooldownLabel || "1h"}` : "Save")
                      : "Post Listing"}
            </Button>
          </div>
          <div id="go-live-note" className="flex justify-center">
            <div className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-800">
              {GO_LIVE_NOTE}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ListPage() {
  return (
    <Suspense>
      <ListForm />
    </Suspense>
  );
}
