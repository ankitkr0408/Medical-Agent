'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const FEATURES = [
  {
    icon: '🧠',
    title: 'GPT-4 Vision Analysis',
    desc: 'State-of-the-art multimodal AI reads X-rays, MRIs, and CT scans with radiologist-grade precision — delivering structured findings in seconds.',
    tag: 'Core AI',
    accent: '#7c3aed',
    bg: '#f5f3ff',
    border: '#ede9fe',
  },
  {
    icon: '👨‍⚕️',
    title: 'Virtual Multi-Specialist Panel',
    desc: 'Simultaneously consult radiologists, cardiologists, pulmonologists, and neurologists through coordinated AI agents — one image, full spectrum.',
    tag: 'Collaboration',
    accent: '#0ea5e9',
    bg: '#f0f9ff',
    border: '#e0f2fe',
  },
  {
    icon: '📄',
    title: 'Structured PDF Reports',
    desc: 'Auto-generate SOAP-style clinical reports with findings, differential diagnoses, and evidence-based recommendations — EHR-ready.',
    tag: 'Reporting',
    accent: '#10b981',
    bg: '#f0fdf4',
    border: '#d1fae5',
  },
  {
    icon: '🔥',
    title: 'Explainable Heatmaps',
    desc: 'Grad-CAM visualisations highlight exact regions driving each AI conclusion — giving clinicians full interpretability and audit-ready transparency.',
    tag: 'Explainability',
    accent: '#f43f5e',
    bg: '#fff1f2',
    border: '#ffe4e6',
  },
  {
    icon: '💬',
    title: 'Contextual Q&A',
    desc: 'Ask anything about a report in natural language. Health IQ recalls the full imaging context to answer follow-up questions with precision.',
    tag: 'Conversational AI',
    accent: '#f59e0b',
    bg: '#fffbeb',
    border: '#fef3c7',
  },
  {
    icon: '🔒',
    title: 'HIPAA-Ready Architecture',
    desc: 'End-to-end encrypted data flows, zero image retention after analysis, and role-based access controls ensure full regulatory alignment.',
    tag: 'Compliance',
    accent: '#6366f1',
    bg: '#eef2ff',
    border: '#e0e7ff',
  },
];

const STEPS = [
  {
    num: '01',
    icon: '⬆️',
    title: 'Upload Your Scan',
    desc: 'Drag-and-drop JPEG, PNG, or DICOM files into the secure upload zone. Bulk multi-frame uploads supported.',
  },
  {
    num: '02',
    icon: '⚙️',
    title: 'AI Orchestration',
    desc: 'Health IQ routes your image through the appropriate specialist agents, running concurrent analysis for maximum speed.',
  },
  {
    num: '03',
    icon: '📊',
    title: 'Receive Clinical Insights',
    desc: 'Review structured findings, heatmaps, and a downloadable report — all in one unified dashboard.',
  },
];

