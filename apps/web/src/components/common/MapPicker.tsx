"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { Search, MapPin, Loader2, Navigation, Crosshair } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { PAKISTAN_CITIES, CITY_COORDINATES } from "@/lib/constants/locations";
import { Button } from "@/components/ui/button";

// Dynamically import the Map component to avoid SSR issues
const LeafletMap = dynamic(
  () => import("./LeafletMap"),
  { 
    ssr: false,
    loading: () => (
      <div className="h-full w-full flex items-center justify-center bg-slate-100 text-slate-400">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }
);

interface LocationResult {
  lat: number;
  lng: number;
  address: string;
  city?: string;
}

interface MapPickerProps {
  initialLocation?: { lat: number; lng: number } | null;
  onLocationSelect: (location: LocationResult) => void;
  onGeocodingChange?: (isGeocoding: boolean) => void;
  className?: string;
  required?: boolean;
}

interface NominatimResult {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  boundingbox: string[];
  lat: string;
  lon: string;
  display_name: string;
  class: string;
  type: string;
  importance: number;
  icon?: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
    country_code?: string;
  };
}

export function MapPicker({ initialLocation, onLocationSelect, onGeocodingChange, className, required }: MapPickerProps) {
  // Default to Pakistan center if no location
  const DEFAULT_CENTER: [number, number] = [30.3753, 69.3451]; 
  const DEFAULT_ZOOM = 5;

  const [center, setCenter] = useState<[number, number]>(
    initialLocation ? [initialLocation.lat, initialLocation.lng] : DEFAULT_CENTER
  );
  
  const [address, setAddress] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Sync geocoding state with parent
  useEffect(() => {
    onGeocodingChange?.(isGeocoding);
  }, [isGeocoding, onGeocodingChange]);
  
  // Ref to prevent geocoding loop when location is manually set
  const skipGeocodeRef = useRef(false);
  // Ref to track if it's the initial load to potentially use IP location
  // const initializedRef = useRef(!!initialLocation); // REMOVED redundant auto-locate logic

  // REMOVED: Initial Location Strategy block (was duplicate of context logic)
  
  // Debounce search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length < 3) {
        setSearchResults([]);
        return;
      }
      
      setIsSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            searchQuery
          )}&countrycodes=pk&limit=5`
        );
        const data = await res.json();
        setSearchResults(data);
        setShowResults(true);
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reverse Geocode on pin move
  // STABILIZED: useCallback avoids unnecessary re-renders in LeafletMap
  const handleMapMove = useCallback((lat: number, lng: number) => {
    // Only update center if significantly different to avoid loops?
    // Actually, we must update center to keep pin in center of map view logic 
    // (though pin is CSS absolute center, map center is what matters).
    setCenter([lat, lng]);
    
    // We don't trigger geocode here directly, useEffect does it.
  }, []);

  // Ref to store the last geocoded coordinates to prevent loops
  const lastGeocodedCoords = useRef<[number, number] | null>(null);

  // We need a debounced effect for the address fetching based on center
  useEffect(() => {
    // If we just manually set the location (e.g. from search), skip this reverse geocode
    if (skipGeocodeRef.current) {
        skipGeocodeRef.current = false;
        lastGeocodedCoords.current = [...center];
        return;
    }

    // Check if we have moved significantly before triggering a new fetch
    if (lastGeocodedCoords.current) {
        const [lastLat, lastLng] = lastGeocodedCoords.current;
        const latDiff = Math.abs(lastLat - center[0]);
        const lngDiff = Math.abs(lastLng - center[1]);
        
        // Approx 10 meters threshold
        if (latDiff < 0.0001 && lngDiff < 0.0001) {
            return;
        }
    }

    const timer = setTimeout(async () => {
        setIsGeocoding(true);
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${center[0]}&lon=${center[1]}&zoom=18&addressdetails=1`
          );
          const data = await res.json();
          
          const addr = data.display_name || "Unknown Location";
          const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county;
          
          setAddress(addr);
          onLocationSelect({
            lat: center[0],
            lng: center[1],
            address: addr,
            city
          });
          
          lastGeocodedCoords.current = [...center];
        } catch (err) {
          console.error("Reverse geocode failed", err);
          setAddress(`${center[0].toFixed(4)}, ${center[1].toFixed(4)}`);
          onLocationSelect({
            lat: center[0],
            lng: center[1],
            address: `${center[0].toFixed(4)}, ${center[1].toFixed(4)}`,
            city: undefined
          });
          lastGeocodedCoords.current = [...center];
        } finally {
          setIsGeocoding(false);
        }
    }, 1200); // Increased debounce to 1200ms to avoid flicker during fine map adjustments

    return () => clearTimeout(timer);
  }, [center, onLocationSelect]); // Re-run when center changes (drag ends)

  const handleSearchResultClick = (result: NominatimResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    
    setCenter([lat, lng]);
    setSearchQuery("");
    setShowResults(false);
    
    // Use the display name from search result directly
    setAddress(result.display_name);
    
    // Extract city if possible, or just use first part
    const city = result.address?.city || result.display_name.split(',')[0];
    
    onLocationSelect({
        lat,
        lng,
        address: result.display_name,
        city
    });
    
    // Skip next reverse geocode since we just set it
    skipGeocodeRef.current = true;
  };

  const handleQuickCityClick = (cityName: string) => {
    const coords = CITY_COORDINATES[cityName];
    if (coords) {
      const lat = coords.lat;
      const lng = coords.lng;
      
      setCenter([lat, lng]);
      setAddress(`${cityName}, Pakistan`);
      
      onLocationSelect({
          lat,
          lng,
          address: `${cityName}, Pakistan`,
          city: cityName
      });
      
      // Skip next reverse geocode
      skipGeocodeRef.current = true;
    }
  };

  const handleLocateMe = () => {
      if ('geolocation' in navigator) {
          setIsGeocoding(true);
          navigator.geolocation.getCurrentPosition(
              (position) => {
                  const lat = position.coords.latitude;
                  const lng = position.coords.longitude;
                  setCenter([lat, lng]);
                  // Let the useEffect handle the reverse geocoding for this one
                  // to get the accurate address
                  setIsGeocoding(false);
              },
              (error) => {
                  console.error("Geolocation error:", error);
                  setIsGeocoding(false);
                  // Optional: Show toast error
              }
          );
      }
  };

  return (
    <div className={cn("flex flex-col gap-3 w-full h-full min-h-[400px]", className)}>
      {/* Search Bar */}
      <div className="relative z-[500] px-2 pt-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search city, area, or place..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white shadow-sm border-slate-200"
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-blue-600" />
          )}
        </div>

        {/* Search Results Dropdown */}
        {showResults && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden max-h-[200px] overflow-y-auto">
            {searchResults.map((result) => (
              <button
                key={result.place_id}
                className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 border-b border-slate-50 last:border-0 truncate"
                onClick={() => handleSearchResultClick(result)}
              >
                {result.display_name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map Area */}
      <div className="relative flex-1 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
        <LeafletMap 
          center={center} 
          zoom={initialLocation ? 13 : DEFAULT_ZOOM} 
          onMoveEnd={handleMapMove}
        />
        
        {/* GPS Button */}
        <Button
            type="button"
            variant="secondary"
            size="icon"
            className="absolute top-4 right-4 z-[400] bg-white shadow-md hover:bg-slate-50"
            onClick={handleLocateMe}
            title="Locate Me"
        >
            <Crosshair className="h-5 w-5 text-slate-700" />
        </Button>

        {/* Fixed Center Pin Overlay */}
        <div className="absolute inset-0 pointer-events-none z-[400] flex items-center justify-center pb-8">
          <div className="relative">
              <MapPin className="h-8 w-8 text-blue-600 fill-blue-600/20 drop-shadow-xl animate-bounce" style={{ animationDuration: '0.3s', animationIterationCount: 1 }} />
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-1 bg-black/20 rounded-full blur-[1px]" />
          </div>
        </div>

        {/* Address Badge Overlay */}
        <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md p-3 rounded-xl shadow-lg border border-slate-200/50 z-[400]">
          <div className="flex items-start gap-3">
            <div className="mt-1 bg-blue-50 p-1.5 rounded-full">
               {isGeocoding ? (
                 <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
               ) : (
                 <Navigation className="h-4 w-4 text-blue-600 fill-blue-600/20" />
               )}
            </div>
            <div className="flex-1 min-w-0">
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Selected Location</p>
               <p className="text-sm font-semibold text-slate-800 leading-snug truncate">
                 {address || "Drag map to select location"}
               </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick City Chips Fallback */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {PAKISTAN_CITIES.slice(0, 8).map((city) => (
           <button
             key={city}
             onClick={() => handleQuickCityClick(city)}
             className="px-3 py-1.5 bg-slate-50 hover:bg-white border border-slate-200 hover:border-blue-200 rounded-full text-xs font-medium text-slate-600 hover:text-blue-600 whitespace-nowrap transition-colors"
           >
             {city}
           </button>
        ))}
      </div>
      
      {/* Required Message */}
      {required && !address && (
         <p className="text-xs text-red-500 font-medium text-center">
           Please select a location on the map.
         </p>
      )}
    </div>
  );
}
