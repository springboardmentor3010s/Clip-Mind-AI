const STATUS_CONFIG = {
  ready: { classes: "bg-ok/10 text-ok", label: "Completed" },
  processing: { classes: "bg-secondary/10 text-secondary", label: "Processing" },
  uploaded: { classes: "bg-marker/10 text-marker", label: "Uploaded" },
  failed: { classes: "bg-danger/10 text-danger", label: "Failed" },
};

export default function StatusChip({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.uploaded;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${config.classes}`}>
      {config.label}
    </span>
  );
}
