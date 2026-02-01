"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Mail, Lock, MapPin, UserPlus, Phone, Facebook, ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getAuthRedirectUrl } from "@/lib/nativeAuth";

const CITIES = [
  "Karachi",
  "Lahore",
  "Islamabad",
  "Rawalpindi",
  "Faisalabad",
  "Multan",
  "Peshawar",
  "Quetta"
];

export default function SignUpClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  
  const [method, setMethod] = useState<'choice' | 'email'>('choice');
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [city, setCity] = useState("");
  const [errors, setErrors] = useState<{
    name?: boolean;
    email?: boolean;
    phone?: boolean;
    password?: boolean;
    confirmPassword?: boolean;
    city?: boolean;
  }>({});
  const [isShaking, setIsShaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors = {
      name: !name.trim() || name.length < 2,
      email: !email.trim() || !email.includes("@"),
      phone: !phone.trim() || phone.length < 10,
      password: !password.trim() || password.length < 6,
      confirmPassword: password !== confirmPassword,
      city: !city
    };
    
    setErrors(newErrors);
    
    if (Object.values(newErrors).some(Boolean)) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }

    setIsLoading(true);
    
    try {
      console.log("[SignUp] Attempting signup for:", email);
      // Create user with metadata
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: { 
          data: { 
            full_name: name, // Standard Supabase field
            city: city,
            phone: phone // Store phone in metadata too for easy access
          } 
        }
      });

      console.log("[SignUp] Result:", { session: !!data?.session, user: !!data?.user, error: error?.message });

      if (error) {
         console.error("Signup error:", error.message);
         // Ideally show error to user
         setIsShaking(true);
      } else if (!data.session) {
         // Success! But email verification is enabled
         setNeedsVerification(true);
         console.log("[SignUp] Success! Verification required.");
      } else {
         // Success!
         console.log("[SignUp] Success! Redirecting...");
         const target = redirect && redirect.startsWith('/') ? redirect : '/';
         router.push(target);
         router.refresh();
      }
    } catch (err) {
      console.error("Unexpected signup error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'facebook') => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: getAuthRedirectUrl(redirect),
        },
      });
      if (error) {
         console.error("OAuth login error", { provider, message: error.message });
         setIsShaking(true);
      }
    } catch (err) {
      console.error("Unexpected OAuth error:", err);
    } finally {
      // Note: We don't set loading false immediately if redirecting, but for safety in case of error:
      setIsLoading(false); 
    }
  };


  if (needsVerification) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm text-center p-8 space-y-6">
          <div className="mx-auto h-20 w-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
            <Mail className="h-10 w-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900">Check your email</h2>
            <p className="text-slate-600">
              We've sent a verification link to <span className="font-bold text-slate-900">{email}</span>.
            </p>
          </div>
          <div className="bg-blue-50/50 p-4 rounded-xl text-sm text-blue-800 font-medium">
            Please click the link in the email to activate your account.
          </div>
          <Button 
            variant="outline" 
            className="w-full h-12"
            onClick={() => setNeedsVerification(false)}
          >
            Back to Sign Up
          </Button>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card id="signup-card" className="border-none shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden">
        <CardHeader id="signup-header" className="text-center space-y-2 pb-4 relative">
          <AnimatePresence mode="wait">
            {method === 'email' && (
              <motion.button
                key="back-btn"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onClick={() => setMethod('choice')}
                className="absolute left-6 top-8 p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-500"
              >
                <ArrowLeft className="h-5 w-5" />
              </motion.button>
            )}
          </AnimatePresence>

          <div className="mx-auto mb-2">
            <div className="h-14 w-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg">
              <UserPlus className="h-7 w-7 text-white" />
            </div>
          </div>
          <CardTitle id="signup-title" className="text-2xl font-black text-slate-900">
            {method === 'choice' ? "Join Boliyan" : "Create Account"}
          </CardTitle>
          <CardDescription id="signup-description">
            {method === 'choice' ? "Start your bidding journey today" : "Enter your details to get started"}
          </CardDescription>
        </CardHeader>
        
        <CardContent id="signup-form-container">
          <AnimatePresence mode="wait">
            {method === 'choice' ? (
              <motion.div
                key="choice-view"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 gap-3">
                  <Button
                    id="google-signup-btn-choice"
                    variant="outline"
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleOAuthLogin('google')}
                    className="h-12 bg-white hover:bg-slate-50 border-slate-200 text-base font-bold shadow-sm"
                  >
                    <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Continue with Google
                  </Button>
                  <Button
                    id="facebook-signup-btn-choice"
                    variant="outline"
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleOAuthLogin('facebook')}
                    className="h-12 bg-white hover:bg-slate-50 border-slate-200 text-base font-bold shadow-sm"
                  >
                    <Facebook className="mr-3 h-5 w-5 text-[#1877F2]" fill="currentColor" />
                    Continue with Facebook
                  </Button>
                </div>

                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-100" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest text-slate-400">
                    <span className="bg-white px-4">OR</span>
                  </div>
                </div>

                <Button
                  id="email-signup-btn"
                  variant="ghost"
                  onClick={() => setMethod('email')}
                  className="w-full h-12 text-slate-600 font-bold hover:bg-blue-50 hover:text-blue-600 transition-all rounded-xl"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Sign up with Email
                </Button>
              </motion.div>
            ) : (
              <motion.form
                key="email-form"
                id="signup-form"
                onSubmit={handleSubmit}
                initial={{ opacity: 0, x: 20 }}
                animate={isShaking ? { x: [-4, 4, -4, 4, 0] } : { opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={isShaking ? { duration: 0.4 } : {}}
                className="space-y-4"
              >
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name-input" className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <User className="h-3 w-3" />
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

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email-input" className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <Mail className="h-3 w-3" />
                    Email
                  </Label>
                  <Input
                    id="email-input"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors(prev => ({ ...prev, email: false }));
                    }}
                    className={`h-11 transition-all ${errors.email ? "border-red-500 bg-red-50/50" : "bg-slate-50 border-slate-200"}`}
                  />
                  <AnimatePresence>
                    {errors.email && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-[10px] font-bold text-red-500"
                      >
                        Please enter a valid email
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone-input" className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <Phone className="h-3 w-3" />
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

                {/* Password Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="password-input" className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                      <Lock className="h-3 w-3" />
                      Password
                    </Label>
                    <Input
                      id="password-input"
                      type="password"
                      placeholder="••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password) setErrors(prev => ({ ...prev, password: false }));
                      }}
                      className={`h-11 transition-all ${errors.password ? "border-red-500 bg-red-50/50" : "bg-slate-50 border-slate-200"}`}
                    />
                    <AnimatePresence>
                      {errors.password && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="text-[10px] font-bold text-red-500"
                        >
                          Min 6 characters
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password-input" className="text-xs font-bold uppercase tracking-wider text-slate-500">Confirm</Label>
                    <Input
                      id="confirm-password-input"
                      type="password"
                      placeholder="••••••"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: false }));
                      }}
                      className={`h-11 transition-all ${errors.confirmPassword ? "border-red-500 bg-red-50/50" : "bg-slate-50 border-slate-200"}`}
                    />
                    <AnimatePresence>
                      {errors.confirmPassword && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="text-[10px] font-bold text-red-500"
                        >
                          Passwords don't match
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* City */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <MapPin className="h-3 w-3" />
                    City
                  </Label>
                  <Select
                    value={city}
                    onValueChange={(val) => {
                      setCity(val);
                      if (errors.city) setErrors(prev => ({ ...prev, city: false }));
                    }}
                  >
                    <SelectTrigger
                      id="city-select"
                      className={`h-11 transition-all ${errors.city ? "border-red-500 bg-red-50/50" : "bg-slate-50 border-slate-200"}`}
                    >
                      <SelectValue placeholder="Select your city" />
                    </SelectTrigger>
                    <SelectContent id="city-select-content">
                      {CITIES.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <AnimatePresence>
                    {errors.city && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-[10px] font-bold text-red-500"
                      >
                        Please select a city
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                <Button
                  id="signup-submit-btn"
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 font-bold text-base mt-2 rounded-xl shadow-lg shadow-blue-100"
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full"
                    />
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="mt-8 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link
              id="signin-link"
              href={`/signin${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
              className="font-bold text-blue-600 hover:text-blue-700 hover:underline"
            >
              Sign In
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

}
