"use client"

import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full font-bold text-sm whitespace-nowrap transition-all duration-150 outline-none disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground border-2 border-primary/80 border-b-[4px] hover:-translate-y-0.5 hover:border-b-[5px] hover:shadow-[0_0_16px_rgba(37,99,235,0.25)] active:translate-y-[2px] active:border-b-[2px] active:duration-[50ms]",
        outline:
          "border-2 border-border border-b-[4px] bg-background text-foreground hover:bg-muted hover:-translate-y-0.5 hover:border-b-[5px] active:translate-y-[2px] active:border-b-[2px] active:duration-[50ms]",
        secondary:
          "bg-secondary text-secondary-foreground border-2 border-secondary-foreground/10 border-b-[3px] hover:-translate-y-0.5 hover:border-b-[4px] active:translate-y-[1px] active:border-b-[2px]",
        ghost: "hover:bg-muted hover:text-foreground",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 gap-1.5 px-6 text-sm",
        xs: "h-7 gap-1 px-3 text-xs rounded-full",
        sm: "h-8 gap-1 px-4 text-sm rounded-full",
        lg: "h-12 gap-2 px-8 text-base",
        icon: "size-10",
        "icon-xs":
          "size-7 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-8 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
