"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { motion, AnimatePresence } from "framer-motion"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

const DialogContext = React.createContext<{ open: boolean }>({ open: false })

function Dialog({
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  const [open, setOpen] = React.useState(props.open ?? props.defaultOpen ?? false)

  React.useEffect(() => {
    if (props.open !== undefined) setOpen(props.open)
  }, [props.open])

  return (
    <DialogPrimitive.Root
      {...props}
      open={props.open !== undefined ? props.open : open}
      onOpenChange={(val) => {
        setOpen(val)
        props.onOpenChange?.(val)
      }}
    >
      <DialogContext.Provider value={{ open: props.open !== undefined ? props.open : open }}>
        {children}
      </DialogContext.Provider>
    </DialogPrimitive.Root>
  )
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
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
    </DialogPrimitive.Overlay>
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
}) {
  const { open } = React.useContext(DialogContext)

  return (
    <DialogPortal forceMount>
      <AnimatePresence>
        {open && (
          <>
            <DialogOverlay />
            <DialogPrimitive.Content
              forceMount
              data-slot="dialog-content"
              className={cn(
                "bg-background fixed top-[50%] left-[50%] z-50 flex w-[94vw] max-w-md translate-x-[-50%] translate-y-[-50%] flex-col gap-4 overflow-hidden rounded-xl shadow-2xl outline-none sm:max-w-md md:max-w-lg",
                className
              )}
              asChild
              {...props}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 8 }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
              >
                {children}
                {showCloseButton && (
                  <DialogPrimitive.Close
                    data-slot="dialog-close"
                    className="ring-offset-background focus:ring-ring absolute top-3 right-3 rounded-full p-1 opacity-70 transition-all hover:bg-black/5 hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none"
                  >
                    <XIcon className="size-4" />
                    <span className="sr-only">Close</span>
                  </DialogPrimitive.Close>
                )}
              </motion.div>
            </DialogPrimitive.Content>
          </>
        )}
      </AnimatePresence>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-1.5 p-4 text-center sm:text-left", className)}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 bg-slate-50 p-4 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-lg leading-none font-bold tracking-tight", className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
