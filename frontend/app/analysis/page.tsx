'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, Sparkles, Stethoscope, AlertTriangle, Info,
    BookOpen, Search, Download, ChevronRight, CheckCircle2,
    Users, MessageSquare, Microscope, Activity
} from 'lucide-react';
import Card from '@/components/Card';
import Button from '@/components/Button';
import FileUpload from '@/components/FileUpload';
import LoadingSpinner from '@/components/LoadingSpinner';
import { analysisAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

export default function AnalysisPage() {
    const router = useRouter();
    const user = useAuthStore((state) => state.user);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<any>(null);
    const [error, setError] = useState('');

    const handleFileSelect = (file: File) => {
        setSelectedFile(file);
        setAnalysisResult(null);
        setError('');
    };

    const handleAnalyze = async () => {
        if (!selectedFile) return;

        setUploading(true);
        setError('');

        try {
            // Upload file
            const uploadResponse = await analysisAPI.uploadImage(selectedFile);

            setUploading(false);
            setAnalyzing(true);

            // Analyze image
            const analysisResponse = await analysisAPI.analyzeImage({
                filename: selectedFile.name,
                image_data: uploadResponse.image_data,
                enable_xai: true,
            });

            setAnalysisResult(analysisResponse);
        } catch (err: any) {
            if (err.response?.data?.detail) {
                if (typeof err.response.data.detail === 'string') {
                    setError(err.response.data.detail);
                } else if (Array.isArray(err.response.data.detail)) {
                    setError(err.response.data.detail[0].msg);
                } else {
                    setError('Analysis failed. Please try again.');
                }
            } else {
                setError(err.message || 'Analysis failed. Please try again.');
            }
        } finally {
            setUploading(false);
            setAnalyzing(false);
        }
    };

    const getUrgencyColor = (level: string) => {
        switch (level?.toLowerCase()) {
            case 'emergency': return 'text-red-400 bg-red-400/10 border-red-500/20';
            case 'urgent': return 'text-orange-400 bg-orange-400/10 border-orange-500/20';
            case 'routine': return 'text-emerald-400 bg-emerald-400/10 border-emerald-500/20';
            default: return 'text-blue-400 bg-blue-400/10 border-blue-500/20';
        }
    };

    return (
        <div className="min-h-screen w-full relative">
            <div className="animated-bg"></div>

            {/* Header */}
            <header className="glass-card mb-8 relative z-10 w-full border-b border-white/5">
                <div className="w-full px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push('/dashboard')}
                                className="flex items-center gap-2"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back to Dashboard
                            </Button>
                            <div>
                                <h1 className="text-2xl font-bold gradient-text">AI Image Analysis</h1>
                                <p className="text-sm text-text-secondary">
                                    Upload medical imaging (X-ray, MRI, CT) for intelligent insights.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="w-full px-8 pb-12 relative z-10">
                <div className="grid lg:grid-cols-12 gap-8">
                    {/* Left Column - Form/Upload */}
                    <div className="lg:col-span-5 space-y-6 fade-in">
                        <Card className="p-8">
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <Search className="w-5 h-5 text-cyan-400" />
                                New Case Submission
                            </h2>
                            <FileUpload onFileSelect={handleFileSelect} />

                            {selectedFile && !analysisResult && (
                                <div className="mt-8">
                                    <Button
                                        variant="primary"
                                        size="lg"
                                        className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl shadow-xl shadow-cyan-500/20"
                                        onClick={handleAnalyze}
                                        isLoading={uploading || analyzing}
                                    >
                                        <Sparkles className="w-6 h-6" />
                                        {uploading ? 'Processing Image...' : analyzing ? 'Analyzing with AI...' : 'Conduct AI Analysis'}
                                    </Button>
                                </div>
                            )}

                            {error && (
                                <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex gap-3">
                                    <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                                    <p className="text-sm text-red-500">{error}</p>
                                </div>
                            )}
                        </Card>

                        {/* Tips Card */}
                        <Card className="bg-white/[0.02] border-white/5 p-6">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Analysis Guidelines</h3>
                            <ul className="space-y-4">
                                {[
                                    { icon: <Info className="w-4 h-4" />, text: 'Ensure the image is high resolution for best results.' },
                                    { icon: <CheckCircle2 className="w-4 h-4" />, text: 'Supports X-ray, MRI, CT Scans, and DICOM formats.' },
                                    { icon: <AlertTriangle className="w-4 h-4" />, text: 'AI observations are educational, not a primary diagnosis.' },
                                ].map((tip, i) => (
                                    <li key={i} className="flex gap-3 text-sm text-gray-500">
                                        <div className="mt-0.5 text-cyan-400">{tip.icon}</div>
                                        {tip.text}
                                    </li>
                                ))}
                            </ul>
                        </Card>
                    </div>

                    {/* Right Column - Results */}
                    <div className="lg:col-span-7 space-y-6 slide-in-right">
                        {!analysisResult && !analyzing && (
                            <Card className="h-full flex items-center justify-center min-h-[500px] border-dashed border-white/10 bg-transparent">
                                <div className="text-center max-w-sm px-6">
                                    <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mx-auto mb-6">
                                        <Search className="w-10 h-10 text-gray-600" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">No Active Result</h3>
                                    <p className="text-gray-500 text-sm">
                                        Once you upload and analyze an image, the detailed AI results and specialist referrals will appear here.
                                    </p>
                                </div>
                            </Card>
                        )}

                        {analyzing && (
                            <Card className="h-full flex items-center justify-center min-h-[500px] bg-[#030712]/40 backdrop-blur-xl">
                                <div className="text-center">
                                    <LoadingSpinner size="lg" />
                                    <div className="mt-8 space-y-4">
                                        <h3 className="text-xl font-bold text-white animate-pulse">Running AI Simulation...</h3>
                                        <p className="text-gray-500 text-sm max-w-xs mx-auto">
                                            Our GPT-4 Vision model is examining pixel data for anomalies and cross-referencing with medical literature.
                                        </p>
                                        <div className="flex justify-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce delay-0" />
                                            <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce delay-100" />
                                            <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce delay-200" />
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        )}

                        {analysisResult && (
                            <div className="space-y-6">
                                {/* Summary Section */}
                                <Card className="border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-transparent">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                            <Sparkles className="w-5 h-5 text-cyan-400" />
                                            AI Assistant Summary
                                        </h3>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getUrgencyColor(analysisResult.doctor_recommendations?.urgency_level)}`}>
                                            Urgency: {analysisResult.doctor_recommendations?.urgency_level || 'Routine'}
                                        </span>
                                    </div>
                                    <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-wrap line-clamp-6">
                                        {analysisResult.analysis}
                                    </p>
                                    <button
                                        className="mt-4 text-cyan-400 text-xs font-bold hover:underline flex items-center gap-1"
                                        onClick={() => {
                                            const el = document.getElementById('full-analysis');
                                            el?.scrollIntoView({ behavior: 'smooth' });
                                        }}
                                    >
                                        Read full analysis <ChevronRight className="w-3 h-3" />
                                    </button>
                                </Card>

                                {/* Findings and Specialists */}
                                <div className="grid md:grid-cols-2 gap-6">
                                    <Card className="bg-white/5">
                                        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-wide">
                                            <Stethoscope className="w-4 h-4 text-emerald-400" />
                                            Key Findings
                                        </h3>
                                        <ul className="space-y-3">
                                            {analysisResult.findings.map((finding: string, index: number) => (
                                                <li key={index} className="flex items-start gap-3">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                                                    <span className="text-gray-300 text-xs leading-relaxed">{finding}</span>
                                                </li>
                                            ))}
                                            {analysisResult.findings.length === 0 && (
                                                <li className="text-gray-500 text-xs italic">No specific findings parsed.</li>
                                            )}
                                        </ul>
                                    </Card>

                                    <Card className="bg-white/5">
                                        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-wide">
                                            <Users className="w-4 h-4 text-purple-400" />
                                            Specialist Referrals
                                        </h3>
                                        <div className="space-y-4">
                                            {analysisResult.doctor_recommendations?.primary_specialist && (
                                                <div>
                                                    <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Primary Referral</p>
                                                    <p className="text-sm text-cyan-400 font-bold">{analysisResult.doctor_recommendations.primary_specialist}</p>
                                                </div>
                                            )}
                                            {analysisResult.doctor_recommendations?.additional_specialists?.length > 0 && (
                                                <div>
                                                    <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Additional Consults</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {analysisResult.doctor_recommendations.additional_specialists.map((spec: string, i: number) => (
                                                            <span key={i} className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] text-gray-300 border border-white/5">
                                                                {spec}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </Card>
                                </div>

                                {/* Research & Literature */}
                                <Card id="research-section">
                                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                        <BookOpen className="w-5 h-5 text-amber-400" />
                                        Medical Literature & Studies
                                    </h3>

                                    <div className="space-y-4">
                                        {analysisResult.pubmed_articles && analysisResult.pubmed_articles.length > 0 ? (
                                            analysisResult.pubmed_articles.map((article: any, i: number) => (
                                                <a
                                                    key={i}
                                                    href={`https://pubmed.ncbi.nlm.nih.gov/${article.id}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="block p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/5 hover:border-cyan-500/30 transition-all group"
                                                >
                                                    <div className="flex justify-between items-start gap-4">
                                                        <div>
                                                            <p className="text-xs font-bold text-amber-400 mb-1 flex items-center gap-1">
                                                                <Microscope className="w-3 h-3" /> PubMed Entry
                                                            </p>
                                                            <h4 className="text-sm font-semibold text-white group-hover:text-cyan-400 transition-colors">{article.title}</h4>
                                                            <p className="text-[10px] text-gray-500 mt-2">{article.journal} • {article.year}</p>
                                                        </div>
                                                        <ChevronRight className="w-4 h-4 text-gray-700 group-hover:text-cyan-400" />
                                                    </div>
                                                </a>
                                            ))
                                        ) : (
                                            <p className="text-center py-8 text-gray-600 text-sm italic">No relevant literature found for this case.</p>
                                        )}
                                    </div>
                                </Card>

                                {/* Action Buttons */}
                                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                    <Button
                                        variant="primary"
                                        size="lg"
                                        onClick={() => router.push('/consultation')}
                                        className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold"
                                    >
                                        <MessageSquare className="w-5 h-5" />
                                        Consult Specialists
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="lg"
                                        onClick={() => {
                                            setSelectedFile(null);
                                            setAnalysisResult(null);
                                        }}
                                        className="flex-1 py-4 rounded-2xl border-white/10 text-gray-300 font-bold"
                                    >
                                        Analyze Another
                                    </Button>
                                </div>

                                {/* Full Analysis Text */}
                                <Card id="full-analysis" className="mt-6 border-white/5">
                                    <h3 className="text-sm font-bold text-gray-500 mb-4 uppercase tracking-widest">Full Detailed Observations</h3>
                                    <div className="prose prose-invert max-w-none">
                                        <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-wrap font-mono">
                                            {analysisResult.analysis}
                                        </p>
                                    </div>
                                </Card>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
