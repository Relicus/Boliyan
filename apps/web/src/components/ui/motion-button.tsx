"use client";

import * as React from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { BoliyanLogomarkLoader } from "@/components/branding/BoliyanLogomarkLoader";

/**
 * MotionButton - A premium button with built-in Framer Motion animations.
 * 
 * Features:
 * - whileTap press animation (scaleY: 0.96)
 * - whileHover subtle lift effect
 * - Built-in loading state with Boliyan logomark loader
 * - All standard shadcn/ui button variants
 * 
 * Use this for important CTAs where loading states matter.
 * For simple links/navigation, the base Button with CSS :active is sufficient.
 */

const motionButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-bold transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
  {
    variants: {
      variant: {
        default: "bg-slate-900 text-white shadow-md",
        primary: "bg-blue-600 text-white shadow-md",
        success: "bg-amber-600 text-white shadow-md",
        danger: "bg-red-600 text-white shadow-md",
        warning: "bg-orange-500 text-white shadow-md",
        outline: "border border-slate-300 bg-white text-slate-900 shadow-sm",
        ghost: "text-slate-600 hover:bg-slate-100",
        secondary: "bg-slate-100 text-slate-900",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-6 text-base",
        xl: "h-14 px-8 text-lg",
        icon: "size-10",
        "icon-sm": "size-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

// Hover colors for smooth Framer Motion transitions
const VARIANT_HOVER_COLORS: Record<string, string> = {
  default: "#1e293b",  // slate-800
  primary: "#1d4ed8",  // blue-700
  success: "#b45309",  // amber-700
  danger: "#b91c1c",   // red-700
  warning: "#ea580c",  // orange-600
  outline: "#f8fafc",  // slate-50
  ghost: "#f1f5f9",    // slate-100
  secondary: "#e2e8f0", // slate-200
};

const VARIANT_BASE_COLORS: Record<string, string> = {
  default: "#0f172a",  // slate-900
  primary: "#2563eb",  // blue-600
  success: "#d97706",  // amber-600
  danger: "#dc2626",   // red-600
  warning: "#f97316",  // orange-500
  outline: "#ffffff",  // white
  ghost: "transparent",
  secondary: "#f1f5f9", // slate-100
};

export interface MotionButtonProps
  extends Omit<HTMLMotionProps<"button">, "children">,
    VariantProps<typeof motionButtonVariants> {
  isLoading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

const MotionButton = React.forwardRef<HTMLButtonElement, MotionButtonProps>(
  ({ 
    className, 
    variant = "default", 
    size, 
    isLoading = false,
    loadingText,
    disabled,
    children,
    ...props 
  }, ref) => {
    const isDisabled = disabled || isLoading;
    const variantKey = variant || "default";
    
    return (
      <motion.button
        ref={ref}
        disabled={isDisabled}
        initial={false}
        animate={{
          backgroundColor: isLoading ? "#f8fafc" : VARIANT_BASE_COLORS[variantKey],
        }}
        whileHover={!isDisabled ? {
          backgroundColor: VARIANT_HOVER_COLORS[variantKey],
          transition: { duration: 0.2 }
        } : undefined}
        whileTap={!isDisabled ? { 
          scaleY: 0.96,
          transition: { duration: 0.1 }
        } : undefined}
        transition={{
          backgroundColor: { duration: 0.2, ease: "easeInOut" }
        }}
        className={cn(
          motionButtonVariants({ variant, size }),
          isLoading && "cursor-wait text-slate-400 shadow-none border border-slate-200",
          className
        )}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <BoliyanLogomarkLoader className="text-slate-400" />
            {loadingText && <span className="text-slate-500">{loadingText}</span>}
          </span>
        ) : (
          children
        )}
      </motion.button>
    );
  }
);

MotionButton.displayName = "MotionButton";

export { MotionButton, motionButtonVariants };
