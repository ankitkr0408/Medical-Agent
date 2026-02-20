'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, HelpCircle, Send, Plus, Search,
    Bot, MessageSquare, BookOpen, Clock, AlertCircle,
    ChevronRight, Microscope, ShieldCheck, Sparkles
} from 'lucide-react';
import Card from '@/components/Card';
import Button from '@/components/Button';
import LoadingSpinner from '@/components/LoadingSpinner';
import { qaAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

interface Message {
    sender: string;
    message: string;
    timestamp: string;
}

interface QASession {
    id: string;
    title: string;
    messages: Message[];
    created_at: string;
}

export default function QAPage() {
    const router = useRouter();
    const user = useAuthStore((state) => state.user);
    const [sessions, setSessions] = useState<QASession[]>([]);
    const [selectedSession, setSelectedSession] = useState<QASession | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [newSessionTitle, setNewSessionTitle] = useState('');
    const [newMessage, setNewMessage] = useState('');
    const [error, setError] = useState('');

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadSessions();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [selectedSession?.messages]);

    const loadSessions = async () => {
        try {
            const response = await qaAPI.getHistory();
            setSessions(response.sessions || []);
        } catch (err: any) {
            console.error('Error loading QA sessions:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateSession = async () => {
        if (!newSessionTitle.trim()) {
            setError('Please enter a session title');
            return;
        }

        setIsProcessing(true);
        setError('');

        try {
            const response = await qaAPI.createSession({
                title: newSessionTitle,
                user_name: user?.full_name || 'Patient',
            });

            await loadSessions();
            setNewSessionTitle('');
            setIsCreating(false);

            const newSession = await qaAPI.getSession(response.id);
            setSelectedSession(newSession);
        } catch (err: any) {
            setError(err.message || 'Failed to create Q&A session');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSendMessage = async () => {
        if (!selectedSession || !newMessage.trim()) return;

        const originalMessage = newMessage;
        setNewMessage('');
        setIsProcessing(true);

        try {
            await qaAPI.askQuestion(selectedSession.id, {
                question: originalMessage,
                user_name: user?.full_name || 'Patient',
            });

            const updated = await qaAPI.getSession(selectedSession.id);
            setSelectedSession(updated);
        } catch (err: any) {
            setNewMessage(originalMessage);
            setError('Failed to process medical question.');
        } finally {
            setIsProcessing(false);
        }
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
                                <BookOpen className="w-5 h-5 text-purple-400" />
                                Medical Report Intelligence
                            </h1>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">RAG-Powered Medical Q&A System</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => setIsCreating(true)}
                            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600"
                        >
                            <Plus className="w-4 h-4" /> New Session
                        </Button>
                    </div>
                </div>
            </header>

            <main className="flex-1 flex overflow-hidden relative z-10">
                {/* Sidebar - Session List */}
                <div className="w-80 lg:w-96 border-r border-white/5 bg-[#030712]/40 backdrop-blur-md flex flex-col">
                    <div className="p-6 border-b border-white/5">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                            <input
                                type="text"
                                placeholder="Search sessions..."
                                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-300 focus:border-purple-500/50 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {isLoading ? (
                            <div className="py-12 flex justify-center"><LoadingSpinner /></div>
                        ) : sessions.length === 0 ? (
                            <div className="py-12 text-center px-6">
                                <HelpCircle className="w-12 h-12 text-gray-800 mx-auto mb-4" />
                                <p className="text-sm text-gray-500 italic">No Q&A history found.</p>
                            </div>
                        ) : (
                            sessions.map((s) => (
                                <div
                                    key={s.id}
                                    onClick={() => {
                                        setSelectedSession(s);
                                        setError('');
                                    }}
                                    className={`p-4 rounded-2xl cursor-pointer transition-all border ${selectedSession?.id === s.id
                                            ? 'bg-purple-600/10 border-purple-500/30'
                                            : 'bg-transparent border-transparent hover:bg-white/5 hover:border-white/10'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="text-[9px] font-bold text-gray-500 uppercase">{new Date(s.created_at).toLocaleDateString()}</p>
                                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                                    </div>
                                    <h4 className="text-sm font-bold text-white line-clamp-2">
                                        {s.title}
                                    </h4>
                                    <p className="text-[10px] text-gray-500 mt-2 font-medium">{s.messages.length} interactions</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Main Q&A Area */}
                <div className="flex-1 flex flex-col bg-transparent">
                    {!selectedSession ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                            <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-8 relative">
                                <Microscope className="w-10 h-10 text-gray-700" />
                                <div className="absolute inset-0 rounded-full border border-purple-500/20 animate-pulse" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">Diagnostic Intelligence</h3>
                            <p className="text-gray-500 max-w-sm mx-auto mb-8 text-sm">
                                Open a session to ask complex questions about your medical reports. Our AI uses RAG (Retrieval-Augmented Generation) to provide context-aware answers.
                            </p>
                            <Button variant="outline" onClick={() => setIsCreating(true)} className="rounded-2xl border-white/10 px-8 py-3">
                                Start Session
                            </Button>
                        </div>
                    ) : (
                        <>
                            {/* Chat Header */}
                            <div className="p-6 border-b border-white/5 bg-[#030712]/20 backdrop-blur-sm flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                                        <HelpCircle className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white">{selectedSession.title}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                            <p className="text-xs text-gray-500">Knowledge Base Connected</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Messages List */}
                            <div className="flex-1 overflow-y-auto p-8 space-y-8">
                                {selectedSession.messages.length === 0 && (
                                    <div className="max-w-xl mx-auto py-12 text-center text-gray-500">
                                        <Sparkles className="w-8 h-8 mx-auto mb-4 text-purple-400 opacity-50" />
                                        <p className="text-sm italic font-medium">Ready for your medical inquiries. Ask about findings, terminology, or next steps.</p>
                                    </div>
                                )}

                                {selectedSession.messages.map((msg, idx) => {
                                    const isBot = msg.sender === 'AI' || msg.sender === 'System';

                                    return (
                                        <div key={idx} className={`flex gap-6 max-w-4xl mx-auto ${!isBot ? 'flex-row-reverse' : ''}`}>
                                            <div className={`w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center text-xl shadow-xl ${!isBot ? 'bg-gradient-to-br from-purple-500 to-indigo-600' : 'bg-white/5 border border-white/10'
                                                }`}>
                                                {!isBot ? '👤' : <Bot className="w-6 h-6 text-purple-400" />}
                                            </div>
                                            <div className={`flex-1 space-y-2 ${!isBot ? 'text-right' : ''}`}>
                                                <div className={`flex items-center gap-3 ${!isBot ? 'flex-row-reverse' : ''}`}>
                                                    <span className="text-sm font-bold text-white">{msg.sender}</span>
                                                    <span className="text-[10px] text-gray-600 font-medium">Verified Source</span>
                                                </div>
                                                <div className={`p-6 rounded-3xl text-sm leading-relaxed shadow-lg ${!isBot ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white/[0.04] text-gray-300 border border-white/5 rounded-tl-none'
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
                                        onKeyDown={(e) => e.key === 'Enter' && !isProcessing && handleSendMessage()}
                                        placeholder="Ask a medical question about your data..."
                                        disabled={isProcessing}
                                        className="w-full px-6 py-4 pr-16 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-purple-500/50 transition-all placeholder-gray-600 disabled:opacity-50"
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={!newMessage.trim() || isProcessing}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-purple-600 text-white hover:bg-purple-500 transition-colors shadow-lg shadow-purple-500/20 disabled:opacity-50"
                                    >
                                        {isProcessing ? <LoadingSpinner size="sm" /> : <Send className="w-5 h-5" />}
                                    </button>
                                </div>
                                <p className="text-center text-[9px] text-gray-600 mt-4 uppercase tracking-widest font-bold">Scientific RAG Engine powered by OpenAI Embeddings</p>
                            </div>
                        </>
                    )}
                </div>
            </main>

            {/* Modal for New Session */}
            {isCreating && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#030712]/80 backdrop-blur-sm" onClick={() => setIsCreating(false)} />
                    <Card className="relative w-full max-w-lg p-8 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-2xl font-bold text-white">Initialize Q&A</h3>
                            <button onClick={() => setIsCreating(false)} className="text-gray-500 hover:text-white"><AlertCircle className="rotate-45" /></button>
                        </div>
                        <div className="space-y-6">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 block">Inquiry Focus</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-purple-500/30 transition-all text-sm"
                                    placeholder="e.g., Chest X-Ray 2025 Follow-up"
                                    value={newSessionTitle}
                                    onChange={(e) => setNewSessionTitle(e.target.value)}
                                />
                            </div>

                            {error && (
                                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                                    <p className="text-sm text-red-500">{error}</p>
                                </div>
                            )}

                            <div className="flex gap-4">
                                <Button variant="primary" size="lg" className="flex-1 py-4 font-bold bg-purple-600" onClick={handleCreateSession} isLoading={isProcessing}>Start Inquiry</Button>
                                <Button variant="outline" size="lg" className="flex-1 py-4 font-bold border-white/10 text-gray-500" onClick={() => setIsCreating(false)}>Dismiss</Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
