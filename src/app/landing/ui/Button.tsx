"use client";

import { cn } from "@/lib/utils";
import { type ButtonHTMLAttributes, forwardRef } from "react";

type ButtonVariant = "primary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "default" | "large";
  href?: string;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "default", href, children, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-bold cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ocean-primary)]/50 disabled:pointer-events-none disabled:opacity-50";

    const variants: Record<ButtonVariant, string> = {
      primary:
        "bg-[var(--ocean-primary)] text-white font-bold text-base border-2 border-[var(--ocean-primary-dark)] border-b-[5px] rounded-full transition-all duration-[120ms] hover:bg-[var(--ocean-primary-light)] hover:border-[var(--ocean-primary)] hover:-translate-y-0.5 hover:border-b-[6px] hover:shadow-[0_0_20px_var(--ocean-primary-glow)] active:translate-y-[3px] active:border-b-[2px] active:duration-[50ms]",
      ghost:
        "bg-transparent text-[var(--ocean-text-secondary)] border-2 border-white/[0.12] border-b-[4px] rounded-full font-semibold text-base transition-all duration-[120ms] hover:border-[var(--ocean-primary)] hover:text-[var(--ocean-text)] hover:bg-[rgba(37,99,235,0.08)] hover:-translate-y-0.5 hover:border-b-[5px] active:translate-y-[3px] active:border-b-[2px] active:duration-[50ms]",
    };

    const sizes = {
      default: "h-13 px-10 py-3.5 text-base rounded-full",
      large: "h-15 px-12 py-4 text-lg rounded-full",
    };

    const classes = cn(baseStyles, variants[variant], sizes[size], className);

    const fontStyle = { fontFamily: 'var(--font-heading)' };

    if (href) {
      return (
        <a href={href} className={classes} style={fontStyle}>
          {children}
        </a>
      );
    }

    return (
      <button ref={ref} className={classes} style={fontStyle} {...props}>
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button };
