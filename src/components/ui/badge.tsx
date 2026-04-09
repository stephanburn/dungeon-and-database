import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium tracking-[0.01em] transition-colors focus:outline-none focus:ring-2 focus:ring-white/15",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-neutral-100 text-neutral-950 hover:bg-white",
        secondary:
          "border-white/10 bg-white/[0.05] text-neutral-200 hover:bg-white/[0.08]",
        destructive:
          "border-transparent bg-red-500/90 text-white hover:bg-red-400",
        outline: "border-white/12 text-neutral-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
