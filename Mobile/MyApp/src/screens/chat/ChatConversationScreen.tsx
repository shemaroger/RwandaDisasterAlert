// src/screens/chat/ChatConversationScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import apiService from '../../services/api';

interface Message {
  id: string;
  content: string;
  timestamp: string;
  sender: {
    id: number;
    username: string;
    first_name?: string;
    last_name?: string;
  };
  is_read: boolean;
}

interface ChatRoom {
  id: string;
  other_user: {
    id: number;
    username: string;
    first_name?: string;
    last_name?: string;
    email?: string;
  };
}

interface ChatConversationScreenProps {
  navigation: any;
  route: {
    params: {
      chatId: string;
    };
  };
}

const ChatConversationScreen: React.FC<ChatConversationScreenProps> = ({
  navigation,
  route,
}) => {
  const { chatId } = route.params;
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (chatId) {
      loadChatRoom();
      loadMessages();
    }
  }, [chatId]);

  useEffect(() => {
    if (chatRoom) {
      markAsRead();
    }
  }, [chatRoom]);

  const loadChatRoom = async () => {
    try {
      const data = await apiService.getChatRoom(chatId);
      setChatRoom(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load chat room');
    }
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getChatMessages(chatId);
      setMessages(Array.isArray(data) ? data : data.results || []);
    } catch (err: any) {
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
      setMessages((prev) => [...prev, sentMessage]);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
      setNewMessage(messageContent);
      Alert.alert('Error', err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getUserDisplayName = (user: ChatRoom['other_user']) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user.username || user.email || `User ${user.id}`;
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    if (!chatRoom) return null;
    
    const isCurrentUser = item.sender.id !== chatRoom.other_user.id;
    const showAvatar = index === 0 || messages[index - 1].sender.id !== item.sender.id;

    return (
      <View
        style={[
          styles.messageContainer,
          isCurrentUser ? styles.messageContainerRight : styles.messageContainerLeft,
        ]}
      >
        {!isCurrentUser && showAvatar && (
          <View style={styles.avatarSmall}>
            <Ionicons name="person" size={16} color="#94A3B8" />
          </View>
        )}
        {!isCurrentUser && !showAvatar && <View style={styles.avatarSpacer} />}

        <View style={{ flex: 1 }}>
          <View
            style={[
              styles.messageBubble,
              isCurrentUser ? styles.messageBubbleRight : styles.messageBubbleLeft,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                isCurrentUser ? styles.messageTextRight : styles.messageTextLeft,
              ]}
            >
              {item.content}
            </Text>
          </View>

          <View
            style={[
              styles.messageFooter,
              isCurrentUser ? styles.messageFooterRight : styles.messageFooterLeft,
            ]}
          >
            <Text style={styles.messageTime}>{formatMessageTime(item.timestamp)}</Text>
            {isCurrentUser && (
              <Ionicons
                name={item.is_read ? 'checkmark-done' : 'checkmark'}
                size={14}
                color={item.is_read ? '#3B82F6' : '#94A3B8'}
                style={{ marginLeft: 4 }}
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="chatbubbles-outline" size={64} color="#94A3B8" />
      <Text style={styles.emptyTitle}>No messages yet</Text>
      <Text style={styles.emptyText}>Start the conversation!</Text>
    </View>
  );

  if (loading && !chatRoom) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.gradient}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Loading conversation...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  if (error && !chatRoom) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.gradient}>
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={64} color="#EF4444" />
            <Text style={styles.errorTitle}>Error Loading Chat</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backButtonText}>Back to Chats</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  if (!chatRoom) return null;

  const otherUserName = getUserDisplayName(chatRoom.other_user);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.gradient}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backIconButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>

            <View style={styles.avatarContainer}>
              <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.avatar}>
                <Ionicons name="person" size={20} color="#FFF" />
              </LinearGradient>
            </View>

            <View style={styles.headerInfo}>
              <Text style={styles.headerName} numberOfLines={1}>
                {otherUserName}
              </Text>
              <Text style={styles.headerUsername} numberOfLines={1}>
                @{chatRoom.other_user.username}
              </Text>
            </View>

            <TouchableOpacity style={styles.moreButton}>
              <Ionicons name="ellipsis-vertical" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Error Banner */}
          {error && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={20} color="#EF4444" />
              <Text style={styles.errorBannerText}>{error}</Text>
              <TouchableOpacity onPress={() => setError(null)}>
                <Text style={styles.dismissText}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Messages */}
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            ListEmptyComponent={loading ? null : renderEmptyState}
            onContentSizeChange={() => {
              if (messages.length > 0) {
                flatListRef.current?.scrollToEnd({ animated: false });
              }
            }}
            onLayout={() => {
              if (messages.length > 0) {
                flatListRef.current?.scrollToEnd({ animated: false });
              }
            }}
          />

          {/* Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Type a message..."
              placeholderTextColor="#64748B"
              multiline
              maxLength={1000}
              editable={!sending}
            />
            <TouchableOpacity
              style={[styles.sendButton, (!newMessage.trim() || sending) && styles.sendButtonDisabled]}
              onPress={handleSendMessage}
              disabled={!newMessage.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Ionicons name="send" size={20} color="#FFF" />
              )}
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </KeyboardAvoidingView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFF',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.1)',
    gap: 12,
  },
  backIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 4,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 2,
  },
  headerUsername: {
    fontSize: 12,
    color: '#94A3B8',
  },
  moreButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 12,
    gap: 8,
  },
  errorBannerText: {
    flex: 1,
    color: '#EF4444',
    fontSize: 14,
  },
  dismissText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
  },
  messagesList: {
    padding: 16,
    flexGrow: 1,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  messageContainerLeft: {
    justifyContent: 'flex-start',
  },
  messageContainerRight: {
    justifyContent: 'flex-end',
  },
  avatarSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarSpacer: {
    width: 32,
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
  },
  messageBubbleLeft: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.1)',
    borderBottomLeftRadius: 4,
  },
  messageBubbleRight: {
    backgroundColor: '#3B82F6',
    borderBottomRightRadius: 4,
    alignSelf: 'flex-end',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  messageTextLeft: {
    color: '#FFF',
  },
  messageTextRight: {
    color: '#FFF',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  messageFooterLeft: {
    justifyContent: 'flex-start',
  },
  messageFooterRight: {
    justifyContent: 'flex-end',
  },
  messageTime: {
    fontSize: 11,
    color: '#94A3B8',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.1)',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#FFF',
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

export default ChatConversationScreen;