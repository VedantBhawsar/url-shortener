import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  Link2,
  Zap,
  BarChart3,
  Globe,
  Shield,
  Clock,
  ArrowRight,
  Check,
  MousePointerClick,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Lock,
  Timer,
  Star,
} from 'lucide-react';
import { useAuthStore, selectIsAuthenticated } from '@/store/authStore';

// ─── Data ─────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: <Link2 className="w-5 h-5" />,
    title: 'Instant link shortening',
    description: 'Shorten any URL in seconds. Share clean, memorable links everywhere.',
    color: '#7c3aed',
  },
  {
    icon: <BarChart3 className="w-5 h-5" />,
    title: 'Detailed analytics',
    description: 'Track clicks, devices, browsers, OS and geo-location for every link.',
    color: '#2563eb',
  },
  {
    icon: <Globe className="w-5 h-5" />,
    title: 'Region blocking',
    description: 'Restrict access to specific countries to control who reaches your content.',
    color: '#059669',
  },
  {
    icon: <Clock className="w-5 h-5" />,
    title: 'Custom expiry dates',
    description: 'Set links to expire at any time — great for limited-time promotions.',
    color: '#d97706',
  },
  {
    icon: <Shield className="w-5 h-5" />,
    title: 'Secure & reliable',
    description: 'Every redirect is served over HTTPS with low-latency edge caching.',
    color: '#dc2626',
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: 'Premium on demand',
    description: 'Start for free. Upgrade to Premium when you need more power — no lock-in.',
    color: '#5e5cff',
  },
];

const STEPS = [
  {
    number: '01',
    title: 'Paste your long URL',
    description: 'Drop any URL into the input field — no signup required to get started.',
    icon: <Link2 className="w-5 h-5" />,
  },
  {
    number: '02',
    title: 'Get your short link',
    description: 'Receive a clean short link instantly, ready to share anywhere.',
    icon: <Sparkles className="w-5 h-5" />,
  },
  {
    number: '03',
    title: 'Track every click',
    description: 'Open your dashboard to see real-time analytics for every link you create.',
    icon: <TrendingUp className="w-5 h-5" />,
  },
];

const FREE_FEATURES = [
  '10 short links',
  '7-day auto-expiry',
  'Click count tracking',
  'HTTPS secure redirects',
];

const PREMIUM_FEATURES = [
  'Unlimited links',
  'Custom expiry dates',
  'Region blocking',
  'Full click analytics',
  'Geo, device & browser stats',
  'Priority support',
  'API access',
  'Custom domains',
];

const STATS = [
  { value: '10ms', label: 'Avg redirect latency', icon: <Timer className="w-4 h-4" /> },
  { value: '99.9%', label: 'Uptime SLA', icon: <Shield className="w-4 h-4" /> },
  { value: 'Free', label: 'To get started', icon: <Star className="w-4 h-4" /> },
];

const TESTIMONIALS = [
  {
    quote: 'snip.ly cut our link management chaos by 80%. The analytics alone are worth it.',
    author: 'Sarah K.',
    role: 'Marketing Lead',
    avatar: 'SK',
  },
  {
    quote: 'Clean interface, insane speed. We use it for every campaign now.',
    author: 'Marc D.',
    role: 'Growth Hacker',
    avatar: 'MD',
  },
  {
    quote: 'Region blocking saved us from compliance headaches. 10/10 recommend.',
    author: 'Priya R.',
    role: 'Product Manager',
    avatar: 'PR',
  },
];

