'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

export default function Hero3DAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const y3 = useTransform(scrollYProgress, [0, 1], [0, 150]);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Background glow meshes */}
      <div className="absolute top-[20%] left-[10%] w-[500px] h-[500px] rounded-full bg-violet-600/20 blur-[120px]" />
      <div className="absolute top-[40%] right-[10%] w-[400px] h-[400px] rounded-full bg-sky-500/20 blur-[120px]" />
      <div className="absolute -bottom-[10%] left-[30%] w-[600px] h-[600px] rounded-full bg-emerald-500/10 blur-[100px]" />

      {/* Floating 3D-like objects */}
      
      {/* Abstract Medical Cross 1 */}
      <motion.div 
        style={{ y: y1 }}
        animate={{ 
          y: [0, -20, 0], 
          rotateZ: [0, 10, -5, 0],
          rotateX: [0, 20, 0]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[15%] right-[15%] w-32 h-32 opacity-80 backdrop-blur-3xl"
      >
        <div className="w-full h-full relative" style={{ transformStyle: 'preserve-3d', transform: 'perspective(1000px) rotateY(-20deg) rotateX(15deg)' }}>
          {/* Glass slab back */}
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/40 to-fuchsia-500/10 rounded-3xl border border-white/20 shadow-[0_0_50px_rgba(124,58,237,0.3)] flex items-center justify-center translate-z-[-20px]">
          </div>
          {/* Glass slab front */}
          <div className="absolute inset-0 bg-white/10 rounded-3xl border border-white/30 backdrop-blur-md flex items-center justify-center shadow-2xl">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white drop-shadow-lg">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
        </div>
      </motion.div>

      {/* Abstract DNA/Tech Ring */}
      <motion.div 
        style={{ y: y2 }}
        animate={{ 
          y: [0, 30, 0],
          rotate: [0, 180, 360]
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-[25%] left-[10%] w-48 h-48 opacity-60"
      >
        <div className="w-full h-full relative" style={{ transformStyle: 'preserve-3d', transform: 'perspective(1000px) rotateX(60deg) rotateY(20deg)' }}>
          <div className="absolute inset-0 rounded-full border-[8px] border-sky-400/30 border-t-sky-400 border-b-sky-400 filter drop-shadow-[0_0_15px_rgba(56,189,248,0.5)]"></div>
          <div className="absolute inset-4 rounded-full border-[2px] border-dashed border-violet-400/50" style={{ animation: 'spin 15s linear infinite reverse' }}></div>
        </div>
      </motion.div>

      {/* Floating Sparkle/Data nodes */}
      <motion.div
         style={{ y: y3 }}
         animate={{ y: [0, -15, 0], opacity: [0.4, 1, 0.4] }}
         transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
         className="absolute top-[40%] left-[20%] w-16 h-16"
      >
        <div className="w-full h-full bg-gradient-to-tr from-emerald-400 to-cyan-400 rounded-full blur-[2px] shadow-[0_0_30px_rgba(16,185,129,0.6)]"></div>
        <div className="absolute inset-1 bg-white rounded-full"></div>
      </motion.div>
      
      <motion.div
         animate={{ y: [0, 20, 0], opacity: [0.5, 0.8, 0.5] }}
         transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
         className="absolute bottom-[30%] right-[25%] w-10 h-10"
      >
        <div className="w-full h-full bg-gradient-to-tr from-amber-400 to-orange-400 rounded-full blur-[1px] shadow-[0_0_20px_rgba(251,191,36,0.6)]"></div>
        <div className="absolute inset-1.5 bg-white rounded-full"></div>
      </motion.div>

    </div>
  );
}
