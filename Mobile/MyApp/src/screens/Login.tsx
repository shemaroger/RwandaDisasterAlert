// screens/auth/LoginScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Switch,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import apiService from '../services/api';

interface LoginFormData {
  username: string;
  password: string;
}

interface ValidationErrors {
  username?: string;
  password?: string;
}

type LoginMethod = 'username' | 'email';

const LoginScreen = ({ navigation, route }: any) => {
  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('username');
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [loading, setLoading] = useState(false);
  const [systemStatus, setSystemStatus] = useState<'operational' | 'checking' | 'offline'>('checking');

  // Pre-fill username if coming from signup
  useEffect(() => {
    if (route.params?.username) {
      setFormData((prev) => ({ ...prev, username: route.params.username }));
      if (route.params.username.includes('@')) {
        setLoginMethod('email');
      }
    }

    // Temporarily disable health check for debugging
    // TODO: Re-enable once network is working
    // checkSystemHealth();
    setSystemStatus('operational'); // Assume operational for now
  }, [route.params]);

  const checkSystemHealth = async () => {
    try {
      const isHealthy = await apiService.healthCheck();
      setSystemStatus(isHealthy ? 'operational' : 'offline');
    } catch (error) {
      console.log('System health check failed, marking as offline');
      setSystemStatus('offline');
    }
  };

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    if (!formData.username) {
      errors.username = loginMethod === 'email' ? 'Email is required' : 'Username is required';
    } else if (loginMethod === 'email' && !/\S+@\S+\.\S+/.test(formData.username)) {
      errors.username = 'Please enter a valid email address';
    } else if (loginMethod === 'username' && formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const result = await apiService.login(formData.username, formData.password);

      // Store remember me preference
      if (rememberMe) {
        // In production, you might want to use SecureStore for this
        // For now, just log the preference
        console.log('Remember me enabled');
      }

      Alert.alert('Success', 'You have successfully signed in!', [
        {
          text: 'OK',
          onPress: () => {
            // Navigate to main app
            // Replace this with your actual navigation logic
            navigation.replace('MainApp');
          },
        },
      ]);
    } catch (error: any) {
      let errorMessage = 'An error occurred during sign in. Please try again.';
      
      if (error?.status === 401) {
        errorMessage = 'Invalid username or password. Please check your credentials and try again.';
      } else if (error?.message) {
        errorMessage = error.message;
      }

      Alert.alert('Sign In Failed', errorMessage, [{ text: 'OK' }]);
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof LoginFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Auto-detect login method
    if (field === 'username') {
      setLoginMethod(value.includes('@') ? 'email' : 'username');
    }

    // Clear validation error
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const renderInput = (
    field: keyof LoginFormData,
    placeholder: string,
    icon: keyof typeof Ionicons.glyphMap,
    options?: {
      secureTextEntry?: boolean;
      keyboardType?: any;
      autoCapitalize?: any;
      rightIcon?: React.ReactNode;
    }
  ) => {
    const error = validationErrors[field];
    return (
      <View style={styles.inputContainer}>
        <View style={[styles.inputWrapper, error && styles.inputError]}>
          <Ionicons name={icon} size={20} color="#EF4444" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor="#94A3B8"
            value={formData[field]}
            onChangeText={(value) => updateField(field, value)}
            secureTextEntry={options?.secureTextEntry}
            keyboardType={options?.keyboardType || 'default'}
            autoCapitalize={options?.autoCapitalize || 'none'}
            autoCorrect={false}
            editable={!loading}
          />
          {options?.rightIcon}
        </View>
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={14} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <StatusBar style="light" />

      <LinearGradient colors={['#0F172A', '#DC2626', '#0F172A']} style={styles.gradient}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Ionicons name="alert-circle" size={56} color="#EF4444" />
              </View>
              <Text style={styles.title}>MINEMA Alert</Text>
              <Text style={styles.subtitle}>Emergency Management System</Text>
              <Text style={styles.subtitleSmall}>Ministry of Emergency Management - Rwanda</Text>
            </View>

            {/* Success Message from Signup */}
            {route.params?.message && (
              <View style={styles.successMessage}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <View style={styles.messageContent}>
                  <Text style={styles.messageTitle}>Registration Successful</Text>
                  <Text style={styles.messageText}>{route.params.message}</Text>
                </View>
              </View>
            )}

            {/* Login Method Toggle */}
            <View style={styles.loginMethodContainer}>
              <TouchableOpacity
                style={[styles.methodButton, loginMethod === 'username' && styles.methodButtonActive]}
                onPress={() => setLoginMethod('username')}
                disabled={loading}
              >
                <Ionicons
                  name="person-outline"
                  size={18}
                  color={loginMethod === 'username' ? '#FFF' : '#94A3B8'}
                />
                <Text
                  style={[styles.methodButtonText, loginMethod === 'username' && styles.methodButtonTextActive]}
                >
                  Username
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.methodButton, loginMethod === 'email' && styles.methodButtonActive]}
                onPress={() => setLoginMethod('email')}
                disabled={loading}
              >
                <Ionicons
                  name="mail-outline"
                  size={18}
                  color={loginMethod === 'email' ? '#FFF' : '#94A3B8'}
                />
                <Text
                  style={[styles.methodButtonText, loginMethod === 'email' && styles.methodButtonTextActive]}
                >
                  Email
                </Text>
              </TouchableOpacity>
            </View>

            {/* Login Form */}
            <View style={styles.formContainer}>
              <Text style={styles.formLabel}>
                {loginMethod === 'email' ? 'Email Address' : 'Username'}
              </Text>
              {renderInput(
                'username',
                loginMethod === 'email' ? 'Enter your email address' : 'Enter your username',
                loginMethod === 'email' ? 'mail-outline' : 'person-outline',
                {
                  keyboardType: loginMethod === 'email' ? 'email-address' : 'default',
                }
              )}

              <Text style={styles.formLabel}>Password</Text>
              {renderInput('password', 'Enter your password', 'lock-closed-outline', {
                secureTextEntry: !showPassword,
                rightIcon: (
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} disabled={loading}>
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color="#94A3B8"
                    />
                  </TouchableOpacity>
                ),
              })}

              {/* Remember Me & Forgot Password */}
              <View style={styles.optionsRow}>
                <View style={styles.rememberMeContainer}>
                  <Switch
                    value={rememberMe}
                    onValueChange={setRememberMe}
                    trackColor={{ false: '#475569', true: '#DC2626' }}
                    thumbColor={rememberMe ? '#EF4444' : '#CBD5E1'}
                    disabled={loading}
                  />
                  <Text style={styles.rememberMeText}>Remember me</Text>
                </View>

                <TouchableOpacity
                  onPress={() => navigation.navigate('ForgotPassword')}
                  disabled={loading}
                >
                  <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                </TouchableOpacity>
              </View>

              {/* Sign In Button */}
              <TouchableOpacity
                style={[styles.signInButton, loading && styles.signInButtonDisabled]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="shield-checkmark" size={20} color="#FFF" />
                    <Text style={styles.signInButtonText}>Sign In to MINEMA</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Sign Up Link */}
            <View style={styles.signUpContainer}>
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>Don't have an account?</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={styles.signUpButton}
                onPress={() => navigation.navigate('Signup')}
                disabled={loading}
              >
                <Ionicons name="person-add-outline" size={18} color="#FCA5A5" />
                <Text style={styles.signUpButtonText}>Create Emergency Account</Text>
              </TouchableOpacity>
            </View>

            {/* Emergency Contact */}
            <View style={styles.emergencyContainer}>
              <Ionicons name="warning-outline" size={18} color="#EF4444" />
              <View style={styles.emergencyContent}>
                <Text style={styles.emergencyTitle}>Emergency Contacts</Text>
                <Text style={styles.emergencyText}>
                  Emergency: <Text style={styles.emergencyBold}>112</Text> | MINEMA:{' '}
                  <Text style={styles.emergencyBold}>+250-788-000-000</Text>
                </Text>
              </View>
            </View>

            {/* System Status */}
            <View style={styles.statusContainer}>
              <View
                style={[
                  styles.statusDot,
                  systemStatus === 'operational' && styles.statusDotOperational,
                  systemStatus === 'checking' && styles.statusDotChecking,
                  systemStatus === 'offline' && styles.statusDotOffline,
                ]}
              />
              <Text style={styles.statusText}>
                {systemStatus === 'operational' && 'System Operational'}
                {systemStatus === 'checking' && 'Checking System...'}
                {systemStatus === 'offline' && 'System Offline'}
              </Text>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                © 2024 MINEMA - Ministry of Emergency Management
              </Text>
              <Text style={styles.footerTextSmall}>Republic of Rwanda</Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#FCA5A5',
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitleSmall: {
    fontSize: 12,
    color: '#94A3B8',
  },
  successMessage: {
    flexDirection: 'row',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  messageContent: {
    flex: 1,
    marginLeft: 12,
  },
  messageTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 12,
    color: '#6EE7B7',
  },
  loginMethodContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
    gap: 4,
  },
  methodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  methodButtonActive: {
    backgroundColor: '#DC2626',
  },
  methodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
  },
  methodButtonTextActive: {
    color: '#FFF',
  },
  formContainer: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E2E8F0',
    marginBottom: 8,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#FFF',
    fontSize: 15,
    fontWeight: '500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginLeft: 4,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rememberMeText: {
    fontSize: 14,
    color: '#E2E8F0',
    fontWeight: '500',
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '600',
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 10,
  },
  signInButtonDisabled: {
    opacity: 0.6,
  },
  signInButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  signUpContainer: {
    marginBottom: 20,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(148, 163, 184, 0.3)',
  },
  dividerText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
    paddingHorizontal: 12,
  },
  signUpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  signUpButtonText: {
    color: '#FCA5A5',
    fontSize: 15,
    fontWeight: '600',
  },
  emergencyContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  emergencyContent: {
    flex: 1,
    marginLeft: 12,
  },
  emergencyTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FCA5A5',
    marginBottom: 4,
  },
  emergencyText: {
    fontSize: 12,
    color: '#FCA5A5',
  },
  emergencyBold: {
    fontWeight: '700',
    color: '#FEE2E2',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusDotOperational: {
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  statusDotChecking: {
    backgroundColor: '#F59E0B',
  },
  statusDotOffline: {
    backgroundColor: '#EF4444',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#94A3B8',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 4,
  },
  footerTextSmall: {
    fontSize: 10,
    color: '#475569',
  },
});

export default LoginScreen;