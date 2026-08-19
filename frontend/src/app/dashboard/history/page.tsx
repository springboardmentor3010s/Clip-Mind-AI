"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { authFetch } from '@/lib/authFetch';
import { History, Eye, Download, Play } from 'lucide-react';

interface ActivityEvent {
  id: number;
  event_type: string;
  video_id: number | null;
  video_title: string | null;
  metadata_val: string | null;
  created_at: string;
}

const EVENT_LABELS: Record<string, string> = {
  video_view: 'Watched',
  export_txt: 'Downloaded',
};

export default function HistoryPage() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await authFetch('/users/me/activity');
        if (res.ok) setEvents(await res.json());
      } catch (e) {
        console.error('Failed to load history:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-4xl">
      <header>
        <h1 className="text-headline-medium font-bold text-md-on-surface tracking-tight flex items-center gap-3">
          Learning History
          <History className="text-md-primary h-6 w-6" />
        </h1>
        <p className="text-md-on-surface-variant mt-2">A record of what you've watched and downloaded.</p>
      </header>

      {loading ? (
        <p className="text-md-on-surface-variant">Loading...</p>
      ) : events.length === 0 ? (
        <div className="bg-md-surface-container p-12 rounded-xl text-center space-y-3">
          <History className="mx-auto text-md-on-surface-variant" size={32} />
          <h3 className="text-title-large font-semibold text-md-on-surface">No activity yet</h3>
          <p className="text-md-on-surface-variant">Videos you watch and materials you download will show up here.</p>
        </div>
      ) : (
        <div className="bg-md-surface-container rounded-xl divide-y divide-md-outline-variant overflow-hidden">
          {events.map((e) => (
            <div key={e.id} className="px-5 py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-full bg-md-surface-container-highest text-md-on-surface-variant shrink-0">
                  {e.event_type === 'export_txt' ? <Download size={16} /> : <Eye size={16} />}
                </div>
                <div className="min-w-0">
                  <p className="text-body-medium text-md-on-surface truncate">
                    {EVENT_LABELS[e.event_type] || e.event_type}
                    {e.video_title ? `: ${e.video_title}` : ''}
                    {e.metadata_val ? ` (${e.metadata_val})` : ''}
                  </p>
                  <p className="text-label-small text-md-on-surface-variant">
                    {new Date(e.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              {e.video_id && (
                <Link
                  href={`/dashboard/video/${e.video_id}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-label-small font-medium text-md-primary hover:bg-md-primary-container rounded-full transition-colors shrink-0"
                >
                  <Play size={14} />
                  Open
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
