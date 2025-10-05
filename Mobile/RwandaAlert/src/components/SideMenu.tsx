// components/SideMenu.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SideMenuProps {
  navigation: any;
}

const SideMenu = ({ navigation }: SideMenuProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Menu</Text>
      </View>
      <View style={styles.menuItems}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Dashboard')}
        >
          <Ionicons name="grid-outline" size={20} color="#64748B" />
          <Text style={styles.menuText}>Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Alerts')}
        >
          <Ionicons name="notifications-outline" size={20} color="#64748B" />
          <Text style={styles.menuText}>Alerts</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('ReportIncident')}
        >
          <Ionicons name="camera-outline" size={20} color="#64748B" />
          <Text style={styles.menuText}>Report Incident</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('SafetyGuides')}
        >
          <Ionicons name="book-outline" size={20} color="#64748B" />
          <Text style={styles.menuText}>Safety Guides</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('EmergencyContacts')}
        >
          <Ionicons name="call-outline" size={20} color="#64748B" />
          <Text style={styles.menuText}>Emergency Contacts</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Settings')}
        >
          <Ionicons name="settings-outline" size={20} color="#64748B" />
          <Text style={styles.menuText}>Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.replace('Welcome')}
        >
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={[styles.menuText, { color: '#EF4444' }]}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E293B',
    paddingTop: 50,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.2)',
  },
  headerText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  menuItems: {
    padding: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginVertical: 5,
  },
  menuText: {
    color: '#94A3B8',
    fontSize: 16,
    marginLeft: 15,
  },
});

export default SideMenu;
