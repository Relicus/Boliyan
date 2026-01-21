"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      duration={8000}
      visibleToasts={5}
      closeButton
      toastOptions={{
        classNames: {
          toast: "group toast !bg-white !text-slate-950 border border-slate-200 shadow-xl",
          title: "text-slate-950 font-semibold tracking-tight",
          description: "text-slate-700 font-medium",
          actionButton: "bg-slate-900 text-slate-50",
          cancelButton: "bg-slate-100 text-slate-600",
          closeButton: "text-slate-400 hover:text-slate-700",
        },
      }}
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      {...props}
    />
  )
}

export { Toaster }
