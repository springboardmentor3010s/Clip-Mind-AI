"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { API_BASE_URL } from '@/config';
import { Sparkles, Star, Clock } from 'lucide-react';

interface SharedContent {
  video_title: string;
  duration_seconds: number;
  summary_short: string | null;
  summary_detailed: string | null;
  key_moments: { start_time: number; end_time: number; title: string; description: string }[];
  keywords: string[];
  shared_by: string;
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function SharedVideoPage() {
  const params = useParams();
  const token = params?.token as string;

  const [content, setContent] = useState<SharedContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'short' | 'detailed'>('short');

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/share/${token}`);
        if (res.ok) {
          setContent(await res.json());
        } else {
          const data = await res.json().catch(() => ({}));
          setError(data.detail || 'This share link is invalid or has been revoked.');
        }
      } catch (e) {
        setError('Failed to load shared content.');
      } finally {
        setIsLoading(false);
      }
    };
    if (token) fetchContent();
  }, [token]);

  return (
    <div className="min-h-screen bg-md-background text-md-on-background">
      <header className="flex items-center gap-2 px-6 py-5 border-b border-md-outline-variant">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-md-primary">
          <Sparkles size={16} className="text-md-on-primary" />
        </div>
        <span className="text-title-medium font-bold tracking-tight">ClipMind AI</span>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        {isLoading ? (
          <p className="text-md-on-surface-variant">Loading...</p>
        ) : error ? (
          <div className="bg-md-surface-container p-10 rounded-xl text-center space-y-3">
            <h1 className="text-title-large font-semibold">{error}</h1>
            <Link href="/" className="text-md-primary hover:underline">Go to ClipMind AI</Link>
          </div>
        ) : content ? (
          <>
            <div>
              <span className="inline-block px-2.5 py-1 rounded-full bg-md-tertiary-container text-md-on-tertiary-container text-label-small font-semibold mb-3">
                Shared by {content.shared_by}
              </span>
              <h1 className="text-headline-medium font-bold">{content.video_title}</h1>
              <p className="text-md-on-surface-variant mt-1 flex items-center gap-1.5">
                <Clock size={14} />
                {formatTime(content.duration_seconds)}
              </p>
            </div>

            {content.keywords.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {content.keywords.map((kw) => (
                  <span key={kw} className="px-3 py-1 bg-md-secondary-container text-md-on-secondary-container text-label-small font-medium rounded-full">
                    {kw}
                  </span>
                ))}
              </div>
            )}

            {(content.summary_short || content.summary_detailed) && (
              <div className="bg-md-surface-container rounded-xl overflow-hidden">
                <div className="flex border-b border-md-outline-variant bg-md-surface-container-high">
                  <button
                    onClick={() => setActiveTab('short')}
                    className={`py-3 px-4 text-label-large font-medium transition-colors ${activeTab === 'short' ? 'text-md-primary border-b-2 border-md-primary bg-md-surface-container' : 'text-md-on-surface-variant'}`}
                  >
                    Quick Summary
                  </button>
                  <button
                    onClick={() => setActiveTab('detailed')}
                    className={`py-3 px-4 text-label-large font-medium transition-colors ${activeTab === 'detailed' ? 'text-md-primary border-b-2 border-md-primary bg-md-surface-container' : 'text-md-on-surface-variant'}`}
                  >
                    Detailed Notes
                  </button>
                </div>
                <p className="p-6 text-body-medium leading-relaxed whitespace-pre-wrap">
                  {(activeTab === 'short' ? content.summary_short : content.summary_detailed) || 'Not available.'}
                </p>
              </div>
            )}

            {content.key_moments.length > 0 && (
              <div className="bg-md-surface-container rounded-xl overflow-hidden">
                <div className="p-4 border-b border-md-outline-variant bg-md-surface-container-high flex items-center gap-2">
                  <Star size={16} className="text-md-tertiary" />
                  <h3 className="text-title-large font-semibold">Key Moments</h3>
                </div>
                <div className="p-4 space-y-3">
                  {content.key_moments.map((m, i) => (
                    <div key={i} className="p-3 rounded-lg border border-md-outline-variant">
                      <div className="flex gap-3">
                        <span className="text-label-small font-mono font-medium text-md-on-surface-variant mt-0.5">
                          {formatTime(m.start_time)}
                        </span>
                        <div>
                          <h4 className="text-body-small font-semibold mb-1">{m.title}</h4>
                          {m.description && <p className="text-label-small text-md-on-surface-variant">{m.description}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : null}
      </main>
    </div>
  );
}
