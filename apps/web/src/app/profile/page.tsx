"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { User, Mail, MapPin, Star, Edit2, Save, LogOut, Camera, Phone } from "lucide-react";

export default function ProfilePage() {
  const { user, logout } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // TODO: Replace with Supabase profile update
    // await supabase.from('profiles').update({ full_name: name }).eq('id', user.id);
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsSaving(false);
    setIsEditing(false);
  };

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="container mx-auto max-w-lg py-8 px-4"
    >
      <Card id="profile-card" className="border-none shadow-xl bg-white overflow-hidden">
        {/* Header with Avatar */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 pt-8 pb-16 px-6 relative">
          <div className="absolute top-4 right-4">
            <Button
              id="logout-btn"
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-white/80 hover:text-white hover:bg-white/10"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
          
          <h1 className="text-white text-xl font-bold">My Profile</h1>
        </div>

        {/* Avatar - Overlapping */}
        <div className="relative -mt-12 px-6">
          <div className="relative inline-block">
            <Avatar id="profile-avatar" className="h-24 w-24 border-4 border-white shadow-lg">
              <AvatarImage src={user.avatar} />
              <AvatarFallback className="text-2xl font-bold bg-slate-200 text-slate-600">
                {user.name[0]}
              </AvatarFallback>
            </Avatar>
            <button
              id="change-avatar-btn"
              className="absolute bottom-0 right-0 h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-md hover:bg-blue-700 transition-colors"
              title="Change avatar"
            >
              <Camera className="h-4 w-4" />
            </button>
          </div>
        </div>

        <CardContent id="profile-content" className="pt-4 pb-6 space-y-6">
          {/* Rating Badge */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 px-3 py-1">
              <Star className="h-3.5 w-3.5 fill-amber-500 mr-1" />
              <span className="font-bold">{user.rating}</span>
              <span className="text-amber-600/70 ml-1">({user.reviewCount} reviews)</span>
            </Badge>
          </div>

          <Separator />

          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name-input" className="flex items-center gap-1.5 text-slate-600">
              <User className="h-3.5 w-3.5" />
              Full Name
            </Label>
            {isEditing ? (
              <Input
                id="name-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11 bg-slate-50 border-slate-200"
              />
            ) : (
              <p id="name-display" className="text-lg font-semibold text-slate-900 py-2">
                {user.name}
              </p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-slate-600">
              <Phone className="h-3.5 w-3.5" />
              Phone Number
            </Label>
            <p id="phone-display" className="text-slate-600 py-2">
              {user.phone || "0300 1234567"}
            </p>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-slate-600">
              <MapPin className="h-3.5 w-3.5" />
              Location
            </Label>
            <p id="location-display" className="text-slate-600 py-2">
              {user.location.address}
            </p>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex gap-3">
            {isEditing ? (
              <>
                <Button
                  id="cancel-edit-btn"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setName(user.name);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  id="save-profile-btn"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {isSaving ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full"
                    />
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Button
                id="edit-profile-btn"
                onClick={() => setIsEditing(true)}
                variant="outline"
                className="w-full"
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
