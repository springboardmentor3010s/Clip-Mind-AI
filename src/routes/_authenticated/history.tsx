import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { FiClock, FiSearch, FiTrash2 } from "react-icons/fi";
import { useWorkspace } from "../../context/WorkspaceContext";
import { historyService, type HistoryFilters } from "../../services/history";
import { EmptyState } from "../../components/EmptyState";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({
    meta: [
      { title: "History — ClipMind AI" },
      { name: "description", content: "Filterable archive of every recording processed in your ClipMind AI workspace." },
      { property: "og:title", content: "History — ClipMind AI" },
      { property: "og:description", content: "Search, filter and re-open previously processed recordings." },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const { videos, setActive, removeVideo } = useWorkspace();
  const navigate = useNavigate();
  const [filters, setFilters] = useState<HistoryFilters>({ query: "", status: "All", range: "all", sort: "newest" });

  const rows = useMemo(() => historyService.filter(videos, filters), [videos, filters]);
  const set = (patch: Partial<HistoryFilters>) => setFilters((f) => ({ ...f, ...patch }));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl">History</h1>
        <p className="mt-1 text-sm text-muted-foreground">{videos.length} recording(s) in this workspace.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-56 flex-1">
          <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={filters.query}
            onChange={(e) => set({ query: e.target.value })}
            placeholder="Search title, file name, topic or transcript…"
            className="h-10 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-sm outline-none focus:ring-focus"
          />
        </div>
        <select value={filters.status} onChange={(e) => set({ status: e.target.value as HistoryFilters["status"] })} className="h-10 rounded-xl border border-border bg-card px-3 text-sm outline-none focus:ring-focus">
          {["All", "Processed", "Processing", "Queued", "Failed"].map((s) => <option key={s}>{s}</option>)}
        </select>
        <select value={filters.range} onChange={(e) => set({ range: e.target.value as HistoryFilters["range"] })} className="h-10 rounded-xl border border-border bg-card px-3 text-sm outline-none focus:ring-focus">
          <option value="all">All time</option>
          <option value="24h">Last 24 hours</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
        </select>
        <select value={filters.sort} onChange={(e) => set({ sort: e.target.value as HistoryFilters["sort"] })} className="h-10 rounded-xl border border-border bg-card px-3 text-sm outline-none focus:ring-focus">
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="longest">Longest duration</option>
          <option value="title">Title A–Z</option>
        </select>
      </div>

      {videos.length === 0 ? (
        <EmptyState icon={<FiClock />} title="Your archive is empty" description="Processed recordings are listed here with filters for status, date range and sort order." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="p-3 font-medium">Recording</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Duration</th>
                <th className="p-3 font-medium">Moments</th>
                <th className="p-3 font-medium">Processed</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((v) => (
                <tr key={v.id} className="hover:bg-muted/40">
                  <td className="p-3">
                    <button
                      onClick={() => { setActive(v.id); navigate({ to: "/summary" }); }}
                      className="text-left font-medium hover:text-primary"
                    >
                      {v.title}
                      <div className="text-xs text-muted-foreground">{v.fileName}</div>
                    </button>
                  </td>
                  <td className="p-3 text-muted-foreground">{v.status}</td>
                  <td className="p-3 font-mono-num text-muted-foreground">{v.duration}</td>
                  <td className="p-3 font-mono-num text-muted-foreground">{v.moments.length}</td>
                  <td className="p-3 text-muted-foreground">{new Date(v.createdAt).toLocaleString()}</td>
                  <td className="p-3 text-right">
                    <button onClick={() => removeVideo(v.id)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-destructive" aria-label="Delete">
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No recordings match the current filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
