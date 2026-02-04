'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Sparkles } from 'lucide-react';
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
            // Handle different error formats
            if (err.response?.data?.detail) {
                if (typeof err.response.data.detail === 'string') {
                    setError(err.response.data.detail);
                } else if (Array.isArray(err.response.data.detail)) {
                    const errorMessages = err.response.data.detail
                        .map((e: any) => `${e.loc.join('.')}: ${e.msg}`)
                        .join(', ');
                    setError(errorMessages);
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

    return (
        <div className="min-h-screen w-full">
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
                            <h1 className="text-2xl font-bold gradient-text">Image Analysis</h1>
                            <p className="text-sm text-text-secondary mt-1">
                                AI-Powered Medical Image Analysis
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Upload Section */}
                    <div className="fade-in">
                        <h2 className="text-xl font-bold text-text-primary mb-4">
                            Upload Medical Image
                        </h2>
                        <FileUpload onFileSelect={handleFileSelect} />

                        {selectedFile && !analysisResult && (
                            <div className="mt-6">
                                <Button
                                    variant="primary"
                                    size="lg"
                                    className="w-full flex items-center justify-center gap-2"
                                    onClick={handleAnalyze}
                                    isLoading={uploading || analyzing}
                                >
                                    <Sparkles className="w-5 h-5" />
                                    {uploading ? 'Uploading...' : analyzing ? 'Analyzing...' : 'Analyze Image'}
                                </Button>
                            </div>
                        )}

                        {error && (
                            <div className="mt-4 p-4 bg-error/10 border border-error/20 rounded-lg">
                                <p className="text-sm text-error">{error}</p>
                            </div>
                        )}
                    </div>

                    {/* Results Section */}
                    <div className="slide-in-right">
                        <h2 className="text-xl font-bold text-text-primary mb-4">
                            Analysis Results
                        </h2>

                        {!analysisResult && !analyzing && (
                            <Card className="h-full flex items-center justify-center min-h-[400px]">
                                <div className="text-center">
                                    <Sparkles className="w-16 h-16 text-text-muted mx-auto mb-4" />
                                    <p className="text-text-secondary">
                                        Upload an image to see AI analysis results
                                    </p>
                                </div>
                            </Card>
                        )}

                        {analyzing && (
                            <Card className="h-full flex items-center justify-center min-h-[400px]">
                                <div className="text-center">
                                    <LoadingSpinner size="lg" />
                                    <p className="text-text-secondary mt-4">
                                        Analyzing your medical image...
                                    </p>
                                </div>
                            </Card>
                        )}

                        {analysisResult && (
                            <div className="space-y-6">
                                <Card>
                                    <h3 className="text-lg font-semibold text-text-primary mb-3">
                                        AI Analysis
                                    </h3>
                                    <p className="text-text-secondary text-sm leading-relaxed whitespace-pre-wrap">
                                        {analysisResult.analysis}
                                    </p>
                                </Card>

                                {analysisResult.findings && analysisResult.findings.length > 0 && (
                                    <Card>
                                        <h3 className="text-lg font-semibold text-text-primary mb-3">
                                            Key Findings
                                        </h3>
                                        <ul className="space-y-2">
                                            {analysisResult.findings.map((finding: string, index: number) => (
                                                <li key={index} className="flex items-start gap-2">
                                                    <span className="text-primary mt-1">•</span>
                                                    <span className="text-text-secondary text-sm">{finding}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </Card>
                                )}

                                {analysisResult.keywords && analysisResult.keywords.length > 0 && (
                                    <Card>
                                        <h3 className="text-lg font-semibold text-text-primary mb-3">
                                            Keywords
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {analysisResult.keywords.map((keyword: string, index: number) => (
                                                <span
                                                    key={index}
                                                    className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm"
                                                >
                                                    {keyword}
                                                </span>
                                            ))}
                                        </div>
                                    </Card>
                                )}

                                <div className="flex gap-4">
                                    <Button
                                        variant="primary"
                                        onClick={() => router.push('/consultation')}
                                        className="flex-1"
                                    >
                                        Start Consultation
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setSelectedFile(null);
                                            setAnalysisResult(null);
                                        }}
                                        className="flex-1"
                                    >
                                        Analyze Another
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
