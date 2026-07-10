const STATUS_CONFIG = {
  ready: { color: "bg-ok", label: "Ready" },
  processing: { color: "bg-marker", label: "Processing" },
  uploaded: { color: "bg-line-dark", label: "Uploaded" },
  failed: { color: "bg-danger", label: "Failed" },
};

export default function StatusChip({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.uploaded;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide text-ink dark:border-line-dark dark:text-paper">
      <span className={`h-1.5 w-1.5 rounded-full ${config.color}`} />
      {config.label}
    </span>
  );
}