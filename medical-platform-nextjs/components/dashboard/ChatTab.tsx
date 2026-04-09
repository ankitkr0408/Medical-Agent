'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';

type Stage = 'initial' | 'specialists' | 'summary' | 'complete';

// Enhanced markdown formatter for medical chat messages
function formatMarkdown(text: string) {
    return text
        // Bold text: **text** -> <strong>text</strong>
        .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
        // Italic text: *text* -> <em>text</em>
        .replace(/\*(.+?)\*/g, '<em class="italic">$1</em>')
        // Headers: ### text -> <h3>text</h3>
        .replace(/^###\s+(.+)$/gm, '<h3 class="font-bold text-base mt-4 mb-2 text-gray-900">$1</h3>')
        .replace(/^##\s+(.+)$/gm, '<h2 class="font-bold text-lg mt-4 mb-2 text-gray-900">$1</h2>')
        // Numbered lists: 1. text -> proper list items with better spacing
        .replace(/^(\d+)\.\s+\*\*(.+?)\*\*(.*)$/gm, '<div class="ml-4 my-2 flex"><span class="font-semibold text-gray-700 mr-2">$1.</span><span><strong class="font-semibold text-gray-900">$2</strong>$3</span></div>')
        .replace(/^(\d+)\.\s+(.+)$/gm, '<div class="ml-4 my-2 flex"><span class="font-semibold text-gray-700 mr-2">$1.</span><span>$2</span></div>')
        // Bullet points: - text -> proper list items with round bullets
        .replace(/^-\s+\*\*(.+?)\*\*(.*)$/gm, '<div class="ml-4 my-2 flex"><span class="text-gray-600 mr-2 text-lg leading-none">●</span><span><strong class="font-semibold text-gray-900">$1</strong>$2</span></div>')
        .replace(/^-\s+(.+)$/gm, '<div class="ml-4 my-2 flex"><span class="text-gray-600 mr-2 text-lg leading-none">●</span><span>$1</span></div>')
        // Code blocks: `code` -> <code>code</code>
        .replace(/`(.+?)`/g, '<code class="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-purple-700">$1</code>')
        // Paragraphs: double line breaks
        .replace(/\n\n/g, '<br/><br/>')
        // Single line breaks
        .replace(/\n/g, '<br/>');
}

interface Room {
    id: string;
    description: string;
    creator: string;
    created_at: string;
    participants: number;
    consultation_stage: Stage;
    specialist_opinions?: string[];
}

interface Msg {
    id: string;
    user: string;
    content: string;
    type: string;
    timestamp: string;
}

// Matches Streamlit st.chat_message avatar logic
function avatar(msg: Msg) {
    if (msg.type === 'system') return '🏥';
    if (msg.user.includes('Dr. David') || msg.user.includes('Dr. Michael')) return '👨‍⚕️';
    if (msg.user.startsWith('Dr.')) return '👩‍⚕️';
    return '👤';
}

export default function ChatTab() {
    const { data: session } = useSession();
    const [rooms, setRooms] = useState<Room[]>([]);
    const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
    const [messages, setMessages] = useState<Msg[]>([]);
    const [input, setInput] = useState('');
    const [annotation, setAnnotation] = useState('');
    const [showAnnotation, setShowAnnotation] = useState(false);
    const [caseDesc, setCaseDesc] = useState('');
    const [activeTab, setActiveTab] = useState<'join' | 'create'>('join');
    const [consultLoading, setConsultLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [statusMsg, setStatusMsg] = useState('');
    const [progress, setProgress] = useState(0);
    const [sendingMessage, setSendingMessage] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const [isUserScrolling, setIsUserScrolling] = useState(false);
    const prevMessagesLengthRef = useRef(0);

    useEffect(() => { loadRooms(); }, []);

    useEffect(() => {
        if (!currentRoom) return;
        loadMessages();
        const t = setInterval(loadMessages, 3000);
        return () => clearInterval(t);
    }, [currentRoom?.id]);

    useEffect(() => {
        // Only auto-scroll if user is not manually scrolling and new messages arrived
        if (!isUserScrolling && messages.length > prevMessagesLengthRef.current) {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
        prevMessagesLengthRef.current = messages.length;
    }, [messages, isUserScrolling]);

    const loadRooms = async () => {
        const res = await fetch('/api/chat/rooms');
        const d = await res.json();
        if (d.success) setRooms(d.data);
    };

    const loadMessages = async () => {
        if (!currentRoom) return;
        const res = await fetch(`/api/chat/${currentRoom.id}/messages`);
        const d = await res.json();
        if (d.success) setMessages(d.data);
    };

    const reloadRoom = async () => {
        const res = await fetch('/api/chat/rooms');
        const d = await res.json();
        if (d.success) {
            setRooms(d.data);
            if (currentRoom) {
                const updated = d.data.find((r: Room) => r.id === currentRoom.id);
                if (updated) setCurrentRoom(updated);
            }
        }
    };

    const joinRoom = async (room: Room) => {
        setCurrentRoom(room);
    };

    const createRoom = async () => {
        if (!caseDesc.trim()) return;
        setCreating(true);
        const res = await fetch('/api/chat/rooms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ description: caseDesc }),
        });
        const d = await res.json();
        if (d.success) {
            setCaseDesc('');
            await loadRooms();
            const res2 = await fetch('/api/chat/rooms');
            const d2 = await res2.json();
            if (d2.success) {
                const newRoom = d2.data.find((r: Room) => r.id === d.data.roomId);
                if (newRoom) setCurrentRoom(newRoom);
            }
        }
        setCreating(false);
    };

    const sendMessage = async () => {
        if (!input.trim() || !currentRoom) return;
        const msg = input;
        setInput('');
        setSendingMessage(true);
        setIsUserScrolling(false); // Allow auto-scroll for new messages
        await fetch(`/api/chat/${currentRoom.id}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: msg }),
        });
        await loadMessages();
        setSendingMessage(false);
    };

    const handleScroll = () => {
        if (!messagesContainerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
        const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
        setIsUserScrolling(!isAtBottom);
    };

    const submitAnnotation = async () => {
        if (!annotation.trim() || !currentRoom) return;
        await fetch(`/api/chat/${currentRoom.id}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: annotation, type: 'annotation' }),
        });
        setAnnotation('');
        setShowAnnotation(false);
        await loadMessages();
    };

    const runConsultation = async (action: 'start' | 'next' | 'summary' | 'auto') => {
        if (!currentRoom) return;
        setConsultLoading(true);
        setProgress(0);
        setStatusMsg(action === 'auto' ? '🔬 Analyzing imaging details...' : '⏳ Processing...');

        const endpoint = action === 'auto' ? '/api/consultation/auto' : '/api/consultation';
        await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ caseId: currentRoom.id, action }),
        });

        setStatusMsg(action === 'auto' ? '✅ Complete consultation finished!' : '');
        setProgress(action === 'auto' ? 100 : 0);
        await loadMessages();
        await reloadRoom();
        setConsultLoading(false);
        setTimeout(() => { setStatusMsg(''); setProgress(0); }, 2000);
    };

    const stage = currentRoom?.consultation_stage || 'initial';
    const opinions = currentRoom?.specialist_opinions || [];

    const stageInfo: Record<Stage, string> = {
        initial: '🔵 **Stage 1:** Present your case and questions',
        specialists: `🟡 **Stage 2:** Specialist consultation (${opinions.length}/3 opinions received)`,
        summary: '🟢 **Stage 3:** Multidisciplinary summary ready',
        complete: '✅ **Complete:** Consultation finished',
    };

    const roomOptions = rooms.map(r => ({
        label: `${r.id} - ${r.description} (by ${r.creator})`,
        room: r,
    }));

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">👨‍⚕️👩‍⚕️ Multi-Doctor Collaboration</h2>

            {/* Tabs: Join Existing / Create New — matches Streamlit st.tabs */}
            {!currentRoom && (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <div className="flex border-b border-gray-200">
                        {(['join', 'create'] as const).map(t => (
                            <button key={t} onClick={() => setActiveTab(t)}
                                className={`flex-1 py-3 text-sm font-medium transition ${activeTab === t ? 'border-b-2 border-purple-600 text-purple-600 bg-purple-50' : 'text-gray-600 hover:bg-gray-50'}`}>
                                {t === 'join' ? 'Join Existing Case' : 'Create New Case'}
                            </button>
                        ))}
                    </div>

                    <div className="p-5">
                        {activeTab === 'join' && (
                            rooms.length > 0 ? (
                                <div className="space-y-3">
                                    <label className="text-sm font-medium text-gray-700">Select Case</label>
                                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                        {rooms.map(room => (
                                            <div key={room.id} className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                                                <button
                                                    onClick={() => setCurrentRoom(room)}
                                                    className="flex-1 text-left"
                                                >
                                                    <div className="font-semibold text-sm text-gray-900">{room.description}</div>
                                                    <div className="text-xs text-gray-500">by {room.creator} • {room.participants} participants</div>
                                                </button>
                                                <button
                                                    onClick={async (e) => {
                                                        e.stopPropagation();
                                                        if (confirm('Delete this discussion?')) {
                                                            try {
                                                                await fetch(`/api/chat/${room.id}`, { method: 'DELETE' });
                                                                await loadRooms();
                                                            } catch (error) {
                                                                console.error('Error deleting room:', error);
                                                                alert('Failed to delete discussion');
                                                            }
                                                        }
                                                    }}
                                                    className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition"
                                                >
                                                    🗑️ Delete
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-800 text-sm">
                                    No active case discussions. Create a new one!
                                </div>
                            )
                        )}

                        {activeTab === 'create' && (
                            <div className="space-y-3">
                                <label className="text-sm font-medium text-gray-700">Case Description</label>
                                <input
                                    type="text"
                                    value={caseDesc}
                                    onChange={e => setCaseDesc(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && createRoom()}
                                    placeholder="Describe the case..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                />
                                <button
                                    onClick={createRoom}
                                    disabled={creating || !caseDesc.trim()}
                                    className="w-full py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50"
                                >{creating ? 'Creating...' : 'Create Discussion'}</button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Active chat room — matches Streamlit active chat section */}
            {currentRoom && (
                <div className="space-y-4">
                    {/* Room header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Case Discussion: {currentRoom.description}</h3>
                            <p className="text-sm text-gray-500">Created by {currentRoom.creator} • {currentRoom.participants} participants</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={async () => {
                                    if (confirm('Are you sure you want to delete this discussion? This action cannot be undone.')) {
                                        try {
                                            await fetch(`/api/chat/${currentRoom.id}`, { method: 'DELETE' });
                                            setCurrentRoom(null);
                                            setMessages([]);
                                            await loadRooms();
                                        } catch (error) {
                                            console.error('Error deleting room:', error);
                                            alert('Failed to delete discussion');
                                        }
                                    }
                                }}
                                className="text-sm text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1 rounded-lg transition"
                            >
                                🗑️ Delete
                            </button>
                            <button onClick={() => setCurrentRoom(null)} className="text-sm text-gray-400 hover:text-gray-600 underline">← Back</button>
                        </div>
                    </div>

                    {/* Stage info — matches Streamlit st.info() */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-800">
                        {stageInfo[stage]}
                    </div>

                    {/* Consultation controls — matches Streamlit col1/col2 buttons */}
                    {stage === 'initial' && (
                        <div>
                            <p className="text-sm font-semibold text-gray-700 mb-2">Ready to start specialist consultation?</p>
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => runConsultation('start')} disabled={consultLoading}
                                    className="py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
                                    🩺 Start Step-by-Step
                                </button>
                                <button onClick={() => runConsultation('auto')} disabled={consultLoading}
                                    className="py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50">
                                    ⚡ Auto Complete Consultation
                                </button>
                            </div>
                        </div>
                    )}

                    {stage === 'specialists' && (
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => runConsultation('next')} disabled={consultLoading}
                                className="py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
                                👨‍⚕️ Get Next Specialist Opinion
                            </button>
                            {opinions.length >= 2 && (
                                <button onClick={() => runConsultation('summary')} disabled={consultLoading}
                                    className="py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50">
                                    📋 Get Multidisciplinary Summary
                                </button>
                            )}
                        </div>
                    )}

                    {stage === 'summary' && (
                        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-800">
                            ✅ Multidisciplinary summary completed! Continue discussion or ask follow-up questions.
                        </div>
                    )}

                    {/* Progress bar — matches Streamlit st.progress() */}
                    {consultLoading && (
                        <div className="space-y-1">
                            <p className="text-xs text-purple-600 animate-pulse">{statusMsg || '⏳ AI specialists are reviewing...'}</p>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div className="bg-purple-600 h-1.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                            </div>
                        </div>
                    )}

                    {/* Messages — matches Streamlit st.chat_message */}
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                        <div
                            ref={messagesContainerRef}
                            onScroll={handleScroll}
                            className="h-[380px] overflow-y-auto p-4 space-y-3"
                        >
                            {messages.map(msg => (
                                <div key={msg.id} className="flex gap-3 items-start">
                                    <span className="text-2xl flex-shrink-0 mt-0.5">{avatar(msg)}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-gray-600 mb-1">{msg.user}</p>
                                        <div
                                            className={`text-sm rounded-2xl px-4 py-2 break-words ${msg.type === 'system' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                                                msg.type === 'ai_response' ? 'bg-green-50 text-gray-800 border border-green-200' :
                                                    msg.type === 'annotation' ? 'bg-yellow-50 text-gray-800 border border-yellow-200' :
                                                        'bg-gray-100 text-gray-800'
                                                }`}
                                            dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.content) }}
                                        />
                                        <p className="text-xs text-gray-400 mt-1">
                                            {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : ''}
                                        </p>
                                    </div>
                                </div>
                            ))}

                            {/* Thinking indicator when message is being processed */}
                            {sendingMessage && (
                                <div className="flex gap-3 items-start">
                                    <span className="text-2xl flex-shrink-0 mt-0.5">🤖</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-gray-600 mb-1">AI Assistant</p>
                                        <div className="bg-purple-50 border border-purple-200 rounded-2xl px-4 py-3 flex items-center gap-2">
                                            <div className="flex gap-1">
                                                <span className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                                <span className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                                <span className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                            </div>
                                            <span className="text-sm text-purple-700">Thinking...</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div ref={bottomRef} />
                        </div>

                        {/* Chat input — matches Streamlit st.chat_input */}
                        <div className="border-t border-gray-200 p-3 flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                                placeholder="Type your message or question here..."
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                            />
                            <button onClick={sendMessage} disabled={!input.trim()}
                                className="px-5 py-2 bg-purple-600 text-white rounded-xl text-sm hover:bg-purple-700 disabled:opacity-50">
                                Send
                            </button>
                        </div>
                    </div>

                    {/* Image annotation expander — matches Streamlit st.expander */}
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                        <button
                            onClick={() => setShowAnnotation(!showAnnotation)}
                            className="w-full flex justify-between items-center px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            <span>Add Image Annotation</span>
                            <span>{showAnnotation ? '▲' : '▼'}</span>
                        </button>
                        {showAnnotation && (
                            <div className="p-4 border-t border-gray-200 space-y-3">
                                <textarea
                                    value={annotation}
                                    onChange={e => setAnnotation(e.target.value)}
                                    placeholder="Describe what you see in the image"
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                                />
                                <button onClick={submitAnnotation} disabled={!annotation.trim()}
                                    className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50">
                                    Submit Annotation
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
