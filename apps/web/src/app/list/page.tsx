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
import { Gavel, EyeOff, Camera, X, Save, Check, Loader2 } from "lucide-react";
import { CATEGORIES } from "@/lib/constants";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useApp } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { uploadListingImage } from "@/lib/uploadImage";
import { supabase } from "@/lib/supabase";
import { generateSlug } from "@/lib/utils";
import { Database } from "@/types/database.types";

function ListForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");
  const { items, user } = useApp();
  
  const editingItem = editId ? items.find(i => i.id === editId) : null;
  
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>("");
  const [askPrice, setAskPrice] = useState<string>("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [duration, setDuration] = useState<"24" | "48" | "72">("24");
  const [condition, setCondition] = useState<'new' | 'like_new' | 'used' | 'fair'>("used");
  
  const [images, setImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const [errors, setErrors] = useState<{
    title?: boolean;
    category?: boolean;
    askPrice?: boolean;
  }>({});
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    if (editingItem) {
      setTitle(editingItem.title);
      setCategory(editingItem.category);
      setAskPrice(editingItem.askPrice.toString());
      setDescription(editingItem.description || "");
      setIsPublic(editingItem.isPublicBid);
      setImages(editingItem.images);
      setDuration(editingItem.listingDuration.toString() as "24" | "48" | "72");
      setCondition(editingItem.condition || "used");
    }
  }, [editingItem]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      const newImages = newFiles.map(file => URL.createObjectURL(file));
      
      setImages(prev => [...prev, ...newImages].slice(0, 5));
      setImageFiles(prev => [...prev, ...newFiles].slice(0, 5));
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!user) {
        router.push('/signin');
        return;
    }

    const newErrors = {
      title: !title.trim(),
      category: !category,
      askPrice: !askPrice || isNaN(parseFloat(askPrice)) || parseFloat(askPrice) <= 0
    };

    setErrors(newErrors);

    if (newErrors.title || newErrors.category || newErrors.askPrice) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }

    setIsUploading(true);

    try {
        // 1. Upload Images
        const uploadedUrls = await Promise.all(
            imageFiles.map(file => uploadListingImage(file, user.id))
        );

        // Filter out blob URLs from 'images' and keep existing HTTP/Supabase URLs
        const existingRealUrls = images.filter(url => !url.startsWith('blob:'));
        const allUrls = [...existingRealUrls, ...uploadedUrls];

        const finalDurationNum = parseInt(duration) as 24 | 48 | 72;
        const endsAt = new Date(Date.now() + finalDurationNum * 60 * 60 * 1000).toISOString();
        
        const listingData = {
            title,
            category,
            asked_price: parseFloat(askPrice),
            description,
            auction_mode: (isPublic ? 'visible' : 'sealed') as 'visible' | 'sealed',
            images: allUrls,
            seller_id: user.id,
            status: 'active' as const,
            condition: condition,
            ends_at: endsAt
        };

        if (editingItem) {
          // Update logic (Not implemented yet, but safe from slug overwrites)
        } else {
            // Insert - Add slug only here
            const insertPayload: Database['public']['Tables']['listings']['Insert'] = {
              ...listingData,
              slug: generateSlug(title)
            };
            
            const { error } = await supabase.from('listings').insert([insertPayload] as any);
            
            if (error) throw error;
            router.push("/");
        }

    } catch (error) {
        console.error("Error creating listing:", error);
        alert("Failed to create listing. Please try again."); // Simple feedback for now
    } finally {
        setIsUploading(false);
    }
  };

  return (
    <div id="list-page-container" className="container mx-auto max-w-2xl py-12 px-4">
      <Card id="list-item-card" className="border-none shadow-lg bg-white">
        <CardHeader id="list-item-header" className="space-y-1">
          <CardTitle id="list-item-title-heading" className="text-2xl font-bold text-slate-900">
            {editingItem ? "Edit Listing" : "List an Item"}
          </CardTitle>
          <CardDescription id="list-item-description-text">
            {editingItem ? "Update your item details and bidding strategy." : "Minimalist listing. Set your price and choose your bidding style."}
          </CardDescription>
        </CardHeader>
        <CardContent id="list-item-form" className="space-y-6">
          <motion.div 
            animate={isShaking ? { x: [-4, 4, -4, 4, 0], transition: { duration: 0.4 } } : {}}
            className="space-y-6"
          >
          <div className="space-y-4">
            <Label id="images-label" className="text-sm font-semibold text-slate-900">Product Images (Max 5)</Label>
            <div id="images-preview-container" className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {images.map((src, index) => (
                <div key={index} id={`image-preview-${index}`} className="relative h-28 w-28 shrink-0 rounded-xl overflow-hidden border border-slate-100 shadow-sm group">
                  <img src={src} alt="" className="h-full w-full object-cover" />
                  <button 
                    id={`remove-image-btn-${index}`}
                    onClick={() => removeImage(index)}
                    className="absolute top-1.5 right-1.5 p-1.5 bg-white/90 rounded-full hover:bg-red-50 hover:text-red-500 shadow-sm transition-all opacity-0 group-hover:opacity-100"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {images.length < 5 && (
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
            <Label htmlFor="title" className="flex items-center gap-1">
              Item Title <span className="text-red-500">*</span>
            </Label>
            <Input 
              id="title-input" 
              placeholder="e.g. Sony Headphones, Wood Table..." 
              className={`transition-all ${errors.title ? "border-red-500 bg-red-50/50 ring-red-500/20" : "bg-slate-50 border-slate-100"}`} 
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
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
                  Please enter a title for your item
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
              <Label htmlFor="price-input" className="flex items-center gap-1">
                Ask Price (Rs.) <span className="text-red-500">*</span>
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
                <p className="text-[10px] font-bold text-red-500">Valid price required</p>
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
            <Label htmlFor="description-textarea">Description</Label>
            <Textarea 
              id="description-textarea" 
              placeholder="Tell buyers about condition, usage, and any defects..." 
              className="bg-slate-50 border-slate-100 min-h-[100px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
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
          
          <div className="flex flex-row gap-3">
            <Button 
              id="cancel-listing-btn"
              type="button"
              variant="outline"
              className="flex-1 h-14 text-lg font-semibold border-slate-200 text-slate-600 hover:bg-slate-50"
              onClick={() => router.back()}
              disabled={isUploading}
            >
              <X className="h-5 w-5 mr-2" />
              {editingItem ? "Discard" : "Cancel"}
            </Button>
            <Button 
              id="post-listing-btn"
              className="flex-[2] bg-blue-600 hover:bg-blue-700 h-14 text-lg font-bold"
              onClick={handleSubmit}
              disabled={isUploading}
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
