'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, FileText, Download, Eye, Search,
    Filter, Database, Clock, Shield, ChevronRight,
    AlertCircle, FileDown, CheckCircle2, History
} from 'lucide-react';
import Card from '@/components/Card';
import Button from '@/components/Button';
import LoadingSpinner from '@/components/LoadingSpinner';
import { reportsAPI, analysisAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

interface Report {
    id: string;
    filename: string;
    date: string;
    findings_count?: number;
    urgency?: string;
    type?: string;
}

export default function ReportsPage() {
    const router = useRouter();
    const user = useAuthStore((state) => state.user);
    const [reports, setReports] = useState<Report[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedReport, setSelectedReport] = useState<any>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [analyses, setAnalyses] = useState<any[]>([]);
    const [isGenerationModalOpen, setIsGenerationModalOpen] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [reportsRes, historyRes] = await Promise.all([
                reportsAPI.listReports(),
                analysisAPI.getHistory(20)
            ]);

            // Map analysis history to compatible report structures
            const mappedReports = historyRes.analyses.map((a: any) => ({
                id: a.id,
                filename: a.filename,
                date: a.date,
                findings_count: a.findings?.length || 0,
                urgency: a.doctor_recommendations?.urgency_level || 'Routine',
                type: a.type || 'IMAGE'
            }));

            setReports(mappedReports);
            setAnalyses(historyRes.analyses || []);
        } catch (err) {
            console.error('Error loading reports:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownloadReport = async (analysisId: string, filename: string) => {
        try {
            const response = await reportsAPI.generateReport(analysisId);

            // Create a link and trigger download
            const link = document.createElement('a');
            link.href = `data:application/pdf;base64,${response.report_data}`;
            link.download = filename.split('.')[0] + '_medical_report.pdf';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error('Error downloading report:', err);
            alert('Failed to generate PDF report.');
        }
    };

    const getUrgencyStyles = (level: string) => {
        switch (level?.toLowerCase()) {
            case 'emergency': return 'bg-red-500/10 text-red-400 border-red-500/20';
            case 'urgent': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
            default: return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
        }
    };

    const filteredReports = reports.filter(r =>
        r.filename.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen w-full relative flex flex-col">
            <div className="animated-bg"></div>

            {/* Header */}
            <header className="glass-card z-20 border-b border-white/5">
                <div className="w-full px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push('/dashboard')}
                            className="p-2 hover:bg-white/5"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-xl font-bold text-white flex items-center gap-2">
                                <Database className="w-5 h-5 text-emerald-400" />
                                Clinical Report Archives
                            </h1>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Validated Medical Documentation</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 w-full px-8 py-12 relative z-10 max-w-7xl mx-auto">
                <div className="grid lg:grid-cols-12 gap-12">
                    {/* Left - Search & Stats */}
                    <div className="lg:col-span-4 space-y-8">
                        <Card className="p-6">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Archive Management</h3>
                            <div className="relative mb-6">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                                <input
                                    type="text"
                                    placeholder="Find report by scan id..."
                                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-300 focus:border-emerald-500/30 outline-none transition-all"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <History className="w-4 h-4 text-gray-500" />
                                        <span className="text-xs text-gray-400">Total Indexed</span>
                                    </div>
                                    <span className="text-lg font-bold text-white">{reports.length}</span>
                                </div>
                                <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <Shield className="w-4 h-4 text-emerald-500" />
                                        <span className="text-xs text-gray-400">Verified Health Bits</span>
                                    </div>
                                    <span className="text-lg font-bold text-emerald-400">100%</span>
                                </div>
                            </div>
                        </Card>

                        <Card className="bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/20 p-6">
                            <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                Health Export Ready
                            </h4>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                All clinical reports are formatted according to standard medical observation protocols and are ready for professional sharing.
                            </p>
                        </Card>
                    </div>

                    {/* Right - Reports Grid/List */}
                    <div className="lg:col-span-8 space-y-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-white">Diagnostic Logs</h2>
                            <div className="flex items-center gap-2">
                                <Filter className="w-4 h-4 text-gray-600" />
                                <span className="text-xs text-gray-600 font-bold uppercase">Latest First</span>
                            </div>
                        </div>

                        {isLoading ? (
                            <div className="py-24 flex flex-col items-center justify-center">
                                <LoadingSpinner size="lg" />
                                <p className="mt-4 text-gray-600 text-sm italic">Accessing secure archives...</p>
                            </div>
                        ) : filteredReports.length === 0 ? (
                            <div className="py-24 text-center">
                                <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mx-auto mb-6">
                                    <FileText className="w-10 h-10 text-gray-800" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Archive Empty</h3>
                                <p className="text-gray-500 text-sm max-w-xs mx-auto">
                                    No reports found. Generate one by analyzing a medical scan.
                                </p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {filteredReports.map((report) => (
                                    <div
                                        key={report.id}
                                        className="group p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-emerald-500/30 transition-all flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                                                <FileDown className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h4 className="font-bold text-white group-hover:text-emerald-400 transition-colors">{report.filename}</h4>
                                                    <span className={`px-2 py-0.5 rounded-md text-[8px] font-bold uppercase border ${getUrgencyStyles(report.urgency || '')}`}>
                                                        {report.urgency}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4 text-[10px] text-gray-500 font-medium">
                                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(report.date).toLocaleDateString()}</span>
                                                    <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {report.findings_count} Findings</span>
                                                    <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> PDF Export Available</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="p-3 hover:bg-emerald-500/10 hover:text-emerald-400 transition-colors"
                                                onClick={() => handleDownloadReport(report.id, report.filename)}
                                            >
                                                <Download className="w-5 h-5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="p-3 hover:bg-white/10"
                                                onClick={() => router.push(`/analysis`)}
                                            >
                                                <Eye className="w-5 h-5" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
