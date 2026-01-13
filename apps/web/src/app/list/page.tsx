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
import { Sparkles, Gavel, EyeOff } from "lucide-react";
import { useApp } from "@/lib/store";
import { useRouter } from "next/navigation";

export default function ListPage() {
  const router = useRouter();
  const { addItem, user } = useApp();
  
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>("");
  const [askPrice, setAskPrice] = useState<string>("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  
  const [recommended, setRecommended] = useState<number | null>(null);

  useEffect(() => {
    if (category) {
      // Mocked price intelligence
      const prices: Record<string, number> = {
        "Electronics": 45000,
        "Furniture": 15000,
        "Auto Parts": 8000,
        "Audio": 12000,
        "Cameras": 85000,
      };
      setRecommended(prices[category] || 20000);
    }
  }, [category]);

  const handleSubmit = () => {
    if (!title || !category || !askPrice) return;

    addItem({
      title,
      category,
      askPrice: parseFloat(askPrice),
      description,
      isPublicBid: isPublic,
      sellerId: user.id, // Current user
      images: ["https://images.unsplash.com/photo-1550989460-0adf9ea622e2?q=80&w=1000&auto=format&fit=crop"], // Placeholder for now
      recommendedPrice: recommended || 0
    });

    router.push("/");
  };

  return (
    <div id="list-page-container" className="container mx-auto max-w-2xl py-12 px-4">
      <Card id="list-item-card" className="border-none shadow-lg bg-white">
        <CardHeader id="list-item-header" className="space-y-1">
          <CardTitle id="list-item-title-heading" className="text-2xl font-bold text-slate-900">List an Item</CardTitle>
          <CardDescription id="list-item-description-text">
            Minimalist listing. Set your price and choose your bidding style.
          </CardDescription>
        </CardHeader>
        <CardContent id="list-item-form" className="space-y-6">
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
              <Select onValueChange={setCategory}>
                <SelectTrigger id="category-select" className="bg-slate-50 border-slate-100">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent id="category-select-content">
                  <SelectItem value="Electronics">Electronics</SelectItem>
                  <SelectItem value="Furniture">Furniture</SelectItem>
                  <SelectItem value="Auto Parts">Auto Parts</SelectItem>
                  <SelectItem value="Audio">Audio</SelectItem>
                  <SelectItem value="Cameras">Cameras</SelectItem>
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
                className="bg-slate-50 border-slate-100" 
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

          <Button 
            id="post-listing-btn"
            className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg font-bold"
            onClick={handleSubmit}
          >
            Post Listing
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
