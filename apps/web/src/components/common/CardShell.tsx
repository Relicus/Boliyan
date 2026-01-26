import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface CardShellProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  id: string;
}

/**
 * CardShell: Standard container for marketplace cards.
 * Enforces border-radius, border color, and hover shadow states.
 */
export function CardShell({
  children,
  className,
  id,
  onClick,
  ...props
}: CardShellProps) {
  return (
    <motion.div
      id={id}
      onClick={onClick}
      className={cn(
        "group relative bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-all hover:shadow-md",
        onClick && "cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}

interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

/**
 * CardBody: Standard layout for card content.
 * Enforces padding and flex gap.
 */
export function CardBody({ children, className, id }: CardBodyProps) {
  return (
    <div id={id} className={cn("flex p-3 gap-3", className)}>
      {children}
    </div>
  );
}
