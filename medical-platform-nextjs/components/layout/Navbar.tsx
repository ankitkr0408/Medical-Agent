'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-[#0f172a]/80 backdrop-blur-md border-b border-white/10 shadow-lg py-4' 
          : 'bg-transparent py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-sky-400 flex items-center justify-center text-white font-bold text-xl shadow-[0_0_15px_rgba(124,58,237,0.5)] group-hover:scale-105 transition-transform">
            H
          </div>
          <span className="text-2xl font-black text-white tracking-tight">
            Health<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-sky-400">IQ</span>
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {['Features', 'AI Solutions', 'Specialists', 'About'].map((item) => (
            <Link 
              key={item} 
              href={`#${item.toLowerCase().replace(' ', '-')}`}
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors relative group"
            >
              {item}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-violet-500 transition-all group-hover:w-full"></span>
            </Link>
          ))}
        </div>

        {/* Auth Buttons */}
        <div className="flex items-center gap-4">
          <Link 
            href="/login" 
            className="hidden md:block text-sm font-semibold text-slate-300 hover:text-white transition"
          >
            Sign In
          </Link>
          <Link href="/register">
            <button className="px-5 py-2.5 bg-white text-slate-900 rounded-full text-sm font-bold shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_25px_rgba(255,255,255,0.4)] hover:scale-105 transition-all">
              Get Started
            </button>
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}
