import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: "default" | "elevated" | "interactive" | "outlined";
    gradient?: boolean;
  }
>(({ className, variant = "default", gradient = false, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground transition-all duration-200 ease-in-out",
      {
        // Default variant with enhanced shadow
        "shadow-sm border-border": variant === "default",
        
        // Elevated variant with larger shadow
        "shadow-md border-border hover:shadow-lg": variant === "elevated",
        
        // Interactive variant with hover effects
        "shadow-sm border-border hover:shadow-md hover:border-primary/20 hover:-translate-y-1 cursor-pointer": variant === "interactive",
        
        // Outlined variant with accent border
        "shadow-none border-2 border-border hover:border-primary/40": variant === "outlined",
        
        // Gradient accent on left border
        "border-l-4 border-l-primary": gradient,
      },
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    compact?: boolean;
  }
>(({ className, compact = false, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col space-y-1.5",
      compact ? "p-4 pb-2" : "p-6 pb-4",
      className
    )}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    size?: "sm" | "md" | "lg";
    icon?: React.ReactNode;
  }
>(({ className, size = "md", icon, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "font-semibold leading-tight tracking-tight flex items-center gap-2",
      {
        "text-lg": size === "sm",
        "text-xl": size === "md", 
        "text-2xl": size === "lg",
      },
      className
    )}
    {...props}
  >
    {icon && <span className="flex-shrink-0">{icon}</span>}
    <span>{children}</span>
  </div>
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-sm text-muted-foreground leading-relaxed",
      className
    )}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    compact?: boolean;
    divided?: boolean;
  }
>(({ className, compact = false, divided = false, ...props }, ref) => (
  <div 
    ref={ref} 
    className={cn(
      compact ? "p-4 pt-0" : "p-6 pt-0",
      divided && "border-t border-border/50",
      className
    )} 
    {...props} 
  />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    compact?: boolean;
    divided?: boolean;
    justify?: "start" | "center" | "end" | "between";
  }
>(({ className, compact = false, divided = false, justify = "start", ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center gap-3",
      compact ? "p-4 pt-2" : "p-6 pt-4",
      divided && "border-t border-border/50 mt-4",
      {
        "justify-start": justify === "start",
        "justify-center": justify === "center", 
        "justify-end": justify === "end",
        "justify-between": justify === "between",
      },
      className
    )}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
