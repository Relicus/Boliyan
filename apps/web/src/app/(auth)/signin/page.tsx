"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Mail, Lock, LogIn, Facebook } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');

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
    
    try {
      // Import dynamically or assume imported at top (I will fix imports in next step if needed, but for now I see no supabase import in original file view)
      // I need to add import first. Let's do imports in a separate chunk or just use multi_replace.
      // Wait, earlier view_file showed no supabase import. I should verify.
      // Yes, line 40 was commented out: // const { error } = await supabase.auth.signInWithPassword({ email, password });
      // I will replace the whole file content related to imports and submit logic.
      
      /* THIS TOOL CALL IS ONLY FOR HANDLESUBMIT, I WILL NEED ANOTHER FOR IMPORTS */
      
      const { error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });

      if (error) {
         console.error("Login error:", error.message);
         // Ideally show error to user but for now just stop loading
         // In a real app we'd set an error state here
         setIsShaking(true);
      } else {
         // Check for safe redirect path (should start with /)
         const target = redirect && redirect.startsWith('/') ? redirect : '/';
         router.push(target);
         router.refresh(); // Ensure auth state updates
      }
    } catch (err) {
      console.error("Unexpected login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'facebook') => {
    setIsLoading(true);
    const redirectUrl = `${window.location.origin}/auth/callback${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`;
    console.log("[OAuth] Redirecting to:", redirectUrl);
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          // Pass the redirect param to the callback route
          redirectTo: redirectUrl,
        },
      });
      if (error) {
         console.error(`${provider} login error:`, error.message);
         setIsShaking(true);
      }
    } catch (err) {
      console.error("Unexpected OAuth error:", err);
    } finally {
      // Note: We don't set loading false immediately if redirecting, but for safety in case of error:
      setIsLoading(false); 
    }
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

          {/* Social Auth */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-500">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              id="google-signin-btn"
              variant="outline"
              type="button"
              disabled={isLoading}
              onClick={() => handleOAuthLogin('google')}
              className="h-11 bg-white hover:bg-slate-50 border-slate-200"
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
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
              Google
            </Button>
            <Button
              id="facebook-signin-btn"
              variant="outline"
              type="button"
              disabled={isLoading}
              onClick={() => handleOAuthLogin('facebook')}
              className="h-11 bg-white hover:bg-slate-50 border-slate-200"
            >
              <Facebook className="mr-2 h-4 w-4 text-[#1877F2]" fill="currentColor" />
              Facebook
            </Button>
          </div>

          <div className="mt-6 text-center text-sm text-slate-600">
            Don't have an account?{" "}
            <Link
              id="signup-link"
              href={`/signup${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
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
