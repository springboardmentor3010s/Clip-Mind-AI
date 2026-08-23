'use client';
import { useState, useRef, useCallback } from 'react';
import { uploadFile, formatBytes } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const ACCEPTED = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/ogg', 'video/x-matroska'];

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', isPublic: true });
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const selectFile = (f: File) => {
    if (!ACCEPTED.includes(f.type)) { setError('Invalid file type. Please upload a video file (MP4, MOV, AVI, WebM, etc.).'); return; }
    if (f.size > 524288000) { setError('File too large. Maximum size is 500MB.'); return; }
    setFile(f);
    setError('');
    if (!form.title) set('title', f.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '));
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) selectFile(f);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return setError('Please select a video file.');
    if (!form.title.trim()) return setError('Title is required.');
    setUploading(true); setError(''); setSuccess('');
    try {
      const fd = new FormData();
      fd.append('video', file);
      fd.append('title', form.title);
      fd.append('description', form.description);
      fd.append('isPublic', String(form.isPublic));
      const res = await uploadFile('/videos', fd, setProgress);
      setSuccess('Video uploaded successfully! Processing started.');
      setTimeout(() => router.push(`/videos/${res.data.video.id}`), 1500);
    } catch (err: any) {
      setError(err.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <div className="page-header">
        <h1>⬆️ Upload Video</h1>
        <p>Upload a video to generate AI transcripts, summaries, and key moments.</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Drop zone */}
        <div
          className={`upload-zone ${drag ? 'drag-over' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={onDrop}
          onClick={() => !file && fileInputRef.current?.click()}
        >
          <input ref={fileInputRef} type="file" accept={ACCEPTED.join(',')} style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) selectFile(f); }} />

          {file ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, textAlign: 'left', padding: '0 20px' }}>
              <div style={{ fontSize: '3rem' }}>🎬</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{file.name}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{formatBytes(file.size)} · {file.type}</div>
              </div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); setFile(null); setProgress(0); }}>✕ Remove</button>
            </div>
          ) : (
            <>
              <div className="upload-zone-icon">📹</div>
              <h3>Drag & drop your video here</h3>
              <p style={{ margin: '8px 0 16px' }}>or click to browse files</p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                {['MP4', 'MOV', 'AVI', 'WebM', 'MKV'].map((f) => (
                  <span key={f} className="badge badge-gray">{f}</span>
                ))}
              </div>
              <p style={{ fontSize: '0.8rem', marginTop: 12 }}>Maximum file size: 500MB</p>
            </>
          )}
        </div>

        {/* Upload progress */}
        {uploading && (
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Uploading...</span>
              <span style={{ fontSize: '0.875rem', color: 'var(--accent-blue)', fontWeight: 700 }}>{progress}%</span>
            </div>
            <div className="progress-bar-wrapper">
              <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {error && <div className="alert alert-error">⚠️ {error}</div>}
        {success && <div className="alert alert-success">✅ {success}</div>}

        {/* Metadata */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ marginBottom: 4 }}>📋 Video Details</h3>

          <div className="input-group">
            <label className="input-label">Title *</label>
            <input id="video-title" className="input" type="text" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Enter a descriptive title..." required maxLength={200} />
          </div>

          <div className="input-group">
            <label className="input-label">Description</label>
            <textarea className="input" value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Describe your video content..." rows={3} style={{ resize: 'vertical' }} />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
            <div style={{
              width: 44, height: 24, borderRadius: 12,
              background: form.isPublic ? 'var(--accent-blue)' : 'rgba(255,255,255,0.1)',
              position: 'relative', transition: 'background 0.2s', flexShrink: 0,
            }}>
              <div style={{
                position: 'absolute', top: 3, left: form.isPublic ? 22 : 3,
                width: 18, height: 18, borderRadius: '50%', background: '#fff',
                transition: 'left 0.2s',
              }} />
              <input type="checkbox" checked={form.isPublic} onChange={(e) => set('isPublic', e.target.checked)} style={{ display: 'none' }} />
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>Make Public</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Allow learners and others to discover this video</div>
            </div>
          </label>
        </div>

        {/* AI processing info */}
        <div style={{ padding: '16px 20px', borderRadius: 'var(--radius-md)', background: 'rgba(79,142,247,0.06)', border: '1px solid rgba(79,142,247,0.15)' }}>
          <h4 style={{ marginBottom: 8, color: 'var(--accent-blue)', fontSize: '0.875rem' }}>🤖 What happens after upload?</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {['FFmpeg processes your video and generates a thumbnail', 'Audio is extracted for transcription', 'Trigger "Generate AI Analysis" to get transcripts, summaries & key moments'].map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <span style={{ color: 'var(--accent-blue)', fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
                {step}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button id="upload-submit" type="submit" className="btn btn-primary btn-lg" disabled={uploading || !file} style={{ flex: 1 }}>
            {uploading ? <><span className="spinner" /> Uploading {progress}%...</> : '⬆️ Upload Video'}
          </button>
          <Link href="/videos" className="btn btn-secondary btn-lg">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
