'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send, MessageSquare, Plus, Sparkles } from 'lucide-react';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import LoadingSpinner from '@/components/LoadingSpinner';
import { qaAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

interface QAMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}

interface QASession {
    id: string;
    room_name: string;
    creator: string;
    created_at: string;
    messages?: QAMessage[];
}

export default function QAPage() {
    const router = useRouter();
    const user = useAuthStore((state) => state.user);
    const [sessions, setSessions] = useState<QASession[]>([]);
    const [selectedSession, setSelectedSession] = useState<QASession | null>(null);
    const [messages, setMessages] = useState<QAMessage[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isAsking, setIsAsking] = useState(false);
    const [newSessionName, setNewSessionName] = useState('');
    const [newQuestion, setNewQuestion] = useState('');
    const [error, setError] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadSessions();
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const loadSessions = async () => {
        try {
            const data = await qaAPI.getSessions();
            setSessions(data || []);
        } catch (err: any) {
            console.error('Error loading sessions:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateSession = async () => {
        if (!newSessionName.trim()) {
            setError('Please enter a session name');
            return;
        }

        try {
            const newSession = await qaAPI.createSession({
                room_name: newSessionName,
                creator_name: user?.full_name || 'User',
            });

            await loadSessions();
            setNewSessionName('');
            setIsCreating(false);

            // Load the new session
            const history = await qaAPI.getHistory(newSession.id);
            setSelectedSession(newSession);
            setMessages(history.messages || []);
        } catch (err: any) {
            setError('Failed to create session');
        }
    };

    const handleSelectSession = async (session: QASession) => {
        setSelectedSession(session);
        setError('');

        try {
            const history = await qaAPI.getHistory(session.id);
            setMessages(history.messages || []);
        } catch (err: any) {
            setError('Failed to load session history');
        }
    };

    const handleAskQuestion = async () => {
        if (!selectedSession || !newQuestion.trim()) return;

        const questionText = newQuestion;
        setNewQuestion('');
        setIsAsking(true);
        setError('');

        // Add user message optimistically
        const userMessage: QAMessage = {
            role: 'user',
            content: questionText,
            timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, userMessage]);

        try {
            const response = await qaAPI.askQuestion(selectedSession.id, questionText);

            // Add assistant response
            const assistantMessage: QAMessage = {
                role: 'assistant',
                content: response.answer,
                timestamp: response.timestamp,
            };
            setMessages((prev) => [...prev, assistantMessage]);
        } catch (err: any) {
            setError('Failed to get answer');
            // Remove optimistic message on error
            setMessages((prev) => prev.slice(0, -1));
        } finally {
            setIsAsking(false);
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
                                <h1 className="text-2xl font-bold gradient-text">Q&A Session</h1>
                                <p className="text-sm text-text-secondary mt-1">
                                    Ask questions about medical cases and get AI-powered answers
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => setIsCreating(!isCreating)}
                            className="flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            New Session
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
                {/* Create New Session Form */}
                {isCreating && (
                    <Card className="mb-6 fade-in">
                        <h3 className="text-lg font-semibold text-text-primary mb-4">Create New Q&A Session</h3>
                        <Input
                            type="text"
                            placeholder="Enter session name (e.g., Cardiology Questions)"
                            value={newSessionName}
                            onChange={(e) => setNewSessionName(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleCreateSession()}
                            className="mb-4"
                        />
                        {error && (
                            <div className="mb-4 p-3 bg-error/10 border border-error/20 rounded-lg">
                                <p className="text-sm text-error">{error}</p>
                            </div>
                        )}
                        <div className="flex gap-4">
                            <Button
                                variant="primary"
                                onClick={handleCreateSession}
                                className="flex-1"
                            >
                                Create Session
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsCreating(false);
                                    setNewSessionName('');
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
                    {/* Sessions List */}
                    <div className="lg:col-span-1">
                        <h2 className="text-xl font-bold text-text-primary mb-4">Your Sessions</h2>

                        {isLoading ? (
                            <Card className="flex items-center justify-center py-12">
                                <LoadingSpinner />
                            </Card>
                        ) : sessions.length === 0 ? (
                            <Card className="text-center py-12">
                                <MessageSquare className="w-16 h-16 text-text-muted mx-auto mb-4" />
                                <p className="text-text-secondary">No Q&A sessions yet</p>
                                <p className="text-sm text-text-muted mt-2">Create a new session to get started</p>
                            </Card>
                        ) : (
                            <div className="space-y-3">
                                {sessions.map((session) => (
                                    <Card
                                        key={session.id}
                                        hover
                                        onClick={() => handleSelectSession(session)}
                                        className={`cursor-pointer ${selectedSession?.id === session.id
                                            ? 'border-2 border-primary'
                                            : ''
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 rounded-lg bg-accent/20">
                                                <MessageSquare className="w-5 h-5 text-accent" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-text-primary truncate">
                                                    {session.room_name}
                                                </p>
                                                <p className="text-xs text-text-muted mt-1">
                                                    {new Date(session.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Chat Interface */}
                    <div className="lg:col-span-2">
                        {!selectedSession ? (
                            <Card className="flex items-center justify-center min-h-[500px]">
                                <div className="text-center">
                                    <Sparkles className="w-16 h-16 text-text-muted mx-auto mb-4" />
                                    <p className="text-text-secondary">Select a session to start asking questions</p>
                                </div>
                            </Card>
                        ) : (
                            <Card>
                                <div className="mb-4 pb-4 border-b border-white/10">
                                    <h3 className="text-lg font-semibold text-text-primary">
                                        {selectedSession.room_name}
                                    </h3>
                                </div>

                                {/* Messages */}
                                <div className="space-y-4 max-h-[500px] overflow-y-auto mb-4 px-2">
                                    {messages.length === 0 ? (
                                        <div className="text-center py-12">
                                            <p className="text-text-muted">No messages yet. Ask your first question!</p>
                                        </div>
                                    ) : (
                                        messages.map((msg, index) => (
                                            <div
                                                key={index}
                                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div
                                                    className={`max-w-[80%] p-4 rounded-lg ${msg.role === 'user'
                                                        ? 'bg-gradient-primary text-white'
                                                        : 'bg-bg-tertiary text-text-secondary border border-white/10'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs font-semibold opacity-70">
                                                            {msg.role === 'user' ? 'You' : 'AI Assistant'}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                                        {msg.content}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input */}
                                <div className="flex gap-2 pt-4 border-t border-white/10">
                                    <input
                                        type="text"
                                        value={newQuestion}
                                        onChange={(e) => setNewQuestion(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && !isAsking && handleAskQuestion()}
                                        placeholder="Ask a medical question..."
                                        disabled={isAsking}
                                        className="flex-1 px-4 py-3 bg-bg-tertiary text-text-primary border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary placeholder-text-muted transition-smooth disabled:opacity-50"
                                    />
                                    <Button
                                        variant="primary"
                                        onClick={handleAskQuestion}
                                        disabled={!newQuestion.trim() || isAsking}
                                        isLoading={isAsking}
                                    >
                                        <Send className="w-4 h-4" />
                                    </Button>
                                </div>

                                {error && (
                                    <div className="mt-4 p-3 bg-error/10 border border-error/20 rounded-lg">
                                        <p className="text-sm text-error">{error}</p>
                                    </div>
                                )}
                            </Card>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
