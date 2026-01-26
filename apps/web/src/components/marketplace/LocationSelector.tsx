"use client";

import React, { useState } from "react";
import { useApp } from "@/lib/store";
import { Button, ButtonProps } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { MapPin, Globe, Navigation } from "lucide-react";
import { cn, isLocationInCountry } from "@/lib/utils";
import { MapPicker } from "@/components/common/MapPicker";

interface LocationSelectorProps {
  className?: string;
  triggerClassName?: string;
  align?: "start" | "center" | "end";
  variant?: "default" | "mobile-grid" | "sidebar" | "sidebar-compact"; 
}

export function LocationSelector({ className, triggerClassName, align = "end", variant = "default" }: LocationSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (variant === "sidebar") {
    return (
      <div className={cn("w-full bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm", className)}>
        <LocationSelectorContent onSelect={() => {}} />
      </div>
    );
  }

  if (variant === "sidebar-compact") {
    return (
      <div id="location-selector-sidebar-compact" className={cn("w-full", className)}>
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <LocationSelectorTrigger variant={variant} isOpen={isOpen} />
          </PopoverTrigger>
          <PopoverContent className="w-[320px] p-0 shadow-lg border-slate-200 rounded-xl overflow-hidden" align="start" sideOffset={8}>
            <LocationSelectorContent onSelect={() => setIsOpen(false)} />
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  return (
    <div id="location-selector-root" className={cn("flex items-center gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <LocationSelectorTrigger variant={variant} isOpen={isOpen} className={triggerClassName} />
        </PopoverTrigger>
        <PopoverContent className="w-[340px] p-0 shadow-2xl border-slate-200 rounded-2xl overflow-hidden" align={align} sideOffset={8}>
          <LocationSelectorContent onSelect={() => setIsOpen(false)} />
        </PopoverContent>
      </Popover>
    </div>
  );
}

const LocationSelectorTrigger = React.forwardRef<HTMLButtonElement, Omit<ButtonProps, "variant"> & { variant: string, isOpen: boolean }>(
  ({ variant, isOpen, className, ...props }, ref) => {
  const { filters } = useApp();
  
  const getDisplayLabel = () => {
    // If we have a specific city, show it.
    if (filters.city && filters.city !== "Unknown") return filters.city;
    // If we have coords but no name yet, show "Near Me" or "Locating..." if strictly empty?
    // Actually Context initializes city to "", so if it's "" we are likely still locating or unset.
    if (filters.currentCoords) return "Current Location";
    // Default empty state - change to "Locating..." to imply activity if we assume auto-locate runs
    // But if auto-locate failed and we are in default state, "Set Location" is safer.
    // However, user complained about "Set Location". Let's use a neutral "Location".
    return "Locating...";
  };

  if (variant === "mobile-grid") {
    return (
      <Button
        ref={ref}
        id="location-popover-trigger-mobile"
        variant="outline"
        className={cn(
          "h-auto w-full flex flex-col items-center justify-center gap-1 p-2 bg-slate-50 border-slate-200 rounded-xl hover:bg-slate-100 active:scale-y-95 transition-all duration-200 ease-in-out shadow-sm hover:shadow-md",
          filters.locationMode !== "country" && "bg-blue-50 border-blue-200 ring-1 ring-blue-100",
          className
        )}
        {...props}
      >
        <div className="relative">
          {filters.locationMode === "country" ? (
            <Globe className="h-5 w-5 text-slate-500" />
          ) : filters.locationMode === "current" ? (
            <Navigation className="h-5 w-5 text-blue-600 fill-blue-600/10" />
          ) : (
            <MapPin className="h-5 w-5 text-blue-600 fill-blue-600/10" />
          )}
        </div>
        <span className={cn(
          "text-[10px] font-medium leading-none truncate w-full text-center",
          filters.locationMode !== "country" ? "text-blue-700 font-bold" : "text-slate-600"
        )}>
          {(getDisplayLabel() || "Everywhere").split(',')[0]}
        </span>
      </Button>
    );
  }

  if (variant === "sidebar-compact") {
    return (
      <Button
        ref={ref}
        id="location-sidebar-trigger"
        variant="outline"
        className={cn(
          "w-full justify-between px-3 h-9 bg-white border-slate-200 focus:ring-blue-500/20 text-slate-700 font-medium shadow-none transition-all group",
          isOpen && "border-blue-500 ring-2 ring-blue-500/10",
          className
        )}
        {...props}
      >
        <span className="flex items-center gap-2 truncate">
           <span className="truncate text-xs">{getDisplayLabel()}</span>
        </span>
        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-normal bg-slate-50 px-1.5 py-0.5 rounded-md border border-slate-100">
          {filters.radius >= 500 ? "∞" : `${filters.radius}km`}
        </div>
      </Button>
    );
  }

  return (
    <Button
      ref={ref}
      id="location-popover-trigger"
      variant="ghost"
      className={cn("h-7 min-h-0 flex items-center gap-1.5 px-2 rounded-full hover:bg-slate-100 transition-colors", className)}
      {...props}
      title={getDisplayLabel()}
    >
      <MapPin className="h-4 w-4 text-red-600 stroke-[2.5]" />
      <span className="text-xs font-bold text-slate-700 max-w-[120px] truncate hidden lg:inline">
        {getDisplayLabel().split(',')[0]}
      </span>
    </Button>
  );
});
LocationSelectorTrigger.displayName = "LocationSelectorTrigger";

function LocationSelectorContent({ onSelect }: { onSelect: () => void }) {
  const { filters, setFilter, updateFilters, user } = useApp();
  const [tempLocation, setTempLocation] = useState<{ lat: number; lng: number; address: string; city?: string } | null>(null);
  // Initialize tempRadius from current filter
  const [tempRadius, setTempRadius] = useState(filters.radius);
  
  const isOutside = !isLocationInCountry(user?.location.address);

  // Called whenever map moves or search selected - only updates local state
  const handleLocationSelect = (loc: { lat: number; lng: number; address: string; city?: string }) => {
    setTempLocation(loc);
  };

  // Auto-locate effect when opening the map IF no specific location is set yet
  // This bridges the gap if auto-locate failed on mount or if user wants to re-center
  // But wait, user said "only when I open it, that it locates me". 
  // If the context auto-locate worked, filters.currentCoords should already be set.
  // If filters.currentCoords is set, MapPicker initializes with it.
  
  const handleConfirm = () => {
    if (tempLocation) {
        updateFilters({
          currentCoords: { lat: tempLocation.lat, lng: tempLocation.lng },
          locationMode: "current",
          city: tempLocation.city || tempLocation.address.split(',')[0] || "Unknown",
          sortBy: "nearest",
          radius: tempRadius >= 200 ? 500 : tempRadius // Include radius update here
        });
    } else if (tempRadius !== filters.radius) {
        // If location wasn't moved but radius was changed
        setFilter("radius", tempRadius >= 200 ? 500 : tempRadius);
    }
    onSelect(); // Close popover
  };

  const handleRadiusChange = (vals: number[]) => {
    setTempRadius(vals[0]);
  };

  const displayRadius = tempRadius >= 200 ? 200 : tempRadius;

  return (
    <div className="flex flex-col w-full bg-white">
      {/* Search Radius Section */}
      {!isOutside && (
        <div className="p-3 pb-2 border-b bg-slate-50/30">
          <div className="flex items-center justify-between mb-1.5 px-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Range</span>
            <span className="text-[10px] font-black text-blue-600 bg-blue-50/50 px-1.5 py-0.5 rounded">
              {tempRadius >= 500 ? "∞" : `${tempRadius}km`}
            </span>
          </div>
          <Slider
            value={[displayRadius]}
            max={200}
            min={5}
            step={5}
            className="py-1 cursor-pointer"
            onValueChange={handleRadiusChange}
          />
        </div>
      )}

      {/* Map Picker */}
      <div className="h-[350px]">
        <MapPicker 
          initialLocation={filters.currentCoords}
          onLocationSelect={handleLocationSelect}
          className="h-full border-none rounded-none"
        />
      </div>
      
      {/* Footer / Confirm */}
      <div className="p-2 border-t bg-slate-50 flex justify-end">
        <Button 
          size="sm" 
          className="h-8 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white"
          onClick={handleConfirm}
        >
          Confirm Selected Location
        </Button>
      </div>
    </div>
  );
}

export default LocationSelector;
