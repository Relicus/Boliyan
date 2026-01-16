"use client";

import { useState, useCallback } from "react";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Slider } from "@/components/ui/slider";
import { PAKISTAN_CITIES, CITY_COORDINATES } from "@/lib/constants/locations";
import { Check, ChevronsUpDown, MapPin, Globe, Navigation, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface LocationSelectorProps {
  className?: string;
  align?: "start" | "center" | "end";
}

export function LocationSelector({ className, align = "end" }: LocationSelectorProps) {
  const { filters, setFilter } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const handleCurrentLocation = async () => {
    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setFilter("currentCoords", { lat: latitude, lng: longitude });
          setFilter("locationMode", "current");
          setFilter("city", "Near Me");
          setIsLocating(false);
          setIsOpen(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          setIsLocating(false);
          // Fallback or error message could go here
        }
      );
    } else {
      setIsLocating(false);
    }
  };

  const getDisplayLabel = () => {
    if (filters.locationMode === "country") return "Pakistan";
    if (filters.locationMode === "current") return "Near Me";
    return filters.city;
  };

  return (
    <div id="location-selector-root" className={cn("flex items-center gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="location-popover-trigger"
            variant="outline"
            role="combobox"
            aria-expanded={isOpen}
            className="h-11 px-4 bg-slate-50 border-slate-200 shadow-sm min-w-[160px] max-w-[220px] justify-between hover:bg-slate-100 hover:border-slate-300 transition-all rounded-xl group"
          >
            <div className="flex items-center gap-2.5 truncate">
              {filters.locationMode === "country" ? (
                <Globe className="h-4 w-4 text-slate-400 shrink-0 group-hover:text-blue-500 transition-colors" />
              ) : filters.locationMode === "current" ? (
                <Navigation className="h-4 w-4 text-blue-500 fill-blue-500/10 shrink-0" />
              ) : (
                <MapPin className="h-4 w-4 text-blue-500 fill-blue-500/10 shrink-0" />
              )}
              <div className="flex flex-col items-start overflow-hidden">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 group-hover:text-slate-500 transition-colors">Location</span>
                <span className="truncate text-sm font-semibold text-slate-700">
                  {getDisplayLabel()}
                </span>
              </div>
            </div>
            <Search className="ml-2 h-3.5 w-3.5 shrink-0 opacity-40 group-hover:opacity-70 transition-opacity" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0 shadow-2xl border-slate-200 rounded-2xl overflow-hidden" align={align} sideOffset={8}>
          <div className="p-4 border-b bg-slate-50/50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Search Radius</span>
              <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                {filters.radius >= 500 ? "Whole Country" : `${filters.radius} km`}
              </span>
            </div>
            <Slider
              defaultValue={[filters.radius]}
              max={500}
              min={5}
              step={5}
              className="py-2"
              onValueChange={(vals) => setFilter("radius", vals[0])}
            />
            <div className="flex justify-between mt-1 px-0.5 text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
              <span>5km</span>
              <span>Whole Country</span>
            </div>
          </div>

          <Command className="border-none">
            <div className="flex items-center px-3 border-b">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <CommandInput placeholder="Search city or area..." className="h-11 border-none focus:ring-0 shadow-none bg-transparent" />
            </div>
            <CommandList className="max-h-[300px]">
              <CommandEmpty>No city found.</CommandEmpty>
              <CommandGroup heading="Global Options" className="p-2">
                <CommandItem
                  onSelect={() => {
                    setFilter("locationMode", "country");
                    setFilter("radius", 500);
                    setIsOpen(false);
                  }}
                  className="rounded-lg py-2.5 cursor-pointer hover:bg-slate-50"
                  id="loc-option-whole-country"
                >
                  <Globe className="mr-2.5 h-4 w-4 text-slate-500" />
                  <span className="font-medium">Whole Country (Pakistan)</span>
                  {filters.locationMode === "country" && <Check className="ml-auto h-4 w-4 text-blue-600" />}
                </CommandItem>
                <CommandItem
                  onSelect={handleCurrentLocation}
                  className="rounded-lg py-2.5 cursor-pointer hover:bg-slate-50"
                  disabled={isLocating}
                  id="loc-option-near-me"
                >
                  <Navigation className={cn("mr-2.5 h-4 w-4 text-blue-500", isLocating && "animate-pulse")} />
                  <span className="font-medium">{isLocating ? "Locating..." : "Use My Current Location"}</span>
                  {filters.locationMode === "current" && <Check className="ml-auto h-4 w-4 text-blue-600" />}
                </CommandItem>
              </CommandGroup>
              
              <CommandGroup heading="Pakistan Cities" className="p-2 pt-0">
                {PAKISTAN_CITIES.map((city) => (
                  <CommandItem
                    key={city}
                    value={city}
                    onSelect={() => {
                      setFilter("city", city);
                      setFilter("locationMode", "city");
                      if (CITY_COORDINATES[city]) {
                        setFilter("currentCoords", CITY_COORDINATES[city]);
                      }
                      setIsOpen(false);
                    }}
                    className="rounded-lg py-2.5 cursor-pointer hover:bg-slate-50"
                  >
                    <MapPin className="mr-2.5 h-4 w-4 text-slate-400 opacity-50" />
                    <span className="font-medium">{city}</span>
                    {filters.locationMode === "city" && filters.city === city && (
                      <Check className="ml-auto h-4 w-4 text-blue-600" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
