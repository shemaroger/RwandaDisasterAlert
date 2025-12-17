// components/BottomNavigation.tsx
import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../services/api';

interface BottomNavigationProps {
  navigation: any;
  currentRoute: string;
}

const BottomNavigation = ({ navigation, currentRoute }: BottomNavigationProps) => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadUnreadCount();
    
    // Poll for unread count every 30 seconds
    const interval = setInterval(loadUnreadCount, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadUnreadCount = async () => {
    try {
      const isAuth = await apiService.isAuthenticated();
      if (!isAuth) {
        setUnreadCount(0);
        return;
      }

      // Check if method exists before calling
      if (typeof apiService.getUnreadMessageCount === 'function') {
        const data = await apiService.getUnreadMessageCount();
        setUnreadCount(data?.unread_count || 0);
      } else {
        console.log('Chat feature not yet configured - unread count unavailable');
        setUnreadCount(0);
      }
    } catch (error) {
      // Silently fail - don't spam console
      setUnreadCount(0);
    }
  };

  const handleChatNavigation = () => {
    try {
      // Check if ChatList route exists
      navigation.navigate('ChatList');
    } catch (error) {
      console.warn('Chat screens not yet configured. Please add ChatList route to navigation.');
      // Optionally show an alert to the user
      // Alert.alert('Coming Soon', 'Chat feature will be available soon!');
    }
  };

  const navItems = [
    { name: 'Home', route: 'Home', icon: 'home-outline', activeIcon: 'home' },
    { name: 'Alerts', route: 'Alerts', icon: 'notifications-outline', activeIcon: 'notifications' },
    { name: 'Report', route: 'ReportIncident', icon: 'add-circle-outline', activeIcon: 'add-circle' },
    { 
      name: 'Chat', 
      route: 'ChatList', 
      icon: 'chatbubbles-outline', 
      activeIcon: 'chatbubbles', 
      badge: unreadCount,
      onPress: handleChatNavigation 
    },
    { name: 'Dashboard', route: 'Dashboard', icon: 'grid-outline', activeIcon: 'grid' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.navBar}>
        {navItems.map((item, index) => {
          const isActive = currentRoute === item.route;
          const isCenter = index === 2;
          const hasBadge = item.badge && item.badge > 0;

          return (
            <TouchableOpacity
              key={item.route}
              style={[styles.navItem, isCenter && styles.centerNavItem]}
              onPress={() => {
                if (item.onPress) {
                  item.onPress();
                } else {
                  navigation.navigate(item.route);
                }
              }}
              activeOpacity={0.7}
            >
              {isCenter ? (
                <View style={styles.centerButton}>
                  <Ionicons name={isActive ? item.activeIcon : item.icon} size={28} color="#FFF" />
                </View>
              ) : (
                <>
                  <View style={styles.iconContainer}>
                    <Ionicons
                      name={isActive ? item.activeIcon : item.icon}
                      size={24}
                      color={isActive ? '#EF4444' : '#94A3B8'}
                    />
                    {hasBadge && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>
                          {item.badge! > 99 ? '99+' : String(item.badge)}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                    {item.name}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 20,
  },
  navBar: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.2)',
    paddingTop: 8,
    paddingBottom: 4,
    paddingHorizontal: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  centerNavItem: {
    marginTop: -20,
  },
  centerButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#1E293B',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  navLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
    fontWeight: '500',
  },
  navLabelActive: {
    color: '#EF4444',
    fontWeight: '600',
  },
});

export default BottomNavigation;