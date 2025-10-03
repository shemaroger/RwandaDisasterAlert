// StartNewChatPage.jsx
import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ArrowLeft, 
  User,
  MessageCircle,
  AlertCircle,
  RefreshCw,
  Shield,
  Users as UsersIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';

const StartNewChatPage = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [startingChat, setStartingChat] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use the new endpoint that respects user permissions
      const data = await apiService.getChatEligibleUsers();
      
      const userList = Array.isArray(data) ? data : (data.results || []);
      setUsers(userList);
    } catch (err) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const getUserDisplayName = (user) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user.username || user.email || `User ${user.id}`;
  };

  const getUserRole = (user) => {
    if (user.user_type) {
      return user.user_type.charAt(0).toUpperCase() + user.user_type.slice(1);
    }
    return 'User';
  };

  const getUserRoleIcon = (userType) => {
    if (userType === 'admin') {
      return <Shield className="w-4 h-4 text-red-400" />;
    } else if (userType === 'operator') {
      return <UsersIcon className="w-4 h-4 text-blue-400" />;
    }
    return <User className="w-4 h-4 text-gray-400" />;
  };

  const getUserRoleBadgeColor = (userType) => {
    if (userType === 'admin') {
      return 'bg-red-500/10 text-red-400 border-red-500/30';
    } else if (userType === 'operator') {
      return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    }
    return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
  };

  const filteredUsers = users.filter(user => {
    const name = getUserDisplayName(user).toLowerCase();
    const username = (user.username || '').toLowerCase();
    const email = (user.email || '').toLowerCase();
    const role = (user.user_type || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    
    return name.includes(search) || 
           username.includes(search) || 
           email.includes(search) ||
           role.includes(search);
  });

  const handleStartChat = async (targetUser) => {
    if (startingChat === targetUser.id) return;

    try {
      setStartingChat(targetUser.id);
      setError(null);
      
      const chatRoom = await apiService.startChat(targetUser.id);
      
      // Navigate to the chat room
      navigate(`/chat/${chatRoom.id}`);
    } catch (err) {
      setError(err.message || 'Failed to start chat');
      setStartingChat(null);
    }
  };

  const handleBack = () => {
    navigate('/chat');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-teal-500 mx-auto mb-2" />
          <p className="text-gray-400">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a1628]">
      <div className="max-w-4xl mx-auto">
        <div className="bg-[#1e2f3e] shadow-lg min-h-screen">
          {/* Header */}
          <div className="p-4 border-b border-gray-700/50 sticky top-0 bg-[#1e2f3e] z-10 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={handleBack}
                className="p-2 hover:bg-gray-700/50 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-300" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">Start New Chat</h1>
                <p className="text-sm text-gray-400">
                  {user?.user_type === 'citizen' 
                    ? 'Select an operator or administrator to contact' 
                    : 'Select a user to start messaging'}
                </p>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, username, or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#2a3f4f] border border-gray-600/50 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
              />
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-4 bg-red-500/10 border-b border-red-500/20">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <p className="text-red-400 flex-1">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="text-red-400 hover:text-red-300 text-sm font-medium"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Users List */}
          <div className="divide-y divide-gray-700/30">
            {filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <div className="bg-[#2a3f4f] rounded-full p-6 mb-4">
                  <User className="w-16 h-16 text-gray-500" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">
                  {searchTerm ? 'No users found' : 'No users available'}
                </h3>
                <p className="text-gray-400">
                  {searchTerm 
                    ? 'Try adjusting your search' 
                    : user?.user_type === 'citizen'
                      ? 'No operators or administrators are available at the moment'
                      : 'There are no other users to chat with'}
                </p>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Results Count */}
                <div className="px-4 py-3 bg-[#0f1a26]">
                  <p className="text-sm text-gray-400">
                    {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'} available
                    {searchTerm && ` matching "${searchTerm}"`}
                  </p>
                </div>

                {/* User List */}
                {filteredUsers.map((targetUser) => (
                  <div
                    key={targetUser.id}
                    className="p-4 hover:bg-[#2a3f4f] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-br from-teal-500/20 to-teal-600/20 border border-teal-500/30 rounded-full flex items-center justify-center">
                          {getUserRoleIcon(targetUser.user_type)}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-white truncate">
                            {getUserDisplayName(targetUser)}
                          </h3>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border ${getUserRoleBadgeColor(targetUser.user_type)}`}>
                            {getUserRoleIcon(targetUser.user_type)}
                            {getUserRole(targetUser)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 truncate">
                          @{targetUser.username}
                        </p>
                        {targetUser.email && (
                          <p className="text-xs text-gray-500 truncate mt-0.5">
                            {targetUser.email}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => handleStartChat(targetUser)}
                        disabled={startingChat === targetUser.id}
                        className="flex-shrink-0 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors text-sm font-medium shadow-lg"
                      >
                        {startingChat === targetUser.id ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Starting...
                          </>
                        ) : (
                          <>
                            <MessageCircle className="w-4 h-4" />
                            Chat
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StartNewChatPage;