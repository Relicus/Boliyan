"use client";

import React, { useState } from "react";
import { useApp } from "@/lib/store";
import { Button, ButtonProps } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Slider } from "@/components/ui/slider";
import { PAKISTAN_CITIES, CITY_COORDINATES } from "@/lib/constants/locations";
import { Check, MapPin, Globe, Navigation, Search } from "lucide-react";
import { cn, isLocationInCountry } from "@/lib/utils";


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
          <PopoverContent className="w-[280px] p-0 shadow-lg border-slate-200 rounded-xl overflow-hidden" align="start" sideOffset={8}>
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
        <PopoverContent className="w-[300px] p-0 shadow-2xl border-slate-200 rounded-2xl overflow-hidden" align={align} sideOffset={8}>
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
    if (filters.locationMode === "current") return "Near Me";
    return filters.city;
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
          {(getDisplayLabel() || "Everywhere").split(' ')[0]}
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
        {getDisplayLabel().split(' ')[0]}
      </span>
    </Button>
  const [isLocating, setIsLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);

  const isOutside = !isLocationInCountry(user?.location.address);

  const handleCurrentLocation = async (e?: React.MouseEvent | React.PointerEvent) => {

    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    setLocError(null);
    setIsLocating(true);

    if (!window.isSecureContext && window.location.hostname !== "localhost") {
      setLocError("Needs HTTPS");
      setIsLocating(false);
      return;
    }

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          updateFilters({
            currentCoords: { lat: latitude, lng: longitude },
            locationMode: "current",
            city: "Near Me",
            sortBy: "nearest"
          });
          setIsLocating(false);
          onSelect();
        },
        (error) => {
          console.error("Error getting location:", error);
          setLocError(error.code === 1 ? "Permission Denied" : "Search Failed");
          setIsLocating(false);
        },
        { timeout: 10000 }
      );
    } else {
      setLocError("Not Supported");
      setIsLocating(false);
    }
  };

  const handleRadiusChange = (vals: number[]) => {
    const val = vals[0];
    setFilter("radius", val >= 200 ? 500 : val);
  };

  const displayRadius = filters.radius >= 200 ? 200 : filters.radius;

  return (
    <div className="flex flex-col w-full">
      {/* Search Radius Section - Ultra Compact */}
      {!isOutside && (
        <div className="p-3 pb-2 border-b bg-slate-50/30">
          <div className="flex items-center justify-between mb-1.5 px-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Range</span>
            <span className="text-[10px] font-black text-blue-600 bg-blue-50/50 px-1.5 py-0.5 rounded">
              {filters.radius >= 500 ? "∞" : `${filters.radius}km`}
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

      {/* Current Location Button */}

      <div className="p-1 border-b bg-white">
         <div
            onPointerDown={handleCurrentLocation}
            className={cn(
              "flex items-center w-full px-2 py-1.5 rounded-md cursor-pointer transition-all active:scale-[0.96]",
              isLocating ? "bg-slate-50 opacity-70" : "hover:bg-slate-50",
              locError ? "bg-red-50 text-red-600 border border-red-100" : "text-sm"
            )}
            id="loc-option-near-me-direct"
         >
            <Navigation className={cn("mr-2 h-3.5 w-3.5", isLocating ? "animate-pulse text-blue-500" : (locError ? "text-red-500" : "text-blue-500"))} />
            <span className="font-bold flex-1 text-left text-xs">
              {isLocating ? "Locating..." : (locError || "Near Me")}
            </span>
            {filters.locationMode === "current" && !locError && <Check className="ml-auto h-3.5 w-3.5 text-blue-600" />}
         </div>
         {locError === "Needs HTTPS" && (
            <div className="mt-1 px-2 text-[8px] text-red-400 leading-tight">
              Needs HTTPS for GPS. Pick a city below.
            </div>
         )}
      </div>

      {/* Cities Search Section */}
      <Command className="border-none flex-1 flex flex-col min-h-0">
        <div className="flex items-center px-2 border-b shrink-0 h-9">
          <Search className="mr-2 h-3.5 w-3.5 shrink-0 opacity-40" />
          <CommandInput placeholder="Search city..." className="h-full border-none focus:ring-0 shadow-none bg-transparent text-xs" />
        </div>
        
        <CommandList className="flex-1 max-h-[300px] overflow-y-auto scrollbar-thin">
          <CommandEmpty className="py-2 text-xs text-slate-400 text-center">No city found.</CommandEmpty>
          <CommandGroup heading="Pakistan Cities" className="p-1 px-1">
            {Array.from(new Set(PAKISTAN_CITIES)).map((city) => (
              <CommandItem
                key={city}
                value={city}
                onSelect={() => {
                  updateFilters({
                    city: city,
                    locationMode: "city",
                    currentCoords: CITY_COORDINATES[city] || filters.currentCoords,
                    sortBy: "nearest"
                  });
                  onSelect();
                }}
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                className="rounded-md py-1.5 cursor-pointer hover:bg-slate-50"
              >
                <MapPin className="mr-2 h-3 w-3 text-slate-400 opacity-40" />
                <span className="text-xs font-semibold text-slate-600">{city}</span>
                {filters.locationMode === "city" && filters.city === city && (
                  <Check className="ml-auto h-3 w-3 text-blue-600" />
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  );
}

export default LocationSelector;
