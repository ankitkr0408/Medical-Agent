'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, Send, MessageSquare, Users, Sparkles,
    ChevronRight, CheckCircle2, AlertCircle, Bot,
    Clock, Plus, Filter, Search, MoreVertical
} from 'lucide-react';
import Card from '@/components/Card';
import Button from '@/components/Button';
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

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadConsultations();
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [selectedConsultation?.messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

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
            setError('Please describe your case first');
            return;
        }

        setIsProcessing(true);
        setError('');

        try {
            const response = await consultationAPI.createConsultation({
                case_description: newCaseDescription,
                creator_name: user?.full_name || 'Patient',
            });

            await loadConsultations();
            setNewCaseDescription('');
            setIsCreating(false);

            const newConsultation = await consultationAPI.getConsultation(response.id);
            setSelectedConsultation(newConsultation);
        } catch (err: any) {
            setError(err.message || 'Failed to initialize consultation unit.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleStartConsultation = async () => {
        if (!selectedConsultation) return;

        setIsProcessing(true);
        try {
            await consultationAPI.autoCompleteConsultation(selectedConsultation.id);
            const updated = await consultationAPI.getConsultation(selectedConsultation.id);
            setSelectedConsultation(updated);
            await loadConsultations();
        } catch (err: any) {
            setError('Autonomous specialist panel failed to initialize.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSendMessage = async () => {
        if (!selectedConsultation || !newMessage.trim()) return;

        const originalMessage = newMessage;
        setNewMessage(''); // optimistic

        try {
            await consultationAPI.sendMessage(selectedConsultation.id, {
                message: originalMessage,
                user_name: user?.full_name || 'Patient',
            });

            const updated = await consultationAPI.getConsultation(selectedConsultation.id);
            setSelectedConsultation(updated);
        } catch (err: any) {
            setNewMessage(originalMessage);
            setError('Communication array error. Please try again.');
        }
    };

    const getSpecialistAvatar = (type: string) => {
        const styles: { [key: string]: { emoji: string, color: string } } = {
            radiologist: { emoji: '🔬', color: 'cyan' },
            cardiologist: { emoji: '❤️', color: 'red' },
            neurologist: { emoji: '🧠', color: 'purple' },
            pulmonologist: { emoji: '🫁', color: 'blue' },
            summary: { emoji: '📋', color: 'emerald' },
        };
        return styles[type?.toLowerCase()] || { emoji: '👨‍⚕️', color: 'gray' };
    };

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
                                <Users className="w-5 h-5 text-blue-400" />
                                Specialist Consultation Unit
                            </h1>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Secure Medical Discussion Channel</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex items-center px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold gap-2">
                            <Clock className="w-3 h-3" />
                            Active Signal
                        </div>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => setIsCreating(true)}
                            className="flex items-center gap-2 rounded-xl"
                        >
                            <Plus className="w-4 h-4" /> New Case
                        </Button>
                    </div>
                </div>
            </header>

            <main className="flex-1 flex overflow-hidden relative z-10">
                {/* Sidebar - Case List */}
                <div className="w-80 lg:w-96 border-r border-white/5 bg-[#030712]/40 backdrop-blur-md flex flex-col">
                    <div className="p-6 border-b border-white/5">
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                            <input
                                type="text"
                                placeholder="Search cases..."
                                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-300 focus:border-blue-500/50 outline-none transition-all"
                            />
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                            <span>Open Consultations</span>
                            <Filter className="w-3 h-3 cursor-pointer hover:text-white" />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {isLoading ? (
                            <div className="py-12 flex justify-center"><LoadingSpinner /></div>
                        ) : consultations.length === 0 ? (
                            <div className="py-12 text-center px-6">
                                <MessageSquare className="w-12 h-12 text-gray-800 mx-auto mb-4" />
                                <p className="text-sm text-gray-500 italic">No diagnostic cases initialized yet.</p>
                            </div>
                        ) : (
                            consultations.map((c) => (
                                <div
                                    key={c.id}
                                    onClick={() => {
                                        setSelectedConsultation(c);
                                        setError('');
                                    }}
                                    className={`p-4 rounded-2xl cursor-pointer transition-all border ${selectedConsultation?.id === c.id
                                            ? 'bg-blue-600/10 border-blue-500/30'
                                            : 'bg-transparent border-transparent hover:bg-white/5 hover:border-white/10'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="text-xs font-bold text-gray-500">{new Date(c.created_at).toLocaleDateString()}</p>
                                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase ${c.consultation_stage === 'summary' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
                                            }`}>
                                            {c.consultation_stage}
                                        </span>
                                    </div>
                                    <h4 className="text-sm font-bold text-white line-clamp-2 group-hover:text-blue-400 transition-colors">
                                        {c.case_description}
                                    </h4>
                                    <div className="mt-3 flex items-center justify-between">
                                        <div className="flex -space-x-2">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="w-6 h-6 rounded-full border-2 border-[#0a0f1e] bg-gray-800 flex items-center justify-center text-[10px]">
                                                    {['🔬', '🧠', '❤️'][i - 1]}
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-[10px] text-gray-500 font-medium">{c.messages.length} notes</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Main Chat Area */}
                <div className="flex-1 flex flex-col bg-transparent">
                    {!selectedConsultation ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                            <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-8 relative">
                                <Users className="w-10 h-10 text-gray-700" />
                                <div className="absolute inset-0 rounded-full border border-blue-500/20 animate-ping opacity-20" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">Initialize Consultation</h3>
                            <p className="text-gray-500 max-w-sm mx-auto mb-8">
                                Select an existing diagnostic case or create a new one to begin the autonomous specialist panel discussion.
                            </p>
                            <Button variant="outline" onClick={() => setIsCreating(true)} className="rounded-2xl border-white/10">
                                Create Diagnostic Case
                            </Button>
                        </div>
                    ) : (
                        <>
                            {/* Chat Header */}
                            <div className="p-6 border-b border-white/5 bg-[#030712]/20 backdrop-blur-sm flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                        <Bot className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white line-clamp-1">{selectedConsultation.case_description}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                            <p className="text-xs text-gray-500">Autonomous Specialist Panel Active</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="sm" className="p-2"><MoreVertical className="w-5 h-5 text-gray-500" /></Button>
                                </div>
                            </div>

                            {/* Messages List */}
                            <div className="flex-1 overflow-y-auto p-8 space-y-8 scroll-smooth">
                                {/* Case Initial Description */}
                                <div className="max-w-3xl mx-auto mb-12">
                                    <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 relative">
                                        <div className="absolute -top-3 left-6 px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[9px] font-bold uppercase text-gray-500">Original Case Log</div>
                                        <p className="text-gray-300 text-sm leading-relaxed">{selectedConsultation.case_description}</p>

                                        {selectedConsultation.consultation_stage === 'initial' && (
                                            <div className="mt-6 pt-6 border-t border-white/5 text-center">
                                                <Button
                                                    variant="primary"
                                                    onClick={handleStartConsultation}
                                                    isLoading={isProcessing}
                                                    className="w-full sm:w-auto px-10 py-4 rounded-2xl flex items-center gap-2 mx-auto"
                                                >
                                                    <Sparkles className="w-5 h-5" />
                                                    Summon Board of Specialists
                                                </Button>
                                                <p className="text-[10px] text-gray-600 mt-4 uppercase tracking-tighter">Initializes Radiologist, Cardiologist, and Neurologist AI units</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {selectedConsultation.messages.map((msg, idx) => {
                                    const spec = getSpecialistAvatar(msg.specialist_type || '');
                                    const isUser = !msg.specialist_type && msg.sender !== 'System';

                                    return (
                                        <div key={idx} className={`flex gap-6 max-w-4xl mx-auto ${isUser ? 'flex-row-reverse' : ''}`}>
                                            <div className={`w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center text-2xl shadow-xl ${isUser ? 'bg-gradient-to-br from-cyan-500 to-blue-600' : 'bg-white/5 border border-white/10'
                                                }`}>
                                                {isUser ? '👤' : spec.emoji}
                                            </div>
                                            <div className={`flex-1 space-y-2 ${isUser ? 'text-right' : ''}`}>
                                                <div className={`flex items-center gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
                                                    <span className="text-sm font-bold text-white">{msg.sender}</span>
                                                    {!isUser && msg.specialist_type && (
                                                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase bg-${spec.color}-500/10 text-${spec.color}-400 border border-${spec.color}-500/20`}>
                                                            {msg.specialist_type}
                                                        </span>
                                                    )}
                                                    <span className="text-[10px] text-gray-600 font-medium">10:42 AM</span>
                                                </div>
                                                <div className={`p-6 rounded-3xl text-sm leading-relaxed shadow-lg ${isUser ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white/[0.04] text-gray-300 border border-white/5 rounded-tl-none'
                                                    }`}>
                                                    <p className="whitespace-pre-wrap">{msg.message}</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <div className="p-6 border-t border-white/5 bg-[#030712]/40 backdrop-blur-xl">
                                <div className="max-w-4xl mx-auto relative">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                        placeholder="Enter secure message for the medical board..."
                                        className="w-full px-6 py-4 pr-16 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-blue-500/50 transition-all placeholder-gray-600"
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-blue-600 text-white hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20"
                                    >
                                        <Send className="w-5 h-5" />
                                    </button>
                                </div>
                                <p className="text-center text-[9px] text-gray-600 mt-4 uppercase tracking-widest font-bold">End-to-end encrypted medical observation channel</p>
                            </div>
                        </>
                    )}
                </div>
            </main>

            {/* Modal for New Case */}
            {isCreating && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#030712]/80 backdrop-blur-sm" onClick={() => setIsCreating(false)} />
                    <Card className="relative w-full max-w-lg p-8 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-2xl font-bold text-white">New Diagnostic Case</h3>
                            <button onClick={() => setIsCreating(false)} className="text-gray-500 hover:text-white"><AlertCircle className="rotate-45" /></button>
                        </div>
                        <div className="space-y-6">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 block">Case Parameters & Symptoms</label>
                                <textarea
                                    className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-blue-500/30 transition-all min-h-[160px] text-sm"
                                    placeholder="Briefly describe the clinical observations, medical history, or specific questions for the specialist board..."
                                    value={newCaseDescription}
                                    onChange={(e) => setNewCaseDescription(e.target.value)}
                                />
                            </div>

                            {error && (
                                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                                    <p className="text-sm text-red-500">{error}</p>
                                </div>
                            )}

                            <div className="flex gap-4">
                                <Button variant="primary" size="lg" className="flex-1 py-4 font-bold" onClick={handleCreateCase} isLoading={isProcessing}>Initialize Unit</Button>
                                <Button variant="outline" size="lg" className="flex-1 py-4 font-bold border-white/10 text-gray-500" onClick={() => setIsCreating(false)}>Cancel</Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
