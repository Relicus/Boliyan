"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { User, MapPin, Phone, CheckCircle2, Navigation } from "lucide-react";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import { LocationSelector } from "@/components/marketplace/LocationSelector";

export default function CompleteProfileClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const { user, updateProfile, isLoading: isAuthLoading, myLocation } = useApp();
  
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [isSameAsPhone, setIsSameAsPhone] = useState(true);
  
  const [errors, setErrors] = useState<{
    name?: boolean;
    phone?: boolean;
    location?: boolean;
  }>({});
  const [isShaking, setIsShaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Prefill from user profile if available
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPhone(user.phone || "");
      setWhatsapp(user.whatsapp || "");
      
      if (user.whatsapp && user.whatsapp === user.phone) {
        setIsSameAsPhone(true);
      } else if (user.whatsapp && user.phone) {
        setIsSameAsPhone(false);
      }
    }
  }, [user]);

  // Sync WhatsApp with Phone if enabled
  useEffect(() => {
    if (isSameAsPhone) {
      setWhatsapp(phone);
    }
  }, [phone, isSameAsPhone]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors = {
      name: !name.trim() || name.length < 2,
      phone: !phone.trim() || phone.length < 10,
      location: !myLocation
    };
    
    setErrors(newErrors);
    
    if (Object.values(newErrors).some(Boolean)) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }

    setIsLoading(true);
    
    try {
      await updateProfile({
        name,
        phone,
        whatsapp: isSameAsPhone ? phone : whatsapp,
        location: {
          lat: myLocation!.lat,
          lng: myLocation!.lng,
          address: myLocation!.address,
          city: myLocation!.city || myLocation!.address.split(',')[0]
        }
      });

      // Success!
      const target = redirect && redirect.startsWith('/') ? redirect : '/';
      router.push(target);
      router.refresh();
    } catch (err) {
      console.error("Profile completion error:", err);
      setIsShaking(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthLoading) return null;
  if (!user) {
    router.push('/signin');
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card id="complete-profile-card" className="border-none shadow-xl bg-white/80 backdrop-blur-sm">
        <CardHeader id="complete-profile-header" className="text-center space-y-2 pb-4">
          <div className="mx-auto mb-2">
            <div className="h-14 w-14 bg-gradient-to-br from-green-600 to-green-700 rounded-2xl flex items-center justify-center shadow-lg">
              <CheckCircle2 className="h-7 w-7 text-white" />
            </div>
          </div>
          <CardTitle id="complete-profile-title" className="text-2xl font-black text-slate-900">
            Complete Your Profile
          </CardTitle>
          <CardDescription id="complete-profile-description">
            Just a few more details to start bidding
          </CardDescription>
        </CardHeader>
        
        <CardContent id="complete-profile-form-container">
          <motion.form
            id="complete-profile-form"
            onSubmit={handleSubmit}
            animate={isShaking ? { x: [-4, 4, -4, 4, 0], transition: { duration: 0.4 } } : {}}
            className="space-y-4"
          >
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name-input" className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-slate-500" />
                Full Name
              </Label>
              <Input
                id="name-input"
                type="text"
                placeholder="Ahmed Ali"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors(prev => ({ ...prev, name: false }));
                }}
                className={`h-11 transition-all ${errors.name ? "border-red-500 bg-red-50/50" : "bg-slate-50 border-slate-200"}`}
              />
              <AnimatePresence>
                {errors.name && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-[10px] font-bold text-red-500"
                  >
                    Please enter your name
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone-input" className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-slate-500" />
                Phone Number
              </Label>
              <Input
                id="phone-input"
                type="tel"
                placeholder="0300 1234567"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (errors.phone) setErrors(prev => ({ ...prev, phone: false }));
                }}
                className={`h-11 transition-all ${errors.phone ? "border-red-500 bg-red-50/50" : "bg-slate-50 border-slate-200"}`}
              />
              <AnimatePresence>
                {errors.phone && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-[10px] font-bold text-red-500"
                  >
                    Please enter a valid phone number
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* WhatsApp */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="whatsapp-input" className="flex items-center gap-1.5">
                  <svg className="h-3.5 w-3.5 text-slate-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.631 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WhatsApp Number (Optional)
                </Label>
                <div className="flex items-center gap-2">
                  <Switch 
                    id="same-as-phone" 
                    checked={isSameAsPhone} 
                    onCheckedChange={(val: boolean) => setIsSameAsPhone(val)}
                  />
                  <Label htmlFor="same-as-phone" className="text-xs text-slate-500 cursor-pointer">Same as phone</Label>
                </div>
              </div>
              <Input
                id="whatsapp-input"
                type="tel"
                placeholder="0300 1234567"
                value={whatsapp}
                disabled={isSameAsPhone}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="h-11 bg-slate-50 border-slate-200 disabled:opacity-50"
              />
              <p className="text-[10px] text-blue-600 font-medium">
                Add WhatsApp number for faster selling and buying
              </p>
            </div>

            {/* Location (City Selection) */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-slate-500" />
                Your City / Location
              </Label>
              
              <LocationSelector 
                mode="user" 
                variant="sidebar-compact" 
                className={cn(
                    "w-full h-11",
                    errors.location && "border-red-500 ring-1 ring-red-500/20"
                )}
                triggerClassName={cn(
                    "h-11 bg-slate-50 border-slate-200 hover:bg-slate-100",
                    errors.location && "border-red-500"
                )}
              />
              
              <AnimatePresence>
                {errors.location && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-[10px] font-bold text-red-500"
                  >
                    Please select your location
                  </motion.p>
                )}
              </AnimatePresence>
              
              {!errors.location && myLocation && (
                  <p className="text-[10px] text-blue-600 font-medium flex items-center gap-1">
                      <Navigation className="h-2.5 w-2.5 fill-current" />
                      {myLocation.address}
                  </p>
              )}
            </div>

            <Button
              id="complete-profile-submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 font-bold text-base mt-2"
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full"
                />
              ) : (
                "Save & Continue"
              )}
            </Button>
          </motion.form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
