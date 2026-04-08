'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function ChatTab() {
  const { data: session } = useSession();
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDescription, setNewRoomDescription] = useState('');
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    if (selectedRoom) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedRoom]);

  const fetchRooms = async () => {
    try {
      const response = await fetch('/api/chat/rooms');
      const data = await response.json();
      if (data.success) {
        setRooms(data.data);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const fetchMessages = async () => {
    if (!selectedRoom) return;
    try {
      const response = await fetch(`/api/chat/${selectedRoom}/messages`);
      const data = await response.json();
      if (data.success) {
        setMessages(data.data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleCreateRoom = async () => {
    if (!newRoomName || !newRoomDescription) return;
    setLoading(true);
    try {
      const response = await fetch('/api/chat/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomName: newRoomName,
          caseDescription: newRoomDescription,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setNewRoomName('');
        setNewRoomDescription('');
        setShowCreateRoom(false);
        fetchRooms();
        setSelectedRoom(data.data.roomId);
      }
    } catch (error) {
      console.error('Error creating room:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedRoom) return;
    try {
      const response = await fetch(`/api/chat/${selectedRoom}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newMessage }),
      });
      const data = await response.json();
      if (data.success) {
        setNewMessage('');
        fetchMessages();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
      {/* Rooms List */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-900">Chat Rooms</h3>
          <button
            onClick={() => setShowCreateRoom(!showCreateRoom)}
            className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
          >
            + New
          </button>
        </div>

        {showCreateRoom && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg space-y-2">
            <input
              type="text"
              placeholder="Room name"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            />
            <input
              type="text"
              placeholder="Case description"
              value={newRoomDescription}
              onChange={(e) => setNewRoomDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            />
            <button
              onClick={handleCreateRoom}
              disabled={loading}
              className="w-full px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
            >
              Create Room
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
                  ? 'bg-purple-100 border-2 border-purple-600'
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className="font-semibold text-sm text-gray-900">{room.name}</div>
              <div className="text-xs text-gray-500 mt-1">by {room.creator}</div>
            </button>
          ))}
          {rooms.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">No rooms yet</p>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg flex flex-col">
        {selectedRoom ? (
          <>
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">
                {rooms.find((r) => r.id === selectedRoom)?.name || 'Chat Room'}
              </h3>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-3 rounded-lg ${
                    msg.user === session?.user?.name
                      ? 'bg-purple-100 ml-auto max-w-[80%]'
                      : 'bg-gray-100 mr-auto max-w-[80%]'
                  }`}
                >
                  <div className="text-xs font-semibold text-gray-700 mb-1">{msg.user}</div>
                  <div className="text-sm text-gray-900">{msg.content}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(msg.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
                <button
                  onClick={handleSendMessage}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a room to start chatting
          </div>
        )}
      </div>
    </div>
  );
}
