"use client"

import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import { motion, AnimatePresence } from "framer-motion"

import { cn } from "@/lib/utils"

const PopoverContext = React.createContext<{ open: boolean }>({ open: false })

function Popover({
  children,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  const [open, setOpen] = React.useState(props.open ?? props.defaultOpen ?? false)

  React.useEffect(() => {
    if (props.open !== undefined) setOpen(props.open)
  }, [props.open])

  return (
    <PopoverPrimitive.Root
      {...props}
      open={props.open !== undefined ? props.open : open}
      onOpenChange={(val) => {
        setOpen(val)
        props.onOpenChange?.(val)
      }}
    >
      <PopoverContext.Provider value={{ open: props.open !== undefined ? props.open : open }}>
        {children}
      </PopoverContext.Provider>
    </PopoverPrimitive.Root>
  )
}

function PopoverTrigger({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
}

function PopoverContent({
  className,
  align = "center",
  sideOffset = 4,
  children,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  const { open } = React.useContext(PopoverContext)

  return (
    <PopoverPrimitive.Portal forceMount>
      <AnimatePresence>
        {open && (
          <PopoverPrimitive.Content
            forceMount
            data-slot="popover-content"
            align={align}
            sideOffset={sideOffset}
            className={cn(
              "bg-popover text-popover-foreground z-50 w-72 origin-(--radix-popover-content-transform-origin) rounded-lg border-none p-4 shadow-2xl outline-hidden",
              className
            )}
            asChild
            {...props}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 5 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </PopoverPrimitive.Content>
        )}
      </AnimatePresence>
    </PopoverPrimitive.Portal>
  )
}

function PopoverAnchor({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Anchor>) {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />
}

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor }
