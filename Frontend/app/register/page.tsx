'use client';
import { useState } from 'react';
import Link from 'next/link';
import { AuthProvider, useAuth } from '@/lib/auth';

const ROLES = [
  { value: 'LEARNER',         label: '🎓 Learner',          desc: 'Browse and consume video content' },
  { value: 'CONTENT_CREATOR', label: '🎬 Content Creator',  desc: 'Upload and manage video content' },
  { value: 'EDUCATOR',        label: '📚 Educator',         desc: 'Create educational content' },
];

function RegisterForm() {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'LEARNER' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) return setError('Password must be at least 8 characters.');
    setLoading(true);
    try {
      await register(form);
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-orb" style={{ width: 500, height: 500, top: '-10%', left: '-10%', background: 'radial-gradient(circle, rgba(139,92,246,0.14) 0%, transparent 70%)' }} />
      <div className="auth-bg-orb" style={{ width: 400, height: 400, bottom: '-10%', right: '-5%', background: 'radial-gradient(circle, rgba(6,182,212,0.1) 0%, transparent 70%)' }} />

      <div className="auth-card" style={{ maxWidth: 480 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: '2.2rem', marginBottom: 8 }}>🎬</div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: 4 }}>Create Your Account</h1>
          <p style={{ fontSize: '0.875rem' }}>Join ClipMind AI today — it's free</p>
        </div>

        {error && <div className="alert alert-error mb-4">{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="input-group">
            <label className="input-label">Full Name</label>
            <div className="input-icon-wrapper">
              <span className="input-icon">👤</span>
              <input id="name" className="input" type="text" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Jane Smith" required minLength={2} />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Email Address</label>
            <div className="input-icon-wrapper">
              <span className="input-icon">✉️</span>
              <input id="reg-email" className="input" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="jane@example.com" required />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Password</label>
            <div className="input-icon-wrapper">
              <span className="input-icon">🔒</span>
              <input id="reg-password" className="input" type="password" value={form.password} onChange={(e) => set('password', e.target.value)} placeholder="Min 8 chars with uppercase & number" required />
            </div>
          </div>

          {/* Role selection */}
          <div className="input-group">
            <label className="input-label">I am a...</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ROLES.map((r) => (
                <label key={r.value} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${form.role === r.value ? 'var(--accent-blue)' : 'var(--border-subtle)'}`,
                  background: form.role === r.value ? 'rgba(79,142,247,0.08)' : 'var(--bg-input)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}>
                  <input type="radio" name="role" value={r.value} checked={form.role === r.value} onChange={() => set('role', r.value)} style={{ display: 'none' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{r.label}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.desc}</div>
                  </div>
                  {form.role === r.value && <span style={{ color: 'var(--accent-blue)' }}>✓</span>}
                </label>
              ))}
            </div>
          </div>

          <button id="register-btn" type="submit" className="btn btn-primary btn-full" style={{ marginTop: 8 }} disabled={loading}>
            {loading ? <><span className="spinner" /> Creating Account...</> : 'Create Account →'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>Sign in</Link>
          </span>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return <AuthProvider><RegisterForm /></AuthProvider>;
}
