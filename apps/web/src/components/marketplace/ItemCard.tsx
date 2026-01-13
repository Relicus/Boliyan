import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { Item, User } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, ArrowRight, Lock, Globe, Clock } from "lucide-react";
import { useApp } from "@/lib/store";

interface ItemCardProps {
  item: Item;
  seller: User;
  viewMode?: 'compact' | 'comfortable' | 'spacious';
}

export default function ItemCard({ item, seller, viewMode = 'compact' }: ItemCardProps) {
  const { placeBid } = useApp();

  // Helper for compact price display (e.g. 185.5k)
  // Helper for price display
  const formatDisplayPrice = (price: number) => {
    if (viewMode === 'spacious') {
      return Math.round(price).toLocaleString();
    }
    return (price / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  };

  // Smart Step Logic
  const getSmartStep = (price: number) => {
    if (price >= 100000) return 1000;
    if (price >= 10000) return 500;
    return 100;
  };

  // Initialize with Ask Price or Current High Bid
  const initialBid = item.isPublicBid && item.currentHighBid
    ? item.currentHighBid + getSmartStep(item.currentHighBid)
    : item.askPrice;

  const [bidAmount, setBidAmount] = useState<string>(initialBid.toLocaleString());
  const [error, setError] = useState<boolean>(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Stable "random" distance based on item ID to prevent hydration mismatch
  const distance = useMemo(() => {
    const hash = item.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const dist = ((hash % 80) / 10 + 1.2).toFixed(1);
    const dur = Math.round(Number(dist) * 2.5); // Approx 2.5 mins per km
    return { distance: dist, duration: dur };
  }, [item.id]);

  const handleSmartAdjust = (e: React.MouseEvent, direction: 1 | -1) => {
    e.stopPropagation();
    const current = parseFloat(bidAmount.replace(/,/g, '')) || 0;
    const step = getSmartStep(current);
    const newValue = Math.max(0, current + (step * direction));
    setBidAmount(newValue.toLocaleString());
    setError(false);
  };

  const handleBid = (e?: React.MouseEvent) => {
    e?.stopPropagation(); // Prevent dialog from opening when clicking bid button
    const amount = parseFloat(bidAmount.replace(/,/g, ''));
    const minBid = item.askPrice * 0.7;

    if (isNaN(amount) || amount < minBid) {
      setError(true);
      setTimeout(() => setError(false), 2000);
      return;
    }

    placeBid(item.id, amount, item.isPublicBid ? 'public' : 'private');
    // Don't reset bid amount completely, just keep it ready for next bid or update
    setIsDialogOpen(false);
  };

  const handleInputClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent dialog from opening when clicking input
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Prevent 'e', 'E', '+', '-'
    if (['e', 'E', '+', '-'].includes(e.key)) {
      e.preventDefault();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/,/g, '');
    if (raw === '') {
      setBidAmount('');
      setError(false);
      return;
    }
    if (/^\d+$/.test(raw)) {
      setBidAmount(parseInt(raw, 10).toLocaleString());
      setError(false);
    }
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
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Card
          className="group border-none shadow-sm hover:shadow-md transition-shadow duration-200 bg-white rounded-lg overflow-hidden flex flex-col will-change-transform cursor-pointer"
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
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-[2px] px-2 py-1.5 flex justify-between items-center z-10 transition-all">
                <div className="flex items-center gap-3 overflow-hidden min-w-0">
                  <div className={`flex items-center gap-2 ${getLabelClass()} text-white font-bold tracking-wide shrink-0`}>
                    <div className="flex items-center gap-0.5">
                      <MapPin className="h-3 w-3 text-red-500" />
                      {distance.distance}km
                    </div>
                    <div className="flex items-center gap-0.5">
                       <Clock className="h-3 w-3 text-blue-400" />
                       {distance.duration}min
                    </div>
                  </div>
                  {viewMode !== 'compact' && (
                    <div className="flex items-center gap-1 text-[10px] text-slate-300 font-medium truncate border-l border-white/20 pl-2">
                       <MapPin className="h-3 w-3 text-slate-400" />
                       <span className="truncate max-w-[100px]">{seller.location.address}</span>
                    </div>
                  )}
                </div>

                {item.isPublicBid ? (
                  <Badge variant="secondary" className="h-6 px-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-100 border border-blue-500/50 backdrop-blur-md shadow-sm text-[10px] font-bold">
                    <Globe className="h-3.5 w-3.5 mr-1.5" />
                    Public
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="h-6 px-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-100 border border-amber-500/50 backdrop-blur-md shadow-sm text-[10px] font-bold">
                    <Lock className="h-3.5 w-3.5 mr-1.5" />
                    Secret
                  </Badge>
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
              <h3 className={`font-bold ${getTitleClass()} text-slate-900 leading-tight ${viewMode === 'compact' ? 'line-clamp-1' : 'line-clamp-2'} transition-all`} title={item.title}>
                {item.title}
              </h3>

              {/* Price Row */}
              <div className="flex items-end justify-between transition-all">
                <div className="flex flex-col">
                  <span className={`${getLabelClass()} text-slate-500 font-bold uppercase tracking-wider transition-all`}>Asking</span>
                  <span className={`${getPriceClass()} font-black text-slate-800 leading-none transition-all`}>
                    {formatDisplayPrice(item.askPrice)}
                  </span>
                </div>

                <div className="flex flex-col items-end transition-all">
                  <span className={`${getLabelClass()} text-slate-500 font-bold uppercase tracking-wider transition-all`}>
                    {item.isPublicBid ? "High Bid" : "Sealed Bids"}
                  </span>
                  {item.isPublicBid && item.currentHighBid ? (
                    <span className={`${getPriceClass()} font-black text-blue-600 leading-none transition-all`}>
                      {formatDisplayPrice(item.currentHighBid)}
                    </span>
                  ) : (
                    <Badge variant="outline" className={`px-1.5 py-0 min-h-0 h-auto ${getPriceClass()} leading-none font-black bg-amber-50 text-amber-700 border-amber-200 transition-all`}>
                      {item.bidCount} Active
                    </Badge>
                  )}
                </div>
              </div>

              {/* Spacious Mode Details */}
              {viewMode === 'spacious' && (
                <div className="mt-2 mb-1 animate-in fade-in duration-300">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="h-5 w-5 rounded-full bg-slate-200 overflow-hidden shrink-0">
                      <img src={seller.avatar} alt={seller.name} className="h-full w-full object-cover" />
                    </div>
                    <span className="text-xs font-bold text-slate-700 truncate">{seller.name}</span>
                    <div className="flex items-center gap-0.5 ml-auto text-[10px] text-slate-500">
                      <MapPin className="h-2.5 w-2.5 text-red-500" />
                      <span className="truncate max-w-[80px]">{seller.location.address}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              )}

              {/* Smart Stepper Input Row - Stacked Layout */}
              <div className="flex flex-col gap-2 mt-1">
                <div className="flex h-9 shadow-sm w-full">
                  <div className="flex flex-1 border border-slate-300 rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-blue-600 focus-within:border-blue-600">
                    {/* Decrement Button - Large Touch Target */}
                    <button
                      onClick={(e) => handleSmartAdjust(e, -1)}
                      className="w-10 bg-slate-50 hover:bg-slate-100 border-r border-slate-200 flex items-center justify-center text-slate-500 hover:text-red-600 transition-colors active:bg-slate-200"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M18 12H6" /></svg>
                    </button>

                    {/* Input */}
                    <input
                      type="text"
                      value={bidAmount}
                      onClick={handleInputClick}
                      onKeyDown={handleKeyDown}
                      onChange={handleInputChange}
                      className={`flex-1 w-full text-center text-sm font-bold text-slate-900 focus:outline-none px-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
                              ${error ? 'bg-red-50 text-red-900 text-red-900 placeholder:text-red-400' : 'bg-white'}
                            `}
                    />

                    {/* Increment Button - Large Touch Target */}
                    <button
                      onClick={(e) => handleSmartAdjust(e, 1)}
                      className="w-10 bg-slate-50 hover:bg-slate-100 border-l border-slate-200 flex items-center justify-center text-slate-500 hover:text-green-600 transition-colors active:bg-slate-200"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6v12m6-6H6" /></svg>
                    </button>
                  </div>
                </div>

                {/* Submit Bid Button - Full Width New Line */}
                <button
                  onClick={handleBid}
                  className="w-full h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center justify-center shadow-sm transition-colors active:scale-95 font-bold text-sm tracking-wide"
                >
                  Place Bid
                </button>
              </div>
            </CardContent>
          </Card>
        </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-transparent border-none shadow-none sm:bg-white sm:border sm:shadow-lg sm:block gap-0">
        <motion.div
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 0.8 }}
          onDragEnd={(_, info) => {
            if (info.offset.y > 150) {
              setIsDialogOpen(false);
            }
          }}
          className="bg-white rounded-lg overflow-hidden w-full h-full max-h-[85vh] sm:max-h-full sm:h-auto flex flex-col"
        >
          {/* Mobile Drag Handle */}
          <div className="h-1.5 w-12 bg-slate-300 rounded-full mx-auto my-2 absolute top-1 left-1/2 -translate-x-1/2 z-20 sm:hidden" />
          
          <div className="relative h-52 sm:h-60 w-full bg-slate-100 shrink-0">
            <img
              src={item.images[0]}
              alt={item.title}
              className="object-cover w-full h-full"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-12">
              <div className="flex justify-between items-end">
                <DialogTitle className="text-xl font-bold text-white leading-tight">{item.title}</DialogTitle>
                {item.isPublicBid ? (
                  <Badge variant="secondary" className="font-bold bg-blue-500 text-white hover:bg-blue-600 border-none shadow-sm">
                    <Globe className="h-3 w-3 mr-1" />
                    Public Bid
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="font-bold bg-amber-500 text-white hover:bg-amber-600 border-none shadow-sm">
                    <Lock className="h-3 w-3 mr-1" />
                    Sealed Bid
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(85vh-200px)] sm:max-h-none overscroll-contain">
            {/* Price Info Grid */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase">Asking Price</span>
                <div className="text-2xl font-black text-slate-800">{Math.round(item.askPrice).toLocaleString()} PKR</div>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-slate-500 uppercase">
                  {item.isPublicBid ? "Current High" : "Offers Made"}
                </span>
                <div className="text-2xl font-black text-blue-600">
                  {item.isPublicBid && item.currentHighBid
                    ? `${Math.round(item.currentHighBid).toLocaleString()} PKR`
                    : `${item.bidCount} Offers`
                  }
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-900">Description</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                {item.description}
              </p>
            </div>

            {/* Seller Info */}
            <div className="flex items-center gap-3 py-3 border-t border-b border-slate-100">
              <div className="h-10 w-10 rounded-full bg-slate-200 overflow-hidden">
                <img src={seller.avatar} alt={seller.name} className="h-full w-full object-cover" />
              </div>
              <div>
                <div className="font-bold text-slate-900 text-sm">{seller.name}</div>
                <div className="text-xs text-slate-500 flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-red-500" />
                  {seller.location.address}
                </div>
                <div className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                  <Clock className="h-3 w-3 text-blue-500" />
                  {distance.duration} min drive ({distance.distance} km)
                </div>
              </div>
              <div className="ml-auto flex flex-col items-end">
                <Badge variant="outline" className="font-bold bg-yellow-50 text-yellow-700 border-yellow-200">
                  ⭐ {seller.rating}
                </Badge>
              </div>
            </div>

            {/* Smart Stepper Bidding Section in Modal */}
            <div className="space-y-3 pb-4 sm:pb-0">
              <label className="block text-sm font-bold text-slate-900 mb-2">Place Your Bid</label>

              <div className="flex h-12 shadow-sm">
                <div className="flex flex-1 border border-slate-300 rounded-l-md overflow-hidden focus-within:border-blue-600">
                  {/* Decrement Button - Extra Large for Modal */}
                  <button
                    onClick={(e) => handleSmartAdjust(e, -1)}
                    className="w-14 bg-slate-50 hover:bg-slate-100 border-r border-slate-200 flex items-center justify-center text-slate-500 hover:text-red-600 transition-colors active:bg-slate-200"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M18 12H6" /></svg>
                  </button>

                  {/* Input */}
                  <input
                    type="text"
                    value={bidAmount}
                    onKeyDown={handleKeyDown}
                    onChange={handleInputChange}
                    className={`flex-1 w-full text-center text-xl font-bold text-slate-900 focus:outline-none px-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
                          ${error ? 'bg-red-50 text-red-900 placeholder:text-red-400' : 'bg-white'}
                        `}
                  />

                  {/* Increment Button - Extra Large for Modal */}
                  <button
                    onClick={(e) => handleSmartAdjust(e, 1)}
                    className="w-14 bg-slate-50 hover:bg-slate-100 border-l border-slate-200 flex items-center justify-center text-slate-500 hover:text-green-600 transition-colors active:bg-slate-200"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6v12m6-6H6" /></svg>
                  </button>
                </div>

                {/* Submit Bid Button */}
                <button
                  onClick={() => handleBid()}
                  className="px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-r-md font-bold shadow-sm transition-colors active:scale-95 text-lg"
                >
                  Bid
                </button>
              </div>

              {error && (
                <p className="text-xs text-red-500 font-bold">
                  Bid must be at least {Math.round(item.askPrice * 0.7).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
