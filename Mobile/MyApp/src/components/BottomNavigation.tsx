// components/BottomNavigation.tsx
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface NavItem {
  name: string;
  route: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
}

interface BottomNavigationProps {
  navigation: any;
  currentRoute: string;
}

const BottomNavigation = ({ navigation, currentRoute }: BottomNavigationProps) => {
  const insets = useSafeAreaInsets();

  const navItems: NavItem[] = [
    {
      name: 'Home',
      route: 'Home',
      icon: 'home-outline',
      activeIcon: 'home',
    },
    {
      name: 'Alerts',
      route: 'Alerts',
      icon: 'notifications-outline',
      activeIcon: 'notifications',
    },
    {
      name: 'Report',
      route: 'ReportIncident',
      icon: 'add-circle-outline',
      activeIcon: 'add-circle',
    },
    {
      name: 'Guides',
      route: 'SafetyGuides',
      icon: 'book-outline',
      activeIcon: 'book',
    },
    {
      name: 'Dashboard',
      route: 'Dashboard',
      icon: 'grid-outline',
      activeIcon: 'grid',
    },
  ];

  const handleNavigation = (route: string) => {
    navigation.navigate(route);
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={styles.navBar}>
        {navItems.map((item, index) => {
          const isActive = currentRoute === item.route;
          const isCenter = index === 2; // Center button (Report)

          return (
            <TouchableOpacity
              key={item.route}
              style={[styles.navItem, isCenter && styles.centerNavItem]}
              onPress={() => handleNavigation(item.route)}
              activeOpacity={0.7}
            >
              {isCenter ? (
                <View style={styles.centerButton}>
                  <Ionicons
                    name={isActive ? item.activeIcon : item.icon}
                    size={28}
                    color="#FFF"
                  />
                </View>
              ) : (
                <>
                  <Ionicons
                    name={isActive ? item.activeIcon : item.icon}
                    size={24}
                    color={isActive ? '#EF4444' : '#94A3B8'}
                  />
                  <Text
                    style={[
                      styles.navLabel,
                      isActive && styles.navLabelActive,
                    ]}
                  >
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
    backgroundColor: 'transparent',
  },
  navBar: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.2)',
    paddingTop: 8,
    paddingBottom: 4,
    paddingHorizontal: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 16,
      },
    }),
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
    ...Platform.select({
      ios: {
        shadowColor: '#DC2626',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
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