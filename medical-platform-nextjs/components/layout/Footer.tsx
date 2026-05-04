import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#0b1120] border-t border-white/10 pt-16 pb-8 relative overflow-hidden">
      {/* Glow effect at the bottom */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-violet-600/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-sky-400 flex items-center justify-center text-white font-bold text-lg">
                H
              </div>
              <span className="text-xl font-black text-white tracking-tight">
                Health<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-sky-400">IQ</span>
              </span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed">
              Empowering healthcare professionals with state-of-the-art AI analysis, collaborative tools, and actionable medical intelligence.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Platform</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link href="#" className="hover:text-violet-400 transition">AI Diagnostics</Link></li>
              <li><Link href="#" className="hover:text-violet-400 transition">Multi-Doctor Chat</Link></li>
              <li><Link href="#" className="hover:text-violet-400 transition">Patient Records</Link></li>
              <li><Link href="#" className="hover:text-violet-400 transition">Interactive Heatmaps</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link href="#" className="hover:text-violet-400 transition">About Us</Link></li>
              <li><Link href="#" className="hover:text-violet-400 transition">Careers</Link></li>
              <li><Link href="#" className="hover:text-violet-400 transition">Blog</Link></li>
              <li><Link href="#" className="hover:text-violet-400 transition">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Legal & Security</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link href="#" className="hover:text-violet-400 transition">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-violet-400 transition">Terms of Service</Link></li>
              <li className="flex items-center gap-2 mt-4 pt-4 border-t border-white/10">
                <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]"></span>
                HIPAA Compliant
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]"></span>
                End-to-End Encrypted
              </li>
            </ul>
          </div>

        </div>

        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-white/5 text-sm text-slate-500">
          <p>© {new Date().getFullYear()} HealthIQ Intelligence. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            {/* Social SVGs */}
            <a href="#" className="hover:text-white transition">Twitter</a>
            <a href="#" className="hover:text-white transition">LinkedIn</a>
            <a href="#" className="hover:text-white transition">GitHub</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
