"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sparkles, Gavel, EyeOff, Camera, X } from "lucide-react";
import { CATEGORIES } from "@/lib/constants";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useApp } from "@/lib/store";

function ListForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");
  const { addItem, updateItem, items, user } = useApp();
  
  const editingItem = editId ? items.find(i => i.id === editId) : null;
  
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>("");
  const [askPrice, setAskPrice] = useState<string>("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  
  const [images, setImages] = useState<string[]>([]);
  const [recommended, setRecommended] = useState<number | null>(null);

  useEffect(() => {
    if (editingItem) {
      setTitle(editingItem.title);
      setCategory(editingItem.category);
      setAskPrice(editingItem.askPrice.toString());
      setDescription(editingItem.description || "");
      setIsPublic(editingItem.isPublicBid);
      setImages(editingItem.images);
    }
  }, [editingItem]);

  useEffect(() => {
    if (category) {
      // Mocked price intelligence
      const prices: Record<string, number> = {
        "Mobiles": 45000,
        "Electronics": 65000,
        "Furniture": 15000,
        "Fashion": 5000,
        "Sports": 8000,
        "Gaming": 40000,
        "Watches": 20000,
        "Audio": 12000,
        "Cameras": 85000,
        "Appliances": 25000,
        "Community": 1000,
      };
      setRecommended(prices[category] || 20000);
    }
  }, [category]);


  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages = Array.from(files).map(file => URL.createObjectURL(file));
      setImages(prev => [...prev, ...newImages].slice(0, 5));
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!title || !category || !askPrice) return;

    if (editingItem) {
      updateItem(editingItem.id, {
        title,
        category,
        askPrice: parseFloat(askPrice),
        description,
        isPublicBid: isPublic,
        images: images.length > 0 ? images : editingItem.images,
      });
      router.push("/dashboard");
    } else {
      addItem({
        title,
        category,
        askPrice: parseFloat(askPrice),
        description,
        isPublicBid: isPublic,
        sellerId: user.id, // Current user
        images: images.length > 0 ? images : ["https://images.unsplash.com/photo-1550989460-0adf9ea622e2?q=80&w=1000&auto=format&fit=crop"], // Fallback if no images
        recommendedPrice: recommended || 0
      });
      router.push("/");
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
            <Label htmlFor="title">Item Title</Label>
            <Input 
              id="title-input" 
              placeholder="e.g. Sony Headphones, Wood Table..." 
              className="bg-slate-50 border-slate-100" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category-select" className="bg-slate-50 border-slate-100 w-full h-11">
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

            </div>
            
            <div className="space-y-2">
              <Label htmlFor="price-input">Ask Price (Rs.)</Label>
              <Input 
                id="price-input" 
                type="number" 
                placeholder="0" 
                value={askPrice}
                onChange={(e) => setAskPrice(e.target.value)}
                className="bg-slate-50 border-slate-100 h-11 w-full" 
              />

            </div>
          </div>

          {recommended && (
            <div id="recommended-price-banner" className="p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-center gap-3">
              <Sparkles id="recommended-sparkles-icon" className="h-5 w-5 text-blue-600 animate-pulse" />
              <div className="flex-1">
                <p id="recommended-title" className="text-sm font-semibold text-blue-900">Recommended Market Price</p>
                <p id="recommended-text" className="text-xs text-blue-700">Based on recent sales: <span className="font-bold">Rs. {recommended.toLocaleString()}</span></p>
              </div>
              <Button 
                id="apply-recommended-price-btn"
                variant="ghost" 
                size="sm" 
                className="text-xs text-blue-600 hover:bg-blue-100"
                onClick={() => setAskPrice(recommended.toString())}
              >
                Use This
              </Button>
            </div>
          )}

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
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              id="cancel-listing-btn"
              type="button"
              variant="outline"
              className="flex-1 h-12 text-lg font-semibold border-slate-200 text-slate-600 hover:bg-slate-50"
              onClick={() => router.back()}
            >
              {editingItem ? "Discard Changes" : "Cancel"}
            </Button>
            <Button 
              id="post-listing-btn"
              className="flex-[2] bg-blue-600 hover:bg-blue-700 h-12 text-lg font-bold"
              onClick={handleSubmit}
            >
              {editingItem ? "Save Changes" : "Post Listing"}
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
