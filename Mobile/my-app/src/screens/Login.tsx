import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';

const { width, height } = Dimensions.get('window');

const Login = ({ navigation, route }: any) => {
  const { login, loading, error, clearError } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<any>({});
  const [rememberMe, setRememberMe] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'username' | 'email'>('username');

  // Get params from navigation
  const fromPath = route?.params?.from;
  const redirectMessage = route?.params?.message;
  const successMessage = route?.params?.successMessage;
  const prefillUsername = route?.params?.username || route?.params?.email;

  useEffect(() => {
    clearError();
    
    if (prefillUsername) {
      setFormData(prev => ({
        ...prev,
        username: prefillUsername,
      }));
      if (prefillUsername.includes('@')) {
        setLoginMethod('email');
      }
    }
  }, [clearError, prefillUsername]);

  useEffect(() => {
    if (error) {
      Alert.alert('Sign In Failed', error);
    }
  }, [error]);

  const validateForm = () => {
    const errors: any = {};
    
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

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      console.log('Attempting login with username:', formData.username);
      
      const result = await login(formData.username, formData.password, rememberMe);
      console.log('Login successful, user type:', result.user?.user_type);

      const userType = result.user?.user_type;

      // Navigate based on user type
      switch (userType) {
        case 'admin':
          navigation.replace('AdminDashboard');
          break;
        case 'operator':
          navigation.replace('OperatorDashboard');
          break;
        case 'authority':
          navigation.replace('AuthorityDashboard');
          break;
        case 'citizen':
          navigation.replace('Dashboard');
          break;
        default:
          navigation.replace('Dashboard');
      }
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    if (name === 'username') {
      if (value.includes('@')) {
        setLoginMethod('email');
      } else {
        setLoginMethod('username');
      }
    }

    if (validationErrors[name]) {
      setValidationErrors((prev: any) => ({
        ...prev,
        [name]: '',
      }));
    }

    if (error) {
      clearError();
    }
  };

  const getFieldError = (fieldName: string) => {
    return validationErrors[fieldName] || '';
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Background gradient effect */}
          <View style={styles.backgroundGradient} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons name="warning" size={40} color="#f87171" />
            </View>
            <Text style={styles.title}>MINEMA Alert</Text>
            <Text style={styles.subtitle}>Emergency Management System</Text>
            <Text style={styles.subtext}>Ministry of Emergency Management - Rwanda</Text>
          </View>

          {/* Success Message */}
          {successMessage && successMessage.includes('created successfully') && (
            <View style={[styles.messageBox, styles.successBox]}>
              <Ionicons name="checkmark-circle" size={20} color="#4ade80" />
              <View style={styles.messageContent}>
                <Text style={styles.messageTitle}>Registration Successful</Text>
                <Text style={styles.messageText}>{successMessage}</Text>
              </View>
            </View>
          )}

          {/* Redirect Message */}
          {redirectMessage && !successMessage && (
            <View style={[styles.messageBox, styles.infoBox]}>
              <Ionicons name="shield-checkmark" size={20} color="#60a5fa" />
              <View style={styles.messageContent}>
                <Text style={styles.messageTitle}>Access Required</Text>
                <Text style={styles.messageText}>{redirectMessage}</Text>
              </View>
            </View>
          )}

          {/* Login Method Toggle */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                loginMethod === 'username' && styles.toggleButtonActive,
              ]}
              onPress={() => setLoginMethod('username')}
              disabled={loading}
            >
              <Ionicons
                name="person"
                size={16}
                color={loginMethod === 'username' ? '#fff' : '#94a3b8'}
              />
              <Text
                style={[
                  styles.toggleText,
                  loginMethod === 'username' && styles.toggleTextActive,
                ]}
              >
                Username
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toggleButton,
                loginMethod === 'email' && styles.toggleButtonActive,
              ]}
              onPress={() => setLoginMethod('email')}
              disabled={loading}
            >
              <Ionicons
                name="mail"
                size={16}
                color={loginMethod === 'email' ? '#fff' : '#94a3b8'}
              />
              <Text
                style={[
                  styles.toggleText,
                  loginMethod === 'email' && styles.toggleTextActive,
                ]}
              >
                Email
              </Text>
            </TouchableOpacity>
          </View>

          {/* Login Form */}
          <View style={styles.form}>
            {/* Username/Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {loginMethod === 'email' ? 'Email Address' : 'Username'}
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  getFieldError('username') && styles.inputError,
                ]}
              >
                <Ionicons
                  name={loginMethod === 'email' ? 'mail' : 'person'}
                  size={20}
                  color="#f87171"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={formData.username}
                  onChangeText={(value) => handleChange('username', value)}
                  placeholder={
                    loginMethod === 'email'
                      ? 'Enter your email address'
                      : 'Enter your username'
                  }
                  placeholderTextColor="#64748b"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType={loginMethod === 'email' ? 'email-address' : 'default'}
                  editable={!loading}
                />
              </View>
              {getFieldError('username') ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={14} color="#f87171" />
                  <Text style={styles.errorText}>{getFieldError('username')}</Text>
                </View>
              ) : null}
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View
                style={[
                  styles.inputContainer,
                  getFieldError('password') && styles.inputError,
                ]}
              >
                <Ionicons
                  name="lock-closed"
                  size={20}
                  color="#f87171"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  value={formData.password}
                  onChangeText={(value) => handleChange('password', value)}
                  placeholder="Enter your password"
                  placeholderTextColor="#64748b"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color="#f87171"
                  />
                </TouchableOpacity>
              </View>
              {getFieldError('password') ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={14} color="#f87171" />
                  <Text style={styles.errorText}>{getFieldError('password')}</Text>
                </View>
              ) : null}
            </View>

            {/* Remember Me & Forgot Password */}
            <View style={styles.optionsRow}>
              <TouchableOpacity
                style={styles.rememberMe}
                onPress={() => setRememberMe(!rememberMe)}
                disabled={loading}
              >
                <View
                  style={[
                    styles.checkbox,
                    rememberMe && styles.checkboxChecked,
                  ]}
                >
                  {rememberMe && (
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  )}
                </View>
                <Text style={styles.rememberText}>Remember me</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate('PasswordReset')}
                disabled={loading}
              >
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>
            </View>

            {/* Sign In Button */}
            <TouchableOpacity
              style={[styles.signInButton, loading && styles.signInButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="shield-checkmark" size={20} color="#fff" />
                  <Text style={styles.signInText}>Sign In to MINEMA</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Sign Up Link */}
          <View style={styles.signUpSection}>
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
              <Ionicons name="person-add" size={18} color="#fca5a5" />
              <Text style={styles.signUpText}>Create Emergency Account</Text>
            </TouchableOpacity>
          </View>

          {/* Emergency Contact Info */}
          <View style={styles.emergencyBox}>
            <Ionicons name="warning" size={18} color="#f87171" />
            <View style={styles.emergencyContent}>
              <Text style={styles.emergencyTitle}>Emergency Contacts</Text>
              <Text style={styles.emergencyText}>
                Emergency: <Text style={styles.emergencyBold}>112</Text> | MINEMA:{' '}
                <Text style={styles.emergencyBold}>+250-788-000-000</Text>
              </Text>
            </View>
          </View>

          {/* System Status */}
          <View style={styles.systemStatus}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>System Operational</Text>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              © 2024 MINEMA - Ministry of Emergency Management
            </Text>
            <Text style={styles.footerSubtext}>Republic of Rwanda</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 30,
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
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#fca5a5',
    fontWeight: '600',
    marginBottom: 4,
  },
  subtext: {
    fontSize: 12,
    color: '#94a3b8',
  },
  messageBox: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  successBox: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: 'rgba(74, 222, 128, 0.3)',
  },
  infoBox: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: 'rgba(96, 165, 250, 0.3)',
  },
  messageContent: {
    marginLeft: 8,
    flex: 1,
  },
  messageTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4ade80',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 11,
    color: '#94a3b8',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)',
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  toggleButtonActive: {
    backgroundColor: '#dc2626',
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
    marginLeft: 6,
  },
  toggleTextActive: {
    color: '#fff',
  },
  form: {
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.5)',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
  },
  inputError: {
    borderColor: 'rgba(248, 113, 113, 0.5)',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  passwordInput: {
    paddingRight: 40,
  },
  eyeIcon: {
    position: 'absolute',
    right: 14,
    padding: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  errorText: {
    fontSize: 11,
    color: '#f87171',
    marginLeft: 4,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  rememberMe: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#475569',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: '#dc2626',
    borderColor: '#dc2626',
  },
  rememberText: {
    fontSize: 12,
    color: '#cbd5e1',
    fontWeight: '500',
  },
  forgotText: {
    fontSize: 12,
    color: '#f87171',
    fontWeight: '600',
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dc2626',
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  signInButtonDisabled: {
    opacity: 0.6,
  },
  signInText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 8,
  },
  signUpSection: {
    marginBottom: 16,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(71, 85, 105, 0.5)',
  },
  dividerText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
    paddingHorizontal: 12,
  },
  signUpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.3)',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  signUpText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fca5a5',
    marginLeft: 8,
  },
  emergencyBox: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.3)',
    marginBottom: 16,
  },
  emergencyContent: {
    marginLeft: 8,
    flex: 1,
  },
  emergencyTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fca5a5',
    marginBottom: 4,
  },
  emergencyText: {
    fontSize: 11,
    color: '#fecaca',
  },
  emergencyBold: {
    fontWeight: 'bold',
  },
  systemStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ade80',
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4ade80',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 10,
    color: '#64748b',
  },
});

export default Login;