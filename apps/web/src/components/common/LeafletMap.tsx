"use client";

import { useEffect, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin } from "lucide-react";
import L from "leaflet";

// Fix for Leaflet icon issues in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface LeafletMapProps {
  center: [number, number];
  zoom: number;
  onMoveEnd: (lat: number, lng: number) => void;
  isGeocoding: boolean;
}

// Helper to center map when props change
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  const previousCenter = useRef<[number, number] | null>(null);

  useEffect(() => {
    if (map) {
      // Check distance to avoid tiny micro-moves triggering loops
      // If distance is significant (> 10 meters roughly), then fly
      const current = map.getCenter();
      const dist = current.distanceTo(L.latLng(center[0], center[1]));
      
      // Only fly if distance is > 100 meters to allow free dragging
      // When dragging, center prop updates via onMoveEnd -> state -> center prop
      // We want to avoid flyTo fighting the drag.
      // Actually, if we are dragging, we don't want flyTo to fire at all.
      // But we can't easily detect "isDragging" here without more state.
      // Simple heuristic: if the difference is small, assume it's sync, don't fly.
      
      if (dist > 50) { 
         map.flyTo(center, 13);
      }
    }
  }, [center, map]);
  return null;
}

// Component to handle map clicks/drags and update parent
function MapEvents({ onMoveEnd }: { onMoveEnd: (lat: number, lng: number) => void }) {
  const map = useMapEvents({
    moveend: () => {
      const center = map.getCenter();
      onMoveEnd(center.lat, center.lng);
    },
  });
  return null;
}

export default function LeafletMap({ center, zoom, onMoveEnd, isGeocoding }: LeafletMapProps) {
  // Approximate bounds for Pakistan to prevent panning too far away
  // SouthWest: [23.0, 60.0], NorthEast: [37.5, 78.0]
  const pakistanBounds = L.latLngBounds(
    L.latLng(23.0, 60.0), // South West
    L.latLng(37.5, 78.0)  // North East
  );

  return (
    <MapContainer 
      center={center} 
      zoom={zoom} 
      scrollWheelZoom={true}
      style={{ height: "100%", width: "100%" }}
      className="z-0"
      minZoom={5}
      maxBounds={pakistanBounds}
      maxBoundsViscosity={1.0}
    >
      {/* CartoDB Voyager Tiles (Apple-like clean style) */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />
      
      <MapUpdater center={center} />
      <MapEvents onMoveEnd={onMoveEnd} />
    </MapContainer>
  );
}
