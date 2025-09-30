import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../hooks/useAuth';
import apiService from '../services/api';

const { width } = Dimensions.get('window');

// Rwanda districts data
const RWANDA_DISTRICTS = [
  { id: 'bugesera', name: 'Bugesera' },
  { id: 'burera', name: 'Burera' },
  { id: 'gakenke', name: 'Gakenke' },
  { id: 'gasabo', name: 'Gasabo' },
  { id: 'gatsibo', name: 'Gatsibo' },
  { id: 'gicumbi', name: 'Gicumbi' },
  { id: 'gisagara', name: 'Gisagara' },
  { id: 'huye', name: 'Huye' },
  { id: 'kamonyi', name: 'Kamonyi' },
  { id: 'karongi', name: 'Karongi' },
  { id: 'kayonza', name: 'Kayonza' },
  { id: 'kicukiro', name: 'Kicukiro' },
  { id: 'kirehe', name: 'Kirehe' },
  { id: 'muhanga', name: 'Muhanga' },
  { id: 'musanze', name: 'Musanze' },
  { id: 'ngoma', name: 'Ngoma' },
  { id: 'ngororero', name: 'Ngororero' },
  { id: 'nyabihu', name: 'Nyabihu' },
  { id: 'nyagatare', name: 'Nyagatare' },
  { id: 'nyamagabe', name: 'Nyamagabe' },
  { id: 'nyanza', name: 'Nyanza' },
  { id: 'nyarugenge', name: 'Nyarugenge' },
  { id: 'nyaruguru', name: 'Nyaruguru' },
  { id: 'rubavu', name: 'Rubavu' },
  { id: 'ruhango', name: 'Ruhango' },
  { id: 'rulindo', name: 'Rulindo' },
  { id: 'rusizi', name: 'Rusizi' },
  { id: 'rutsiro', name: 'Rutsiro' },
  { id: 'rwamagana', name: 'Rwamagana' },
];

const Signup = ({ navigation }: any) => {
  const { register, loading, error } = useAuth();
  const scrollViewRef = useRef<ScrollView>(null);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    preferred_language: 'rw',
    district: '',
    accepted_terms: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<any>({});
  const [currentStep, setCurrentStep] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);
  const [districts] = useState(RWANDA_DISTRICTS);

  useEffect(() => {
    if (error) {
      Alert.alert('Registration Failed', error);
    }
  }, [error]);

  const validateStep1 = () => {
    const errors: any = {};

    if (!formData.first_name?.trim()) {
      errors.first_name = 'First name is required';
    } else if (formData.first_name.trim().length < 2) {
      errors.first_name = 'First name must be at least 2 characters';
    }

    if (!formData.last_name?.trim()) {
      errors.last_name = 'Last name is required';
    } else if (formData.last_name.trim().length < 2) {
      errors.last_name = 'Last name must be at least 2 characters';
    }

    if (!formData.username?.trim()) {
      errors.username = 'Username is required';
    } else if (formData.username.trim().length < 3) {
      errors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.username.trim())) {
      errors.username = 'Username can only contain letters, numbers, hyphens, and underscores';
    }

    if (!formData.email?.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }

    if (formData.phone_number?.trim() && !/^\+?[0-9\s\-\(\)]{10,}$/.test(formData.phone_number.trim())) {
      errors.phone_number = 'Please enter a valid phone number (e.g., +250788123456)';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = () => {
    const errors: any = {};

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = 'Password must contain uppercase, lowercase, and number';
    }

    if (!formData.password_confirm) {
      errors.password_confirm = 'Please confirm your password';
    } else if (formData.password !== formData.password_confirm) {
      errors.password_confirm = 'Passwords do not match';
    }

    if (!formData.accepted_terms) {
      errors.accepted_terms = 'You must accept the terms and conditions';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (currentStep === 1) {
      if (validateStep1()) {
        setCurrentStep(2);
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      }
      return;
    }

    if (currentStep === 2) {
      if (validateStep2()) {
        try {
          const registrationData = {
            username: formData.username,
            email: formData.email,
            password: formData.password,
            password_confirm: formData.password_confirm,
            first_name: formData.first_name,
            last_name: formData.last_name,
            phone_number: formData.phone_number || null,
            preferred_language: formData.preferred_language,
            district: formData.district || null,
          };

          const result = await register(registrationData);

          const selectedDistrict = districts.find((d) => d.id === formData.district);
          setSuccessData({
            name: `${formData.first_name} ${formData.last_name}`,
            username: formData.username,
            email: formData.email,
            district: selectedDistrict ? selectedDistrict.name : 'Not specified',
            language:
              formData.preferred_language === 'rw'
                ? 'Kinyarwanda'
                : formData.preferred_language === 'en'
                ? 'English'
                : 'Français',
          });

          setShowSuccess(true);

          // Auto-redirect after 5 seconds
          setTimeout(() => {
            navigation.replace('Login', {
              message: 'Account created successfully! Please sign in to continue.',
              username: formData.username,
            });
          }, 5000);
        } catch (err) {
          console.error('Registration failed:', err);
        }
      }
    }
  };

  const handleChange = (name: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (validationErrors[name]) {
      setValidationErrors((prev: any) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const getFieldError = (fieldName: string) => {
    return validationErrors[fieldName] || '';
  };

  const passwordStrength = () => {
    const password = formData.password;
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const getPasswordStrengthColor = () => {
    const strength = passwordStrength();
    if (strength <= 2) return '#ef4444';
    if (strength <= 3) return '#eab308';
    return '#22c55e';
  };

  const getPasswordStrengthText = () => {
    const strength = passwordStrength();
    if (strength <= 2) return 'Weak';
    if (strength <= 3) return 'Medium';
    return 'Strong';
  };

  // Success Screen
  if (showSuccess) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.backgroundGradient} />
        <ScrollView contentContainerStyle={styles.successContainer}>
          <View style={styles.successCard}>
            {/* Success Icon */}
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={64} color="#4ade80" />
            </View>

            {/* Success Title */}
            <Text style={styles.successTitle}>Welcome to MINEMA Alert!</Text>
            <Text style={styles.successSubtitle}>
              Your emergency management account has been created successfully
            </Text>

            {/* Success Details */}
            <View style={styles.successDetails}>
              <View style={styles.successDetailRow}>
                <Text style={styles.successDetailLabel}>Name:</Text>
                <Text style={styles.successDetailValue}>{successData?.name}</Text>
              </View>
              <View style={styles.successDetailRow}>
                <Text style={styles.successDetailLabel}>Username:</Text>
                <Text style={styles.successDetailValue}>{successData?.username}</Text>
              </View>
              <View style={styles.successDetailRow}>
                <Text style={styles.successDetailLabel}>Email:</Text>
                <Text style={styles.successDetailValue}>{successData?.email}</Text>
              </View>
              <View style={styles.successDetailRow}>
                <Text style={styles.successDetailLabel}>District:</Text>
                <Text style={styles.successDetailValue}>{successData?.district}</Text>
              </View>
              <View style={styles.successDetailRow}>
                <Text style={styles.successDetailLabel}>Language:</Text>
                <Text style={styles.successDetailValue}>{successData?.language}</Text>
              </View>
            </View>

            {/* Next Steps */}
            <View style={styles.nextStepsBox}>
              <Ionicons name="information-circle" size={18} color="#60a5fa" />
              <View style={styles.nextStepsContent}>
                <Text style={styles.nextStepsTitle}>What's Next?</Text>
                <Text style={styles.nextStepsText}>
                  • Receive emergency alerts for your district{'\n'}
                  • Report incidents and safety concerns{'\n'}
                  • Access safety guides and emergency contacts{'\n'}
                  • Download our mobile app for instant notifications
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <TouchableOpacity
              style={styles.continueButton}
              onPress={() =>
                navigation.replace('Login', {
                  message: 'Account created successfully! Please sign in to continue.',
                  username: formData.username,
                })
              }
            >
              <Text style={styles.continueButtonText}>Continue to Sign In</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.homeButton}
              onPress={() => navigation.navigate('Home')}
            >
              <Text style={styles.homeButtonText}>Return to Home</Text>
            </TouchableOpacity>

            {/* Auto-redirect notice */}
            <Text style={styles.autoRedirectText}>
              You'll be automatically redirected to sign in in a few seconds...
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Main Signup Form
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.backgroundGradient} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons name="warning" size={40} color="#f87171" />
            </View>
            <Text style={styles.title}>Join MINEMA Alert</Text>
            <Text style={styles.subtitle}>Create your emergency management account</Text>
            <Text style={styles.subtext}>Stay informed, stay safe, stay connected</Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            {/* Progress Indicator */}
            <View style={styles.progressContainer}>
              <View style={styles.progressIndicators}>
                <View
                  style={[
                    styles.progressDot,
                    currentStep >= 1 && styles.progressDotActive,
                  ]}
                >
                  {currentStep > 1 ? (
                    <Ionicons name="checkmark" size={12} color="#fff" />
                  ) : (
                    <Text style={styles.progressDotText}>1</Text>
                  )}
                </View>
                <View
                  style={[
                    styles.progressLine,
                    currentStep > 1 && styles.progressLineActive,
                  ]}
                />
                <View
                  style={[
                    styles.progressDot,
                    currentStep >= 2 && styles.progressDotActive,
                  ]}
                >
                  <Text style={styles.progressDotText}>2</Text>
                </View>
              </View>
              <View style={styles.progressLabels}>
                <Text style={styles.progressLabel}>Personal Info</Text>
                <Text style={styles.progressLabel}>Security & Terms</Text>
              </View>
            </View>

            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <View style={styles.formStep}>
                {/* First Name & Last Name */}
                <View style={styles.inputRow}>
                  <View style={styles.inputHalf}>
                    <Text style={styles.label}>First Name</Text>
                    <View
                      style={[
                        styles.inputContainer,
                        getFieldError('first_name') && styles.inputError,
                      ]}
                    >
                      <Ionicons
                        name="person"
                        size={20}
                        color="#f87171"
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.input}
                        value={formData.first_name}
                        onChangeText={(value) => handleChange('first_name', value)}
                        placeholder="First name"
                        placeholderTextColor="#64748b"
                        autoCapitalize="words"
                        editable={!loading}
                      />
                    </View>
                    {getFieldError('first_name') && (
                      <Text style={styles.errorText}>{getFieldError('first_name')}</Text>
                    )}
                  </View>

                  <View style={styles.inputHalf}>
                    <Text style={styles.label}>Last Name</Text>
                    <View
                      style={[
                        styles.inputContainer,
                        getFieldError('last_name') && styles.inputError,
                      ]}
                    >
                      <Ionicons
                        name="person"
                        size={20}
                        color="#f87171"
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.input}
                        value={formData.last_name}
                        onChangeText={(value) => handleChange('last_name', value)}
                        placeholder="Last name"
                        placeholderTextColor="#64748b"
                        autoCapitalize="words"
                        editable={!loading}
                      />
                    </View>
                    {getFieldError('last_name') && (
                      <Text style={styles.errorText}>{getFieldError('last_name')}</Text>
                    )}
                  </View>
                </View>

                {/* Username */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Username</Text>
                  <View
                    style={[
                      styles.inputContainer,
                      getFieldError('username') && styles.inputError,
                    ]}
                  >
                    <Ionicons
                      name="person"
                      size={20}
                      color="#f87171"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      value={formData.username}
                      onChangeText={(value) => handleChange('username', value)}
                      placeholder="Choose a username"
                      placeholderTextColor="#64748b"
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!loading}
                    />
                  </View>
                  {getFieldError('username') && (
                    <Text style={styles.errorText}>{getFieldError('username')}</Text>
                  )}
                </View>

                {/* Email */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email</Text>
                  <View
                    style={[
                      styles.inputContainer,
                      getFieldError('email') && styles.inputError,
                    ]}
                  >
                    <Ionicons
                      name="mail"
                      size={20}
                      color="#f87171"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      value={formData.email}
                      onChangeText={(value) => handleChange('email', value)}
                      placeholder="Enter your email"
                      placeholderTextColor="#64748b"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!loading}
                    />
                  </View>
                  {getFieldError('email') && (
                    <Text style={styles.errorText}>{getFieldError('email')}</Text>
                  )}
                </View>

                {/* Phone Number */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>
                    Phone Number <Text style={styles.optionalText}>(Optional)</Text>
                  </Text>
                  <View
                    style={[
                      styles.inputContainer,
                      getFieldError('phone_number') && styles.inputError,
                    ]}
                  >
                    <Ionicons
                      name="call"
                      size={20}
                      color="#f87171"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      value={formData.phone_number}
                      onChangeText={(value) => handleChange('phone_number', value)}
                      placeholder="+250 788 123 456"
                      placeholderTextColor="#64748b"
                      keyboardType="phone-pad"
                      editable={!loading}
                    />
                  </View>
                  {getFieldError('phone_number') && (
                    <Text style={styles.errorText}>{getFieldError('phone_number')}</Text>
                  )}
                </View>

                {/* Language & District */}
                <View style={styles.inputRow}>
                  <View style={styles.inputHalf}>
                    <Text style={styles.label}>Language</Text>
                    <View style={styles.pickerContainer}>
                      <Ionicons name="globe" size={20} color="#f87171" style={styles.pickerIcon} />
                      <Picker
                        selectedValue={formData.preferred_language}
                        onValueChange={(value) => handleChange('preferred_language', value)}
                        style={styles.picker}
                        enabled={!loading}
                      >
                        <Picker.Item label="Kinyarwanda" value="rw" />
                        <Picker.Item label="English" value="en" />
                        <Picker.Item label="Français" value="fr" />
                      </Picker>
                    </View>
                  </View>

                  <View style={styles.inputHalf}>
                    <Text style={styles.label}>District</Text>
                    <View style={styles.pickerContainer}>
                      <Ionicons name="location" size={20} color="#f87171" style={styles.pickerIcon} />
                      <Picker
                        selectedValue={formData.district}
                        onValueChange={(value) => handleChange('district', value)}
                        style={styles.picker}
                        enabled={!loading}
                      >
                        <Picker.Item label="Select District" value="" />
                        {districts.map((district) => (
                          <Picker.Item
                            key={district.id}
                            label={district.name}
                            value={district.id}
                          />
                        ))}
                      </Picker>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* Step 2: Security & Terms */}
            {currentStep === 2 && (
              <View style={styles.formStep}>
                {/* Password */}
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
                      placeholder="Create a strong password"
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

                  {/* Password Strength */}
                  {formData.password && (
                    <View style={styles.passwordStrength}>
                      <View style={styles.passwordStrengthBar}>
                        <View
                          style={[
                            styles.passwordStrengthFill,
                            {
                              width: `${(passwordStrength() / 5) * 100}%`,
                              backgroundColor: getPasswordStrengthColor(),
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.passwordStrengthText}>
                        {getPasswordStrengthText()}
                      </Text>
                    </View>
                  )}

                  {getFieldError('password') && (
                    <Text style={styles.errorText}>{getFieldError('password')}</Text>
                  )}
                </View>

                {/* Confirm Password */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Confirm Password</Text>
                  <View
                    style={[
                      styles.inputContainer,
                      getFieldError('password_confirm') && styles.inputError,
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
                      value={formData.password_confirm}
                      onChangeText={(value) => handleChange('password_confirm', value)}
                      placeholder="Confirm your password"
                      placeholderTextColor="#64748b"
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!loading}
                    />
                    <TouchableOpacity
                      style={styles.eyeIcon}
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={loading}
                    >
                      <Ionicons
                        name={showConfirmPassword ? 'eye-off' : 'eye'}
                        size={20}
                        color="#f87171"
                      />
                    </TouchableOpacity>
                  </View>
                  {getFieldError('password_confirm') && (
                    <Text style={styles.errorText}>
                      {getFieldError('password_confirm')}
                    </Text>
                  )}
                </View>

                {/* Terms & Conditions */}
                <View style={styles.termsContainer}>
                  <TouchableOpacity
                    style={styles.checkboxRow}
                    onPress={() =>
                      handleChange('accepted_terms', !formData.accepted_terms)
                    }
                    disabled={loading}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        formData.accepted_terms && styles.checkboxChecked,
                      ]}
                    >
                      {formData.accepted_terms && (
                        <Ionicons name="checkmark" size={14} color="#fff" />
                      )}
                    </View>
                    <Text style={styles.termsText}>
                      I agree to the{' '}
                      <Text style={styles.termsLink}>Terms & Conditions</Text> and{' '}
                      <Text style={styles.termsLink}>Privacy Policy</Text>
                    </Text>
                  </TouchableOpacity>
                  {getFieldError('accepted_terms') && (
                    <Text style={styles.errorText}>
                      {getFieldError('accepted_terms')}
                    </Text>
                  )}

                  <View style={styles.noticeBox}>
                    <Ionicons
                      name="information-circle"
                      size={18}
                      color="#60a5fa"
                    />
                    <View style={styles.noticeContent}>
                      <Text style={styles.noticeTitle}>Important Notice</Text>
                      <Text style={styles.noticeText}>
                        By creating an account, you'll receive emergency alerts and
                        safety notifications. Your information will be used solely for
                        emergency management purposes.
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* Navigation Buttons */}
            <View style={styles.buttonRow}>
              {currentStep === 2 && (
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => {
                    setCurrentStep(1);
                    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
                  }}
                  disabled={loading}
                >
                  <Ionicons name="arrow-back" size={20} color="#cbd5e1" />
                  <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  currentStep === 2 && styles.submitButtonHalf,
                  loading && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {currentStep === 1 ? 'Continue' : 'Create Account'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Sign In Link */}
            <View style={styles.signInSection}>
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>Already have an account?</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={styles.signInButton}
                onPress={() => navigation.navigate('Login')}
                disabled={loading}
              >
                <Text style={styles.signInText}>Sign In Instead</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Emergency Contact Info */}
          <View style={styles.emergencyBox}>
            <Ionicons name="warning" size={18} color="#f87171" />
            <View style={styles.emergencyContent}>
              <Text style={styles.emergencyTitle}>Emergency Access</Text>
              <Text style={styles.emergencyText}>
                Emergency: <Text style={styles.emergencyBold}>112</Text> | MINEMA:{' '}
                <Text style={styles.emergencyBold}>+250-788-000-000</Text>
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
      </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#fca5a5',
    fontWeight: '600',
    marginBottom: 4,
  },
  subtext: {
    fontSize: 11,
    color: '#94a3b8',
  },
  formCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 16,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  progressDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(71, 85, 105, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDotActive: {
    backgroundColor: '#dc2626',
  },
  progressDotText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
  },
  progressLine: {
    width: 48,
    height: 4,
    backgroundColor: 'rgba(71, 85, 105, 0.5)',
    marginHorizontal: 12,
  },
  progressLineActive: {
    backgroundColor: '#dc2626',
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 11,
    color: '#94a3b8',
  },
  formStep: {
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  inputHalf: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 8,
  },
  optionalText: {
    color: '#94a3b8',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.5)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  inputError: {
    borderColor: 'rgba(248, 113, 113, 0.5)',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 13,
    color: '#fff',
    fontWeight: '500',
  },
  passwordInput: {
    paddingRight: 40,
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    padding: 4,
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.5)',
    borderRadius: 12,
    paddingLeft: 12,
    height: 48,
  },
  pickerIcon: {
    marginRight: 8,
  },
  picker: {
    flex: 1,
    color: '#fff',
    fontSize: 13,
  },
  errorText: {
    fontSize: 11,
    color: '#f87171',
    marginTop: 4,
  },
  passwordStrength: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  passwordStrengthBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(71, 85, 105, 0.5)',
    borderRadius: 3,
    marginRight: 8,
    overflow: 'hidden',
  },
  passwordStrengthFill: {
    height: '100%',
    borderRadius: 3,
  },
  passwordStrengthText: {
    fontSize: 11,
    color: '#94a3b8',
  },
  termsContainer: {
    marginTop: 8,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
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
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#dc2626',
    borderColor: '#dc2626',
  },
  termsText: {
    flex: 1,
    fontSize: 11,
    color: '#cbd5e1',
    lineHeight: 16,
  },
  termsLink: {
    color: '#f87171',
    textDecorationLine: 'underline',
  },
  noticeBox: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
  },
  noticeContent: {
    marginLeft: 8,
    flex: 1,
  },
  noticeTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#60a5fa',
    marginBottom: 4,
  },
  noticeText: {
    fontSize: 10,
    color: '#93c5fd',
    lineHeight: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  backButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.3)',
    backgroundColor: 'rgba(71, 85, 105, 0.1)',
  },
  backButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#cbd5e1',
    marginLeft: 6,
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#dc2626',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  submitButtonHalf: {
    flex: 1,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  signInSection: {
    marginTop: 16,
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
  signInButton: {
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.3)',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
  },
  signInText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fca5a5',
  },
  emergencyBox: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.3)',
    marginBottom: 12,
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
  footer: {
    alignItems: 'center',
    marginBottom: 20,
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
  // Success Screen Styles
  successContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  successCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
  },
  successIcon: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 13,
    color: '#cbd5e1',
    marginBottom: 20,
    textAlign: 'center',
  },
  successDetails: {
    width: '100%',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.3)',
    marginBottom: 16,
  },
  successDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  successDetailLabel: {
    fontSize: 12,
    color: '#94a3b8',
  },
  successDetailValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  nextStepsBox: {
    width: '100%',
    flexDirection: 'row',
    padding: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
    marginBottom: 20,
  },
  nextStepsContent: {
    marginLeft: 8,
    flex: 1,
  },
  nextStepsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#60a5fa',
    marginBottom: 6,
  },
  nextStepsText: {
    fontSize: 11,
    color: '#93c5fd',
    lineHeight: 16,
  },
  continueButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22c55e',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  continueButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    marginRight: 8,
  },
  homeButton: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.3)',
    backgroundColor: 'rgba(71, 85, 105, 0.1)',
    alignItems: 'center',
    marginBottom: 12,
  },
  homeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#cbd5e1',
  },
  autoRedirectText: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default Signup;