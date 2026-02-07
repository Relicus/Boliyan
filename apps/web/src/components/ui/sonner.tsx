"use client"

import { useEffect, useState } from "react"
import {
  CircleCheckIcon,
  InfoIcon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { BoliyanLogomarkLoader } from "@/components/branding/BoliyanLogomarkLoader"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const [position, setPosition] = useState<ToasterProps["position"]>("bottom-right")
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const updateDimensions = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      setPosition(mobile ? "bottom-center" : "bottom-right")
    }

    updateDimensions()
    window.addEventListener("resize", updateDimensions)
    return () => window.removeEventListener("resize", updateDimensions)
  }, [])

  return (
    <Sonner
      theme="light"
      className="toaster group"
      position={position}
      duration={8000}
      visibleToasts={5}
      closeButton={!isMobile}
      toastOptions={{
        classNames: {
          toast: "group toast !bg-white !text-slate-950 border border-slate-200 shadow-xl !rounded-2xl !p-4 md:!pr-12 transition-all duration-300",
          title: "text-slate-950 font-semibold tracking-tight",
          description: "text-slate-700 font-medium",
          actionButton: "bg-slate-900 text-slate-50",
          cancelButton: "bg-slate-100 text-slate-600",
          closeButton: "opacity-0 group-hover:opacity-100 transition-opacity !bg-white !border-slate-100 !text-slate-400 hover:!text-slate-900 !right-3 !top-3 !left-auto !transform-none shadow-sm",
        },
      }}
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <BoliyanLogomarkLoader size="xs" />,
      }}
      {...props}
    />
  )
}

export { Toaster }
