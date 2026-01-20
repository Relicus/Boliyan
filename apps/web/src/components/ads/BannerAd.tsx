import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface BannerAdProps {
  variant?: "sidebar" | "header";
}

export default function BannerAd({ variant = "sidebar" }: BannerAdProps) {
  if (variant === "sidebar") {
    return (
      <div 
        id="banner-ad-sidebar"
        className="mx-3 mt-4 overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 p-5 text-white shadow-lg shadow-indigo-200"
      >
        <div className="mb-4">
          <span className="mb-2 inline-block rounded-md bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
            Ad
          </span>
          <h3 className="font-outfit text-lg font-bold leading-tight">
            Supercharge Your Workflow
          </h3>
          <p className="mt-2 text-xs font-medium text-indigo-100">
            Get 50% off professional tools this week only.
          </p>
        </div>
        
        <Button 
          variant="secondary" 
          size="sm"
          className="w-full gap-2 border-0 bg-white text-indigo-600 hover:bg-indigo-50"
        >
          Check Offer
          <ArrowRight className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return null;
}
