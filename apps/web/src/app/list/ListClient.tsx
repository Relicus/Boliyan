"use client";

import { useState, useEffect } from "react";
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
import { Gavel, EyeOff, Camera, X, Save, Check, Loader2, ArrowLeft, ArrowRight, Star } from "lucide-react";
import { CATEGORIES, LISTING_LIMITS } from "@/lib/constants";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { uploadListingImage } from "@/lib/uploadImage";
import { supabase } from "@/lib/supabase";
import { generateSlug, formatPrice } from "@/lib/utils";
import { Database } from "@/types/database.types";
import { toast } from "sonner";
import { transformListingToItem } from "@/lib/transform";
import { Item } from "@/types";

function ListForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");
  const { items, user } = useApp();
  
  const [fetchedItem, setFetchedItem] = useState<Item | null>(null);
  const [isLoadingItem, setIsLoadingItem] = useState(!!editId);
  
  const editingItem = (editId ? items.find(i => i.id === editId) : null) || fetchedItem;

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
          setFetchedItem(transformListingToItem(data as any));
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
  const [duration, setDuration] = useState<"24" | "48" | "72">("24");
  const [condition, setCondition] = useState<'new' | 'like_new' | 'used' | 'fair'>("used");
  
  type ImageEntry = {
    id: string;
    url: string;
    file?: File;
    isNew: boolean;
  };

  const [imageEntries, setImageEntries] = useState<ImageEntry[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const [errors, setErrors] = useState<{
    title?: boolean;
    category?: boolean;
    askPrice?: boolean;
    description?: boolean;
    images?: boolean;
  }>({});
  const [isShaking, setIsShaking] = useState(false);

  const isValid = 
    title.length >= LISTING_LIMITS.TITLE.MIN && 
    title.length <= LISTING_LIMITS.TITLE.MAX &&
    category !== "" &&
    parseFloat(askPrice) >= LISTING_LIMITS.PRICE.MIN &&
    parseFloat(askPrice) <= LISTING_LIMITS.PRICE.MAX &&
    description.length >= LISTING_LIMITS.DESCRIPTION.MIN &&
    description.length <= LISTING_LIMITS.DESCRIPTION.MAX &&
    imageEntries.length >= 1;

  useEffect(() => {
    if (editingItem) {

      setTitle(editingItem.title);
      setCategory(editingItem.category);
      setAskPrice(editingItem.askPrice.toString());
      setDescription(editingItem.description || "");
      setIsPublic(editingItem.isPublicBid);
      setImageEntries(
        editingItem.images.map((url: string, index: number) => ({
          id: `existing-${index}`,
          url,
          isNew: false
        }))
      );
      setDuration(editingItem.listingDuration.toString() as "24" | "48" | "72");
      setCondition(editingItem.condition || "used");
      return;
    }

    setImageEntries([]);
  }, [editingItem]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setImageEntries(prev => {
        const remainingSlots = Math.max(0, 5 - prev.length);
        if (remainingSlots === 0) return prev;

        const stamp = Date.now();
        const newEntries = newFiles.slice(0, remainingSlots).map((file, index) => ({
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

  const handleSubmit = async () => {
    if (!user) {
        router.push('/signin');
        return;
    }

    const priceNum = parseFloat(askPrice);
    const newErrors = {
      title: title.length < LISTING_LIMITS.TITLE.MIN || title.length > LISTING_LIMITS.TITLE.MAX,
      category: !category,
      askPrice: isNaN(priceNum) || priceNum < LISTING_LIMITS.PRICE.MIN || priceNum > LISTING_LIMITS.PRICE.MAX,
      description: description.length < LISTING_LIMITS.DESCRIPTION.MIN || description.length > LISTING_LIMITS.DESCRIPTION.MAX,
      images: imageEntries.length < 1
    };

    setErrors(newErrors);

    if (Object.values(newErrors).some(Boolean)) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      
      if (newErrors.images) toast.error("At least one image is required");
      return;
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
        const finalDurationNum = parseInt(duration) as 24 | 48 | 72;
        const endsAt = new Date(Date.now() + finalDurationNum * 60 * 60 * 1000).toISOString();

        const listingPayload = {
          title,
          category,
          asked_price: parseFloat(askPrice),
          description,
          auction_mode: (isPublic ? 'visible' : 'sealed') as 'visible' | 'sealed',
          images: orderedUrls,
          condition: condition,
          ends_at: endsAt
        };

        if (editingItem) {
          const { error } = await supabase
            .from('listings')
            .update(listingPayload)
            .eq('id', editingItem.id);

          if (error) throw error;
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

  return (
    <div id="list-page-container" className="container mx-auto max-w-2xl py-12 px-4">
      <Card id="list-item-card" className="border-none shadow-lg bg-white">
        <CardHeader id="list-item-header" className="space-y-1">
          <CardTitle id="list-item-title-heading" className="text-2xl font-bold text-slate-900">
            {isLoadingItem ? "Loading..." : editingItem ? "Edit Listing" : "List an Item"}
          </CardTitle>
          <CardDescription id="list-item-description-text">
            {isLoadingItem ? "Fetching item details..." : editingItem ? "Update your item details and bidding strategy." : "Minimalist listing. Set your price and choose your bidding style."}
          </CardDescription>
        </CardHeader>
        <CardContent id="list-item-form" className="space-y-6">
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
                <Label id="images-label" className="text-sm font-semibold text-slate-900">Product Images (Max 5)</Label>
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
                      <input id="image-upload-input" type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title" className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1">
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
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
                      className={`transition-all w-full h-11 ${errors.category ? "border-red-500 bg-red-50/50" : "bg-slate-50 border-slate-100"}`}
                    >
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent id="category-select-content">
                      {CATEGORIES.filter(c => c.label !== "All Items").map(cat => {
                        const Icon = cat.icon;
                        return (
                          <SelectItem key={cat.label} value={cat.label} className="py-3">
                            <div className="flex items-center gap-3">
                              <div className="p-1.5 rounded-md bg-slate-100 text-slate-600 group-data-[selected]:bg-blue-100 group-data-[selected]:text-blue-600">
                                <Icon className="h-4 w-4" />
                              </div>
                              <span className="font-medium text-slate-700">{cat.label}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {errors.category && (
                    <p className="text-[10px] font-bold text-red-500">Selection required</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="price-input" className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1">
                      Ask Price (Rs.) <span className="text-red-500">*</span>
                    </div>
                    {askPrice && !isNaN(parseFloat(askPrice)) && parseFloat(askPrice) >= 1000000 && (
                      <span className="text-[10px] font-black text-blue-600 animate-in fade-in zoom-in-95 duration-300">
                        Preview: Rs. {formatPrice(parseFloat(askPrice))}
                      </span>
                    )}
                  </Label>
                  <Input 
                    id="price-input" 
                    type="number" 
                    placeholder="0" 
                    value={askPrice}
                    onChange={(e) => {
                      setAskPrice(e.target.value);
                      if (errors.askPrice) setErrors(prev => ({ ...prev, askPrice: false }));
                    }}
                    className={`transition-all h-11 w-full ${errors.askPrice ? "border-red-500 bg-red-50/50" : "bg-slate-50 border-slate-100"}`} 
                  />
                  {errors.askPrice && (
                    <p className="text-[10px] font-bold text-red-500">
                      {parseFloat(askPrice) < LISTING_LIMITS.PRICE.MIN 
                        ? `Minimum price is Rs. ${LISTING_LIMITS.PRICE.MIN.toLocaleString()}` 
                        : `Maximum price is Rs. ${LISTING_LIMITS.PRICE.MAX.toLocaleString()}`}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1">Item Condition</Label>
                <Select 
                  value={condition} 
                  onValueChange={(val: 'new' | 'like_new' | 'used' | 'fair') => setCondition(val)}
                >
                  <SelectTrigger id="condition-select" className="bg-slate-50 border-slate-100 h-11 w-full">
                    <SelectValue placeholder="Select Condition" />
                  </SelectTrigger>
                  <SelectContent id="condition-select-content">
                    <SelectItem value="new">🌟 Brand New</SelectItem>
                    <SelectItem value="like_new">✨ Like New / Mint</SelectItem>
                    <SelectItem value="used">👌 Gently Used</SelectItem>
                    <SelectItem value="fair">🔨 Heavily Used (Fair)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description-textarea" className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1">
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
                  id="sealed-bids-option"
                  className={`flex items-center justify-between p-3 border rounded-lg transition-colors cursor-pointer ${!isPublic ? 'bg-blue-50 border-blue-200' : 'bg-slate-50'}`}
                  onClick={() => setIsPublic(false)}
                >
                  <div className="flex items-center gap-3">
                    <EyeOff className={`h-4 w-4 ${!isPublic ? 'text-blue-600' : 'text-slate-500'}`} />
                    <div>
                      <p className="text-sm font-medium">Secret Bids Only</p>
                      <p className="text-[10px] text-muted-foreground">Only you see the bid amounts</p>
                    </div>
                  </div>
                  <div className={`w-4 h-4 rounded-full border ${!isPublic ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`} />
                </div>

                <div className="space-y-3 pt-2">
                  <Label className="text-sm font-semibold text-slate-900">Listing Duration</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['24', '48', '72'] as const).map((d) => (
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
                        {d} Hours
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
              disabled={isUploading || isLoadingItem}
            >
              {isUploading ? (
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : editingItem ? (
                  <Save className="h-5 w-5 mr-2" />
              ) : (
                  <Check className="h-5 w-5 mr-2" />
              )}
              {isUploading ? "Uploading..." : editingItem ? "Save" : "Post Listing"}
            </Button>
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
