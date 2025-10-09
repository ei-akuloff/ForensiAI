import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-all duration-300 overflow-hidden shadow-sm",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-emerald-500/30 [a&]:hover:shadow-emerald-500/40 [a&]:hover:from-emerald-600 [a&]:hover:to-teal-700 [a&]:hover:scale-105",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "text-foreground border-emerald-500/50 [a&]:hover:bg-emerald-500/10 [a&]:hover:text-emerald-700 dark:[a&]:hover:text-emerald-300",
        success: 
          "border-transparent bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-green-500/30 [a&]:hover:shadow-green-500/40 [a&]:hover:scale-105",
        warning: 
          "border-transparent bg-gradient-to-r from-yellow-500 to-orange-600 text-white shadow-yellow-500/30 [a&]:hover:shadow-yellow-500/40 [a&]:hover:scale-105",
        info: 
          "border-transparent bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-cyan-500/30 [a&]:hover:shadow-cyan-500/40 [a&]:hover:scale-105",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
