"use client";

import { useEffect, useState, use } from "react";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useApp } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { VerifiedBadge } from "@/components/common/VerifiedBadge";
import { ReportUserModal } from "@/components/profile/ReportUserModal";
import ReviewList from "@/components/profile/ReviewList";
import { BoliyanLogomarkLoader } from "@/components/branding/BoliyanLogomarkLoader";
import { 
  Star, 
  MapPin, 
  Calendar, 
  ShoppingBag, 
  Package,
  Ban
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface UserProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  location: string | null;
  is_verified: boolean | null;
  rating: number | null;
  rating_count: number | null;
  created_at: string | null;
  deals_sealed_count: number | null;
  banned_until: string | null;
}

interface UserStats {
  listingsCount: number;
  bidsCount: number;
}

export default function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats>({ listingsCount: 0, bidsCount: 0 });
  const [loading, setLoading] = useState(true);
  const [notFoundState, setNotFoundState] = useState(false);
  const { user } = useApp();
  const isOwner = user?.id === id;
  const isBanned = profile?.banned_until && new Date(profile.banned_until) > new Date();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, location, is_verified, rating, rating_count, created_at, deals_sealed_count, banned_until")
        .eq("id", id)
        .single();

      if (error || !data) {
        setNotFoundState(true);
        setLoading(false);
        return;
      }

      setProfile(data);

      // Fetch stats in parallel
      const [listingsRes, bidsRes] = await Promise.all([
        supabase
          .from("listings")
          .select("*", { count: "exact", head: true })
          .eq("seller_id", id),
        supabase
          .from("bids")
          .select("*", { count: "exact", head: true })
          .eq("bidder_id", id),
      ]);

      setStats({
        listingsCount: listingsRes.count ?? 0,
        bidsCount: bidsRes.count ?? 0,
      });

      setLoading(false);
    };

    fetchProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <BoliyanLogomarkLoader />
      </div>
    );
  }

  if (notFoundState) {
    notFound();
  }

  if (!profile) {
    return null;
  }

  return (
    <div id="public-profile" className="container mx-auto max-w-3xl p-4 md:p-8 space-y-6">
      <Card className="p-6 border-slate-200">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Avatar */}
          <Avatar className="h-24 w-24 border-4 border-slate-50 shadow-sm ring-1 ring-slate-200">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="text-2xl font-bold bg-slate-100 text-slate-500">
              {profile.full_name?.[0] || "?"}
            </AvatarFallback>
          </Avatar>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-black text-slate-900">
                {profile.full_name || "Unknown User"}
              </h1>
              {profile.is_verified && <VerifiedBadge size="sm" />}
              {isBanned && (
                <Badge className="bg-red-100 text-red-700 border-red-200">
                  <Ban className="h-3 w-3 mr-1" />
                  Account Restricted
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-2">
              {profile.rating !== null && (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                  <Star className="h-3 w-3 fill-amber-500 mr-1" />
                  {profile.rating.toFixed(1)} ({profile.rating_count || 0} reviews)
                </Badge>
              )}
              {profile.location && (
                <span className="text-sm text-slate-500 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {profile.location}
                </span>
              )}
              {profile.created_at && (
                <span className="text-sm text-slate-400 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Member {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true })}
                </span>
              )}
            </div>

            {/* Stats */}
            <div className="flex gap-6 mt-4">
              <div className="text-center">
                <p className="text-2xl font-black text-slate-900">{stats.listingsCount}</p>
                <p className="text-xs text-slate-500 flex items-center gap-1 justify-center">
                  <Package className="h-3 w-3" />
                  Listings
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-slate-900">{stats.bidsCount}</p>
                <p className="text-xs text-slate-500 flex items-center gap-1 justify-center">
                  <ShoppingBag className="h-3 w-3" />
                  Offers Made
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-slate-900">{profile.deals_sealed_count || 0}</p>
                <p className="text-xs text-slate-500">Deals Sealed</p>
              </div>
            </div>
          </div>

          {/* Report button - only for logged in users viewing other profiles */}
          {user && !isOwner && (
            <ReportUserModal 
              userId={profile.id} 
              userName={profile.full_name || "this user"} 
            />
          )}
        </div>
      </Card>

      <Separator />

      {/* Reviews Section */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4">Reviews</h2>
        <ReviewList userId={id} />
      </div>
    </div>
  );
}
