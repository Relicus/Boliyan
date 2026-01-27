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
import { Gavel, EyeOff, Camera, X, Save, Check, Loader2, ArrowLeft, ArrowRight, Star, Calendar, DollarSign, Sparkles, CreditCard, Clock, Calculator, Plus, Minus, Tag, Shapes, BadgeCheck, AlignLeft, Phone } from "lucide-react";
import { CATEGORIES, LISTING_IMAGE_ACCEPT, LISTING_LIMITS, isAllowedListingImage } from "@/lib/constants";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { uploadListingImage } from "@/lib/uploadImage";
import { supabase } from "@/lib/supabase";
import { generateSlug, formatPrice, formatCountdown } from "@/lib/utils";
import { Database } from "@/types/database.types";
import { toast } from "sonner";
import { transformListingToItem, ListingWithSeller } from "@/lib/transform";
import { Item } from "@/types";
import { roundToReasonablePrice } from "@/lib/bidding";
import { calculateDepreciation, formatPriceEstimate, getPurchaseYearOptions, getPurchaseMonthOptions, DepreciationResult } from "@/lib/depreciation";
import { MapPicker } from "@/components/common/MapPicker";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTime } from "@/context/TimeContext";
import { MapPin } from "lucide-react";

const EDIT_WARNING_TITLE = "Editing resets bids";
const EDIT_WARNING_DESCRIPTION = "Saving changes will delete all bids and relaunch this listing in 1 hour.";
const EDIT_WARNING_CONFIRM = "Save & Reset Bids";
const EDIT_WARNING_CANCEL = "Keep Editing";
const GO_LIVE_NOTE = "Goes live in 1 hour after saving.";
const EDIT_COOLDOWN_TOAST = "You can edit this listing again in";

function ListForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");
  const { items, user } = useApp();
  const { now } = useTime();
  
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
  const [currentNewPrice, setCurrentNewPrice] = useState<string>("");
  const [contactPhone, setContactPhone] = useState("");
  const [showPriceEstimator, setShowPriceEstimator] = useState(false);
  const [location, setLocation] = useState<{lat: number, lng: number, address: string, city?: string} | null>(null);
  
  // Computed price estimate
  const priceEstimate: DepreciationResult | null = React.useMemo(() => {
    const price = parseFloat(purchasePrice);
    const year = parseInt(purchaseYear);
    if (!category || !price || !year || isNaN(price) || isNaN(year)) return null;
    const newPrice = parseFloat(currentNewPrice);
    const month = parseInt(purchaseMonth);
    return calculateDepreciation({
      purchasePrice: price,
      purchaseYear: year,
      purchaseMonth: isNaN(month) ? undefined : month,
      category,
      condition,
      currentNewPrice: isNaN(newPrice) || newPrice <= 0 ? undefined : newPrice,
    });
  }, [purchasePrice, purchaseYear, purchaseMonth, category, condition, currentNewPrice]);
  
  type ImageEntry = {
    id: string;
    url: string;
    file?: File;
    isNew: boolean;
  };

  const [imageEntries, setImageEntries] = useState<ImageEntry[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showEditWarning, setShowEditWarning] = useState(false);

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
      return;
    }

    setImageEntries([]);
    if (user?.phone && !contactPhone) {
      setContactPhone(user.phone);
    }
  }, [editingItem, user, contactPhone]);

  const isValidPhone = (value: string) => value.replace(/\D/g, "").length >= 10;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      const allowedFiles = newFiles.filter(isAllowedListingImage);
      const rejectedCount = newFiles.length - allowedFiles.length;
      if (rejectedCount > 0) {
        toast.error("Only JPG, PNG, or iPhone HEIC/HEIF images are allowed.");
      }
      if (allowedFiles.length === 0) return;
      setImageEntries(prev => {
        const remainingSlots = Math.max(0, 5 - prev.length);
        if (remainingSlots === 0) return prev;

        const stamp = Date.now();
        const newEntries = allowedFiles.slice(0, remainingSlots).map((file, index) => ({
          id: `new-${stamp}-${index}`,
          url: URL.createObjectURL(file),
          file,
          isNew: true
        }));

        return [...prev, ...newEntries];
      });
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
      purchasePrice: !purchasePrice || isNaN(parseFloat(purchasePrice)) || parseFloat(purchasePrice) <= 0,
      purchaseYear: !purchaseYear
    };

    setErrors(newErrors);

    if (Object.values(newErrors).some(Boolean)) {
      if (newErrors.images) toast.error("At least one image is required");
      if (newErrors.location) toast.error("Location is required");
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
            const uploadedUrl = await uploadListingImage(entry.file, user.id);
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
            const { error } = await supabase
              .rpc('edit_listing_with_cooldown', {
                p_listing_id: editingItem.id,
                p_title: listingPayload.title,
                p_description: listingPayload.description,
                p_category: listingPayload.category,
                p_asked_price: listingPayload.asked_price,
                p_contact_phone: listingPayload.contact_phone,
                p_auction_mode: listingPayload.auction_mode,
                p_images: listingPayload.images,
                p_condition: listingPayload.condition,
                p_ends_at: listingPayload.ends_at,
                p_listing_duration: listingPayload.listing_duration
              });
            
          // NOTE: edit_listing_with_cooldown RPC might not accept location params yet.
          // We need to update location separately or update the RPC. 
          // For now, let's update location via direct update if RPC succeeds or just ignore location update in edit mode for this specific RPC path if risk is high.
          // Better approach: Direct update for non-critical fields if we want to support location edit.
          // However, since we are doing a "reset bids" edit, we might as well update everything.
          // But RPC signature is fixed. I should update the RPC signature or do a separate update call.
          // Let's do a separate update call for location immediately after RPC if successful.
          
          if (!error) {
             await supabase.from('listings').update({
               location_lat: location!.lat,
               location_lng: location!.lng,
               location_address: location!.address
             }).eq('id', editingItem.id);
          }

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
          router.push("/");
        } else {
          const insertPayload: Database['public']['Tables']['listings']['Insert'] = {
            ...listingPayload,
            seller_id: user.id,
            status: 'active',
            slug: generateSlug(title)
          };

          const { error } = await supabase.from('listings').insert([insertPayload]);

          if (error) throw error;
          toast.success("Listing created", {
            description: GO_LIVE_NOTE
          });
          router.push("/");
        }

    } catch (error) {
        console.error("Error creating listing:", error);
        toast.error("Listing not saved", {
          description: "Please try again in a moment."
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

  return (
    <div id="list-page-container" className="container mx-auto max-w-2xl py-12 px-4">
      <Card id="list-item-card" className="border-none shadow-lg bg-white">
        <CardHeader id="list-item-header" className="space-y-1">
          <CardTitle id="list-item-title-heading" className="text-2xl font-bold text-slate-900">
            {isLoadingItem ? "Loading..." : editingItem ? "Edit Listing" : "Create New Listing"}
          </CardTitle>
          <CardDescription id="list-item-description-text">
            {isLoadingItem ? "Fetching item details..." : editingItem ? "Update your item details and bidding strategy." : "Enter your item details and set a fair price to attract the best bids."}
          </CardDescription>
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
                  Product Images (Max 5)
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
                        className="absolute top-1.5 right-1.5 p-1.5 bg-white/90 rounded-full hover:bg-red-50 hover:text-red-500 shadow-sm transition-all opacity-0 group-hover:opacity-100"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  {imageEntries.length < 5 && (
                    <label 
                      id="add-image-label"
                      className="h-28 w-28 shrink-0 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all group"
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
                      <SelectItem value="new">🌟 Brand New</SelectItem>
                      <SelectItem value="like_new">✨ Like New</SelectItem>
                      <SelectItem value="used">👌 Used</SelectItem>
                      <SelectItem value="fair">🔨 Fair</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Price Estimator Toggle - Optional Helper */}
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
                        
                        <div className="grid grid-cols-2 gap-6">
                          {/* Paid Price */}
                          <div className="space-y-1">
                            <Label htmlFor="purchase-price-input" className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                              <CreditCard className="w-3 h-3" /> Paid (Rs.)
                            </Label>
                            <Input 
                              id="purchase-price-input" 
                              type="number" 
                              placeholder="Original Price" 
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
                              <div className="flex-[2] min-w-0">
                                <Select value={purchaseMonth} onValueChange={setPurchaseMonth}>
                                  <SelectTrigger id="purchase-month-select" className="h-9 text-xs bg-white border-slate-200 px-2 w-full">
                                    <SelectValue placeholder="Mo" />
                                  </SelectTrigger>
                                  <SelectContent id="purchase-month-select-content">
                                    {getPurchaseMonthOptions().map(m => (
                                      <SelectItem key={m.value} value={m.value.toString()} className="text-xs">{m.label.slice(0,3)}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="flex-[3] min-w-0">
                                <Select 
                                  value={purchaseYear} 
                                  onValueChange={(val) => {
                                    setPurchaseYear(val);
                                    if (errors.purchaseYear) setErrors(prev => ({ ...prev, purchaseYear: false }));
                                  }}
                                >
                                  <SelectTrigger 
                                    id="purchase-year-select" 
                                    className={`h-9 text-xs bg-white px-2 w-full ${errors.purchaseYear ? "border-red-500" : "border-slate-200"}`}
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
                        
                        {/* Current New Price - Very Compact */}
                        <div className="relative">
                          <div className="absolute inset-y-0 left-2 flex items-center pointer-events-none">
                            <Sparkles className="w-3 h-3 text-slate-400" />
                          </div>
                          <Input 
                            id="current-new-price-input" 
                            type="number" 
                            placeholder="Current New Price (Optional)" 
                            value={currentNewPrice}
                            onChange={(e) => setCurrentNewPrice(e.target.value)}
                            className="h-8 text-xs bg-white border-slate-200 pl-7 placeholder:text-slate-400"
                          />
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

              <div className="space-y-2">
                <Label htmlFor="listing-phone-input" className="flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5 text-slate-500" />
                  Phone for this listing <span className="text-red-500">*</span>
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

              {/* Location Map Section */}
              <div className="space-y-4">
                <Label className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-slate-500" />
                  Item Location <span className="text-red-500">*</span>
                </Label>
                <div className={`h-[300px] rounded-xl overflow-hidden border ${errors.location ? 'border-red-500' : 'border-slate-200'} shadow-sm`}>
                  <MapPicker 
                    initialLocation={location}
                    onLocationSelect={setLocation}
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
              disabled={isUploading || isLoadingItem || isEditCooldown}
            >
              {isUploading ? (
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : editingItem ? (
                  <Save className="h-5 w-5 mr-2" />
              ) : (
                  <Check className="h-5 w-5 mr-2" />
              )}
              {isUploading ? "Uploading..." : editingItem ? (isEditCooldown ? `Edit in ${editCooldownLabel || "1h"}` : "Save") : "Post Listing"}
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
