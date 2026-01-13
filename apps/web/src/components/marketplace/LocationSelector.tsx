"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { PAKISTAN_CITIES } from "@/lib/constants/locations";
import { Check, ChevronsUpDown, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface LocationSelectorProps {
  className?: string;
  align?: "start" | "center" | "end";
}

export function LocationSelector({ className, align = "end" }: LocationSelectorProps) {
  const { filters, setFilter } = useApp();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div id="location-selector-root" className={cn("flex items-center gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="location-popover-trigger"
            variant="outline"
            role="combobox"
            aria-expanded={isOpen}
            className="h-10 px-3 bg-white border-slate-200 shadow-sm min-w-[140px] max-w-[180px] justify-between hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-2 truncate">
              <MapPin className="h-4 w-4 text-blue-500 fill-blue-500/10 shrink-0" />
              <span className="truncate text-sm font-medium">
                {filters.locationMode === "current" ? "Current" : filters.city}
              </span>
              {filters.locationMode === "city" && (
                <span className="text-[10px] text-muted-foreground shrink-0">({filters.radius}km)</span>
              )}
            </div>
            <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[240px] p-0" align={align}>
          <Command className="border-none">
            <CommandInput placeholder="Search city..." className="h-9" />
            <CommandList>
              <CommandEmpty>No city found.</CommandEmpty>
              <CommandGroup heading="Quick Settings">
                <CommandItem
                  onSelect={() => {
                    setFilter("locationMode", "current");
                    setIsOpen(false);
                  }}
                  className="cursor-pointer"
                >
                  <MapPin className="mr-2 h-4 w-4 text-blue-500" />
                  <span>Current (Karachi)</span>
                  {filters.locationMode === "current" && <Check className="ml-auto h-4 w-4" />}
                </CommandItem>
              </CommandGroup>
              <CommandGroup heading="Pakistan Cities">
                {PAKISTAN_CITIES.map((city) => (
                  <CommandItem
                    key={city}
                    value={city}
                    onSelect={() => {
                      setFilter("city", city);
                      setFilter("locationMode", "city");
                      setIsOpen(false);
                    }}
                    className="cursor-pointer"
                  >
                    <span>{city}</span>
                    {filters.locationMode === "city" && filters.city === city && (
                      <Check className="ml-auto h-4 w-4" />
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
