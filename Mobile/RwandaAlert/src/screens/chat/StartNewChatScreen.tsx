// src/screens/chat/StartNewChatScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import apiService from '../../services/api';

interface User {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  user_type?: string;
}

interface StartNewChatScreenProps {
  navigation: any;
}

const StartNewChatScreen: React.FC<StartNewChatScreenProps> = ({ navigation }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [startingChat, setStartingChat] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    loadCurrentUser();
    loadUsers();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const user = await apiService.getProfile();
      setCurrentUser(user);
    } catch (err) {
      console.error('Failed to load current user:', err);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await apiService.getChatEligibleUsers();
      const userList = Array.isArray(data) ? data : data.results || [];
      setUsers(userList);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
      Alert.alert('Error', err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const getUserDisplayName = (user: User) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user.username || user.email || `User ${user.id}`;
  };

  const getUserRole = (user: User) => {
    if (user.user_type) {
      return user.user_type.charAt(0).toUpperCase() + user.user_type.slice(1);
    }
    return 'User';
  };

  const getUserRoleIcon = (userType?: string) => {
    if (userType === 'admin') {
      return <Ionicons name="shield" size={16} color="#F87171" />;
    } else if (userType === 'operator') {
      return <Ionicons name="people" size={16} color="#60A5FA" />;
    }
    return <Ionicons name="person" size={16} color="#94A3B8" />;
  };

  const getUserRoleColor = (userType?: string) => {
    if (userType === 'admin') {
      return {
        bg: 'rgba(239, 68, 68, 0.1)',
        border: 'rgba(239, 68, 68, 0.3)',
        text: '#F87171',
      };
    } else if (userType === 'operator') {
      return {
        bg: 'rgba(59, 130, 246, 0.1)',
        border: 'rgba(59, 130, 246, 0.3)',
        text: '#60A5FA',
      };
    }
    return {
      bg: 'rgba(148, 163, 184, 0.1)',
      border: 'rgba(148, 163, 184, 0.3)',
      text: '#94A3B8',
    };
  };

  const filteredUsers = users.filter((user) => {
    const name = getUserDisplayName(user).toLowerCase();
    const username = (user.username || '').toLowerCase();
    const email = (user.email || '').toLowerCase();
    const role = (user.user_type || '').toLowerCase();
    const search = searchTerm.toLowerCase();

    return (
      name.includes(search) ||
      username.includes(search) ||
      email.includes(search) ||
      role.includes(search)
    );
  });

  const handleStartChat = async (targetUser: User) => {
    if (startingChat === targetUser.id) return;

    try {
      setStartingChat(targetUser.id);
      setError(null);

      const chatRoom = await apiService.startChat(targetUser.id);

      navigation.navigate('ChatConversation', { chatId: chatRoom.id });
    } catch (err: any) {
      setError(err.message || 'Failed to start chat');
      Alert.alert('Error', err.message || 'Failed to start chat');
      setStartingChat(null);
    }
  };

  const renderUserItem = ({ item }: { item: User }) => {
    const roleColors = getUserRoleColor(item.user_type);

    return (
      <TouchableOpacity
        style={styles.userItem}
        onPress={() => handleStartChat(item)}
        disabled={startingChat === item.id}
        activeOpacity={0.7}
      >
        <View style={styles.userAvatarContainer}>
          <LinearGradient
            colors={['rgba(20, 184, 166, 0.2)', 'rgba(20, 184, 166, 0.2)']}
            style={styles.userAvatar}
          >
            {getUserRoleIcon(item.user_type)}
          </LinearGradient>
        </View>

        <View style={styles.userInfo}>
          <View style={styles.userNameRow}>
            <Text style={styles.userName} numberOfLines={1}>
              {getUserDisplayName(item)}
            </Text>
            <View
              style={[
                styles.roleBadge,
                {
                  backgroundColor: roleColors.bg,
                  borderColor: roleColors.border,
                },
              ]}
            >
              {getUserRoleIcon(item.user_type)}
              <Text style={[styles.roleBadgeText, { color: roleColors.text }]}>
                {getUserRole(item)}
              </Text>
            </View>
          </View>
          <Text style={styles.userUsername} numberOfLines={1}>
            @{item.username}
          </Text>
          {item.email && (
            <Text style={styles.userEmail} numberOfLines={1}>
              {item.email}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={[styles.chatButton, startingChat === item.id && styles.chatButtonDisabled]}
          onPress={() => handleStartChat(item)}
          disabled={startingChat === item.id}
        >
          {startingChat === item.id ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Ionicons name="chatbubble" size={20} color="#FFF" />
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="person-outline" size={64} color="#64748B" />
      </View>
      <Text style={styles.emptyTitle}>
        {searchTerm ? 'No users found' : 'No users available'}
      </Text>
      <Text style={styles.emptyText}>
        {searchTerm
          ? 'Try adjusting your search'
          : currentUser?.user_type === 'citizen'
          ? 'No operators or administrators are available at the moment'
          : 'There are no other users to chat with'}
      </Text>
      {searchTerm && (
        <TouchableOpacity
          style={styles.clearSearchButton}
          onPress={() => setSearchTerm('')}
        >
          <Text style={styles.clearSearchButtonText}>Clear Search</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.gradient}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#14B8A6" />
            <Text style={styles.loadingText}>Loading users...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Start New Chat</Text>
            <Text style={styles.headerSubtitle}>
              {currentUser?.user_type === 'citizen'
                ? 'Select an operator or administrator to contact'
                : 'Select a user to start messaging'}
            </Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#94A3B8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, username, or role..."
            placeholderTextColor="#64748B"
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={() => setSearchTerm('')}>
              <Ionicons name="close-circle" size={20} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Error Banner */}
        {error && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={20} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => setError(null)}>
              <Text style={styles.dismissText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Results Count */}
        {filteredUsers.length > 0 && (
          <View style={styles.resultsCount}>
            <Text style={styles.resultsCountText}>
              {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'}{' '}
              available
              {searchTerm && ` matching "${searchTerm}"`}
            </Text>
          </View>
        )}

        {/* Users List */}
        <FlatList
          data={filteredUsers}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyState}
        />
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  gradient: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94A3B8',
    marginTop: 12,
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 16,
    paddingVertical: 12,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    gap: 8,
  },
  errorText: {
    flex: 1,
    color: '#EF4444',
    fontSize: 14,
  },
  dismissText: {
    color: '#EF4444',
    fontWeight: '600',
    fontSize: 14,
  },
  resultsCount: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  resultsCountText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  listContent: {
    flexGrow: 1,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.1)',
    gap: 12,
  },
  userAvatarContainer: {
    flexShrink: 0,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(20, 184, 166, 0.3)',
  },
  userInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    flex: 1,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  userUsername: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 12,
    color: '#64748B',
  },
  chatButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#14B8A6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatButtonDisabled: {
    opacity: 0.5,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 24,
  },
  clearSearchButton: {
    backgroundColor: '#14B8A6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  clearSearchButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default StartNewChatScreen;