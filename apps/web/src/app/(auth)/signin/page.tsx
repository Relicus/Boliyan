"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Mail, Lock, LogIn } from "lucide-react";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: boolean; password?: boolean }>({});
  const [isShaking, setIsShaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors = {
      email: !email.trim() || !email.includes("@"),
      password: !password.trim() || password.length < 6
    };
    
    setErrors(newErrors);
    
    if (newErrors.email || newErrors.password) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }

    setIsLoading(true);
    
    // TODO: Replace with Supabase Auth
    // const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    // Simulate login delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setIsLoading(false);
    router.push("/");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card id="signin-card" className="border-none shadow-xl bg-white/80 backdrop-blur-sm">
        <CardHeader id="signin-header" className="text-center space-y-2 pb-4">
          <div className="mx-auto mb-2">
            <div className="h-14 w-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg">
              <LogIn className="h-7 w-7 text-white" />
            </div>
          </div>
          <CardTitle id="signin-title" className="text-2xl font-black text-slate-900">
            Welcome Back
          </CardTitle>
          <CardDescription id="signin-description">
            Sign in to continue to Boliyan
          </CardDescription>
        </CardHeader>
        
        <CardContent id="signin-form-container">
          <motion.form
            id="signin-form"
            onSubmit={handleSubmit}
            animate={isShaking ? { x: [-4, 4, -4, 4, 0], transition: { duration: 0.4 } } : {}}
            className="space-y-4"
          >
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
                    Please enter a valid email address
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password-input" className="flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-slate-500" />
                Password
              </Label>
              <Input
                id="password-input"
                type="password"
                placeholder="••••••••"
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
                    Password must be at least 6 characters
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <Button
              id="signin-submit-btn"
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
                "Sign In"
              )}
            </Button>
          </motion.form>

          <div className="mt-6 text-center text-sm text-slate-600">
            Don't have an account?{" "}
            <Link
              id="signup-link"
              href="/signup"
              className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
            >
              Sign Up
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
