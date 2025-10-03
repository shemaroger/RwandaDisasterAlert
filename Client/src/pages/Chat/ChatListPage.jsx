// ChatListPage.jsx
import React, { useState, useEffect } from 'react';
import { 
  MessageCircle, 
  Search, 
  User,
  CheckCheck,
  Check,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiService from '../../services/api';

const ChatListPage = () => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getChatRooms();
      setChats(data);
    } catch (err) {
      setError(err.message || 'Failed to load chats');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const getUserDisplayName = (user) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user.username || user.email || `User ${user.id}`;
  };

  const filteredChats = chats.filter(chat => {
    const name = getUserDisplayName(chat.other_user).toLowerCase();
    const lastMsg = chat.last_message?.content?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();
    return name.includes(search) || lastMsg.includes(search);
  });

  const handleSelectChat = (chat) => {
    navigate(`/chat/${chat.id}`);
  };

  const handleStartNewChat = () => {
    navigate('/chat/new');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-2" />
          <p className="text-gray-600">Loading chats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-sm">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
              <button
                onClick={handleStartNewChat}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
              >
                New Chat
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border-b border-red-200">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <p className="text-red-800">{error}</p>
                <button
                  onClick={loadChats}
                  className="ml-auto text-red-700 hover:text-red-900 text-sm font-medium"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          <div className="divide-y">
            {filteredChats.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <MessageCircle className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations yet</h3>
                <p className="text-gray-500 mb-4">Start a conversation with your team members</p>
                <button
                  onClick={handleStartNewChat}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Start New Chat
                </button>
              </div>
            ) : (
              filteredChats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => handleSelectChat(chat)}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {getUserDisplayName(chat.other_user)}
                        </h3>
                        <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                          {chat.last_message && formatTime(chat.last_message.timestamp)}
                        </span>
                      </div>

                      {chat.last_message && (
                        <div className="flex items-center justify-between">
                          <p className={`text-sm truncate ${chat.unread_count > 0 ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                            {chat.last_message.sender === 'You' && (
                              <span className="inline-flex mr-1">
                                {chat.last_message.is_read ? (
                                  <CheckCheck className="w-4 h-4 text-blue-500" />
                                ) : (
                                  <Check className="w-4 h-4 text-gray-400" />
                                )}
                              </span>
                            )}
                            {chat.last_message.content}
                          </p>
                          {chat.unread_count > 0 && (
                            <span className="flex-shrink-0 ml-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                              {chat.unread_count}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatListPage;