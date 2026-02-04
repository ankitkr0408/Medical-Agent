'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send, MessageSquare, Users, Sparkles } from 'lucide-react';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import LoadingSpinner from '@/components/LoadingSpinner';
import { consultationAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

interface Message {
    sender: string;
    message: string;
    timestamp: string;
    specialist_type?: string;
}

interface Consultation {
    id: string;
    description: string;
    case_description: string;
    creator_name: string;
    messages: Message[];
    consultation_stage: string;
    created_at: string;
}

export default function ConsultationPage() {
    const router = useRouter();
    const user = useAuthStore((state) => state.user);
    const [consultations, setConsultations] = useState<Consultation[]>([]);
    const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [newCaseDescription, setNewCaseDescription] = useState('');
    const [newMessage, setNewMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        loadConsultations();
    }, []);

    const loadConsultations = async () => {
        try {
            const response = await consultationAPI.getRooms();
            setConsultations(response.rooms || []);
        } catch (err: any) {
            console.error('Error loading consultations:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateCase = async () => {
        if (!newCaseDescription.trim()) {
            setError('Please enter a case description');
            return;
        }

        setIsProcessing(true);
        setError('');

        try {
            const response = await consultationAPI.createConsultation({
                case_description: newCaseDescription,
                creator_name: user?.full_name || 'Doctor',
            });

            await loadConsultations();
            setNewCaseDescription('');
            setIsCreating(false);

            // Select the newly created consultation
            const newConsultation = await consultationAPI.getConsultation(response.id);
            setSelectedConsultation(newConsultation);
        } catch (err: any) {
            if (err.response?.data?.detail) {
                if (typeof err.response.data.detail === 'string') {
                    setError(err.response.data.detail);
                } else {
                    setError('Failed to create consultation');
                }
            } else {
                setError(err.message || 'Failed to create consultation');
            }
        } finally {
            setIsProcessing(false);
        }
    };

    const handleStartConsultation = async () => {
        if (!selectedConsultation) return;

        setIsProcessing(true);
        try {
            await consultationAPI.autoCompleteConsultation(selectedConsultation.id);

            // Reload the consultation to see the specialist responses
            const updated = await consultationAPI.getConsultation(selectedConsultation.id);
            setSelectedConsultation(updated);
            await loadConsultations();
        } catch (err: any) {
            setError('Failed to start consultation');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSendMessage = async () => {
        if (!selectedConsultation || !newMessage.trim()) return;

        setIsProcessing(true);
        try {
            await consultationAPI.sendMessage(selectedConsultation.id, {
                message: newMessage,
                user_name: user?.full_name || 'Doctor',
            });

            // Reload the consultation
            const updated = await consultationAPI.getConsultation(selectedConsultation.id);
            setSelectedConsultation(updated);
            setNewMessage('');
        } catch (err: any) {
            setError('Failed to send message');
        } finally {
            setIsProcessing(false);
        }
    };

    const getSpecialistIcon = (stage: string) => {
        const icons: { [key: string]: string } = {
            radiologist: '🔬',
            cardiologist: '❤️',
            neurologist: '🧠',
            orthopedist: '🦴',
            summary: '📋',
        };
        return icons[stage] || '👨‍⚕️';
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
                                <h1 className="text-2xl font-bold gradient-text">Multi-Doctor Consultation</h1>
                                <p className="text-sm text-text-secondary mt-1">
                                    Get expert opinions from multiple specialists
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => setIsCreating(!isCreating)}
                            className="flex items-center gap-2"
                        >
                            <MessageSquare className="w-4 h-4" />
                            New Case
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
                {/* Create New Case Form */}
                {isCreating && (
                    <Card className="mb-6 fade-in">
                        <h3 className="text-lg font-semibold text-text-primary mb-4">Create New Case</h3>
                        <textarea
                            className="w-full px-4 py-3 bg-bg-tertiary text-text-primary border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary placeholder-text-muted transition-smooth mb-4"
                            rows={4}
                            placeholder="Describe the medical case, symptoms, and any relevant information..."
                            value={newCaseDescription}
                            onChange={(e) => setNewCaseDescription(e.target.value)}
                        />
                        {error && (
                            <div className="mb-4 p-3 bg-error/10 border border-error/20 rounded-lg">
                                <p className="text-sm text-error">{error}</p>
                            </div>
                        )}
                        <div className="flex gap-4">
                            <Button
                                variant="primary"
                                onClick={handleCreateCase}
                                isLoading={isProcessing}
                                className="flex-1"
                            >
                                Create Case
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsCreating(false);
                                    setNewCaseDescription('');
                                    setError('');
                                }}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                        </div>
                    </Card>
                )}

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Consultations List */}
                    <div className="lg:col-span-1">
                        <h2 className="text-xl font-bold text-text-primary mb-4">Your Cases</h2>

                        {isLoading ? (
                            <Card className="flex items-center justify-center py-12">
                                <LoadingSpinner />
                            </Card>
                        ) : consultations.length === 0 ? (
                            <Card className="text-center py-12">
                                <MessageSquare className="w-16 h-16 text-text-muted mx-auto mb-4" />
                                <p className="text-text-secondary">No consultations yet</p>
                                <p className="text-sm text-text-muted mt-2">Create a new case to get started</p>
                            </Card>
                        ) : (
                            <div className="space-y-3">
                                {consultations.map((consultation) => (
                                    <Card
                                        key={consultation.id}
                                        hover
                                        onClick={() => {
                                            setSelectedConsultation(consultation);
                                            setError('');
                                        }}
                                        className={`cursor-pointer ${selectedConsultation?.id === consultation.id
                                            ? 'border-2 border-primary'
                                            : ''
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 rounded-lg bg-primary/20">
                                                <Users className="w-5 h-5 text-primary" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-text-primary truncate">
                                                    {consultation.case_description.substring(0, 50)}...
                                                </p>
                                                <p className="text-xs text-text-muted mt-1">
                                                    {consultation.messages.length} messages
                                                </p>
                                                <span className="inline-block mt-2 px-2 py-1 text-xs rounded-full bg-primary/20 text-primary">
                                                    {consultation.consultation_stage}
                                                </span>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Consultation Details */}
                    <div className="lg:col-span-2">
                        {!selectedConsultation ? (
                            <Card className="flex items-center justify-center min-h-[500px]">
                                <div className="text-center">
                                    <MessageSquare className="w-16 h-16 text-text-muted mx-auto mb-4" />
                                    <p className="text-text-secondary">Select a consultation to view details</p>
                                </div>
                            </Card>
                        ) : (
                            <div className="space-y-6">
                                {/* Case Description */}
                                <Card>
                                    <h3 className="text-lg font-semibold text-text-primary mb-3">Case Description</h3>
                                    <p className="text-text-secondary text-sm">{selectedConsultation.case_description}</p>

                                    {selectedConsultation.consultation_stage === 'initial' && (
                                        <Button
                                            variant="primary"
                                            onClick={handleStartConsultation}
                                            isLoading={isProcessing}
                                            className="mt-4 flex items-center gap-2"
                                        >
                                            <Sparkles className="w-4 h-4" />
                                            Start Multi-Doctor Consultation
                                        </Button>
                                    )}
                                </Card>

                                {/* Messages */}
                                <Card>
                                    <h3 className="text-lg font-semibold text-text-primary mb-4">Discussion</h3>
                                    <div className="space-y-4 max-h-[400px] overflow-y-auto mb-4">
                                        {selectedConsultation.messages.map((msg, index) => (
                                            <div
                                                key={index}
                                                className={`p-4 rounded-lg ${msg.specialist_type
                                                    ? 'bg-primary/10 border border-primary/20'
                                                    : 'bg-bg-tertiary'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-lg">
                                                        {msg.specialist_type ? getSpecialistIcon(msg.specialist_type) : '👤'}
                                                    </span>
                                                    <span className="font-semibold text-text-primary text-sm">
                                                        {msg.sender}
                                                    </span>
                                                    {msg.specialist_type && (
                                                        <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary">
                                                            {msg.specialist_type}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-text-secondary whitespace-pre-wrap">{msg.message}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Message Input */}
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                            placeholder="Ask a follow-up question..."
                                            className="flex-1 px-4 py-3 bg-bg-tertiary text-text-primary border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary placeholder-text-muted transition-smooth"
                                        />
                                        <Button
                                            variant="primary"
                                            onClick={handleSendMessage}
                                            disabled={!newMessage.trim() || isProcessing}
                                        >
                                            <Send className="w-4 h-4" />
                                        </Button>
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
