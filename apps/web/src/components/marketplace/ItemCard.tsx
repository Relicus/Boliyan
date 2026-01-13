import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { Item, User } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, ArrowRight, Lock, Globe } from "lucide-react";
import { useApp } from "@/lib/store";

interface ItemCardProps {
  item: Item;
  seller: User;
  viewMode?: 'compact' | 'comfortable' | 'spacious';
}

export default function ItemCard({ item, viewMode = 'compact' }: ItemCardProps) {
  const { placeBid } = useApp();
  const [bidAmount, setBidAmount] = useState<string>("");
  const [error, setError] = useState<boolean>(false);

  // Stable "random" distance based on item ID to prevent hydration mismatch
  const distance = useMemo(() => {
    const hash = item.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return ((hash % 80) / 10 + 1.2).toFixed(1);
  }, [item.id]);

  const handleBid = () => {
    const amount = parseFloat(bidAmount);
    const minBid = item.askPrice * 0.7;

    if (isNaN(amount) || amount < minBid) {
      setError(true);
      setTimeout(() => setError(false), 2000);
      return;
    }

    placeBid(item.id, amount, item.isPublicBid ? 'public' : 'private');
    setBidAmount("");
  };

  const getHeightClass = () => {
    switch (viewMode) {
      case 'spacious': return 'h-52';
      case 'comfortable': return 'h-40';
      default: return 'h-28';
    }
  };

  const getTitleClass = () => {
    switch (viewMode) {
      case 'spacious': return 'text-lg';
      case 'comfortable': return 'text-base';
      default: return 'text-sm';
    }
  };

  const getPriceClass = () => {
    switch (viewMode) {
      case 'spacious': return 'text-xl';
      case 'comfortable': return 'text-lg';
      default: return 'text-base';
    }
  };

  const getLabelClass = () => {
    switch (viewMode) {
      case 'spacious': return 'text-xs';
      case 'comfortable': return 'text-[10px]';
      default: return 'text-[9px]';
    }
  };

  return (
    <Card 
      className="group border-none shadow-sm hover:shadow-md transition-shadow duration-200 bg-white rounded-lg overflow-hidden flex flex-col will-change-transform"
      style={{ backfaceVisibility: 'hidden' }}
    >
      {/* 
        Image Section:
        Dynamic height based on viewMode.
        Changed to motion.div with layout prop to sync with parent grid animation.
        Removed CSS transition-all to prevent jitter.
      */}
      <motion.div 
        layout
        className={`relative ${getHeightClass()} bg-slate-100 overflow-hidden shrink-0 z-0`}
        style={{ backfaceVisibility: 'hidden' }}
      >
        <img 
          src={item.images[0]} 
          alt={item.title}
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500 will-change-transform"
        />
        
        {/* High Contrast Bottom Bar on Image */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-[2px] px-2 py-1 flex justify-between items-center z-10 transition-all">
           <div className={`flex items-center gap-1 ${getLabelClass()} text-white font-bold tracking-wide transition-all`}>
             <MapPin className="h-3 w-3 text-red-400" />
             {distance}km
           </div>
           {item.isPublicBid ? (
             <div className={`flex items-center gap-1 ${getLabelClass()} text-blue-200 font-bold transition-all`}>
                <Globe className="h-3 w-3" />
                <span>Public</span>
             </div>
           ) : (
             <div className={`flex items-center gap-1 ${getLabelClass()} text-amber-200 font-bold transition-all`}>
                <Lock className="h-3 w-3" />
                <span>Secret</span>
             </div>
           )}
        </div>
      </motion.div>
      
      {/* 
        Content Section:
        - Removed mt-auto from input row to eliminate variable gap
        - Reduced gap-2 to gap-1.5 for tighter fit
        - Removed pt-1
      */}
      <CardContent className="p-2 flex flex-col gap-1.5 flex-1 z-10 bg-white transition-all">
        {/* Title */}
        <h3 className={`font-bold ${getTitleClass()} text-slate-900 leading-tight line-clamp-1 transition-all`} title={item.title}>
          {item.title}
        </h3>

        {/* Price Row */}
        <div className="flex items-end justify-between transition-all">
          <div className="flex flex-col">
            <span className={`${getLabelClass()} text-slate-500 font-bold uppercase tracking-wider transition-all`}>Asking</span>
            <span className={`${getPriceClass()} font-black text-slate-800 leading-none transition-all`}>
              {Math.round(item.askPrice/1000)}k
            </span>
          </div>
          
          <div className="flex flex-col items-end transition-all">
            <span className={`${getLabelClass()} text-slate-500 font-bold uppercase tracking-wider transition-all`}>
              {item.isPublicBid ? "High Bid" : "Offers"}
            </span>
            {item.isPublicBid && item.currentHighBid ? (
              <span className={`${getPriceClass()} font-black text-blue-600 leading-none transition-all`}>
                {Math.round(item.currentHighBid/1000)}k
              </span>
            ) : (
              <Badge variant="outline" className={`h-4 px-1.5 ${getLabelClass()} font-bold border-slate-300 text-slate-600 transition-all`}>
                {item.bidCount}
              </Badge>
            )}
          </div>
        </div>

        {/* Input Row - Removed mt-auto */}
        <div className="flex gap-1">
          <div className="relative flex-1">
             <Input 
                type="number" 
                placeholder="Your Offer..."
                value={bidAmount}
                onChange={(e) => {
                  setBidAmount(e.target.value);
                  setError(false);
                }}
                className={`h-9 px-2 text-sm font-bold bg-slate-50 border-slate-300 focus-visible:ring-2 focus-visible:ring-blue-600 
                  ${error ? 'border-red-500 bg-red-50 text-red-900 placeholder:text-red-400' : 'text-slate-900'}
                `}
              />
          </div>
          <Button 
            size="sm" 
            className="h-9 w-10 p-0 bg-blue-600 hover:bg-blue-700 rounded-md shrink-0 shadow-sm active:scale-95 transition-transform"
            onClick={handleBid}
          >
            <ArrowRight className="h-5 w-5 text-white stroke-[3px]" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