// ─── Styles ───────────────────────────────────────────────────────────────────

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&family=DM+Mono:wght@400;500&display=swap');

  .snip-root { font-family: 'Bricolage Grotesque', sans-serif; }
  .snip-root * { box-sizing: border-box; margin: 0; padding: 0; }

  @keyframes fade-up {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulse-ring {
    0%   { box-shadow: 0 0 0 0 rgba(94,92,255,0.45); }
    70%  { box-shadow: 0 0 0 12px rgba(94,92,255,0); }
    100% { box-shadow: 0 0 0 0 rgba(94,92,255,0); }
  }
  @keyframes ticker {
    from { transform: translateX(0); }
    to   { transform: translateX(-50%); }
  }
  @keyframes card-enter {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .snip-hero-title {
    font-size: clamp(2.6rem, 7vw, 5.2rem);
    font-weight: 800;
    line-height: 1.05;
    letter-spacing: -0.03em;
    color: #f0eeff;
  }
  .snip-accent { color: #7c6fff; }

  .snip-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 16px;
    transition: border-color 0.25s, transform 0.25s, box-shadow 0.25s;
    animation: card-enter 0.45s ease both;
  }
  .snip-card:hover {
    border-color: rgba(94,92,255,0.35);
    transform: translateY(-3px);
    box-shadow: 0 16px 48px rgba(0,0,0,0.4);
  }

  .snip-glow-btn {
    background: #5e5cff;
    border: none;
    border-radius: 10px;
    color: #fff;
    font-family: 'Bricolage Grotesque', sans-serif;
    font-weight: 600;
    font-size: 0.95rem;
    padding: 12px 26px;
    cursor: pointer;
    animation: pulse-ring 2.5s infinite;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    white-space: nowrap;
    transition: background 0.2s, transform 0.2s;
  }
  .snip-glow-btn:hover {
    background: #4a48e8;
    transform: translateY(-1px);
    animation: none;
    box-shadow: 0 8px 28px rgba(94,92,255,0.4);
  }

  .snip-outline-btn {
    background: transparent;
    border: 1px solid rgba(255,255,255,0.14);
    border-radius: 10px;
    color: rgba(255,255,255,0.7);
    font-family: 'Bricolage Grotesque', sans-serif;
    font-weight: 500;
    font-size: 0.95rem;
    padding: 12px 26px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    white-space: nowrap;
    transition: border-color 0.2s, color 0.2s, background 0.2s;
  }
  .snip-outline-btn:hover {
    border-color: rgba(255,255,255,0.3);
    color: #fff;
    background: rgba(255,255,255,0.05);
  }

  .snip-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(94,92,255,0.12);
    border: 1px solid rgba(94,92,255,0.26);
    border-radius: 999px;
    padding: 5px 14px;
    font-size: 0.77rem;
    font-weight: 600;
    color: #a49fff;
    letter-spacing: 0.01em;
  }

  .snip-mono { font-family: 'DM Mono', monospace; }

  .snip-ticker-track {
    display: flex;
    gap: 3rem;
    animation: ticker 22s linear infinite;
    width: max-content;
  }

  .snip-grid-bg {
    background-image:
      linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
    background-size: 48px 48px;
  }

  .snip-premium-card {
    background: rgba(94,92,255,0.06);
    border: 1px solid rgba(94,92,255,0.3);
    border-radius: 20px;
    position: relative;
    overflow: hidden;
  }

  .snip-avatar {
    width: 36px; height: 36px;
    border-radius: 50%;
    background: #5e5cff;
    display: flex; align-items: center; justify-content: center;
    font-size: 0.72rem; font-weight: 700; color: #fff; flex-shrink: 0;
  }

  @media (max-width: 640px) {
    .snip-hero-title { font-size: 2.3rem; }
  }
`;

// ─── Component ────────────────────────────────────────────────────────────────

export function LandingPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const goApp = () => navigate(isAuthenticated ? '/dashboard/links' : '/login');

  return (
    <>
      <style>{CSS}</style>

      <div
        className="snip-root"
        style={{ background: '#07060f', color: '#f0eeff', minHeight: '100vh', overflowX: 'hidden' }}
      >
        {/* Subtle dot grid */}
        <div
          className="snip-grid-bg"
          style={{ position: 'fixed', inset: 0, zIndex: 0, opacity: 0.6 }}
        />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* ── Navbar ──────────────────────────────────────────────────── */}
          <header
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 100,
              padding: '0 2rem',
              height: 64,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: scrolled ? 'rgba(7,6,15,0.9)' : 'transparent',
              backdropFilter: scrolled ? 'blur(18px)' : 'none',
              borderBottom: scrolled ? '1px solid rgba(255,255,255,0.07)' : '1px solid transparent',
              transition: 'all 0.3s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: '#5e5cff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Link2 style={{ width: 15, height: 15, color: '#fff', strokeWidth: 2.5 }} />
              </div>
              <span style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.02em' }}>
                snip.ly
              </span>
            </div>

            <nav style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
              {['Features', 'Pricing', 'How it works'].map((item) => (
                <button
                  key={item}
                  onClick={() => (item === 'Pricing' ? navigate('/pricing') : undefined)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'rgba(240,238,255,0.48)',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    fontFamily: "'Bricolage Grotesque', sans-serif",
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#f0eeff')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(240,238,255,0.48)')}
                >
                  {item}
                </button>
              ))}
            </nav>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                className="snip-outline-btn"
                style={{ padding: '8px 18px', fontSize: '0.85rem' }}
                onClick={goApp}
              >
                {isAuthenticated ? 'Dashboard' : 'Sign in'}
              </button>
              <button
                className="snip-glow-btn"
                style={{ padding: '8px 18px', fontSize: '0.85rem' }}
                onClick={goApp}
              >
                {isAuthenticated ? 'Go to app' : 'Get started'}
                <ArrowRight style={{ width: 14, height: 14 }} />
              </button>
            </div>
          </header>

          {/* ── Hero ──────────────────────────────────────────────────── */}
          <section
            style={{
              maxWidth: 860,
              margin: '0 auto',
              padding: '96px 2rem 80px',
              textAlign: 'center',
            }}
          >
            <div style={{ marginBottom: 22, animation: 'fade-up 0.55s ease both' }}>
              <span className="snip-badge">
                <Sparkles style={{ width: 11, height: 11 }} />
                Free to start · No credit card required
              </span>
            </div>

            <h1
              className="snip-hero-title"
              style={{ marginBottom: 22, animation: 'fade-up 0.55s 0.08s ease both', opacity: 0 }}
            >
              Short links. <span className="snip-accent">Big insights.</span>
            </h1>

            <p
              style={{
                color: 'rgba(240,238,255,0.48)',
                fontSize: '1.1rem',
                lineHeight: 1.65,
                maxWidth: 500,
                margin: '0 auto 36px',
                animation: 'fade-up 0.55s 0.16s ease both',
                opacity: 0,
              }}
            >
              Create clean, shareable short links in seconds. Track every click with detailed
              analytics — devices, locations, browsers, and more.
            </p>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 12,
                justifyContent: 'center',
                animation: 'fade-up 0.55s 0.24s ease both',
                opacity: 0,
              }}
            >
              <button
                className="snip-glow-btn"
                style={{ fontSize: '1rem', padding: '13px 30px' }}
                onClick={goApp}
              >
                <Zap style={{ width: 16, height: 16 }} />
                {isAuthenticated ? 'Go to Dashboard' : 'Start for free'}
              </button>
              <button
                className="snip-outline-btn"
                style={{ fontSize: '1rem', padding: '13px 30px' }}
                onClick={() => navigate('/pricing')}
              >
                View pricing <ChevronRight style={{ width: 15, height: 15 }} />
              </button>
            </div>

            <div
              style={{
                marginTop: 28,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                justifyContent: 'center',
                animation: 'fade-up 0.55s 0.32s ease both',
                opacity: 0,
              }}
            >
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  style={{ width: 13, height: 13, color: '#fbbf24', fill: '#fbbf24' }}
                />
              ))}
              <span style={{ color: 'rgba(240,238,255,0.35)', fontSize: '0.8rem' }}>
                Trusted by 3,000+ marketers & developers
              </span>
            </div>
          </section>

          {/* ── Ticker ──────────────────────────────────────────────────── */}
          <div
            style={{
              overflow: 'hidden',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(255,255,255,0.02)',
              padding: '13px 0',
            }}
          >
            <div className="snip-ticker-track">
              {[...Array(2)].map((_, i) =>
                [
                  'Unlimited links',
                  'Real-time analytics',
                  'Region blocking',
                  '10ms redirects',
                  '99.9% uptime',
                  'HTTPS secure',
                  'Free to start',
                  'Cancel anytime',
                  'Stripe payments',
                  'Priority support',
                ].map((item) => (
                  <span
                    key={`${i}-${item}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      color: 'rgba(240,238,255,0.28)',
                      fontSize: '0.78rem',
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                    }}
                  >
                    <span style={{ color: '#5e5cff' }}>✦</span>
                    {item}
                  </span>
                )),
              )}
            </div>
          </div>

          {/* ── Stats ─────────────────────────────────────────────────── */}
          <section style={{ maxWidth: 820, margin: '0 auto', padding: '80px 2rem' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 16,
              }}
            >
              {STATS.map(({ value, label, icon }) => (
                <div
                  key={label}
                  className="snip-card"
                  style={{ padding: '28px 24px', textAlign: 'center' }}
                >
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 10,
                      background: 'rgba(94,92,255,0.1)',
                      border: '1px solid rgba(94,92,255,0.18)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#7c6fff',
                      margin: '0 auto 14px',
                    }}
                  >
                    {icon}
                  </div>
                  <div style={{ fontSize: '2.1rem', fontWeight: 800, letterSpacing: '-0.04em' }}>
                    {value}
                  </div>
                  <div
                    style={{ fontSize: '0.8rem', color: 'rgba(240,238,255,0.38)', marginTop: 4 }}
                  >
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Features ──────────────────────────────────────────────── */}
          <section style={{ maxWidth: 1080, margin: '0 auto', padding: '0 2rem 96px' }}>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <span className="snip-badge" style={{ marginBottom: 14, display: 'inline-flex' }}>
                <Zap style={{ width: 11, height: 11 }} />
                Everything you need
              </span>
              <h2
                style={{
                  fontSize: 'clamp(1.75rem, 4vw, 2.6rem)',
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  marginBottom: 12,
                }}
              >
                Powerful tools, simple interface
              </h2>
              <p
                style={{
                  color: 'rgba(240,238,255,0.42)',
                  maxWidth: 420,
                  margin: '0 auto',
                  lineHeight: 1.65,
                  fontSize: '0.93rem',
                }}
              >
                From basic link shortening to advanced analytics and access controls — all in one
                place.
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 14,
              }}
            >
              {FEATURES.map((f, idx) => (
                <div
                  key={f.title}
                  className="snip-card"
                  style={{ padding: 26, animationDelay: `${idx * 0.06}s` }}
                >
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 10,
                      background: f.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      marginBottom: 16,
                    }}
                  >
                    {f.icon}
                  </div>
                  <h3
                    style={{
                      fontSize: '0.93rem',
                      fontWeight: 700,
                      marginBottom: 7,
                      color: '#f0eeff',
                    }}
                  >
                    {f.title}
                  </h3>
                  <p
                    style={{
                      fontSize: '0.825rem',
                      color: 'rgba(240,238,255,0.42)',
                      lineHeight: 1.65,
                    }}
                  >
                    {f.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* ── How it works ──────────────────────────────────────────── */}
          <section
            style={{
              borderTop: '1px solid rgba(255,255,255,0.06)',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(255,255,255,0.015)',
              padding: '96px 2rem',
            }}
          >
            <div style={{ maxWidth: 860, margin: '0 auto' }}>
              <div style={{ textAlign: 'center', marginBottom: 60 }}>
                <span className="snip-badge" style={{ marginBottom: 14, display: 'inline-flex' }}>
                  <MousePointerClick style={{ width: 11, height: 11 }} />
                  How it works
                </span>
                <h2
                  style={{
                    fontSize: 'clamp(1.75rem, 4vw, 2.6rem)',
                    fontWeight: 800,
                    letterSpacing: '-0.03em',
                    marginBottom: 12,
                  }}
                >
                  Three steps to smarter links
                </h2>
                <p
                  style={{
                    color: 'rgba(240,238,255,0.42)',
                    maxWidth: 340,
                    margin: '0 auto',
                    lineHeight: 1.65,
                    fontSize: '0.93rem',
                  }}
                >
                  From long URL to tracked short link in under 10 seconds.
                </p>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: 40,
                }}
              >
                {STEPS.map((s) => (
                  <div key={s.number} style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 14,
                        background: 'rgba(94,92,255,0.1)',
                        border: '1px solid rgba(94,92,255,0.22)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 18px',
                        color: '#7c6fff',
                      }}
                    >
                      {s.icon}
                    </div>
                    <div
                      className="snip-mono"
                      style={{
                        fontSize: '0.7rem',
                        color: 'rgba(124,111,255,0.65)',
                        fontWeight: 500,
                        letterSpacing: '0.1em',
                        marginBottom: 8,
                      }}
                    >
                      {s.number}
                    </div>
                    <h3
                      style={{
                        fontSize: '0.95rem',
                        fontWeight: 700,
                        marginBottom: 10,
                        color: '#f0eeff',
                      }}
                    >
                      {s.title}
                    </h3>
                    <p
                      style={{
                        fontSize: '0.825rem',
                        color: 'rgba(240,238,255,0.42)',
                        lineHeight: 1.65,
                        maxWidth: 210,
                        margin: '0 auto',
                      }}
                    >
                      {s.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Testimonials ──────────────────────────────────────────── */}
          <section style={{ maxWidth: 980, margin: '0 auto', padding: '96px 2rem' }}>
            <div style={{ textAlign: 'center', marginBottom: 52 }}>
              <span className="snip-badge" style={{ marginBottom: 14, display: 'inline-flex' }}>
                <Star style={{ width: 11, height: 11 }} />
                Loved by users
              </span>
              <h2
                style={{
                  fontSize: 'clamp(1.75rem, 4vw, 2.6rem)',
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                }}
              >
                What our users say
              </h2>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: 16,
              }}
            >
              {TESTIMONIALS.map((t) => (
                <div key={t.author} className="snip-card" style={{ padding: 26 }}>
                  <div style={{ display: 'flex', gap: 3, marginBottom: 14 }}>
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        style={{ width: 12, height: 12, color: '#fbbf24', fill: '#fbbf24' }}
                      />
                    ))}
                  </div>
                  <p
                    style={{
                      fontSize: '0.875rem',
                      color: 'rgba(240,238,255,0.62)',
                      lineHeight: 1.7,
                      marginBottom: 20,
                    }}
                  >
                    "{t.quote}"
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="snip-avatar">{t.avatar}</div>
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>{t.author}</div>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(240,238,255,0.36)' }}>
                        {t.role}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Pricing ───────────────────────────────────────────────── */}
          <section
            style={{
              borderTop: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(255,255,255,0.015)',
              padding: '96px 2rem',
            }}
          >
            <div style={{ maxWidth: 780, margin: '0 auto' }}>
              <div style={{ textAlign: 'center', marginBottom: 52 }}>
                <span className="snip-badge" style={{ marginBottom: 14, display: 'inline-flex' }}>
                  <Zap style={{ width: 11, height: 11 }} />
                  Simple pricing
                </span>
                <h2
                  style={{
                    fontSize: 'clamp(1.75rem, 4vw, 2.6rem)',
                    fontWeight: 800,
                    letterSpacing: '-0.03em',
                    marginBottom: 12,
                  }}
                >
                  Start free. Scale when ready.
                </h2>
                <p
                  style={{
                    color: 'rgba(240,238,255,0.42)',
                    maxWidth: 340,
                    margin: '0 auto',
                    lineHeight: 1.65,
                    fontSize: '0.93rem',
                  }}
                >
                  No hidden fees. Cancel anytime. Payments via Stripe.
                </p>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: 18,
                }}
              >
                {/* Free */}
                <div
                  className="snip-card"
                  style={{ padding: 30, display: 'flex', flexDirection: 'column' }}
                >
                  <div style={{ marginBottom: 18 }}>
                    <div
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        color: 'rgba(240,238,255,0.38)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        marginBottom: 8,
                      }}
                    >
                      Free
                    </div>
                    <div
                      style={{ display: 'flex', alignItems: 'flex-end', gap: 4, marginBottom: 6 }}
                    >
                      <span
                        style={{
                          fontSize: '2.8rem',
                          fontWeight: 800,
                          letterSpacing: '-0.04em',
                          lineHeight: 1,
                        }}
                      >
                        $0
                      </span>
                      <span
                        style={{
                          color: 'rgba(240,238,255,0.36)',
                          paddingBottom: 5,
                          fontSize: '0.85rem',
                        }}
                      >
                        /&nbsp;forever
                      </span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'rgba(240,238,255,0.36)' }}>
                      For personal use & testing.
                    </p>
                  </div>
                  <div
                    style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '0 0 22px' }}
                  />
                  <ul
                    style={{
                      listStyle: 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 11,
                      marginBottom: 26,
                      flex: 1,
                    }}
                  >
                    {FREE_FEATURES.map((f) => (
                      <li
                        key={f}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          fontSize: '0.875rem',
                          color: 'rgba(240,238,255,0.62)',
                        }}
                      >
                        <span
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: 6,
                            background: 'rgba(94,92,255,0.14)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <Check style={{ width: 11, height: 11, color: '#7c6fff' }} />
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    className="snip-outline-btn"
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => navigate(isAuthenticated ? '/dashboard/links' : '/register')}
                  >
                    {isAuthenticated ? 'Go to dashboard' : 'Get started free'}
                  </button>
                </div>

                {/* Premium */}
                <div
                  className="snip-premium-card"
                  style={{
                    padding: 30,
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: -13,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: '#5e5cff',
                      borderRadius: 999,
                      padding: '4px 14px',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: '#fff',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Most popular
                  </div>
                  <div style={{ marginBottom: 18 }}>
                    <div
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        color: '#7c6fff',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        marginBottom: 8,
                      }}
                    >
                      Premium
                    </div>
                    <div
                      style={{ display: 'flex', alignItems: 'flex-end', gap: 4, marginBottom: 6 }}
                    >
                      <span
                        style={{
                          fontSize: '2.8rem',
                          fontWeight: 800,
                          letterSpacing: '-0.04em',
                          lineHeight: 1,
                        }}
                      >
                        $9
                      </span>
                      <span
                        style={{
                          color: 'rgba(240,238,255,0.36)',
                          paddingBottom: 5,
                          fontSize: '0.85rem',
                        }}
                      >
                        /&nbsp;month
                      </span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'rgba(240,238,255,0.36)' }}>
                      For power users & businesses.
                    </p>
                  </div>
                  <div
                    style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '0 0 22px' }}
                  />
                  <ul
                    style={{
                      listStyle: 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 11,
                      marginBottom: 26,
                      flex: 1,
                    }}
                  >
                    {PREMIUM_FEATURES.map((f) => (
                      <li
                        key={f}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          fontSize: '0.875rem',
                          color: 'rgba(240,238,255,0.68)',
                        }}
                      >
                        <span
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: 6,
                            background: 'rgba(94,92,255,0.18)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <Check style={{ width: 11, height: 11, color: '#7c6fff' }} />
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    className="snip-glow-btn"
                    style={{ width: '100%', justifyContent: 'center', animation: 'none' }}
                    onClick={() => navigate(isAuthenticated ? '/dashboard/billing' : '/register')}
                  >
                    <Zap style={{ width: 15, height: 15 }} />
                    {isAuthenticated ? 'Upgrade to Premium' : 'Get Premium'}
                  </button>
                </div>
              </div>

              <p
                style={{
                  textAlign: 'center',
                  fontSize: '0.77rem',
                  color: 'rgba(240,238,255,0.2)',
                  marginTop: 22,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <Lock style={{ width: 11, height: 11 }} />
                Payments processed securely by Stripe. Cancel anytime.
              </p>
            </div>
          </section>

          {/* ── Final CTA ─────────────────────────────────────────────── */}
          <section style={{ padding: '96px 2rem', textAlign: 'center' }}>
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: 16,
                background: 'rgba(94,92,255,0.1)',
                border: '1px solid rgba(94,92,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 26px',
                color: '#7c6fff',
              }}
            >
              <MousePointerClick style={{ width: 26, height: 26 }} />
            </div>
            <h2
              style={{
                fontSize: 'clamp(1.9rem, 5vw, 3.2rem)',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                marginBottom: 14,
                lineHeight: 1.1,
              }}
            >
              Ready to shorten your <span className="snip-accent">first link?</span>
            </h2>
            <p
              style={{
                color: 'rgba(240,238,255,0.42)',
                maxWidth: 380,
                margin: '0 auto 34px',
                lineHeight: 1.65,
                fontSize: '0.93rem',
              }}
            >
              Join thousands of users who trust snip.ly to manage and track their links.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
              <button
                className="snip-glow-btn"
                style={{ fontSize: '1rem', padding: '13px 30px' }}
                onClick={goApp}
              >
                <Zap style={{ width: 16, height: 16 }} />
                {isAuthenticated ? 'Go to Dashboard' : 'Start for free'}
              </button>
              <button
                className="snip-outline-btn"
                style={{ fontSize: '1rem', padding: '13px 30px' }}
                onClick={() => navigate('/pricing')}
              >
                View pricing
              </button>
            </div>
          </section>

          {/* ── Footer ──────────────────────────────────────────────────── */}
          <footer
            style={{
              borderTop: '1px solid rgba(255,255,255,0.06)',
              padding: '28px 2rem',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 14,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 8,
                  background: '#5e5cff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Link2 style={{ width: 12, height: 12, color: '#fff', strokeWidth: 2.5 }} />
              </div>
              <span
                style={{ fontWeight: 800, fontSize: '0.88rem', color: 'rgba(240,238,255,0.5)' }}
              >
                snip.ly
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
              {['Pricing', 'Sign in'].map((item) => (
                <button
                  key={item}
                  onClick={() => (item === 'Pricing' ? navigate('/pricing') : goApp())}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    color: 'rgba(240,238,255,0.3)',
                    fontFamily: "'Bricolage Grotesque', sans-serif",
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(240,238,255,0.72)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(240,238,255,0.3)')}
                >
                  {item}
                </button>
              ))}
            </div>

            <p style={{ fontSize: '0.74rem', color: 'rgba(240,238,255,0.18)' }}>
              © {new Date().getFullYear()} snip.ly. All rights reserved.
            </p>
          </footer>
        </div>
      </div>
    </>
  );
}