const TESTIMONIALS = [
  {
    quote: "Health IQ has fundamentally changed how I triage complex imaging. The multi-specialist synthesis is unlike anything I've seen in clinical AI.",
    name: 'Dr. Priya Sharma',
    role: 'Radiologist, Apollo Hospitals',
    avatar: '👩‍⚕️',
  },
  {
    quote: "The explainability features are critical for our residents' training. They can see exactly *why* the AI flagged a region — not just that it did.",
    name: 'Dr. Arun Mehta',
    role: 'Head of Radiology, AIIMS Delhi',
    avatar: '👨‍⚕️',
  },
  {
    quote: "We integrated Health IQ into our telehealth workflow within a day. The HIPAA-ready architecture removed every compliance blocker.",
    name: 'Sarah Okonkwo',
    role: 'CTO, HealthBridge Telemedicine',
    avatar: '👩‍💻',
  },
];

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setActiveTestimonial(p => (p + 1) % TESTIMONIALS.length), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a', fontFamily: "'Inter', system-ui, sans-serif", overflowX: 'hidden' }}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .text-gradient {
          background: linear-gradient(135deg, #7c3aed 0%, #0ea5e9 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 16px;
          border-radius: 99px;
          background: linear-gradient(135deg, #ede9fe, #e0f2fe);
          border: 1px solid #c4b5fd;
          font-size: 0.8rem;
          font-weight: 600;
          color: #6d28d9;
          margin-bottom: 24px;
        }

        .btn-primary {
          background: linear-gradient(135deg, #7c3aed, #0ea5e9);
          color: #fff;
          border: none;
          border-radius: 14px;
          font-weight: 700;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.25s ease;
          box-shadow: 0 4px 20px rgba(124, 58, 237, 0.3);
          text-decoration: none;
          display: inline-flex;
          align-items: center;
        }

        .btn-primary:hover {
          box-shadow: 0 8px 32px rgba(124, 58, 237, 0.4);
          transform: translateY(-2px) scale(1.01);
        }

        .btn-secondary {
          background: #fff;
          color: #374151;
          border: 1.5px solid #e2e8f0;
          border-radius: 14px;
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.25s ease;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
        }

        .btn-secondary:hover {
          border-color: #a78bfa;
          color: #7c3aed;
          background: #faf5ff;
          transform: translateY(-1px);
        }

        .nav-sticky {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 100;
          transition: all 0.3s ease;
        }

        .nav-scrolled {
          background: rgba(248, 250, 252, 0.92);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid #e2e8f0;
          box-shadow: 0 1px 12px rgba(0,0,0,0.06);
        }

        .feature-card {
          background: #fff;
          border-radius: 20px;
          padding: 28px;
          border: 1px solid #f1f5f9;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03);
          transition: all 0.28s ease;
        }

        .feature-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 8px 32px rgba(0,0,0,0.1);
          border-color: #e2e8f0;
        }

        .step-card {
          background: #fff;
          border-radius: 20px;
          padding: 32px 24px;
          border: 1px solid #f1f5f9;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
          text-align: center;
          transition: all 0.28s ease;
        }

        .step-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(124,58,237,0.1);
          border-color: #ede9fe;
        }

        .testimonial-card {
          background: #fff;
          border-radius: 24px;
          padding: 40px 48px;
          border: 1px solid #f1f5f9;
          box-shadow: 0 4px 24px rgba(0,0,0,0.06);
          max-width: 720px;
          margin: 0 auto;
        }

        .trust-logo {
          font-weight: 700;
          font-size: 0.95rem;
          color: #94a3b8;
          letter-spacing: -0.01em;
          transition: color 0.2s;
        }

        .trust-logo:hover { color: #64748b; }

        .tag-pill {
          display: inline-flex;
          align-items: center;
          padding: 4px 12px;
          border-radius: 99px;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .mockup {
          background: #fff;
          border-radius: 20px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 24px 64px rgba(0,0,0,0.1), 0 4px 16px rgba(0,0,0,0.05);
          overflow: hidden;
        }

        .mockup-bar {
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .dot { width: 10px; height: 10px; border-radius: 50%; }

        .about-card {
          background: #fff;
          border: 1px solid #f1f5f9;
          border-radius: 16px;
          padding: 20px 24px;
          display: flex;
          gap: 16px;
          align-items: center;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
          transition: all 0.25s;
        }

        .about-card:hover {
          border-color: #ede9fe;
          box-shadow: 0 4px 16px rgba(124,58,237,0.08);
          transform: translateX(4px);
        }

        .divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
          margin: 0;
        }

        .nav-link {
          font-size: 0.875rem;
          font-weight: 500;
          color: #64748b;
          text-decoration: none;
          transition: color 0.2s;
        }

        .nav-link:hover { color: #0f172a; }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .animate-float { animation: float 7s ease-in-out infinite; }

        .testimonial-dot {
          width: 8px;
          height: 8px;
          border-radius: 99px;
          background: #cbd5e1;
          border: none;
          cursor: pointer;
          transition: all 0.3s;
        }

        .testimonial-dot.active {
          width: 24px;
          background: linear-gradient(135deg, #7c3aed, #0ea5e9);
        }

        .footer-link {
          font-size: 0.875rem;
          color: #94a3b8;
          text-decoration: none;
          transition: color 0.2s;
        }

        .footer-link:hover { color: #475569; }

        .cta-section {
          background: linear-gradient(135deg, #7c3aed 0%, #0ea5e9 100%);
          position: relative;
          overflow: hidden;
        }

        .cta-section::before {
          content: '';
          position: absolute;
          top: -80px; left: -80px;
          width: 300px; height: 300px;
          border-radius: 50%;
          background: rgba(255,255,255,0.08);
        }

        .cta-section::after {
          content: '';
          position: absolute;
          bottom: -100px; right: -60px;
          width: 400px; height: 400px;
          border-radius: 50%;
          background: rgba(255,255,255,0.06);
        }
      `}</style>

      {/* ── Navigation ── */}
      <nav className={`nav-sticky ${scrolled ? 'nav-scrolled' : ''}`}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 64 }}>
            {/* Logo */}
            <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
              <div style={{
                width: 36, height: 36,
                background: 'linear-gradient(135deg, #7c3aed, #0ea5e9)',
                borderRadius: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(124,58,237,0.3)',
                flexShrink: 0,
              }}>
                <span style={{ color: '#fff', fontWeight: 800, fontSize: 18 }}>M</span>
              </div>
              <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a', letterSpacing: '-0.02em' }}>
                Health <span className="text-gradient">IQ</span>
              </span>
            </a>

            {/* Nav links */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 32 }} className="hidden md:flex">
              <a href="#features" className="nav-link">Features</a>
              <a href="#how-it-works" className="nav-link">How It Works</a>
              <a href="#testimonials" className="nav-link">Stories</a>
              <a href="#about" className="nav-link">About</a>
            </div>

            {/* CTA */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <Link href="/login">
                <button className="btn-secondary" style={{ padding: '8px 20px' }}>Sign In</button>
              </Link>
              <Link href="/register">
                <button className="btn-primary" style={{ padding: '9px 22px' }}>Get Access →</button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ paddingTop: 120, paddingBottom: 80, paddingLeft: 24, paddingRight: 24, position: 'relative' }}>
        {/* Background blobs */}
        <div style={{
          position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: '100%', maxWidth: 1000, height: 600,
          background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(124,58,237,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          {/* Badge */}
          <div className="hero-badge">
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#7c3aed', display: 'inline-block', flexShrink: 0 }} />
            Next-generation clinical AI — now in early access
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: 'clamp(2.6rem, 5.5vw, 4.5rem)',
            fontWeight: 900,
            lineHeight: 1.1,
            letterSpacing: '-0.04em',
            color: '#0f172a',
            marginBottom: 24,
          }}>
            Clinical AI That Reads<br />
            <span className="text-gradient">Medical Images</span><br />
            Like a Specialist
          </h1>

          <p style={{
            fontSize: 'clamp(1rem, 2vw, 1.2rem)',
            color: '#64748b',
            maxWidth: 600,
            margin: '0 auto 36px',
            lineHeight: 1.75,
          }}>
            Health IQ orchestrates a panel of virtual specialist agents to analyse X-rays,
            MRIs, and CT scans — delivering structured reports, explainable heatmaps, and
            natural-language Q&A from a single upload.
          </p>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/register">
              <button className="btn-primary" style={{ padding: '13px 32px', fontSize: '1rem' }}>
                Start Free Analysis →
              </button>
            </Link>
            <a href="#how-it-works">
              <button className="btn-secondary" style={{ padding: '13px 32px', fontSize: '1rem', gap: 8 }}>
                <span>▶</span> See How It Works
              </button>
            </a>
          </div>

          <p style={{ marginTop: 16, fontSize: '0.8rem', color: '#94a3b8' }}>
            No credit card · HIPAA-ready infrastructure · Instant onboarding
          </p>

          {/* Mockup */}
          <div className="animate-float" style={{ marginTop: 64, position: 'relative' }}>
            {/* Soft glow behind */}
            <div style={{
              position: 'absolute', inset: -40,
              background: 'radial-gradient(ellipse, rgba(124,58,237,0.08) 0%, transparent 65%)',
              pointerEvents: 'none',
            }} />

            <div className="mockup" style={{ maxWidth: 860, margin: '0 auto', position: 'relative' }}>
              <div className="mockup-bar">
                <div className="dot" style={{ background: '#ff5f57' }} />
                <div className="dot" style={{ background: '#febc2e' }} />
                <div className="dot" style={{ background: '#28c840' }} />
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                    healthiq/dashboard/analysis
                  </span>
                </div>
              </div>

              <div style={{ padding: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, background: '#fff' }}>
                {/* Left panel */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Scan · Chest X-Ray
                  </div>
                  <div style={{
                    background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
                    borderRadius: 12, height: 200,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative', overflow: 'hidden',
                    border: '1px solid #e2e8f0',
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 52 }}>🫁</div>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginTop: 8 }}>PA Chest · 2560×2048</div>
                    </div>
                    {/* Heatmap highlight */}
                    <div style={{
                      position: 'absolute', top: '28%', left: '32%',
                      width: 64, height: 44, borderRadius: 8,
                      background: 'rgba(244,63,94,0.25)',
                      border: '1.5px solid rgba(244,63,94,0.6)',
                      boxShadow: '0 0 16px rgba(244,63,94,0.3)',
                    }} />
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.7rem', padding: '3px 10px', borderRadius: 99, background: '#fff1f2', color: '#f43f5e', border: '1px solid #fecdd3' }}>⚠ Region flagged</span>
                    <span style={{ fontSize: '0.7rem', padding: '3px 10px', borderRadius: 99, background: '#f0fdf4', color: '#10b981', border: '1px solid #bbf7d0' }}>✓ Analysis complete</span>
                  </div>
                </div>

                {/* Right panel */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    AI Findings
                  </div>

                  {[
                    { label: 'Primary Finding', val: 'Right lower lobe opacity consistent with consolidation', color: '#f43f5e', bg: '#fff1f2' },
                    { label: 'Differential Dx', val: 'Community-acquired pneumonia / aspiration', color: '#f59e0b', bg: '#fffbeb' },
                    { label: 'Recommendation', val: 'Correlate clinically; consider sputum culture', color: '#10b981', bg: '#f0fdf4' },
                  ].map(f => (
                    <div key={f.label} style={{ background: f.bg, border: `1px solid ${f.color}22`, borderRadius: 10, padding: '10px 12px' }}>
                      <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{f.label}</div>
                      <div style={{ fontSize: '0.8rem', color: f.color, fontWeight: 600, lineHeight: 1.4 }}>{f.val}</div>
                    </div>
                  ))}

                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>
                    Specialist Opinions
                  </div>
                  {[
                    { role: 'Radiologist', icon: '🔬', opinion: 'Consistent with lobar pneumonia' },
                    { role: 'Pulmonologist', icon: '🫁', opinion: 'No effusion; no air bronchograms' },
                  ].map(s => (
                    <div key={s.role} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 18 }}>{s.icon}</span>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#7c3aed', fontWeight: 700 }}>{s.role}</div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{s.opinion}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust strip removed as requested ── */}

      {/* ── Features ── */}
      <section id="features" style={{ padding: '96px 24px', background: '#f8fafc' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <span className="tag-pill" style={{ background: '#ede9fe', color: '#6d28d9', marginBottom: 16, display: 'inline-flex' }}>
              Platform Capabilities
            </span>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', fontWeight: 800, letterSpacing: '-0.03em', color: '#0f172a', lineHeight: 1.15, marginBottom: 14 }}>
              Built for the way<br />clinicians actually work
            </h2>
            <p style={{ color: '#64748b', fontSize: '1.05rem', maxWidth: 520, margin: '0 auto' }}>
              Every feature is shaped by radiologist workflows — not retrofitted from generic AI tools.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            {FEATURES.map((f, i) => (
              <div key={i} className="feature-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: f.bg, border: `1px solid ${f.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                    {f.icon}
                  </div>
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: f.bg, color: f.accent, border: `1px solid ${f.border}`, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {f.tag}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ── How It Works ── */}
      <section id="how-it-works" style={{ padding: '96px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <span className="tag-pill" style={{ background: '#e0f2fe', color: '#0369a1', marginBottom: 16, display: 'inline-flex' }}>
              Workflow
            </span>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', fontWeight: 800, letterSpacing: '-0.03em', color: '#0f172a', lineHeight: 1.15 }}>
              From upload to insights<br />in moments
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
            {STEPS.map((step, i) => (
              <div key={i} className="step-card">
                <div style={{
                  width: 72, height: 72,
                  background: 'linear-gradient(135deg, #ede9fe, #e0f2fe)',
                  border: '1px solid #c4b5fd',
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 20px',
                  fontSize: 28,
                }}>
                  {step.icon}
                </div>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#a78bfa', letterSpacing: '0.1em', marginBottom: 8 }}>STEP {step.num}</div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>{step.title}</h3>
                <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.7 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ── Testimonials ── */}
      <section id="testimonials" style={{ padding: '96px 24px', background: '#f8fafc' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', textAlign: 'center' }}>
          <span className="tag-pill" style={{ background: '#f0fdf4', color: '#059669', marginBottom: 24, display: 'inline-flex' }}>
            Clinical Stories
          </span>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', fontWeight: 800, letterSpacing: '-0.03em', color: '#0f172a', lineHeight: 1.15, marginBottom: 48 }}>
            Physicians trust Health IQ
          </h2>

          <div style={{ position: 'relative', minHeight: 240 }}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i} style={{
                position: i === activeTestimonial ? 'relative' : 'absolute',
                top: 0, left: 0, right: 0,
                opacity: i === activeTestimonial ? 1 : 0,
                transition: 'opacity 0.6s ease',
                pointerEvents: i === activeTestimonial ? 'auto' : 'none',
              }}>
                <div className="testimonial-card">
                  <div style={{ fontSize: 48, color: '#c4b5fd', lineHeight: 1, marginBottom: 16 }}>"</div>
                  <p style={{ fontSize: '1.05rem', color: '#374151', lineHeight: 1.8, fontStyle: 'italic', marginBottom: 24 }}>
                    {t.quote}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center' }}>
                    <span style={{ fontSize: 32 }}>{t.avatar}</span>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>{t.name}</div>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{t.role}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 28 }}>
            {TESTIMONIALS.map((_, i) => (
              <button key={i} onClick={() => setActiveTestimonial(i)}
                className={`testimonial-dot ${i === activeTestimonial ? 'active' : ''}`}
              />
            ))}
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ── About / Mission ── */}
      <section id="about" style={{ padding: '96px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 64, alignItems: 'center' }}>
            <div>
              <span className="tag-pill" style={{ background: '#fffbeb', color: '#b45309', marginBottom: 20, display: 'inline-flex' }}>
                Our Mission
              </span>
              <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 800, letterSpacing: '-0.03em', color: '#0f172a', lineHeight: 1.2, marginBottom: 20 }}>
                Democratising specialist-grade imaging intelligence
              </h2>
              <p style={{ fontSize: '1rem', color: '#64748b', lineHeight: 1.8, marginBottom: 16 }}>
                Radiology expertise is geographically concentrated. A patient in a tier-3 city deserves the same quality of diagnostic insight as one in a metropolitan hospital.
              </p>
              <p style={{ fontSize: '1rem', color: '#64748b', lineHeight: 1.8 }}>
                Health IQ was built to close that gap — combining frontier language-vision models with a clinical-agent architecture that mirrors how multi-disciplinary teams actually reason.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { icon: '🎯', label: 'Modalities Supported', detail: 'X-ray · MRI · CT · Ultrasound · Retinal fundus' },
                { icon: '🌐', label: 'Deployment', detail: 'Cloud SaaS, on-premise, or hybrid — your data stays yours' },
                { icon: '🔐', label: 'Security', detail: 'AES-256 encryption at rest and in transit; zero retention policy' },
                { icon: '📚', label: 'Evidence-based', detail: 'Recommendations grounded in PubMed-indexed clinical literature' },
              ].map(item => (
                <div key={item.label} className="about-card">
                  <span style={{ fontSize: 26 }}>{item.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem', marginBottom: 4 }}>{item.label}</div>
                    <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>{item.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>




      {/* ── Footer ── */}
      <footer style={{ background: '#0f172a', color: '#f1f5f9', padding: '60px 24px 32px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 48, marginBottom: 48 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #7c3aed, #0ea5e9)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ color: '#fff', fontWeight: 800, fontSize: 16 }}>M</span>
                </div>
                <span style={{ fontWeight: 800, fontSize: '1rem' }}>Health IQ</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.7 }}>
                Clinical AI for medical image analysis. Built by clinicians, for clinicians.
              </p>
            </div>

            {[
              {
                heading: 'Product',
                links: [
                  { label: 'Features', href: '#features' },
                  { label: 'How It Works', href: '#how-it-works' },
                  { label: 'Dashboard', href: '/dashboard' },
                ],
              },
              {
                heading: 'Company',
                links: [
                  { label: 'About', href: '#about' },
                  { label: 'Clinical Stories', href: '#testimonials' },
                  { label: 'Contact', href: 'mailto:ankit75kumar3e@gmail.com' },
                ],
              },
              {
                heading: 'Legal',
                links: [
                  { label: 'Privacy Policy', href: '#' },
                  { label: 'Terms of Service', href: '#' },
                  { label: 'HIPAA Compliance', href: '#' },
                ],
              },
            ].map(col => (
              <div key={col.heading}>
                <h4 style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.875rem', marginBottom: 16 }}>{col.heading}</h4>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {col.links.map(link => (
                    <li key={link.label}>
                      <a href={link.href} className="footer-link">{link.label}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid #1e293b', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <p style={{ fontSize: '0.8rem', color: '#475569' }}>© 2025 Health IQ. All rights reserved.</p>
            <p style={{ fontSize: '0.75rem', color: '#334155' }}>Not a substitute for professional medical judgement. For investigational use.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
