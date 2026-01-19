"use client"

import * as React from "react"
import * as SheetPrimitive from "@radix-ui/react-dialog"
import { motion, AnimatePresence } from "framer-motion"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

const SheetContext = React.createContext<{ open: boolean }>({ open: false })

function Sheet({
  children,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Root>) {
  const [open, setOpen] = React.useState(props.open ?? props.defaultOpen ?? false)

  React.useEffect(() => {
    if (props.open !== undefined) setOpen(props.open)
  }, [props.open])

  return (
    <SheetPrimitive.Root
      {...props}
      open={props.open !== undefined ? props.open : open}
      onOpenChange={(val) => {
        setOpen(val)
        props.onOpenChange?.(val)
      }}
    >
      <SheetContext.Provider value={{ open: props.open !== undefined ? props.open : open }}>
        {children}
      </SheetContext.Provider>
    </SheetPrimitive.Root>
  )
}

function SheetTrigger({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetPortal({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/40 backdrop-blur-sm",
        className
      )}
      {...props}
      asChild
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      />
    </SheetPrimitive.Overlay>
  )
}

function SheetContent({
  className,
  children,
  side = "right",
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: "top" | "right" | "bottom" | "left"
}) {
  const { open } = React.useContext(SheetContext)

  const variants = {
    top: { y: "-100%" },
    bottom: { y: "100%" },
    left: { x: "-100%" },
    right: { x: "100%" },
    animate: { x: 0, y: 0 },
  }

  return (
    <SheetPortal forceMount>
      <AnimatePresence>
        {open && (
          <>
            <SheetOverlay />
            <SheetPrimitive.Content
              forceMount
              data-slot="sheet-content"
              className={cn(
                "bg-background fixed z-50 flex flex-col gap-4 shadow-2xl transition-none",
                side === "right" && "inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm",
                side === "left" && "inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
                side === "top" && "inset-x-0 top-0 h-auto border-b",
                side === "bottom" && "inset-x-0 bottom-0 h-auto border-t",
                className
              )}
              asChild
              {...props}
            >
              <motion.div
                initial={variants[side]}
                animate="animate"
                exit={variants[side]}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
              >
                {children}
                <SheetPrimitive.Close className="ring-offset-background focus:ring-ring absolute top-4 right-4 rounded-full p-2 opacity-70 transition-all hover:bg-black/5 hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none">
                  <XIcon className="size-4" />
                  <span className="sr-only">Close</span>
                </SheetPrimitive.Close>
              </motion.div>
            </SheetPrimitive.Content>
          </>
        )}
      </AnimatePresence>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-1.5 p-4", className)}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4 bg-slate-50", className)}
      {...props}
    />
  )
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("text-foreground font-bold tracking-tight", className)}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
