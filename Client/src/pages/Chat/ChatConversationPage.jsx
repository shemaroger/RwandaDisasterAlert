// ChatConversationPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  ArrowLeft, 
  MoreVertical,
  Check,
  CheckCheck,
  User,
  MessageCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import apiService from '../../services/api';

const ChatConversationPage = () => {
  const [chatRoom, setChatRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const { id } = useParams(); // Changed from chatId to id to match route
  const chatId = id; // Keep chatId variable for rest of the code
  const navigate = useNavigate();

  useEffect(() => {
    if (chatId) {
      loadChatRoom();
      loadMessages();
    }
  }, [chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (chatRoom) {
      markAsRead();
    }
  }, [chatRoom]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatRoom = async () => {
    try {
      const data = await apiService.getChatRoom(chatId);
      setChatRoom(data);
    } catch (err) {
      setError(err.message || 'Failed to load chat room');
    }
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getChatMessages(chatId);
      setMessages(data);
    } catch (err) {
      setError(err.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async () => {
    try {
      await apiService.markMessagesAsRead(chatId);
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      const sentMessage = await apiService.sendMessage(chatId, messageContent);
      setMessages(prev => [...prev, sentMessage]);
    } catch (err) {
      setError(err.message || 'Failed to send message');
      setNewMessage(messageContent);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getUserDisplayName = (user) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user.username || user.email || `User ${user.id}`;
  };

  const handleBack = () => {
    navigate('/chat');
  };

  if (loading && !chatRoom) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-2" />
          <p className="text-gray-600">Loading conversation...</p>
        </div>
      </div>
    );
  }

  if (error && !chatRoom) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Chat</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleBack}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Chats
          </button>
        </div>
      </div>
    );
  }

  if (!chatRoom) {
    return null;
  }

  const otherUserName = getUserDisplayName(chatRoom.other_user);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto bg-white shadow-sm min-h-screen flex flex-col">
        {/* Header */}
        <div className="p-4 border-b bg-white shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>

            <div className="flex-1">
              <h2 className="font-semibold text-gray-900">{otherUserName}</h2>
              <p className="text-sm text-gray-500">@{chatRoom.other_user.username}</p>
            </div>

            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <MoreVertical className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="p-4 bg-red-50 border-b border-red-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-800 text-sm">{error}</p>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-700 hover:text-red-900"
              >
                <span className="text-sm">Dismiss</span>
              </button>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <MessageCircle className="w-8 h-8 animate-pulse text-blue-500" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageCircle className="w-16 h-16 text-gray-300 mb-4" />
              <p className="text-gray-500">No messages yet</p>
              <p className="text-sm text-gray-400">Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => {
              const isCurrentUser = message.sender.id !== chatRoom.other_user.id;
              
              return (
                <div
                  key={message.id}
                  className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-2 max-w-md ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
                    {!isCurrentUser && (
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-gray-600" />
                      </div>
                    )}

                    <div>
                      <div
                        className={`px-4 py-2 rounded-2xl ${
                          isCurrentUser
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-900 border border-gray-200'
                        }`}
                      >
                        <p className="text-sm break-words">{message.content}</p>
                      </div>
                      <div className={`flex items-center gap-1 mt-1 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                        <span className="text-xs text-gray-500">
                          {formatMessageTime(message.timestamp)}
                        </span>
                        {isCurrentUser && (
                          message.is_read ? (
                            <CheckCheck className="w-3 h-3 text-blue-500" />
                          ) : (
                            <Check className="w-3 h-3 text-gray-400" />
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              disabled={sending}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {sending ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatConversationPage;