'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FileText, Download, Plus, Calendar, FileDown } from 'lucide-react';
import Card from '@/components/Card';
import Button from '@/components/Button';
import LoadingSpinner from '@/components/LoadingSpinner';
import { reportsAPI, analysisAPI } from '@/lib/api';

interface Report {
    id: string;
    title: string;
    analysis_id: string;
    content: string;
    created_at: string;
    filename: string;
}

interface Analysis {
    id: string;
    filename: string;
    date: string;
    analysis: string;
}

export default function ReportsPage() {
    const router = useRouter();
    const [reports, setReports] = useState<Report[]>([]);
    const [analyses, setAnalyses] = useState<Analysis[]>([]);
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [selectedAnalysisId, setSelectedAnalysisId] = useState('');
    const [reportTitle, setReportTitle] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadReports();
        loadAnalyses();
    }, []);

    const loadReports = async () => {
        try {
            const data = await reportsAPI.listReports();
            setReports(data || []);
        } catch (err: any) {
            console.error('Error loading reports:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const loadAnalyses = async () => {
        try {
            const data = await analysisAPI.getHistory();
            setAnalyses(data.analyses || []);
        } catch (err: any) {
            console.error('Error loading analyses:', err);
        }
    };

    const handleGenerateReport = async () => {
        if (!selectedAnalysisId) {
            setError('Please select an analysis');
            return;
        }

        setIsGenerating(true);
        setError('');

        try {
            const report = await reportsAPI.generateReport(selectedAnalysisId, reportTitle || undefined);
            setReports([report, ...reports]);
            setShowGenerateModal(false);
            setSelectedAnalysisId('');
            setReportTitle('');
            setSelectedReport(report);
        } catch (err: any) {
            setError('Failed to generate report');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownloadReport = async (report: Report) => {
        try {
            await reportsAPI.downloadReport(report.id, report.filename);
        } catch (err: any) {
            alert('Failed to download report');
        }
    };

    return (
        <div className="min-h-screen w-full">
            <div className="animated-bg"></div>

            {/* Header */}
            <header className="glass-card mb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push('/dashboard')}
                                className="flex items-center gap-2"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back
                            </Button>
                            <div>
                                <h1 className="text-2xl font-bold gradient-text">Medical Reports</h1>
                                <p className="text-sm text-text-secondary mt-1">
                                    Generate and download comprehensive medical reports
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => setShowGenerateModal(true)}
                            className="flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Generate Report
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
                {/* Generate Modal */}
                {showGenerateModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <Card className="max-w-md w-full">
                            <h3 className="text-xl font-bold text-text-primary mb-4">Generate New Report</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-2">
                                        Select Analysis
                                    </label>
                                    <select
                                        value={selectedAnalysisId}
                                        onChange={(e) => setSelectedAnalysisId(e.target.value)}
                                        className="w-full px-4 py-2 bg-bg-tertiary text-text-primary border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    >
                                        <option value="">Choose an analysis...</option>
                                        {analyses.map((analysis) => (
                                            <option key={analysis.id} value={analysis.id}>
                                                {analysis.filename} - {new Date(analysis.date).toLocaleDateString()}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-2">
                                        Report Title (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={reportTitle}
                                        onChange={(e) => setReportTitle(e.target.value)}
                                        placeholder="e.g., Chest X-Ray Report"
                                        className="w-full px-4 py-2 bg-bg-tertiary text-text-primary border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary placeholder-text-muted"
                                    />
                                </div>

                                {error && (
                                    <div className="p-3 bg-error/10 border border-error/20 rounded-lg">
                                        <p className="text-sm text-error">{error}</p>
                                    </div>
                                )}

                                <div className="flex gap-3">
                                    <Button
                                        variant="primary"
                                        onClick={handleGenerateReport}
                                        isLoading={isGenerating}
                                        disabled={isGenerating}
                                        className="flex-1"
                                    >
                                        Generate
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setShowGenerateModal(false);
                                            setError('');
                                            setSelectedAnalysisId('');
                                            setReportTitle('');
                                        }}
                                        disabled={isGenerating}
                                        className="flex-1"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Reports List */}
                    <div className="lg:col-span-1">
                        <h2 className="text-xl font-bold text-text-primary mb-4">Your Reports</h2>

                        {isLoading ? (
                            <Card className="flex items-center justify-center py-12">
                                <LoadingSpinner />
                            </Card>
                        ) : reports.length === 0 ? (
                            <Card className="text-center py-12">
                                <FileText className="w-16 h-16 text-text-muted mx-auto mb-4" />
                                <p className="text-text-secondary">No reports generated yet</p>
                                <p className="text-sm text-text-muted mt-2">Generate your first report from an analysis</p>
                            </Card>
                        ) : (
                            <div className="space-y-3">
                                {reports.map((report) => (
                                    <Card
                                        key={report.id}
                                        hover
                                        onClick={() => setSelectedReport(report)}
                                        className={`cursor-pointer ${selectedReport?.id === report.id
                                            ? 'border-2 border-primary'
                                            : ''
                                            }`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-start gap-3 flex-1 min-w-0">
                                                <div className="p-2 rounded-lg bg-accent/20 flex-shrink-0">
                                                    <FileText className="w-5 h-5 text-accent" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-text-primary truncate">
                                                        {report.title}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Calendar className="w-3 h-3 text-text-muted" />
                                                        <p className="text-xs text-text-muted">
                                                            {new Date(report.created_at).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDownloadReport(report);
                                                }}
                                                className="flex-shrink-0"
                                            >
                                                <Download className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Report Viewer */}
                    <div className="lg:col-span-2">
                        {!selectedReport ? (
                            <Card className="flex items-center justify-center min-h-[500px]">
                                <div className="text-center">
                                    <FileDown className="w-16 h-16 text-text-muted mx-auto mb-4" />
                                    <p className="text-text-secondary">Select a report to view</p>
                                </div>
                            </Card>
                        ) : (
                            <Card>
                                <div className="mb-6 pb-4 border-b border-white/10 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold text-text-primary">
                                            {selectedReport.title}
                                        </h3>
                                        <p className="text-sm text-text-muted mt-1">
                                            Generated: {new Date(selectedReport.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={() => handleDownloadReport(selectedReport)}
                                        className="flex items-center gap-2"
                                    >
                                        <Download className="w-4 h-4" />
                                        Download
                                    </Button>
                                </div>

                                {/* Report Content */}
                                <div className="prose prose-invert max-w-none">
                                    <div className="whitespace-pre-wrap text-sm text-text-secondary leading-relaxed">
                                        {selectedReport.content}
                                    </div>
                                </div>
                            </Card>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
