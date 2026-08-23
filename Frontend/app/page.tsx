import Link from 'next/link';

export default function LandingPage() {
  return (
    <main style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* Background orbs */}
      <div style={{ position: 'fixed', top: '-10%', right: '-10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,142,247,0.12) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '-10%', left: '-5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      {/* Navbar */}
      <nav style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 48px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '1.5rem' }}>🎬</span>
          <span className="sidebar-logo-mark" style={{ fontSize: '1.3rem' }}>
            Clip<span className="text-gradient">Mind</span> AI
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/login" className="btn btn-ghost btn-sm">Sign in</Link>
          <Link href="/register" className="btn btn-primary btn-sm">Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '100px 24px 80px', maxWidth: 900, margin: '0 auto' }} className="fade-in">
        <div className="badge badge-blue" style={{ marginBottom: 24, display: 'inline-flex' }}>
          ✨ AI-Powered Video Intelligence
        </div>
        <h1 style={{ marginBottom: 24, fontSize: 'clamp(2.2rem, 6vw, 3.8rem)' }}>
          Transform Long Videos into<br />
          <span className="text-gradient">Instant Insights</span>
        </h1>
        <p style={{ fontSize: '1.15rem', maxWidth: 620, margin: '0 auto 40px', lineHeight: 1.7 }}>
          ClipMind AI automatically transcribes, summarizes, and detects key moments in your videos — saving hours of watch time.
        </p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/register" className="btn btn-primary btn-lg">
            🚀 Start for Free
          </Link>
          <Link href="/login" className="btn btn-secondary btn-lg">
            Sign In
          </Link>
        </div>
      </section>

      {/* Features */}
      <section style={{ position: 'relative', zIndex: 1, padding: '60px 48px', maxWidth: 1100, margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', marginBottom: 48 }}>Everything You Need</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
          {FEATURES.map((f) => (
            <div key={f.title} className="card card-glow" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: '2rem' }}>{f.icon}</div>
              <h3 style={{ fontSize: '1rem' }}>{f.title}</h3>
              <p style={{ fontSize: '0.85rem' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Roles */}
      <section style={{ position: 'relative', zIndex: 1, padding: '40px 48px 80px', maxWidth: 1100, margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', marginBottom: 16 }}>Built for Every Role</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: 40 }}>
          Tailored experiences for creators, educators, learners, and administrators.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {ROLES.map((r) => (
            <div key={r.role} className="card" style={{ textAlign: 'center', padding: 24 }}>
              <div style={{ fontSize: '2.4rem', marginBottom: 12 }}>{r.icon}</div>
              <div className={`badge ${r.color}`} style={{ margin: '0 auto 10px' }}>{r.role}</div>
              <p style={{ fontSize: '0.82rem' }}>{r.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '0 24px 100px' }}>
        <div style={{ background: 'var(--gradient-glow)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', padding: '48px 32px', maxWidth: 600, margin: '0 auto', backdropFilter: 'blur(12px)' }}>
          <h2 style={{ marginBottom: 12 }}>Ready to get started?</h2>
          <p style={{ marginBottom: 28 }}>Join thousands of users turning long videos into key insights.</p>
          <Link href="/register" className="btn btn-primary btn-lg">Create Free Account →</Link>
        </div>
      </section>
    </main>
  );
}

const FEATURES = [
  { icon: '🎙️', title: 'Speech-to-Text Transcription', desc: 'Powered by OpenAI Whisper for accurate multi-language transcription.' },
  { icon: '🤖', title: 'AI Summary Generation', desc: 'GPT-4o creates concise short and detailed summaries instantly.' },
  { icon: '⏱️', title: 'Key Moments Detection', desc: 'Automatically identifies and timestamps the most important segments.' },
  { icon: '📊', title: 'Analytics Dashboard', desc: 'Gain insights into views, engagement, and content performance.' },
  { icon: '🔒', title: 'Role-Based Access', desc: 'Granular permissions for creators, educators, learners, and admins.' },
  { icon: '⚡', title: 'Async Processing', desc: 'Background job queue keeps your workflow fast and non-blocking.' },
];

const ROLES = [
  { icon: '🎬', role: 'Content Creator', color: 'badge-blue', desc: 'Upload videos, generate transcripts, and publish summaries to your audience.' },
  { icon: '📚', role: 'Educator', color: 'badge-violet', desc: 'Transform lectures into concise learning resources and share with students.' },
  { icon: '🎓', role: 'Learner', color: 'badge-green', desc: 'Browse summaries, view key moments, and bookmark important content.' },
  { icon: '🛡️', role: 'Administrator', color: 'badge-rose', desc: 'Manage users, monitor AI jobs, and configure platform settings.' },
];
