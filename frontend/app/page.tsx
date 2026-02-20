'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Brain, Stethoscope, FileImage, MessageSquare, HelpCircle,
  Activity, Shield, Zap, Upload, Users, FileText, Download,
  ArrowRight, Check, Star, ChevronDown, Menu, X, Heart,
  Microscope, Sparkles, Globe, Lock, Clock, BarChart3,
  Bot, Layers, Database, GitBranch, MonitorSmartphone
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';

// ─── Animated Counter Component ───────────────────────────────────────
function AnimatedCounter({ end, duration = 2000, suffix = '' }: { end: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          let start = 0;
          const increment = end / (duration / 16);
          const timer = setInterval(() => {
            start += increment;
            if (start >= end) {
              setCount(end);
              clearInterval(timer);
            } else {
              setCount(Math.floor(start));
            }
          }, 16);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration, hasAnimated]);

  return <div ref={ref}>{count}{suffix}</div>;
}

// ─── Floating Particle Component ──────────────────────────────────────
function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full opacity-20"
          style={{
            width: `${Math.random() * 6 + 2}px`,
            height: `${Math.random() * 6 + 2}px`,
            background: `hsl(${200 + Math.random() * 60}, 80%, 70%)`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `float-particle ${8 + Math.random() * 12}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 5}s`,
          }}
        />
      ))}
    </div>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-cycle features
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 5);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const features = [
    {
      icon: <FileImage className="w-7 h-7" />,
      title: 'AI Image Analysis',
      description: 'Upload medical images (X-ray, MRI, CT scans, DICOM, NIfTI) and receive detailed AI-powered analysis with findings, urgency assessment, and specialist recommendations.',
      gradient: 'from-cyan-500 to-blue-600',
      tag: 'Core Feature',
    },
    {
      icon: <Users className="w-7 h-7" />,
      title: 'Multi-Doctor Consultation',
      description: 'Get opinions from multiple AI specialists—Radiologist, Cardiologist, Neurologist, Pulmonologist—with a final multidisciplinary summary in simple language.',
      gradient: 'from-blue-600 to-indigo-600',
      tag: 'Unique',
    },
    {
      icon: <HelpCircle className="w-7 h-7" />,
      title: 'Medical Q&A System',
      description: 'Ask questions about your medical reports and get RAG-powered answers using OpenAI embeddings and cosine similarity for context-aware responses.',
      gradient: 'from-cyan-600 to-indigo-500',
      tag: 'Smart AI',
    },
    {
      icon: <FileText className="w-7 h-7" />,
      title: 'Report Generation',
      description: 'Generate comprehensive medical reports with findings, keywords, doctor recommendations, urgency levels, and downloadable PDF/markdown formats.',
      gradient: 'from-blue-500 to-cyan-400',
      tag: 'Professional',
    },
    {
      icon: <Shield className="w-7 h-7" />,
      title: 'Secure Auth & Data',
      description: 'JWT-based authentication, bcrypt password hashing, MongoDB Atlas storage with local fallback, and per-user data isolation for complete privacy.',
      gradient: 'from-indigo-600 to-blue-500',
      tag: 'Enterprise',
    },
  ];

  const techStack = [
    { name: 'Next.js 16', icon: <MonitorSmartphone className="w-5 h-5" />, category: 'Frontend' },
    { name: 'FastAPI', icon: <Zap className="w-5 h-5" />, category: 'Backend' },
    { name: 'OpenAI GPT-4V', icon: <Brain className="w-5 h-5" />, category: 'AI Engine' },
    { name: 'MongoDB Atlas', icon: <Database className="w-5 h-5" />, category: 'Database' },
    { name: 'React 19', icon: <Layers className="w-5 h-5" />, category: 'UI Library' },
    { name: 'WebSocket', icon: <GitBranch className="w-5 h-5" />, category: 'Real-time' },
    { name: 'PubMed API', icon: <Globe className="w-5 h-5" />, category: 'Research' },
    { name: 'Zustand', icon: <BarChart3 className="w-5 h-5" />, category: 'State' },
  ];

  const howItWorks = [
    {
      step: '01',
      title: 'Upload Medical Image',
      description: 'Drag & drop your medical image — supports JPEG, PNG, DICOM (.dcm), and NIfTI (.nii) formats up to 50MB.',
      icon: <Upload className="w-8 h-8" />,
    },
    {
      step: '02',
      title: 'AI Analysis',
      description: 'GPT-4 Vision analyzes the image, detecting anomalies across skeletal, respiratory, cardiovascular, neurological, and abdominal systems.',
      icon: <Brain className="w-8 h-8" />,
    },
    {
      step: '03',
      title: 'Multi-Specialist Consultation',
      description: 'Get opinions from AI Radiologist, Cardiologist, Neurologist, and more in an automated multi-doctor panel discussion.',
      icon: <Stethoscope className="w-8 h-8" />,
    },
    {
      step: '04',
      title: 'Download Report',
      description: 'Receive a comprehensive report with findings, urgency rating, specialist referrals, and relevant PubMed literature.',
      icon: <Download className="w-8 h-8" />,
    },
  ];

  return (
    <div className="min-h-screen bg-[#030712] text-white overflow-x-hidden">
      {/* ═══════════════════ NAVBAR ═══════════════════ */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled
          ? 'bg-[#030712]/80 backdrop-blur-xl border-b border-white/5 shadow-2xl'
          : 'bg-transparent'
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                  <Stethoscope className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#030712] animate-pulse" />
              </div>
              <div>
                <span className="text-lg font-bold bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
                  Medical Agent
                </span>
                <span className="hidden sm:inline text-xs text-gray-500 ml-2 font-mono">v2.0</span>
              </div>
            </div>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-8">
              <a href="#features" className="text-sm text-gray-400 hover:text-cyan-400 transition-colors">Features</a>
              <a href="#how-it-works" className="text-sm text-gray-400 hover:text-cyan-400 transition-colors">How it Works</a>
              <a href="#tech-stack" className="text-sm text-gray-400 hover:text-cyan-400 transition-colors">Tech Stack</a>
              <a href="#specialists" className="text-sm text-gray-400 hover:text-cyan-400 transition-colors">Specialists</a>
            </div>

            {/* Auth Buttons */}
            <div className="hidden lg:flex items-center gap-3">
              {isAuthenticated ? (
                <button
                  onClick={() => router.push('/dashboard')}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-cyan-500/30 transition-all duration-300 hover:scale-105"
                >
                  Go to Dashboard →
                </button>
              ) : (
                <>
                  <button
                    onClick={() => router.push('/auth/login')}
                    className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-300 hover:text-white border border-white/10 hover:border-white/20 transition-all"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => router.push('/auth/register')}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-cyan-500/30 transition-all duration-300 hover:scale-105"
                  >
                    Get Started Free
                  </button>
                </>
              )}
            </div>

            {/* Mobile Menu */}
            <button
              className="lg:hidden p-2 text-gray-400 hover:text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#0a0f1e]/95 backdrop-blur-xl border-t border-white/5 px-4 py-6 space-y-4">
            <a href="#features" className="block text-gray-300 hover:text-cyan-400 py-2" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#how-it-works" className="block text-gray-300 hover:text-cyan-400 py-2" onClick={() => setMobileMenuOpen(false)}>How it Works</a>
            <a href="#tech-stack" className="block text-gray-300 hover:text-cyan-400 py-2" onClick={() => setMobileMenuOpen(false)}>Tech Stack</a>
            <div className="pt-4 border-t border-white/10 space-y-3">
              <button onClick={() => router.push('/auth/login')} className="w-full py-3 rounded-xl border border-white/20 text-white font-medium">Sign In</button>
              <button onClick={() => router.push('/auth/register')} className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold">Get Started Free</button>
            </div>
          </div>
        )}
      </nav>

      {/* ═══════════════════ HERO SECTION ═══════════════════ */}
      <section className="relative min-h-screen flex items-center justify-center pt-20">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-600/5 rounded-full blur-[150px]" />
          <FloatingParticles />
          {/* Grid Pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-10 backdrop-blur-sm">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-sm font-medium text-gray-300">AI-Powered Medical Imaging Platform</span>
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 text-[10px] font-bold">v2.0</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-bold leading-[1.1] mb-8 tracking-tight">
            <span className="text-white">Your AI-Powered</span>
            <br />
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-600 bg-clip-text text-transparent">
              Medical Assistant
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed font-medium">
            Upload medical images, get instant AI analysis with multi-specialist consultation,
            and generate comprehensive reports — powered by GPT-4 Vision.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-24">
            <button
              onClick={() => router.push(isAuthenticated ? '/dashboard' : '/auth/register')}
              className="group px-10 py-5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-lg font-bold hover:shadow-[0_0_40px_-5px_rgba(6,182,212,0.4)] transition-all duration-300 flex items-center gap-3"
            >
              <Sparkles className="w-6 h-6" />
              {isAuthenticated ? 'Go to Dashboard' : 'Start Analyzing Free'}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <a
              href="#how-it-works"
              className="px-10 py-5 rounded-2xl border border-white/10 text-gray-300 text-lg font-bold hover:bg-white/5 hover:border-white/20 transition-all flex items-center gap-3"
            >
              <Activity className="w-6 h-6" />
              See How It Works
            </a>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { value: 5, suffix: '+', label: 'AI Specialists' },
              { value: 6, suffix: '+', label: 'Image Formats' },
              { value: 94, suffix: '%', label: 'Analysis Accuracy' },
              { value: 24, suffix: '/7', label: 'Availability' },
            ].map((stat, i) => (
              <div key={i} className="text-center p-6 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-md hover:bg-white/[0.05] transition-colors group">
                <div className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-1 group-hover:scale-110 transition-transform">
                  <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Scroll indicator */}
          <div className="mt-16 animate-bounce">
            <ChevronDown className="w-6 h-6 mx-auto text-gray-500" />
          </div>
        </div>
      </section>

      {/* ═══════════════════ FEATURES ═══════════════════ */}
      <section id="features" className="py-24 relative">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
          <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium mb-4">
              <Zap className="w-4 h-4" />
              Powerful Features
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Everything You Need for{' '}
              <span className="bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent">
                Medical Analysis
              </span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              A complete platform from image upload to multi-specialist consultation — all in one place.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`group relative p-10 rounded-3xl border transition-all duration-500 cursor-pointer ${activeFeature === index
                  ? 'bg-white/[0.06] border-cyan-500/30 shadow-2xl shadow-cyan-500/10 scale-[1.02]'
                  : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10'
                  }`}
                onClick={() => setActiveFeature(index)}
                onMouseEnter={() => setActiveFeature(index)}
              >
                {/* Glow effect on active */}
                {activeFeature === index && (
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-cyan-500/5 to-blue-500/5 pointer-events-none" />
                )}

                <div className="relative z-10 flex flex-col h-full">
                  {/* Tag & Icon */}
                  <div className="flex items-center justify-between mb-8">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform`}>
                      {feature.icon}
                    </div>
                    <span className="px-3 py-1 rounded-md bg-white/5 text-[10px] font-bold text-gray-400 border border-white/10 uppercase tracking-widest">
                      {feature.tag}
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-cyan-300 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed mb-8 flex-grow">
                    {feature.description}
                  </p>

                  {/* Learn More */}
                  <div className="flex items-center gap-2 text-cyan-400 text-sm font-bold opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0">
                    <span>Initialize Module</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}

            {/* Last card - CTA card */}
            <div className="relative p-10 rounded-3xl bg-gradient-to-br from-cyan-600/20 to-blue-600/20 border border-cyan-500/20 flex flex-col items-center justify-center text-center min-h-[340px]">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mb-6 shadow-2xl shadow-cyan-500/30">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Try It Now</h3>
              <p className="text-gray-400 text-sm mb-8 max-w-[200px]">Experience high-fidelity medical AI analysis</p>
              <button
                onClick={() => router.push(isAuthenticated ? '/analysis' : '/auth/register')}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold hover:shadow-[0_0_30px_-5px_rgba(6,182,212,0.4)] transition-all hover:scale-[1.05]"
              >
                Get Started →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ HOW IT WORKS ═══════════════════ */}
      <section id="how-it-works" className="py-24 relative">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />
          <div className="absolute bottom-1/3 left-0 w-[400px] h-[400px] bg-purple-600/5 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium mb-4">
              <Activity className="w-4 h-4" />
              How It Works
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              From Upload to{' '}
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Diagnosis Report
              </span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              Simple 4-step workflow that transforms your medical images into actionable insights
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((item, index) => (
              <div key={index} className="relative group">
                {/* Connector line */}
                {index < 3 && (
                  <div className="hidden lg:block absolute top-14 left-[calc(100%+1rem)] w-[calc(100%-2rem)] h-[2px]">
                    <div className="w-full h-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20" />
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-500/40" />
                  </div>
                )}

                <div className="relative p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300 group-hover:scale-[1.05] h-full">
                  {/* Step number */}
                  <div className="absolute -top-3 -left-3 w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-sm font-bold text-white shadow-lg z-20">
                    {item.step}
                  </div>

                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400/10 to-blue-600/10 border border-white/5 flex items-center justify-center text-cyan-400 mb-6 group-hover:scale-110 transition-transform">
                    {item.icon}
                  </div>

                  <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ AI SPECIALISTS ═══════════════════ */}
      <section id="specialists" className="py-24 relative">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium mb-4">
              <Stethoscope className="w-4 h-4" />
              AI Specialists
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Virtual{' '}
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Specialist Panel
              </span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              Each analysis is reviewed by multiple AI specialists, simulating a real multidisciplinary team discussion
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { name: 'Dr. Rodriguez', role: 'Radiologist', emoji: '🔬', specialty: 'Medical Imaging & X-rays', color: 'cyan' },
              { name: 'Dr. Santos', role: 'Cardiologist', emoji: '❤️', specialty: 'Heart & Circulation', color: 'blue' },
              { name: 'Dr. Park', role: 'Neurologist', emoji: '🧠', specialty: 'Brain & Nervous System', color: 'indigo' },
              { name: 'Dr. Williams', role: 'Pulmonologist', emoji: '🫁', specialty: 'Lungs & Respiratory', color: 'cyan' },
            ].map((doc, i) => (
              <div
                key={i}
                className="group relative p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-500 hover:scale-[1.05] text-center"
              >
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 flex items-center justify-center text-5xl mx-auto mb-6 group-hover:scale-110 transition-transform">
                  {doc.emoji}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{doc.name}</h3>
                <p className={`text-sm font-bold mb-3 ${doc.color === 'cyan' ? 'text-cyan-400' :
                  doc.color === 'blue' ? 'text-blue-400' : 'text-indigo-400'
                  }`}>{doc.role}</p>
                <p className="text-xs text-gray-500 font-medium leading-relaxed">{doc.specialty}</p>
              </div>
            ))}
          </div>

          {/* Summary card */}
          <div className="mt-12 p-10 rounded-3xl bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-indigo-500/10 border border-white/10 text-center backdrop-blur-md relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Bot className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-white">Chief Medical Officer Summary</h3>
              </div>
              <p className="text-gray-400 text-lg max-w-3xl mx-auto leading-relaxed">
                After all specialists have weighed in, our AI Chief Medical Officer generates a comprehensive,
                patient-friendly summary written at a <span className="text-cyan-400 font-bold">professional clinical level</span> — making complex medical information accessible and actionable.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ TECH STACK ═══════════════════ */}
      <section id="tech-stack" className="py-24 relative">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
          <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-cyan-600/5 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-4">
              <Layers className="w-4 h-4" />
              Tech Stack
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Built With{' '}
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Modern Technology
              </span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              Production-grade architecture with best-in-class technologies
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {techStack.map((tech, i) => (
              <div
                key={i}
                className="group p-6 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.06] hover:border-cyan-500/20 transition-all duration-300 hover:scale-105 text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 flex items-center justify-center mx-auto mb-4 text-cyan-400 group-hover:scale-110 transition-transform shadow-lg shadow-cyan-500/5">
                  {tech.icon}
                </div>
                <p className="text-sm font-bold text-white mb-1 tracking-tight">{tech.name}</p>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{tech.category}</p>
              </div>
            ))}
          </div>

          {/* Architecture Overview */}
          <div className="mt-12 p-10 rounded-3xl bg-white/[0.02] border border-white/5 backdrop-blur-md">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-6 bg-white/[0.02] rounded-2xl border border-white/5">
                <MonitorSmartphone className="w-10 h-10 text-cyan-400 mx-auto mb-4" />
                <h4 className="font-bold text-white mb-3">Frontend Architecture</h4>
                <p className="text-sm text-gray-400 leading-relaxed font-medium">Next.js 16 + React 19 + Tailwind CSS + Zustand</p>
              </div>
              <div className="text-center p-6 bg-white/[0.02] rounded-2xl border border-white/5">
                <Zap className="w-10 h-10 text-blue-400 mx-auto mb-4" />
                <h4 className="font-bold text-white mb-3">Backend Intelligence</h4>
                <p className="text-sm text-gray-400 leading-relaxed font-medium">FastAPI + OpenAI GPT-4V + WebSocket + PubMed</p>
              </div>
              <div className="text-center p-6 bg-white/[0.02] rounded-2xl border border-white/5">
                <Database className="w-10 h-10 text-indigo-400 mx-auto mb-4" />
                <h4 className="font-bold text-white mb-3">Persistent Layer</h4>
                <p className="text-sm text-gray-400 leading-relaxed font-medium">MongoDB Atlas + RAG with OpenAI Embeddings</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ SUPPORTED FORMATS ═══════════════════ */}
      <section className="py-24 relative">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
        </div>

        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            {/* Left Content */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium mb-6">
                <Microscope className="w-4 h-4" />
                Medical Imaging
              </div>
              <h2 className="text-4xl sm:text-5xl font-bold mb-8 tracking-tight">
                Supports All Major{' '}
                <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  Medical Formats
                </span>
              </h2>
              <p className="text-gray-400 mb-10 text-lg leading-relaxed font-medium">
                Whether you are working with standard images or specialized medical formats,
                our platform handles everything with advanced preprocessing and AI-ready conversion.
              </p>

              <div className="space-y-6">
                {[
                  { format: 'JPEG / PNG', desc: 'Standard medical photos and screenshots', icon: '🖼️' },
                  { format: 'DICOM (.dcm)', desc: 'Industry-standard medical imaging format', icon: '🏥' },
                  { format: 'NIfTI (.nii)', desc: 'Neuroimaging data format for MRI/fMRI', icon: '🧠' },
                  { format: 'Up to 50MB', desc: 'Support for high-resolution medical scans', icon: '📦' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-5 p-4 rounded-2xl hover:bg-white/[0.04] transition-all border border-transparent hover:border-white/5 group">
                    <span className="text-3xl group-hover:scale-110 transition-transform">{item.icon}</span>
                    <div>
                      <p className="font-bold text-lg text-white mb-1">{item.format}</p>
                      <p className="text-sm text-gray-400 font-medium">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right - Analysis Preview */}
            <div className="relative">
              <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 space-y-6 backdrop-blur-xl shadow-2xl">
                {/* Mock Analysis UI */}
                <div className="flex items-center gap-4 pb-6 border-b border-white/5">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-white tracking-tight">AI Analysis Engine</p>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <p className="text-xs text-emerald-400 font-bold uppercase tracking-widest">Active — 3.2s avg</p>
                    </div>
                  </div>
                </div>

                {/* Analysis Output Preview */}
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <p className="text-xs font-bold text-emerald-400 mb-1 uppercase tracking-widest">✅ Findings Detected</p>
                    <p className="text-sm text-gray-300 font-medium">Observations identified with 94.2% confidence</p>
                  </div>
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <p className="text-xs font-bold text-amber-400 mb-1 uppercase tracking-widest">🟡 Urgency Level</p>
                    <p className="text-sm text-gray-300 font-medium">Professional consultation recommended promptly</p>
                  </div>
                  <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                    <p className="text-xs font-bold text-cyan-400 mb-1 uppercase tracking-widest">🩺 Specialist Referral</p>
                    <p className="text-sm text-gray-300 font-medium">Matching specialists ready for consultation</p>
                  </div>
                  <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <p className="text-xs font-bold text-blue-400 mb-1 uppercase tracking-widest">📚 Literature Search</p>
                    <p className="text-sm text-gray-300 font-medium">Relevant PubMed articles found and attached</p>
                  </div>
                </div>

                {/* Keywords Preview */}
                <div className="flex flex-wrap gap-2 pt-6 border-t border-white/5">
                  {['Chest X-Ray', 'Lung Fields', 'Consolidation', 'Follow-up'].map((kw, i) => (
                    <span key={i} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-cyan-400 uppercase tracking-widest">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>

              {/* Decorative glow */}
              <div className="absolute -inset-6 bg-gradient-to-r from-cyan-500/10 via-transparent to-blue-500/10 rounded-[2.5rem] -z-10 blur-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ DISCLAIMER ═══════════════════ */}
      <section className="py-12 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/20">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="font-bold text-amber-400 mb-2">⚠️ Medical Disclaimer</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  This AI analysis platform is for <strong className="text-gray-300">educational and informational purposes only</strong>.
                  It is NOT a substitute for professional medical advice, diagnosis, or treatment.
                  Always seek the advice of a qualified healthcare professional for medical conditions.
                  The AI may contain errors and should never be used as the sole basis for clinical decisions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ FINAL CTA ═══════════════════ */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-600/10 rounded-full blur-[150px]" />
        </div>

        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          <div className="p-16 rounded-[2.5rem] bg-white/[0.03] border border-white/10 backdrop-blur-xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative z-10">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-cyan-500/30">
                <Stethoscope className="w-10 h-10 text-white" />
              </div>

              <h2 className="text-4xl sm:text-5xl font-bold mb-6 tracking-tight">
                Ready to Transform{' '}
                <br />
                <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  Medical Intelligence
                </span>
                ?
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto mb-12 text-xl font-medium leading-relaxed">
                Join thousands of practitioners and patients already using AI-powered analysis for fast, precise, and actionable medical insights.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <button
                  onClick={() => router.push(isAuthenticated ? '/dashboard' : '/auth/register')}
                  className="group px-10 py-5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-lg font-bold hover:shadow-[0_0_40px_-10px_rgba(6,182,212,0.5)] transition-all duration-300 hover:scale-[1.05] flex items-center gap-3"
                >
                  <Sparkles className="w-6 h-6" />
                  {isAuthenticated ? 'Open Dashboard' : 'Start Free Now'}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <div className="flex items-center gap-3 text-gray-500 text-sm font-bold uppercase tracking-widest">
                  <Check className="w-5 h-5 text-emerald-400" />
                  No card required
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ FOOTER ═══════════════════ */}
      <footer className="border-t border-white/5 py-20 bg-white/[0.01]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                  <Stethoscope className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-xl bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent tracking-tighter">
                  Medical Agent
                </span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed font-medium">
                Advanced AI diagnostic intelligence with multi-specialist synergy and patient-centered reporting.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-bold text-white mb-6 uppercase tracking-widest text-xs opacity-50">Product</h4>
              <ul className="space-y-3">
                <li><a href="#features" className="text-sm text-gray-400 hover:text-cyan-400 transition-colors font-medium">Core Features</a></li>
                <li><a href="#how-it-works" className="text-sm text-gray-400 hover:text-cyan-400 transition-colors font-medium">Workflow</a></li>
                <li><a href="#tech-stack" className="text-sm text-gray-400 hover:text-cyan-400 transition-colors font-medium">Engineering</a></li>
                <li><a href="#specialists" className="text-sm text-gray-400 hover:text-cyan-400 transition-colors font-medium">AI Specialists</a></li>
              </ul>
            </div>

            {/* Platform */}
            <div>
              <h4 className="font-bold text-white mb-6 uppercase tracking-widest text-xs opacity-50">Intelligence</h4>
              <ul className="space-y-3">
                <li><Link href="/analysis" className="text-sm text-gray-400 hover:text-cyan-400 transition-colors font-medium">Image Analysis</Link></li>
                <li><Link href="/consultation" className="text-sm text-gray-400 hover:text-cyan-400 transition-colors font-medium">Consultation Hub</Link></li>
                <li><Link href="/qa" className="text-sm text-gray-400 hover:text-cyan-400 transition-colors font-medium">Symptom Q&A</Link></li>
                <li><Link href="/reports" className="text-sm text-gray-400 hover:text-cyan-400 transition-colors font-medium">Diagnostic Reports</Link></li>
              </ul>
            </div>

            {/* Auth */}
            <div>
              <h4 className="font-bold text-white mb-6 uppercase tracking-widest text-xs opacity-50">Account</h4>
              <ul className="space-y-3">
                <li><Link href="/auth/login" className="text-sm text-gray-400 hover:text-cyan-400 transition-colors font-medium">Log In</Link></li>
                <li><Link href="/auth/register" className="text-sm text-gray-400 hover:text-cyan-400 transition-colors font-medium">Join Platform</Link></li>
                <li><Link href="/dashboard" className="text-sm text-gray-400 hover:text-cyan-400 transition-colors font-medium">Command Center</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-10 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
            <p className="text-sm text-gray-600 font-medium">
              © 2025 Medical Agent Intelligence. Advanced Clinical Systems.
            </p>
            <div className="flex items-center gap-6 text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em]">
              <span className="flex items-center gap-1.5 hover:text-cyan-400 transition-colors cursor-default">
                <Lock className="w-3 h-3" /> HIPAA-Ready
              </span>
              <span className="flex items-center gap-1.5 hover:text-cyan-400 transition-colors cursor-default">
                <Shield className="w-3 h-3" /> AES-256
              </span>
              <span className="flex items-center gap-1.5 hover:text-cyan-400 transition-colors cursor-default">
                <Clock className="w-3 h-3" /> 99.9% Uptime
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* ═══════════════════ CUSTOM STYLES ═══════════════════ */}
      <style jsx>{`
                @keyframes float-particle {
                    0%, 100% { transform: translateY(0) translateX(0); opacity: 0.15; }
                    25% { transform: translateY(-30px) translateX(15px); opacity: 0.3; }
                    50% { transform: translateY(-15px) translateX(-10px); opacity: 0.15; }
                    75% { transform: translateY(-40px) translateX(20px); opacity: 0.25; }
                }
            `}</style>
    </div>
  );
}
