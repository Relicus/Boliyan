"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "@/types";
import { supabase } from "@/lib/supabase";
import { Session } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  getUser: (id: string) => User | undefined; // Keep for compat, though less useful with real auth
  updateProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Fetch full profile data from Supabase 'profiles' table
    const fetchProfile = async (supabaseUser: any) => {
        console.log("[AuthContext] Fetching profile for:", supabaseUser.id);
        try {
            const { data: fetchedData, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', supabaseUser.id)
                .single();

            let data = fetchedData;

            console.log("[AuthContext] Profile fetch result:", { hasData: !!data, error });

      // Handle 'Row not found' (PGRST116) or null data
      if (!data && (error?.code === 'PGRST116' || !error)) {
          console.warn("Profile not found, attempting to create or use fallback...");
          const metadata = supabaseUser.user_metadata || {};
          
          const newProfile = {
              id: supabaseUser.id,
              full_name: metadata.full_name || metadata.name || supabaseUser.email?.split('@')[0],
              email: supabaseUser.email, 
              avatar_url: metadata.avatar_url,
              location: metadata.city, // Map city to location
              phone: metadata.phone
          };

          // Attempt insertion
          const { data: inserted, error: insertError } = await (supabase
              .from('profiles') as any)
              .insert([newProfile])
              .select()
              .single();

          if (!insertError && inserted) {
             data = inserted;
          } else {
             // Fallback to ephemeral data so the app still works
             console.error("Profile creation failed, using temporary data:", insertError);
             data = newProfile as any;
          }
      } else if (error) {
        console.error('Error fetching profile:', error);
        return null; // Stop if genuine DB error
      }

        if (data) {
          // Map Supabase profile to App User type
          // Note: Some fields might need default values if not present in DB yet
          const profile = data as any;
          const appUser: User = {
              id: profile.id,
              name: profile.full_name || profile.name || supabaseUser.email?.split('@')[0] || 'User',
              avatar: profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}`,
              isVerified: profile.is_verified || false,
              // Default/Fallback values for fields not yet in DB schema or optional
              phone: profile.phone || undefined,
              rating: profile.rating || 0,
              reviewCount: profile.review_count || 0,
              location: profile.location 
                ? (typeof profile.location === 'string' && profile.location.trim().startsWith('{')
                    ? JSON.parse(profile.location) 
                    : { lat: 0, lng: 0, address: profile.location }) 
                : { lat: 24.8607, lng: 67.0011, address: "Karachi, Pakistan" },
              badges: [], // TODO: Fetch badges from a relation if needed
              stats: {
                  bidsAcceptedByMe: 0,
                  myBidsAccepted: 0
              }
          };
          setUser(appUser);
        }
    } catch (err) {
      console.error('Unexpected error fetching profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

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
      setSession(session);

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
  }, []);

  const login = async () => {
    // Redirect to Google OAuth
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) console.error("Login failed:", error);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    router.push('/');
  };

  const getUser = (id: string) => {
    // Compatibility stub: In real app, we can't sync fetch other users easily here.
    // For now, return current user if ID matches, else undefined.
    return user?.id === id ? user : undefined;
  };

  const updateProfile = async (data: Partial<User>) => {
      if (!user) return;
      
      const updates: any = {};
      if (data.name) updates.full_name = data.name;
      if (data.avatar) updates.avatar_url = data.avatar;
      
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);
        
      if (error) {
          console.error('[AuthContext] Update failed:', error);
          throw error;
      }
      
      // Update local state
      setUser(prev => prev ? { ...prev, ...data } : null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoggedIn: !!user, 
      isLoading,
      login, 
      logout, 
      getUser,
      updateProfile
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
