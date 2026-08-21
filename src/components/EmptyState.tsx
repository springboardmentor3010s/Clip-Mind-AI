import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { FiUploadCloud } from "react-icons/fi";

export function EmptyState({
  icon,
  title,
  description,
  actionLabel = "Upload a recording",
  actionTo = "/upload",
}: {
  icon?: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  actionTo?: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center">
      <div className="mx-auto mb-5 h-12 w-12 rounded-xl border border-border bg-muted flex items-center justify-center text-muted-foreground">
        {icon ?? <FiUploadCloud />}
      </div>
      <h3 className="font-display text-lg">{title}</h3>
      <p className="mx-auto mt-1.5 max-w-md text-sm text-muted-foreground">{description}</p>
      <Link
        to={actionTo}
        className="mt-6 inline-flex h-10 items-center rounded-xl bg-gradient-primary px-4 text-sm font-medium text-white"
      >
        {actionLabel}
      </Link>
    </div>
  );
}
