"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Mail, Lock, MapPin, UserPlus, Phone } from "lucide-react";

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

export default function SignUpPage() {
  const router = useRouter();
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
    
    // TODO: Replace with Supabase Auth
    // const { error } = await supabase.auth.signUp({ 
    //   email, 
    //   password,
    //   options: { data: { name, city } }
    // });
    
    // Simulate signup delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsLoading(false);
    router.push("/");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card id="signup-card" className="border-none shadow-xl bg-white/80 backdrop-blur-sm">
        <CardHeader id="signup-header" className="text-center space-y-2 pb-4">
          <div className="mx-auto mb-2">
            <div className="h-14 w-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg">
              <UserPlus className="h-7 w-7 text-white" />
            </div>
          </div>
          <CardTitle id="signup-title" className="text-2xl font-black text-slate-900">
            Create Account
          </CardTitle>
          <CardDescription id="signup-description">
            Join Boliyan and start bidding
          </CardDescription>
        </CardHeader>
        
        <CardContent id="signup-form-container">
          <motion.form
            id="signup-form"
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

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email-input" className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-slate-500" />
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

            {/* Password Row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="password-input" className="flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-slate-500" />
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
                <Label htmlFor="confirm-password-input">Confirm</Label>
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
              <Label className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-slate-500" />
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
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 font-bold text-base mt-2"
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

          <div className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link
              id="signin-link"
              href="/signin"
              className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
            >
              Sign In
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
