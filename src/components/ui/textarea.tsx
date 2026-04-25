import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "focus-ring flex min-h-[96px] w-full rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-base text-neutral-100 placeholder:text-neutral-500 focus-visible:border-blue-300/35 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
