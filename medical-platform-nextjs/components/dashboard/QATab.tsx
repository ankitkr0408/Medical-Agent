'use client';
import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';

interface QARoom { id: string; name: string; creator: string; created_at: string; }
interface QAMessage { id: string; user: string; content: string; timestamp: string; }

// Enhanced markdown formatter for medical Q&A messages
function formatMarkdown(text: string) {
  return text
    // Bold text: **text** -> <strong>text</strong>
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
    // Italic text: *text* -> <em>text</em>
    .replace(/\*(.+?)\*/g, '<em class="italic">$1</em>')
    // Headers: ### text -> <h3>text</h3>
    .replace(/^###\s+(.+)$/gm, '<h3 class="font-bold text-base mt-3 mb-1.5 text-gray-900">$1</h3>')
    .replace(/^##\s+(.+)$/gm, '<h2 class="font-bold text-lg mt-3 mb-1.5 text-gray-900">$1</h2>')
    // Numbered lists: 1. text -> proper list items with better spacing
    .replace(/^(\d+)\.\s+\*\*(.+?)\*\*(.*)$/gm, '<div class="ml-4 my-1 flex"><span class="font-semibold text-gray-700 mr-2">$1.</span><span><strong class="font-semibold text-gray-900">$2</strong>$3</span></div>')
    .replace(/^(\d+)\.\s+(.+)$/gm, '<div class="ml-4 my-1 flex"><span class="font-semibold text-gray-700 mr-2">$1.</span><span>$2</span></div>')
    // Bullet points: - text -> proper list items with round bullets
    .replace(/^-\s+\*\*(.+?)\*\*(.*)$/gm, '<div class="ml-4 my-1 flex"><span class="text-gray-600 mr-2 text-base leading-tight">●</span><span><strong class="font-semibold text-gray-900">$1</strong>$2</span></div>')
    .replace(/^-\s+(.+)$/gm, '<div class="ml-4 my-1 flex"><span class="text-gray-600 mr-2 text-base leading-tight">●</span><span>$1</span></div>')
    // Code blocks: `code` -> <code>code</code>
    .replace(/`(.+?)`/g, '<code class="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-purple-700">$1</code>')
    // Paragraphs: double line breaks (reduce spacing)
    .replace(/\n\n/g, '<br/>')
    // Single line breaks (reduce spacing)
    .replace(/\n/g, '<br/>');
}

export default function QATab() {
  const { data: session } = useSession();
  const [rooms, setRooms] = useState<QARoom[]>([]);
  const [currentRoom, setCurrentRoom] = useState<QARoom | null>(null);
  const [messages, setMessages] = useState<QAMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [tab, setTab] = useState<'join' | 'create'>('join');
  const [creating, setCreating] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const prevMessagesLengthRef = useRef(0);

  useEffect(() => { loadRooms(); }, []);
  useEffect(() => { if (currentRoom) loadMessages(); }, [currentRoom?.id]);
  useEffect(() => {
    // Only auto-scroll if user is not manually scrolling and new messages arrived
    if (!isUserScrolling && messages.length > prevMessagesLengthRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages, isUserScrolling]);

  const loadRooms = async () => {
    const res = await fetch('/api/qa/rooms');
    const d = await res.json();
    if (d.success) setRooms(d.data);
  };

  const loadMessages = async (room?: QARoom) => {
    const target = room || currentRoom;
    if (!target) return;
    const res = await fetch(`/api/qa/${target.id}/messages`);
    const d = await res.json();
    if (d.success) setMessages(d.data);
  };

  const handleCreate = async () => {
    if (!roomName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/qa/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomName: roomName.trim() }),
      });
      const d = await res.json();
      if (d.success) {
        setRoomName('');
        await loadRooms();
        const r2 = await fetch('/api/qa/rooms');
        const d2 = await r2.json();
        if (d2.success) {
          const nr = d2.data.find((r: QARoom) => r.id === d.data.roomId);
          if (nr) { setCurrentRoom(nr); setTab('join'); }
        }
      }
    } finally { setCreating(false); }
  };

  const handleSend = async () => {
    if (!input.trim() || !currentRoom || sending) return;
    const q = input.trim();
    setInput('');
    setSending(true);
    setIsUserScrolling(false); // Allow auto-scroll for new messages
    setMessages(prev => [...prev, { id: `tmp-${Date.now()}`, user: session?.user?.name || 'User', content: q, timestamp: new Date().toISOString() }]);
    try {
      await fetch(`/api/qa/${currentRoom.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: q }),
      });
      await loadMessages(currentRoom);
    } finally { setSending(false); }
  };

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    setIsUserScrolling(!isAtBottom);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[680px]">
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3 overflow-y-auto">
        <h3 className="font-bold text-gray-900">🩺 Medical Report Q&A</h3>
        <div className="flex rounded-lg overflow-hidden border border-gray-200">
          {(['join', 'create'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 text-xs font-medium transition ${tab === t ? 'bg-green-600 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
              {t === 'join' ? 'Join Existing' : 'Create New'}
            </button>
          ))}
        </div>

        {tab === 'join' && (
          <div className="space-y-2 flex-1 overflow-y-auto">
            {rooms.length === 0
              ? <p className="text-sm text-gray-400 text-center py-6">No active Q&A rooms. Create a new one!</p>
              : rooms.map(room => (
                <div key={room.id} className={`flex items-center gap-2 p-3 rounded-lg border transition ${currentRoom?.id === room.id ? 'bg-green-50 border-green-400' : 'bg-gray-50 border-transparent hover:bg-gray-100'}`}>
                  <button
                    onClick={() => { setCurrentRoom(room); loadMessages(room); }}
                    className="flex-1 text-left"
                  >
                    <div className="font-semibold text-sm text-gray-900 truncate">{room.name}</div>
                    <div className="text-xs text-gray-500">by {room.creator}</div>
                    <div className="text-xs text-gray-400">{String(room.created_at).slice(0, 10)}</div>
                  </button>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (confirm('Delete this Q&A room?')) {
                        try {
                          await fetch(`/api/qa/${room.id}`, { method: 'DELETE' });
                          if (currentRoom?.id === room.id) {
                            setCurrentRoom(null);
                            setMessages([]);
                          }
                          await loadRooms();
                        } catch (error) {
                          console.error('Error deleting room:', error);
                          alert('Failed to delete Q&A room');
                        }
                      }
                    }}
                    className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition"
                  >
                    🗑️ Delete
                  </button>
                </div>
              ))
            }
          </div>
        )}

        {tab === 'create' && (
          <div className="space-y-3">
            <input type="text" placeholder="Q&A Room Name" value={roomName}
              onChange={e => setRoomName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:outline-none" />
            <button onClick={handleCreate} disabled={creating || !roomName.trim()}
              className="w-full py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50">
              {creating ? 'Creating...' : 'Create Q&A Room'}
            </button>
          </div>
        )}
      </div>

      <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl flex flex-col overflow-hidden">
        {currentRoom ? (
          <>
            <div className="p-4 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-gray-900">Q&A Room: {currentRoom.name}</h3>
                  <p className="text-xs text-gray-500">Created by {currentRoom.creator} on {String(currentRoom.created_at).slice(0, 10)}</p>
                </div>
              </div>
            </div>

            <div
              ref={messagesContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto p-4 space-y-3"
            >
              {messages.map(msg => {
                const isAI = msg.user === 'Report QA System';
                return (
                  <div key={msg.id} className="flex gap-3 items-start">
                    <span className="text-2xl flex-shrink-0">{isAI ? '🤖' : '👨‍⚕️'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-600 mb-1">{msg.user}</p>
                      <div
                        className={`text-sm rounded-2xl px-4 py-2 break-words ${isAI ? 'bg-green-50 border border-green-200 text-gray-800' : 'bg-gray-100 text-gray-800'}`}
                        dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.content) }}
                      />
                      <p className="text-xs text-gray-400 mt-1">{msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : ''}</p>
                    </div>
                  </div>
                );
              })}
              {sending && (
                <div className="flex gap-3 items-start">
                  <span className="text-2xl">🤖</span>
                  <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-2">
                    <span className="text-sm text-gray-500 animate-pulse">Report QA System is thinking...</span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="p-4 border-t border-gray-200">
              <div className="flex gap-2">
                <input type="text" value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder="Ask a question about your medical reports"
                  disabled={sending}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:outline-none disabled:opacity-50" />
                <button onClick={handleSend} disabled={sending || !input.trim()}
                  className="px-5 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 text-sm font-medium">
                  {sending ? '...' : 'Ask'}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
            <div className="text-5xl">🩺</div>
            <p className="text-sm font-medium">Select a Q&A room or create a new one</p>
            <p className="text-xs text-gray-400">Ask questions about your analyzed medical reports</p>
          </div>
        )}
      </div>
    </div>
  );
}
