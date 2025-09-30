// src/screens/Home.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const Home = ({ navigation }: any) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.backgroundGradient} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="warning" size={60} color="#f87171" />
          </View>
          <Text style={styles.title}>MINEMA Alert</Text>
          <Text style={styles.subtitle}>Emergency Management System</Text>
          <Text style={styles.description}>
            Ministry of Emergency Management - Rwanda
          </Text>
        </View>

        {/* Features */}
        <View style={styles.featuresContainer}>
          <View style={styles.featureCard}>
            <Ionicons name="notifications" size={32} color="#60a5fa" />
            <Text style={styles.featureTitle}>Real-Time Alerts</Text>
            <Text style={styles.featureText}>
              Receive instant emergency notifications for your area
            </Text>
          </View>

          <View style={styles.featureCard}>
            <Ionicons name="warning" size={32} color="#f87171" />
            <Text style={styles.featureTitle}>Report Incidents</Text>
            <Text style={styles.featureText}>
              Quickly report emergencies and safety concerns
            </Text>
          </View>

          <View style={styles.featureCard}>
            <Ionicons name="book" size={32} color="#4ade80" />
            <Text style={styles.featureTitle}>Safety Guides</Text>
            <Text style={styles.featureText}>
              Access comprehensive emergency preparedness resources
            </Text>
          </View>

          <View style={styles.featureCard}>
            <Ionicons name="call" size={32} color="#fbbf24" />
            <Text style={styles.featureTitle}>Emergency Contacts</Text>
            <Text style={styles.featureText}>
              Find emergency services and contacts near you
            </Text>
          </View>
        </View>

        {/* CTA Buttons */}
        <View style={styles.ctaContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Signup')}
          >
            <Ionicons name="person-add" size={20} color="#fff" />
            <Text style={styles.primaryButtonText}>Create Account</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Ionicons name="log-in" size={20} color="#fca5a5" />
            <Text style={styles.secondaryButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>

        {/* Emergency Info */}
        <View style={styles.emergencyBox}>
          <Ionicons name="alert-circle" size={20} color="#f87171" />
          <View style={styles.emergencyContent}>
            <Text style={styles.emergencyTitle}>Emergency Contacts</Text>
            <Text style={styles.emergencyText}>
              Emergency: <Text style={styles.emergencyBold}>112</Text>
              {'\n'}
              MINEMA: <Text style={styles.emergencyBold}>+250-788-000-000</Text>
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © 2024 MINEMA - Ministry of Emergency Management
          </Text>
          <Text style={styles.footerSubtext}>Republic of Rwanda</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#7f1d1d',
    opacity: 0.3,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(248, 113, 113, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#fca5a5',
    fontWeight: '600',
    marginBottom: 8,
  },
  description: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
  },
  featuresContainer: {
    marginBottom: 32,
  },
  featureCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginTop: 12,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 18,
  },
  ctaContainer: {
    marginBottom: 24,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dc2626',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 8,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.3)',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fca5a5',
    marginLeft: 8,
  },
  emergencyBox: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.3)',
    marginBottom: 24,
  },
  emergencyContent: {
    marginLeft: 12,
    flex: 1,
  },
  emergencyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fca5a5',
    marginBottom: 6,
  },
  emergencyText: {
    fontSize: 13,
    color: '#fecaca',
    lineHeight: 20,
  },
  emergencyBold: {
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 4,
    textAlign: 'center',
  },
  footerSubtext: {
    fontSize: 10,
    color: '#64748b',
  },
});

export default Home;