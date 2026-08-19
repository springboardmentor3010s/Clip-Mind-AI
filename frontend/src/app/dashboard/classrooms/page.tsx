"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { authFetch } from '@/lib/authFetch';
import { useAuth } from '@/context/AuthContext';
import { Users2, Plus, ArrowRight } from 'lucide-react';

interface ClassroomSummary {
  id: number;
  name: string;
  educator_username: string | null;
  student_count: number;
  video_count: number;
  created_at: string;
}

export default function ClassroomsPage() {
  const { user } = useAuth();
  const role = (user as any)?.role;
  const isEducator = role === 'Educator' || role === 'Administrator';

  const [classrooms, setClassrooms] = useState<ClassroomSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchClassrooms = async () => {
    try {
      const res = await authFetch(isEducator ? '/classrooms/mine' : '/classrooms/joined');
      if (res.ok) setClassrooms(await res.json());
    } catch (e) {
      console.error('Failed to load classrooms:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassrooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await authFetch('/classrooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (res.ok) {
        setNewName('');
        fetchClassrooms();
      } else {
        alert('Failed to create classroom.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-4xl">
      <header>
        <h1 className="text-headline-medium font-bold text-md-on-surface tracking-tight flex items-center gap-3">
          Classrooms
          <Users2 className="text-md-primary h-6 w-6" />
        </h1>
        <p className="text-md-on-surface-variant mt-2">
          {isEducator
            ? 'Group students and assigned videos so content stays organized per cohort.'
            : 'Classrooms you\'ve been added to.'}
        </p>
      </header>

      {isEducator && (
        <form onSubmit={handleCreate} className="bg-md-surface-container rounded-xl p-5 flex items-center gap-3">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New classroom name (e.g. Period 3 Biology)"
            className="flex-1 px-4 py-2.5 bg-md-surface-container-highest rounded-full text-md-on-surface placeholder:text-md-on-surface-variant focus:outline-none focus:ring-2 focus:ring-md-primary"
          />
          <button
            type="submit"
            disabled={creating || !newName.trim()}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-md-primary hover:opacity-90 text-md-on-primary text-label-large font-semibold rounded-full transition-all disabled:opacity-50"
          >
            <Plus size={16} />
            Create
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-md-on-surface-variant">Loading...</p>
      ) : classrooms.length === 0 ? (
        <div className="bg-md-surface-container p-12 rounded-xl text-center space-y-3">
          <Users2 className="mx-auto text-md-on-surface-variant" size={32} />
          <h3 className="text-title-large font-semibold text-md-on-surface">
            {isEducator ? 'No classrooms yet' : "You haven't been added to a classroom yet"}
          </h3>
          <p className="text-md-on-surface-variant">
            {isEducator ? 'Create one above to start organizing students and videos.' : 'Ask your educator to add you by your account email.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {classrooms.map((c) => (
            <Link
              key={c.id}
              href={`/dashboard/classrooms/${c.id}`}
              className="bg-md-surface-container rounded-xl p-5 flex items-center justify-between gap-4 hover:bg-md-surface-container-high transition-colors group"
            >
              <div className="min-w-0">
                <p className="text-title-medium font-semibold text-md-on-surface truncate">{c.name}</p>
                <p className="text-label-small text-md-on-surface-variant mt-1">
                  {c.student_count} student{c.student_count === 1 ? '' : 's'} · {c.video_count} video{c.video_count === 1 ? '' : 's'}
                  {!isEducator && c.educator_username ? ` · Taught by ${c.educator_username}` : ''}
                </p>
              </div>
              <ArrowRight size={18} className="text-md-on-surface-variant group-hover:text-md-primary transition-colors shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
