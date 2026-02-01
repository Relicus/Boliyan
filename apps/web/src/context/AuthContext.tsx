"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { User } from "@/types";
import { supabase } from "@/lib/supabase";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { useRouter } from "next/navigation";
import { getCurrentLocation } from "@/lib/location";
import { getAuthRedirectUrl } from "@/lib/nativeAuth";

interface UserLocation {
  lat: number;
  lng: number;
  city: string;
  address: string;
}

interface AuthContextType {
  user: User | null;
  myLocation: UserLocation | null;
  setMyLocation: (location: UserLocation) => void;
  isLoggedIn: boolean;
  isLoading: boolean;
  isAdminMode: boolean;
  toggleAdminMode: () => void;
  login: (provider?: 'google' | 'facebook') => Promise<void>;
  logout: () => Promise<void>;
  getUser: (id: string) => User | undefined; // Keep for compat, though less useful with real auth
  updateProfile: (data: Partial<User>) => Promise<void>;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [myLocation, setMyLocationState] = useState<UserLocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const router = useRouter();

  // Load admin mode preference from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('boliyan_admin_mode');
      if (saved === 'true') setIsAdminMode(true);
    } catch { /* ignore */ }
  }, []);

  const toggleAdminMode = useCallback(() => {
    setIsAdminMode(prev => {
      const next = !prev;
      try {
        if (next) {
          localStorage.setItem('boliyan_admin_mode', 'true');
        } else {
          localStorage.removeItem('boliyan_admin_mode');
        }
      } catch { /* ignore */ }
      // Defer navigation to avoid setState-during-render error
      setTimeout(() => {
        router.push(next ? '/admin/reports' : '/');
      }, 0);
      return next;
    });
  }, [router]);

  // Robust Auto-Locate Logic (moved from MarketplaceContext)
  useEffect(() => {
    let mounted = true;
    const locationSetRef = { current: false };

    const saveLocation = (lat: number, lng: number, city: string, isHighAccuracy: boolean = false) => {
        if (!mounted) return;
        
        // Don't downgrade accuracy: If we already have high accuracy (GPS), don't let IP overwrite it
        if (locationSetRef.current && !isHighAccuracy) return;
        
        const loc = { lat, lng, city, address: city }; // Simple address fallback for myLocation
        setMyLocationState(loc);
        locationSetRef.current = true;
        
        try {
            localStorage.setItem('boliyan_user_location', JSON.stringify(loc));
        } catch { /* ignore */ }
    };

    const fetchIpLocation = async () => {
        if (locationSetRef.current) return;

        const fetchWithTimeout = async (url: string, timeout = 8000) => {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), timeout);
            try {
                const response = await fetch(url, { signal: controller.signal });
                clearTimeout(id);
                return response;
            } catch (err) {
                clearTimeout(id);
                throw err;
            }
        };

        try {
            const res = await fetchWithTimeout('https://ipapi.co/json/');
            if (!res.ok) throw new Error('IP API failed');
            const data = await res.json();
            if (data.latitude && data.longitude && data.country_code === 'PK') {
                if (!locationSetRef.current) {
                    saveLocation(parseFloat(data.latitude), parseFloat(data.longitude), data.city || "Unknown", false);
                }
                return;
            }
        } catch {
            try {
                const res = await fetchWithTimeout('https://ipwho.is/');
                const data = await res.json();
                if (data.success && data.country_code === 'PK') {
                    if (!locationSetRef.current) {
                        saveLocation(parseFloat(data.latitude), parseFloat(data.longitude), data.city || "Unknown", false);
                    }
                }
            } catch { /* ignore */ }
        }
    };

    const initializeLocation = async () => {
        try {
            // 1. Try localStorage
            const saved = localStorage.getItem('boliyan_user_location');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.city && parsed.lat && parsed.lng) {
                    setMyLocationState(parsed);
                    locationSetRef.current = true;
                }
            }

            // 2. Race IP and GPS (prefer GPS on first load)
            fetchIpLocation();
            getCurrentLocation({ highAccuracy: true, timeout: 10000 })
                .then(async (position) => {
                    if (!mounted) return;
                    const { lat: latitude, lng: longitude, source } = position;
                    console.log(`[AuthContext] Got location from ${source}:`, latitude, longitude);
                    try {
                        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
                        const data = await res.json();
                        const city = data.address?.city || data.address?.town || data.address?.village || data.address?.suburb || "Current Location";
                        saveLocation(latitude, longitude, city, true);
                    } catch {
                        saveLocation(latitude, longitude, "Current Location", true);
                    }
                })
                .catch(() => {
                    // GPS failed, IP fallback already running
                });
        } catch { /* ignore */ }
    };

    initializeLocation();
    return () => { mounted = false; };
  }, []);

  const setMyLocation = (loc: UserLocation) => {
    setMyLocationState(loc);
    try {
        localStorage.setItem('boliyan_user_location', JSON.stringify(loc));
    } catch { /* ignore */ }
  };

  // Fetch full profile data from Supabase 'profiles' table
    type ProfileRow = Database['public']['Tables']['profiles']['Row'];
    type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
    type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
    type ProfileExtras = { is_verified?: boolean; review_count?: number; rating?: number; rating_count?: number; phone?: string; whatsapp?: string; name?: string };

    const fetchProfile = useCallback(async (supabaseUser: SupabaseUser) => {
        console.log("[AuthContext] Fetching profile for:", supabaseUser.id);
        setIsLoading(true); // Ensure loading is true while fetching
        try {
            const { data: fetchedData, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', supabaseUser.id)
                .single();

            let data = fetchedData as ProfileRow | null;

            console.log("[AuthContext] Profile fetch result:", { hasData: !!data, error });

      // Handle 'Row not found' (PGRST116) or null data
      if (!data && (error?.code === 'PGRST116' || !error)) {
          console.warn("Profile not found, attempting to create or use fallback...");
          const metadata = (supabaseUser.user_metadata || {}) as Record<string, string | undefined>;
          
          const fullName = metadata.full_name || 
                           metadata.name || 
                           (metadata.first_name ? `${metadata.first_name} ${metadata.last_name || ''}`.trim() : null) ||
                           supabaseUser.email?.split('@')[0];

          const newProfile: ProfileInsert = {
              id: supabaseUser.id,
              full_name: fullName,
              avatar_url: metadata.avatar_url || metadata.picture,
              location: metadata.city // Map city to location
          };

          // Attempt insertion
          const { data: inserted, error: insertError } = await supabase
              .from('profiles')
              .insert([newProfile])
              .select()
              .single();

          if (!insertError && inserted) {
             data = inserted as ProfileRow;
          } else {
             // Fallback to ephemeral data so the app still works
              console.error("Profile creation failed, using temporary data:", insertError);
              data = newProfile as ProfileRow;
          }
      } else if (error) {
        console.error('Error fetching profile:', error);
        return null; // Stop if genuine DB error
      }

        if (data) {
          // Map Supabase profile to App User type
          // Note: Some fields might need default values if not present in DB yet
          const profile = data as ProfileRow & ProfileExtras;
          const locationValue = profile.location;
          const parsedLocation = typeof locationValue === 'string' && locationValue.trim().startsWith('{')
            ? JSON.parse(locationValue)
            : locationValue;
          const appUser: User = {
              id: profile.id,
              name: profile.full_name || profile.name || supabaseUser.email?.split('@')[0] || 'User',
              avatar: profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}`,
              isVerified: profile.is_verified || false,
              // Default/Fallback values for fields not yet in DB schema or optional
              phone: profile.phone || undefined,
              whatsapp: profile.whatsapp || undefined,
              rating: profile.rating || 0,
              reviewCount: profile.review_count || profile.rating_count || 0,
              location: parsedLocation
                ? (typeof parsedLocation === 'string'
                    ? { lat: 0, lng: 0, address: parsedLocation, city: parsedLocation }
                    : parsedLocation)
                : { lat: 24.8607, lng: 67.0011, address: "Karachi, Pakistan", city: "Karachi" },
              badges: [], // TODO: Fetch badges from a relation if needed
              stats: {
                  bidsAcceptedByMe: 0,
                  myBidsAccepted: 0
              },
              emailVerified: ['google', 'facebook'].includes(supabaseUser.app_metadata.provider || '') || !!supabaseUser.email_confirmed_at,
              role: (profile.role as 'user' | 'admin') || 'user',
          };

          // Determine profile completeness - strictly check DB fields
          appUser.profileComplete = !!profile.full_name && !!profile.phone && !!profile.location;

          setUser(appUser);
        }
    } catch (err) {
      console.error('Unexpected error fetching profile:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Use a ref to track the last processed user ID to avoid race conditions 
  // and stale closures in the onAuthStateChange listener.
  const lastProcessedUserId = React.useRef<string | null>(null);

  useEffect(() => {
    // Consolidate auth initialization to a single listener.
    // onAuthStateChange fires 'INITIAL_SESSION' immediately on mount, 
    // managing both initial load and subsequent updates.
    
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("[AuthContext] Auth state change:", _event, session?.user?.id);

      if (session?.user) {
         // Check against Ref to strictly deduplicate fetches
         if (session.user.id !== lastProcessedUserId.current) {
            console.log("[AuthContext] New user detected, fetching profile...");
            lastProcessedUserId.current = session.user.id;
            setIsLoading(true);
            fetchProfile(session.user);
         } else {
            // Same user, no action needed unless we want to silent re-validate
            console.log("[AuthContext] User already processed, skipping fetch");
         }
      } else {
        console.log("[AuthContext] No session user, clearing state");
        lastProcessedUserId.current = null;
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const login = async (provider: 'google' | 'facebook' = 'google') => {
    // Redirect to OAuth provider
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: getAuthRedirectUrl(),
      },
    });
    if (error) console.error("OAuth login failed", { provider, error });
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/');
  };

  const getUser = (id: string) => {
    // Compatibility stub: In real app, we can't sync fetch other users easily here.
    // For now, return current user if ID matches, else undefined.
    return user?.id === id ? user : undefined;
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!user) return;

    const updates: ProfileUpdate = {};
    if (data.name) updates.full_name = data.name;
    if (data.avatar) updates.avatar_url = data.avatar;
    if (data.phone) updates.phone = data.phone;
    if (data.whatsapp !== undefined) updates.whatsapp = data.whatsapp;
    if (data.location?.city) updates.location = data.location.city;

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (error) {
      console.error('[AuthContext] Update failed:', error);
      throw error;
    }

    // Update local state
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...data };
      // Recalculate completeness
      updated.profileComplete = !!updated.name && !!updated.phone && !!updated.location;
      return updated;
    });
  };

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  return (
    <AuthContext.Provider value={{ 
      user, 
      myLocation,
      setMyLocation,
      isLoggedIn: !!user, 
      isLoading,
      isAdminMode: isAdminMode && user?.role === 'admin', // Only true if user is actually admin
      toggleAdminMode,
      login, 
      logout, 
      getUser,
      updateProfile,
      isAuthModalOpen,
      openAuthModal,
      closeAuthModal
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
