'use client';

import { useState, useEffect } from 'react';

export default function QATab() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [showCreateRoom, setShowCreateRoom] = useState(false);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await fetch('/api/qa/rooms');
      const data = await response.json();
      if (data.success) {
        setRooms(data.data);
      }
    } catch (error) {
      console.error('Error fetching QA rooms:', error);
    }
  };

  const handleCreateRoom = async () => {
    if (!newRoomName) return;
    try {
      const response = await fetch('/api/qa/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomName: newRoomName }),
      });
      const data = await response.json();
      if (data.success) {
        setNewRoomName('');
        setShowCreateRoom(false);
        fetchRooms();
        setSelectedRoom(data.data.roomId);
      }
    } catch (error) {
      console.error('Error creating QA room:', error);
    }
  };

  const handleAskQuestion = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setAnswer('');
    try {
      const response = await fetch('/api/qa/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      const data = await response.json();
      if (data.success) {
        setAnswer(data.data.answer);
      }
    } catch (error) {
      console.error('Error asking question:', error);
      setAnswer('Failed to get answer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* QA Rooms List */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-900">Q&A Sessions</h3>
          <button
            onClick={() => setShowCreateRoom(!showCreateRoom)}
            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
          >
            + New
          </button>
        </div>

        {showCreateRoom && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg space-y-2">
            <input
              type="text"
              placeholder="Session name"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            />
            <button
              onClick={handleCreateRoom}
              className="w-full px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
            >
              Create Session
            </button>
          </div>
        )}

        <div className="space-y-2">
          {rooms.map((room) => (
            <button
              key={room.id}
              onClick={() => setSelectedRoom(room.id)}
              className={`w-full text-left p-3 rounded-lg transition ${
                selectedRoom === room.id
                  ? 'bg-green-100 border-2 border-green-600'
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className="font-semibold text-sm text-gray-900">{room.name}</div>
              <div className="text-xs text-gray-500 mt-1">by {room.creator}</div>
            </button>
          ))}
          {rooms.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">No sessions yet</p>
          )}
        </div>
      </div>

      {/* Q&A Interface */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-gradient-to-r from-green-50 to-teal-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            ❓ Ask Questions About Your Medical Reports
          </h3>
          <p className="text-sm text-gray-600">
            Our AI will search through your analyzed reports and provide answers based on the findings.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Question
          </label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g., What are the common findings in my chest X-rays?"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 resize-none"
            rows={4}
          />
          <button
            onClick={handleAskQuestion}
            disabled={loading || !question.trim()}
            className="mt-4 w-full bg-gradient-to-r from-green-600 to-teal-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? '🤔 Thinking...' : '🔍 Get Answer'}
          </button>
        </div>

        {answer && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold text-gray-900 mb-3">Answer:</h4>
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap">{answer}</p>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-8">
            <div className="spinner"></div>
          </div>
        )}
      </div>
    </div>
  );
}
