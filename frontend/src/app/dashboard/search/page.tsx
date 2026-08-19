"use client";

import React, { useState } from 'react';
import { API_BASE_URL } from '@/config';
import Link from 'next/link';

interface SearchResultMatch {
  segment_id: string;
  start_time: number;
  end_time: number;
  text: string;
}

interface SearchResultItem {
  video_id: number;
  matches: SearchResultMatch[];
}

interface SearchResponse {
  query: string;
  total_results: number;
  results: SearchResultItem[];
}

export default function GlobalSearchPage() {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || query.length < 2) return;

    setIsSearching(true);
    try {
      const res = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      }
    } catch (e) {
      console.error("Search failed:", e);
    } finally {
      setIsSearching(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-headline-medium font-bold text-md-on-surface">
            Global Search
          </h1>
          <p className="text-body-small text-md-on-surface-variant mt-1">
            Search for exact phrases and keywords across all of your video transcripts.
          </p>
        </div>
        <Link href="/dashboard" className="px-4 py-2 bg-md-surface-container hover:bg-md-surface-container-high text-md-on-surface text-label-large font-medium rounded-full transition-colors">
          Back to Dashboard
        </Link>
      </div>

      <div className="bg-md-surface-container rounded-xl p-6 mb-8">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for something spoken in any video..."
              className="w-full pl-12 pr-4 py-4 text-title-medium border-b-2 border-md-outline rounded-t-md focus:outline-none focus:border-md-primary bg-md-surface-container-highest text-md-on-surface"
            />
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-6 w-6 text-md-on-surface-variant" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <button
            type="submit"
            disabled={isSearching || query.length < 2}
            className="px-8 py-4 bg-md-primary hover:opacity-90 text-md-on-primary font-medium rounded-full transition-colors disabled:opacity-38 disabled:cursor-not-allowed"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      {searchResults && (
        <div className="space-y-6">
          <h2 className="text-title-large font-semibold text-md-on-surface mb-4">
            Found {searchResults.total_results} matches for "{searchResults.query}"
          </h2>

          {searchResults.results.map((videoResult) => (
            <div key={videoResult.video_id} className="bg-md-surface-container rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-md-outline-variant bg-md-surface-container-high flex justify-between items-center">
                <h3 className="font-medium text-md-on-surface flex items-center gap-2">
                  <svg className="w-5 h-5 text-md-on-surface-variant" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                  Video ID: {videoResult.video_id}
                </h3>
                <Link href={`/dashboard/video/${videoResult.video_id}`} className="text-body-small text-md-primary hover:opacity-80 font-medium flex items-center gap-1">
                  View Video
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                </Link>
              </div>
              <div className="divide-y divide-md-outline-variant">
                {videoResult.matches.map((match) => (
                  <div key={match.segment_id} className="p-4 hover:bg-md-surface-container-high transition-colors">
                    <Link href={`/dashboard/video/${videoResult.video_id}?t=${match.start_time}`} className="flex gap-4">
                      <span className="text-label-small font-mono text-md-primary font-medium whitespace-nowrap mt-0.5 bg-md-primary-container px-2 py-1 rounded">
                        {formatTime(match.start_time)}
                      </span>
                      <p className="text-md-on-surface-variant text-body-small leading-relaxed">
                        {/* Super simple highlighting */}
                        {match.text.split(new RegExp(`(${searchResults.query})`, 'gi')).map((part, i) =>
                          part.toLowerCase() === searchResults.query.toLowerCase() ? (
                            <mark key={i} className="bg-md-tertiary-container text-md-on-tertiary-container rounded px-1 font-medium">
                              {part}
                            </mark>
                          ) : (
                            <span key={i}>{part}</span>
                          )
                        )}
                      </p>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
