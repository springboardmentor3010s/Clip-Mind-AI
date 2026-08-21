import { useWorkspace } from "../context/WorkspaceContext";

export function VideoSelect({ className = "" }: { className?: string }) {
  const { videos, activeId, setActive } = useWorkspace();
  if (videos.length === 0) return null;
  return (
    <select
      aria-label="Active recording"
      value={activeId ?? ""}
      onChange={(e) => setActive(e.target.value)}
      className={`h-10 max-w-64 rounded-xl border border-border bg-card px-3 text-sm outline-none focus:ring-focus ${className}`}
    >
      {videos.map((v) => (
        <option key={v.id} value={v.id}>{v.title}</option>
      ))}
    </select>
  );
}
