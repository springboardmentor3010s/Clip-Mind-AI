import type { HTMLAttributes, ReactNode } from "react";

interface Props extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "glass" | "gradient";
  children: ReactNode;
}

export function Card({ variant = "default", className = "", children, ...rest }: Props) {
  const base = "rounded-3xl p-6 shadow-soft transition-all";
  const styles = {
    default: "bg-card border border-border/60",
    glass: "glass-strong",
    gradient: "bg-gradient-primary text-white shadow-glow",
  }[variant];
  return (
    <div className={`${base} ${styles} ${className}`} {...rest}>
      {children}
    </div>
  );
}
