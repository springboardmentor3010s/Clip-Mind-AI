import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  icon?: ReactNode;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { label, hint, icon, error, className = "", ...rest }, ref,
) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-sm font-medium text-foreground">{label}</span>}
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</span>
        )}
        <input
          ref={ref}
          className={`w-full h-11 rounded-2xl border border-border bg-card px-4 ${icon ? "pl-10" : ""} text-sm text-foreground placeholder:text-muted-foreground/70 transition-all focus:border-primary focus:ring-focus ${error ? "border-destructive" : ""} ${className}`}
          {...rest}
        />
      </div>
      {(hint || error) && (
        <span className={`mt-1.5 block text-xs ${error ? "text-destructive" : "text-muted-foreground"}`}>{error || hint}</span>
      )}
    </label>
  );
});
