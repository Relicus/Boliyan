"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { User, MapPin, Star, Edit2, Save, Camera, Phone, ShieldCheck } from "lucide-react";
import { VerifiedBadge } from "@/components/common/VerifiedBadge";

export function ProfileSettings() {
  const { user, updateProfile } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Keep name in sync with user
  React.useEffect(() => {
    if (user) setName(user.name);
  }, [user]);

  if (!user) {
    return (
      <div className="p-8 text-center text-slate-400">
        Please sign in to view your profile.
      </div>
    );
  }

  const handleSave = async () => {
    setIsSaving(true);
    try {
        await updateProfile({ name: name });
        setIsEditing(false);
    } catch (e) {
        console.error("Update failed", e);
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div id="profile-settings-root" className="space-y-6">
      <Card id="profile-settings-card" className="border shadow-sm bg-white overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Avatar Section */}
            <div className="relative shrink-0">
              <Avatar id="profile-settings-avatar" className="h-24 w-24 border-4 border-slate-50 shadow-sm ring-1 ring-slate-200">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="text-2xl font-bold bg-slate-100 text-slate-500">
                  {user.name[0]}
                </AvatarFallback>
              </Avatar>
              <button
                id="change-avatar-btn"
                className="absolute -bottom-1 -right-1 h-8 w-8 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-600 shadow-sm hover:bg-slate-50 hover:text-blue-600 transition-all"
                title="Change avatar"
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>

            {/* Basic Info Section */}
            <div className="flex-1 space-y-6 w-full">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-fluid-h2 font-black text-slate-900 flex items-center gap-2">
                    {user.name}
                    {user.isVerified && <VerifiedBadge size="sm" />}
                  </h2>
                  <div className="flex items-center gap-3 mt-1">
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 px-2 py-0.5 text-[10px] font-bold">
                      <Star className="h-3 w-3 fill-amber-500 mr-1" />
                      {user.rating} ({user.reviewCount} reviews)
                    </Badge>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 px-2 py-0.5 text-[10px] font-bold">
                      <ShieldCheck className="h-3 w-3 mr-1" />
                      Verified Seller
                    </Badge>
                  </div>
                </div>
                {!isEditing && (
                  <Button
                    id="edit-profile-btn"
                    onClick={() => setIsEditing(true)}
                    variant="outline"
                    size="sm"
                    className="h-9 px-4 font-bold border-slate-200 hover:bg-slate-50"
                  >
                    <Edit2 className="h-3.5 w-3.5 mr-2" />
                    Edit Details
                  </Button>
                )}
              </div>

              <Separator className="bg-slate-100" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                {/* Name Field */}
                <div className="space-y-2">
                  <Label htmlFor="name-input" className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <User className="h-3 w-3" />
                    Full Name
                  </Label>
                  {isEditing ? (
                    <Input
                      id="name-input"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-10 bg-slate-50 border-slate-200 focus:ring-blue-500 font-medium"
                    />
                  ) : (
                    <p id="name-display" className="text-sm font-semibold text-slate-700 py-1">
                      {user.name}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Phone className="h-3 w-3" />
                    Phone Number
                  </Label>
                  <p id="phone-display" className="text-sm font-semibold text-slate-700 py-1">
                    {user.phone || "Not provided"}
                  </p>
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <MapPin className="h-3 w-3" />
                    Default Location
                  </Label>
                  <p id="location-display" className="text-sm font-semibold text-slate-700 py-1">
                    {user.location.address}
                  </p>
                </div>
              </div>

              {isEditing && (
                <div className="flex gap-3 pt-4">
                  <Button
                    id="cancel-edit-btn"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsEditing(false);
                      setName(user.name);
                    }}
                    className="font-bold text-slate-500"
                  >
                    Cancel
                  </Button>
                  <Button
                    id="save-profile-btn"
                    size="sm"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-blue-600 hover:bg-blue-700 font-bold px-6 shadow-md shadow-blue-100"
                  >
                    {isSaving ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full"
                      />
                    ) : (
                      <>
                        <Save className="h-3.5 w-3.5 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
