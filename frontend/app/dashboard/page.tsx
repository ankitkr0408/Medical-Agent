'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Activity, Clipboard, MessageCircle, FileText,
    TrendingUp, Plus, ArrowRight, User, Settings,
    LogOut, Search, Bell, Calendar, HelpCircle,
    Stethoscope, Brain, Shield, LucideIcon
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { analysisAPI, consultationAPI } from '@/lib/api';
import Card from '@/components/Card';
import Button from '@/components/Button';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function DashboardPage() {
    const router = useRouter();
    const { user, logout, token } = useAuthStore();
    const [stats, setStats] = useState({
        totalAnalyses: 0,
        activeConsultations: 0,
        pendingQuestions: 0,
        totalReports: 0
    });
    const [recentAnalyses, setRecentAnalyses] = useState([]);
    const [recentConsultations, setRecentConsultations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!token) {
            router.push('/auth/login');
            return;
        }

        const fetchData = async () => {
            try {
                const [historyRes, roomsRes] = await Promise.all([
                    analysisAPI.getHistory(5),
                    consultationAPI.getRooms()
                ]);

                setRecentAnalyses(historyRes.analyses || []);
                setRecentConsultations(roomsRes || []);

                setStats({
                    totalAnalyses: historyRes.analyses?.length || 0,
                    activeConsultations: roomsRes?.length || 0,
                    pendingQuestions: 0,
                    totalReports: historyRes.analyses?.length || 0
                });
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [token, router]);

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-[#030712]">
                <div className="text-center">
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-gray-500 font-medium">Securing your session...</p>
                </div>
            </div>
        );
    }

    const QuickAction = ({ icon: Icon, title, desc, onClick, color }: { icon: LucideIcon, title: string, desc: string, onClick: () => void, color: 'cyan' | 'blue' | 'indigo' }) => {
        const colors = {
            cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 group-hover:border-cyan-500/30',
            blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20 group-hover:border-blue-500/30',
            indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 group-hover:border-indigo-500/30'
        };

        const glowColors = {
            cyan: 'bg-cyan-500/5 group-hover:bg-cyan-500/10',
            blue: 'bg-blue-500/5 group-hover:bg-blue-500/10',
            indigo: 'bg-indigo-500/5 group-hover:bg-indigo-500/10'
        };

        return (
            <button
                onClick={onClick}
                className={`group relative flex flex-col p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.06] transition-all text-left overflow-hidden h-full shadow-lg hover:shadow-cyan-500/5`}
            >
                <div className={`w-14 h-14 rounded-2xl ${colors[color]} flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-lg`}>
                    <Icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3 tracking-tight">{title}</h3>
                <p className="text-sm text-gray-400 font-medium leading-relaxed">{desc}</p>
                <div className="mt-8 flex items-center gap-2 text-xs font-bold text-gray-500 group-hover:text-cyan-400 transition-colors uppercase tracking-widest">
                    Initialize Module <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </div>
                <div className={`absolute -right-6 -bottom-6 w-32 h-32 ${glowColors[color]} rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity`} />
            </button>
        );
    };

    return (
        <div className="min-h-screen w-full relative">
            <div className="animated-bg"></div>

            {/* Sidebar-style Nav (Top Bar for Dashboard) */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-[#030712]/80 backdrop-blur-xl border-b border-white/5">
                <div className="w-full px-12 h-24 flex items-center justify-between">
                    <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                            <Stethoscope className="w-6 h-6 text-white" />
                        </div>
                        <div className="hidden sm:block">
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mb-1">Medical Intelligence</p>
                            <h1 className="text-xl font-bold text-white leading-none">Command Center</h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-8">
                        <div className="hidden lg:flex items-center bg-white/5 border border-white/10 rounded-2xl px-5 py-2.5 gap-3 group focus-within:border-cyan-500/50 transition-all">
                            <Search className="w-4 h-4 text-gray-500 group-focus-within:text-cyan-400" />
                            <input
                                type="text"
                                placeholder="Search dossiers, records..."
                                className="bg-transparent border-none outline-none text-sm text-gray-300 w-56 focus:w-80 transition-all"
                            />
                        </div>

                        <div className="flex items-center gap-4 pl-8 border-l border-white/10">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold text-white">{user?.full_name}</p>
                                <div className="flex items-center gap-1.5 justify-end">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Secure session</p>
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all group"
                                title="Exit Command Center"
                            >
                                <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="w-full pt-40 px-12 pb-20 relative z-10 max-w-[1700px] mx-auto">
                {/* Welcome Hero */}
                <div className="mb-16">
                    <h2 className="text-4xl font-bold text-white mb-3 tracking-tight">
                        Greetings, <span className="gradient-text">{user?.full_name?.split(' ')[0]}</span>.
                    </h2>
                    <p className="text-gray-400 text-lg font-medium">Monitoring diagnostic data and pending intelligence tasks.</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {[
                        { icon: Activity, label: 'Image Analyses', value: stats.totalAnalyses, color: 'cyan', trend: '+12%' },
                        { icon: MessageCircle, label: 'Active Consults', value: stats.activeConsultations, color: 'blue', trend: 'Active' },
                        { icon: HelpCircle, label: 'Q&A Sessions', value: stats.pendingQuestions, color: 'indigo', trend: 'Ready' },
                        { icon: FileText, label: 'Exported Reports', value: stats.totalReports, color: 'cyan', trend: 'Sync' }
                    ].map((stat, i) => (
                        <Card key={i} className="p-6 relative overflow-hidden group">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 rounded-2xl bg-white/5 transition-transform group-hover:scale-110 ${stat.color === 'cyan' ? 'text-cyan-400' :
                                    stat.color === 'blue' ? 'text-blue-400' : 'text-indigo-400'
                                    }`}>
                                    <stat.icon className="w-6 h-6" />
                                </div>
                                <span className="text-[10px] font-bold text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded-full border border-cyan-400/20">
                                    {stat.trend}
                                </span>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium mb-1">{stat.label}</p>
                                <p className="text-3xl font-bold text-white leading-none">{stat.value}</p>
                            </div>
                            {/* Decorative line */}
                            <div className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${stat.color === 'cyan' ? 'from-cyan-500' :
                                stat.color === 'blue' ? 'from-blue-500' : 'from-indigo-500'
                                } to-transparent w-full opacity-30`} />
                        </Card>
                    ))}
                </div>

                <div className="grid lg:grid-cols-12 gap-8">
                    {/* Main Tools */}
                    <div className="lg:col-span-8 space-y-8">
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-cyan-400" />
                                    Diagnostic Portfolio
                                </h3>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => router.push('/analysis')}
                                    className="flex items-center gap-2 rounded-xl"
                                >
                                    <Plus className="w-4 h-4" /> New Case
                                </Button>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-6">
                                <QuickAction
                                    icon={Brain}
                                    title="AI Image Analysis"
                                    desc="Neural-driven diagnostic simulation for medical imaging data."
                                    onClick={() => router.push('/analysis')}
                                    color="cyan"
                                />
                                <QuickAction
                                    icon={Stethoscope}
                                    title="Multi-Specialist Chat"
                                    desc="Asynchronous panel discussions with autonomous AI doctors."
                                    onClick={() => router.push('/consultation')}
                                    color="blue"
                                />
                                <QuickAction
                                    icon={HelpCircle}
                                    title="Report Intelligence"
                                    desc="Natural language interrogation of medical documents and studies."
                                    onClick={() => router.push('/qa')}
                                    color="indigo"
                                />
                                <QuickAction
                                    icon={FileText}
                                    title="Clinical Reports"
                                    desc="Production-ready PDF generation and compliance-ready data."
                                    onClick={() => router.push('/reports')}
                                    color="cyan"
                                />
                            </div>
                        </div>

                        {/* Recent Analyses List */}
                        <div>
                            <h3 className="text-xl font-bold text-white mb-6">Recent Records</h3>
                            <Card className="p-0 overflow-hidden border-white/5">
                                {recentAnalyses.length === 0 ? (
                                    <div className="p-12 text-center">
                                        <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                                            <Clipboard className="w-8 h-8 text-gray-700" />
                                        </div>
                                        <p className="text-gray-500 text-sm">No analysis records found. Start your first diagnostic case.</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-white/5">
                                        {recentAnalyses.map((item: any, i) => (
                                            <div
                                                key={i}
                                                className="p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors cursor-pointer group"
                                                onClick={() => router.push(`/analysis/${item.id}`)}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 font-bold shrink-0">
                                                        #{i + 1}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">
                                                            {item.filename || 'Processed Scan'}
                                                        </p>
                                                        <p className="text-[10px] text-gray-500 mt-1">
                                                            {new Date(item.date).toLocaleDateString()} • {item.findings?.length || 0} Findings Detected
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-white/5 text-[10px] text-gray-400 border border-white/5">
                                                        {item.type || 'IMAGE'}
                                                    </span>
                                                    <ChevronRight className="w-4 h-4 text-gray-700 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </Card>
                        </div>
                    </div>

                    {/* Right Column - System Info & Activity */}
                    <div className="lg:col-span-4 space-y-8">
                        <div>
                            <h3 className="text-xl font-bold text-white mb-6">Security & Trust</h3>
                            <Card className="bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/20 p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                                        <Shield className="w-5 h-5" />
                                    </div>
                                    <h4 className="font-bold text-white">Advanced Protection</h4>
                                </div>
                                <p className="text-xs text-gray-400 leading-relaxed mb-6">
                                    Your data is private. Analyses are isolated to your local account and encrypted using industry standard protocols.
                                </p>
                                <div className="space-y-3">
                                    {[
                                        { label: 'Cloud Storage', value: 'MongoDB Atlas', status: 'Connected' },
                                        { label: 'Encryption', value: 'TLS 1.3 + JWT', status: 'Active' },
                                        { label: 'Account Type', value: user?.role || 'Patient', status: 'Verified' }
                                    ].map((row, i) => (
                                        <div key={i} className="flex justify-between items-center text-[10px]">
                                            <span className="text-gray-500 font-bold uppercase">{row.label}</span>
                                            <div className="text-right">
                                                <span className="text-white font-bold">{row.value}</span>
                                                <span className="ml-2 text-emerald-500">●</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>

                        <div>
                            <h3 className="text-xl font-bold text-white mb-6">Medical Feed</h3>
                            <Card className="bg-white/[0.02] border-white/5 p-6 h-[400px] overflow-y-auto">
                                <div className="space-y-6">
                                    {[
                                        { icon: Stethoscope, title: 'Consultation Complete', time: '2h ago', text: 'Dr. Rodriguez finalized your chest X-ray summary.' },
                                        { icon: Activity, title: 'New Scan Analyzed', time: '5h ago', text: 'Spinal MRI analysis uploaded and keywords extracted.' },
                                        { icon: FileText, label: 'Report Generated', time: 'Yesterday', text: 'PDF report ready for download in your archives.' },
                                    ].map((note, i) => (
                                        <div key={i} className="relative pl-6 border-l border-white/5">
                                            <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-cyan-500 border-2 border-[#030712]" />
                                            <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">{note.time}</p>
                                            <h5 className="text-sm font-bold text-white mb-1">{note.title}</h5>
                                            <p className="text-xs text-gray-500 leading-relaxed">{note.text}</p>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>

            <style jsx>{`
                .gradient-text {
                    background: linear-gradient(135deg, #22d3ee 0%, #3b82f6 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
            `}</style>
        </div>
    );
}

// Simple internal icon for table
function ChevronRight({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="m9 18 6-6-6-6" />
        </svg>
    );
}
