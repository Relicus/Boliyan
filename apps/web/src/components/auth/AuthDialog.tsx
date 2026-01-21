"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { Mail, LogIn, UserPlus } from "lucide-react";

export function AuthDialog() {
  const { isAuthModalOpen, closeAuthModal } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [redirectUrl, setRedirectUrl] = useState("/");

  useEffect(() => {
    // Construct the full path including search params
    const fullPath = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    // Encode it to be safe in URL
    setRedirectUrl(encodeURIComponent(fullPath));
  }, [pathname, searchParams]);

  return (
    <Dialog open={isAuthModalOpen} onOpenChange={closeAuthModal}>
      <DialogContent id="auth-dialog-content" className="sm:max-w-[400px] bg-white gap-0 p-0">
        <DialogHeader id="auth-dialog-header" className="p-6 pb-2 space-y-3 items-center text-center">
            <div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-2">
                <LogIn className="h-6 w-6" />
            </div>
          <DialogTitle id="auth-dialog-title" className="text-2xl font-bold">Sign in to Boliyan</DialogTitle>
          <DialogDescription id="auth-dialog-description" className="text-center">
            You need an account to place bids, track items, and message sellers.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 px-6 pb-6 pt-2">
          <Button 
            id="auth-dialog-signin-btn"
            variant="default" 
            className="w-full h-12 text-base font-medium bg-slate-900 hover:bg-slate-800"
            asChild
            onClick={closeAuthModal}
          >
            <Link href={`/signin?redirect=${redirectUrl}`}>
                <LogIn className="mr-2 h-5 w-5" />
                Sign In
            </Link>
          </Button>

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-500">New to Boliyan?</span>
            </div>
          </div>

          <Button 
            id="auth-dialog-signup-btn"
            variant="outline" 
            className="w-full h-12 text-base font-medium border-slate-300 hover:bg-slate-50 text-slate-700"
            asChild
            onClick={closeAuthModal}
          >
            <Link href={`/signup?redirect=${redirectUrl}`}>
                <UserPlus className="mr-2 h-5 w-5" />
                Create Account
            </Link>
          </Button>

          <div className="text-center text-xs text-slate-400 mt-2">
            By continuing, you agree to our Terms of Service.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
