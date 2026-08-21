import type { ReactNode } from "react";
import { FiUploadCloud } from "react-icons/fi";

export function EmptyState({
  icon,
  title,
  description,
}: {
  icon?: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center">
      <div className="mx-auto mb-5 h-12 w-12 rounded-xl border border-border bg-muted flex items-center justify-center text-muted-foreground">
        {icon ?? <FiUploadCloud />}
      </div>

      <h3 className="font-display text-lg">{title}</h3>

      <p className="mx-auto mt-1.5 max-w-md text-sm text-muted-foreground">
        {description}
      </p>
    </div>
  );
}