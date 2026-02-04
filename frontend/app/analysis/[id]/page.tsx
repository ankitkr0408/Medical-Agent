'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FileImage, Clock } from 'lucide-react';
import Card from '@/components/Card';
import Button from '@/components/Button';
import LoadingSpinner from '@/components/LoadingSpinner';
import { analysisAPI } from '@/lib/api';

export default function AnalysisDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params); // Unwrap the Promise
    const [analysis, setAnalysis] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadAnalysis();
    }, [id]);

    const loadAnalysis = async () => {
        try {
            const data = await analysisAPI.getAnalysis(id);
            setAnalysis(data);
        } catch (err: any) {
            setError('Failed to load analysis');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animated-bg"></div>
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (error || !analysis) {
        return (
            <div className="min-h-screen">
                <div className="animated-bg"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <Card className="text-center py-12">
                        <p className="text-error mb-4">{error || 'Analysis not found'}</p>
                        <Button onClick={() => router.push('/dashboard')}>
                            Back to Dashboard
                        </Button>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <div className="animated-bg"></div>

            {/* Header */}
            <header className="glass-card mb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
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
                            <h1 className="text-2xl font-bold gradient-text">Analysis Results</h1>
                            <p className="text-sm text-text-secondary mt-1">
                                {analysis.filename}
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
                {/* File Info Card */}
                <Card className="mb-6 fade-in">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-gradient-primary">
                            <FileImage className="w-8 h-8 text-white" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-text-primary">{analysis.filename}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <Clock className="w-4 h-4 text-text-muted" />
                                <span className="text-sm text-text-muted">
                                    {new Date(analysis.date).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Parse and display the analysis in a structured way */}
                <div className="space-y-6">
                    {/* AI Analysis - Display the raw analysis with better formatting */}
                    <Card className="slide-in-left">
                        <div className="prose prose-invert max-w-none">
                            <div
                                className="text-text-secondary text-sm leading-relaxed"
                                style={{ whiteSpace: 'pre-wrap' }}
                                dangerouslySetInnerHTML={{
                                    __html: analysis.analysis
                                        // Add styling to headers
                                        .replace(/### (\d+)\. ([^\n]+)/g, '<h3 class="text-lg font-bold text-text-primary mt-6 mb-3 flex items-center gap-2"><span class="bg-primary/20 text-primary px-2 py-1 rounded text-sm">$1</span>$2</h3>')
                                        // Style sub-headers
                                        .replace(/\*\*([^*]+):\*\*/g, '<strong class="text-primary">$1:</strong>')
                                        // Style urgency badges
                                        .replace(/🔴 \*\*IMMEDIATE \(ER\/Emergency\):\*\*/g, '<span class="inline-flex items-center px-3 py-1 rounded-full bg-red-500/20 text-red-400 font-semibold text-sm">🔴 IMMEDIATE (ER/Emergency)</span><br/>')
                                        .replace(/🟡 \*\*URGENT \(24-48 hours\):\*\*/g, '<span class="inline-flex items-center px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 font-semibold text-sm">🟡 URGENT (24-48 hours)</span><br/>')
                                        .replace(/🟢 \*\*ROUTINE \(Schedule soon\):\*\*/g, '<span class="inline-flex items-center px-3 py-1 rounded-full bg-green-500/20 text-green-400 font-semibold text-sm">🟢 ROUTINE (Schedule soon)</span><br/>')
                                        // Style critical severity
                                        .replace(/🔴 \*\*Critical\/Acute:\*\*/g, '<span class="inline-flex items-center px-2 py-1 rounded bg-red-500/20 text-red-400 font-semibold text-sm">🔴 Critical/Acute</span><br/>')
                                        // Style warning boxes
                                        .replace(/⚠️ \*\*IMPORTANT\*\*:/g, '<div class="mt-4 p-4 bg-yellow-500/10 border-l-4 border-yellow-500 rounded"><strong class="text-yellow-400">⚠️ IMPORTANT:</strong>')
                                        .replace(/(Do not delay care based on AI analysis\."\n)/g, '$1</div>')
                                        // Style bullet points
                                        .replace(/^- (.+)$/gm, '<li class="ml-4 text-text-secondary">$1</li>')
                                        // Convert line breaks
                                        .replace(/\n\n/g, '<br/><br/>')
                                }}
                            />
                        </div>
                    </Card>

                    {/* Key Findings - if separate from analysis */}
                    {analysis.findings && analysis.findings.length > 0 && (
                        <Card className="slide-in-left">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-1 h-6 bg-gradient-primary rounded"></div>
                                <h3 className="text-lg font-semibold text-text-primary">
                                    Key Findings
                                </h3>
                            </div>
                            <ul className="space-y-3">
                                {analysis.findings.map((finding: string, index: number) => (
                                    <li key={index} className="flex items-start gap-3 p-3 rounded-lg bg-bg-tertiary hover:bg-bg-tertiary/80 transition-colors">
                                        <span className="text-primary text-lg mt-0.5">•</span>
                                        <span className="text-text-secondary text-sm flex-1">{finding}</span>
                                    </li>
                                ))}
                            </ul>
                        </Card>
                    )}

                    {/* Keywords */}
                    {analysis.keywords && analysis.keywords.length > 0 && (
                        <Card className="slide-in-left">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-1 h-6 bg-gradient-accent rounded"></div>
                                <h3 className="text-lg font-semibold text-text-primary">
                                    Medical Keywords
                                </h3>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {analysis.keywords.map((keyword: string, index: number) => (
                                    <span
                                        key={index}
                                        className="px-4 py-2 bg-gradient-accent text-white rounded-lg text-sm font-medium hover:scale-105 transition-transform"
                                    >
                                        {keyword}
                                    </span>
                                ))}
                            </div>
                        </Card>
                    )}

                    {/* Doctor Recommendations */}
                    {analysis.doctor_recommendations && Object.keys(analysis.doctor_recommendations).length > 0 && (
                        <Card className="slide-in-left border-2 border-primary/30">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-1 h-6 bg-gradient-primary rounded"></div>
                                <h3 className="text-lg font-semibold text-text-primary">
                                    👨‍⚕️ Doctor Recommendations
                                </h3>
                            </div>
                            <div className="space-y-4">
                                {Object.entries(analysis.doctor_recommendations).map(([key, value]: [string, any]) => (
                                    <div key={key} className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                                        <h4 className="font-semibold text-primary mb-2 capitalize flex items-center gap-2">
                                            <span className="w-2 h-2 bg-primary rounded-full"></span>
                                            {key.replace(/_/g, ' ')}
                                        </h4>
                                        <p className="text-sm text-text-secondary leading-relaxed">{value}</p>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}

                    {/* Actions */}
                    <div className="flex gap-4 sticky bottom-4">
                        <Button
                            variant="primary"
                            onClick={() => router.push('/consultation')}
                            className="flex-1"
                        >
                            💬 Start Consultation
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => router.push('/analysis')}
                            className="flex-1"
                        >
                            📋 New Analysis
                        </Button>
                    </div>
                </div>
            </main>
        </div>
    );
}
