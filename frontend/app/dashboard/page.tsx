'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, FileImage, MessageSquare, HelpCircle, LogOut, User, Clock } from 'lucide-react';
import Card from '@/components/Card';
import Button from '@/components/Button';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useAuthStore } from '@/lib/store';
import { authAPI, analysisAPI, consultationAPI } from '@/lib/api';

export default function DashboardPage() {
    const router = useRouter();
    const { user, isAuthenticated, clearAuth } = useAuthStore();
    const [isLoading, setIsLoading] = useState(true);
    const [recentAnalyses, setRecentAnalyses] = useState<any[]>([]);
    const [recentConsultations, setRecentConsultations] = useState<any[]>([]);
    const [loadingActivity, setLoadingActivity] = useState(true);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/auth/login');
        } else {
            setIsLoading(false);
            loadRecentActivity();
        }
    }, [isAuthenticated, router]);

    const loadRecentActivity = async () => {
        try {
            // Fetch recent analyses
            const analysesResponse = await analysisAPI.getHistory(5);
            setRecentAnalyses(analysesResponse.analyses || []);

            // Fetch recent consultations
            const consultationsResponse = await consultationAPI.getRooms();
            setRecentConsultations((consultationsResponse.rooms || []).slice(0, 5));
        } catch (error) {
            console.error('Error loading recent activity:', error);
        } finally {
            setLoadingActivity(false);
        }
    };

    const handleLogout = async () => {
        try {
            await authAPI.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            clearAuth();
            router.push('/auth/login');
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full relative">
            <div className="animated-bg"></div>

            {/* Header */}
            <header className="glass-card mb-8 relative z-10 w-full">
                <div className="w-full px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold gradient-text">Medical Agent Dashboard</h1>
                            <p className="text-sm text-text-secondary mt-1">
                                Welcome back, {user?.full_name || user?.email}
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-text-secondary">
                                <User className="w-4 h-4" />
                                <span className="text-sm hidden sm:block">{user?.email}</span>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleLogout}
                                className="flex items-center gap-2"
                            >
                                <LogOut className="w-4 h-4" />
                                Logout
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="w-full px-8 pb-12 relative z-10">
                {/* Quick Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <Card hover onClick={() => router.push('/analysis')} className="cursor-pointer">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-primary/20">
                                <FileImage className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-text-primary">Image Analysis</p>
                                <p className="text-xs text-text-muted mt-1">Upload & analyze</p>
                            </div>
                        </div>
                    </Card>

                    <Card hover onClick={() => router.push('/consultation')} className="cursor-pointer">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-accent/20">
                                <MessageSquare className="w-6 h-6 text-accent" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-text-primary">Consultation</p>
                                <p className="text-xs text-text-muted mt-1">Multi-doctor chat</p>
                            </div>
                        </div>
                    </Card>

                    <Card hover onClick={() => router.push('/qa')} className="cursor-pointer">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-info/20">
                                <HelpCircle className="w-6 h-6 text-info" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-text-primary">Q&A Session</p>
                                <p className="text-xs text-text-muted mt-1">Ask questions</p>
                            </div>
                        </div>
                    </Card>

                    <Card hover onClick={() => router.push('/reports')} className="cursor-pointer">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-success/20">
                                <Activity className="w-6 h-6 text-success" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-text-primary">Reports</p>
                                <p className="text-xs text-text-muted mt-1">View & download</p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Recent Activity */}
                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Recent Analyses */}
                    <Card>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-text-primary">Recent Analyses</h3>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push('/analysis')}
                            >
                                View All
                            </Button>
                        </div>

                        {loadingActivity ? (
                            <div className="flex items-center justify-center py-12">
                                <LoadingSpinner />
                            </div>
                        ) : recentAnalyses.length === 0 ? (
                            <div className="text-center py-12">
                                <FileImage className="w-16 h-16 text-text-muted mx-auto mb-4 opacity-50" />
                                <p className="text-text-secondary">No analyses yet</p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="mt-4"
                                    onClick={() => router.push('/analysis')}
                                >
                                    Start Analysis
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {recentAnalyses.map((analysis, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-3 rounded-lg hover:bg-bg-tertiary transition-colors cursor-pointer"
                                        onClick={() => router.push('/analysis')}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-primary/20">
                                                <FileImage className="w-4 h-4 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-text-primary">
                                                    {analysis.filename || 'Medical Image'}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Clock className="w-3 h-3 text-text-muted" />
                                                    <p className="text-xs text-text-muted">
                                                        {new Date(analysis.date).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <span className="text-xs px-2 py-1 rounded-full bg-success/20 text-success">
                                            Completed
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>

                    {/* Recent Consultations */}
                    <Card>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-text-primary">Recent Consultations</h3>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push('/consultation')}
                            >
                                View All
                            </Button>
                        </div>

                        {loadingActivity ? (
                            <div className="flex items-center justify-center py-12">
                                <LoadingSpinner />
                            </div>
                        ) : recentConsultations.length === 0 ? (
                            <div className="text-center py-12">
                                <MessageSquare className="w-16 h-16 text-text-muted mx-auto mb-4 opacity-50" />
                                <p className="text-text-secondary">No consultations yet</p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="mt-4"
                                    onClick={() => router.push('/consultation')}
                                >
                                    Start Consultation
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {recentConsultations.map((consultation, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-3 rounded-lg hover:bg-bg-tertiary transition-colors cursor-pointer"
                                        onClick={() => router.push('/consultation')}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-accent/20">
                                                <MessageSquare className="w-4 h-4 text-accent" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-text-primary">
                                                    {consultation.description || 'Medical Consultation'}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Clock className="w-3 h-3 text-text-muted" />
                                                    <p className="text-xs text-text-muted">
                                                        {new Date(consultation.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <span className="text-xs px-2 py-1 rounded-full bg-info/20 text-info">
                                            Active
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>
            </main>
        </div>
    );
}
