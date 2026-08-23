'use client';
import { useState } from 'react';
import Link from 'next/link';
import { AuthProvider, useAuth } from '@/lib/auth';

function LoginForm() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role: string) => {
    const creds: Record<string, { e: string; p: string }> = {
      admin:   { e: 'admin@clipmind.ai',   p: 'Admin@123' },
      creator: { e: 'creator@clipmind.ai', p: 'Creator@123' },
      educator:{ e: 'educator@clipmind.ai',p: 'Educator@123' },
      learner: { e: 'learner@clipmind.ai', p: 'Learner@123' },
    };
    setEmail(creds[role].e);
    setPassword(creds[role].p);
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-orb" style={{ width: 500, height: 500, top: '-15%', right: '-10%', background: 'radial-gradient(circle, rgba(79,142,247,0.14) 0%, transparent 70%)' }} />
      <div className="auth-bg-orb" style={{ width: 400, height: 400, bottom: '-10%', left: '-10%', background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)' }} />

      <div className="auth-card">
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🎬</div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: 4 }}>
            Clip<span className="text-gradient">Mind</span> AI
          </h1>
          <p style={{ fontSize: '0.875rem' }}>Sign in to your account</p>
        </div>

        {/* Demo credentials */}
        <div style={{ marginBottom: 24, padding: 14, background: 'rgba(79,142,247,0.06)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(79,142,247,0.15)' }}>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Quick Demo Login</p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['creator', 'educator', 'learner'].map((r) => (
              <button key={r} onClick={() => fillDemo(r)} className="btn btn-secondary btn-sm" style={{ textTransform: 'capitalize', fontSize: '0.72rem' }}>
                {r === 'creator' ? 'Creator' : r === 'educator' ? 'Educator' : 'Learner'}
              </button>
            ))}
          </div>
        </div>

        {error && <div className="alert alert-error mb-4">{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="input-group">
            <label className="input-label">Email Address</label>
            <div className="input-icon-wrapper">
              <span className="input-icon">✉️</span>
              <input id="email" className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Password</label>
            <div className="input-icon-wrapper" style={{ position: 'relative' }}>
              <span className="input-icon">🔒</span>
              <input id="password" className="input" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required style={{ paddingRight: 44 }} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button id="login-btn" type="submit" className="btn btn-primary btn-full" style={{ marginTop: 8 }} disabled={loading}>
            {loading ? <><span className="spinner" /> Signing in...</> : 'Sign In →'}
          </button>
        </form>

        <div className="divider-text" style={{ margin: '24px 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
          <span>No account yet?</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
        </div>

        <Link href="/register" className="btn btn-secondary btn-full">
          Create an Account
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <AuthProvider><LoginForm /></AuthProvider>;
}
