// screens/auth/SignupScreen.tsx
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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import apiService from '../services/api';

// Types
interface FormData {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  preferred_language: 'rw' | 'en' | 'fr';
  district: string;
  accepted_terms: boolean;
}

interface ValidationErrors {
  [key: string]: string;
}

interface District {
  id: string;
  name: string;
}

const RWANDA_DISTRICTS: District[] = [
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

const SignupScreen = ({ navigation }: any) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showDistrictPicker, setShowDistrictPicker] = useState(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);

  const [formData, setFormData] = useState<FormData>({
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

  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  // Update form field
  const updateField = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Validation functions
  const validateStep1 = (): boolean => {
    const errors: ValidationErrors = {};

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

  const validateStep2 = (): boolean => {
    const errors: ValidationErrors = {};

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

  // Password strength calculator
  const getPasswordStrength = (): number => {
    const password = formData.password;
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const getPasswordStrengthColor = (): string => {
    const strength = getPasswordStrength();
    if (strength <= 2) return '#EF4444';
    if (strength <= 3) return '#F59E0B';
    return '#10B981';
  };

  const getPasswordStrengthText = (): string => {
    const strength = getPasswordStrength();
    if (strength <= 2) return 'Weak';
    if (strength <= 3) return 'Medium';
    return 'Strong';
  };

  // Handle next step
  const handleNext = () => {
    if (validateStep1()) {
      setCurrentStep(2);
    }
  };

  // Handle registration
  const handleRegister = async () => {
    if (!validateStep2()) return;

    setLoading(true);
    try {
      const registrationData = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        password_confirm: formData.password_confirm,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone_number: formData.phone_number || undefined,
        preferred_language: formData.preferred_language,
        district: formData.district || undefined,
      };

      const result = await apiService.register(registrationData);

      Alert.alert(
        'Success!',
        'Your account has been created successfully. Please sign in to continue.',
        [
          {
            text: 'Sign In',
            onPress: () => navigation.replace('Login', { username: formData.username }),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(
        'Registration Failed',
        error?.message || 'An error occurred during registration. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  // Render input field
  const renderInput = (
    field: keyof FormData,
    placeholder: string,
    icon: keyof typeof Ionicons.glyphMap,
    options?: {
      secureTextEntry?: boolean;
      keyboardType?: any;
      autoCapitalize?: any;
      multiline?: boolean;
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
            value={formData[field] as string}
            onChangeText={(value) => updateField(field, value)}
            secureTextEntry={options?.secureTextEntry}
            keyboardType={options?.keyboardType || 'default'}
            autoCapitalize={options?.autoCapitalize || 'none'}
            autoCorrect={false}
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

  // Render step 1 (Personal Info)
  const renderStep1 = () => (
    <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Personal Information</Text>

      <View style={styles.row}>
        {renderInput('first_name', 'First Name', 'person-outline', {
          autoCapitalize: 'words',
        })}
        {renderInput('last_name', 'Last Name', 'person-outline', {
          autoCapitalize: 'words',
        })}
      </View>

      {renderInput('username', 'Username', 'at-outline')}
      {renderInput('email', 'Email', 'mail-outline', {
        keyboardType: 'email-address',
      })}
      {renderInput('phone_number', 'Phone Number (Optional)', 'call-outline', {
        keyboardType: 'phone-pad',
      })}

      {/* District Picker */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>District</Text>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setShowDistrictPicker(true)}
        >
          <Ionicons name="location-outline" size={20} color="#EF4444" />
          <Text style={styles.pickerButtonText}>
            {formData.district
              ? RWANDA_DISTRICTS.find((d) => d.id === formData.district)?.name
              : 'Select District'}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      {/* Language Picker */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Preferred Language</Text>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setShowLanguagePicker(true)}
        >
          <Ionicons name="language-outline" size={20} color="#EF4444" />
          <Text style={styles.pickerButtonText}>
            {formData.preferred_language === 'rw'
              ? 'Kinyarwanda'
              : formData.preferred_language === 'en'
              ? 'English'
              : 'Français'}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      {/* District Picker Modal */}
      {showDistrictPicker && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select District</Text>
            <ScrollView style={styles.modalScroll}>
              {RWANDA_DISTRICTS.map((district) => (
                <TouchableOpacity
                  key={district.id}
                  style={styles.modalItem}
                  onPress={() => {
                    updateField('district', district.id);
                    setShowDistrictPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      formData.district === district.id && styles.modalItemTextSelected,
                    ]}
                  >
                    {district.name}
                  </Text>
                  {formData.district === district.id && (
                    <Ionicons name="checkmark" size={20} color="#EF4444" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowDistrictPicker(false)}
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Language Picker Modal */}
      {showLanguagePicker && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Language</Text>
            {[
              { id: 'rw', name: 'Kinyarwanda' },
              { id: 'en', name: 'English' },
              { id: 'fr', name: 'Français' },
            ].map((lang) => (
              <TouchableOpacity
                key={lang.id}
                style={styles.modalItem}
                onPress={() => {
                  updateField('preferred_language', lang.id);
                  setShowLanguagePicker(false);
                }}
              >
                <Text
                  style={[
                    styles.modalItemText,
                    formData.preferred_language === lang.id && styles.modalItemTextSelected,
                  ]}
                >
                  {lang.name}
                </Text>
                {formData.preferred_language === lang.id && (
                  <Ionicons name="checkmark" size={20} color="#EF4444" />
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowLanguagePicker(false)}
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );

  // Render step 2 (Security)
  const renderStep2 = () => (
    <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Security & Terms</Text>

      {/* Password */}
      <View style={styles.inputContainer}>
        <View style={[styles.inputWrapper, validationErrors.password && styles.inputError]}>
          <Ionicons name="lock-closed-outline" size={20} color="#EF4444" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#94A3B8"
            value={formData.password}
            onChangeText={(value) => updateField('password', value)}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#94A3B8"
            />
          </TouchableOpacity>
        </View>

        {/* Password Strength */}
        {formData.password.length > 0 && (
          <View style={styles.passwordStrength}>
            <View style={styles.passwordStrengthBar}>
              <View
                style={[
                  styles.passwordStrengthFill,
                  {
                    width: `${(getPasswordStrength() / 5) * 100}%`,
                    backgroundColor: getPasswordStrengthColor(),
                  },
                ]}
              />
            </View>
            <Text style={[styles.passwordStrengthText, { color: getPasswordStrengthColor() }]}>
              {getPasswordStrengthText()}
            </Text>
          </View>
        )}

        {validationErrors.password && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={14} color="#EF4444" />
            <Text style={styles.errorText}>{validationErrors.password}</Text>
          </View>
        )}
      </View>

      {/* Confirm Password */}
      <View style={styles.inputContainer}>
        <View
          style={[styles.inputWrapper, validationErrors.password_confirm && styles.inputError]}
        >
          <Ionicons name="lock-closed-outline" size={20} color="#EF4444" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            placeholderTextColor="#94A3B8"
            value={formData.password_confirm}
            onChangeText={(value) => updateField('password_confirm', value)}
            secureTextEntry={!showConfirmPassword}
            autoCapitalize="none"
          />
          <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
            <Ionicons
              name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#94A3B8"
            />
          </TouchableOpacity>
        </View>
        {validationErrors.password_confirm && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={14} color="#EF4444" />
            <Text style={styles.errorText}>{validationErrors.password_confirm}</Text>
          </View>
        )}
      </View>

      {/* Terms Checkbox */}
      <TouchableOpacity
        style={styles.checkboxContainer}
        onPress={() => updateField('accepted_terms', !formData.accepted_terms)}
      >
        <View style={[styles.checkbox, formData.accepted_terms && styles.checkboxChecked]}>
          {formData.accepted_terms && <Ionicons name="checkmark" size={16} color="#FFF" />}
        </View>
        <Text style={styles.checkboxText}>
          I agree to the{' '}
          <Text style={styles.link}>Terms & Conditions</Text> and{' '}
          <Text style={styles.link}>Privacy Policy</Text>
        </Text>
      </TouchableOpacity>
      {validationErrors.accepted_terms && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={14} color="#EF4444" />
          <Text style={styles.errorText}>{validationErrors.accepted_terms}</Text>
        </View>
      )}

      {/* Important Notice */}
      <View style={styles.noticeBox}>
        <Ionicons name="information-circle-outline" size={20} color="#3B82F6" />
        <View style={styles.noticeContent}>
          <Text style={styles.noticeTitle}>Important Notice</Text>
          <Text style={styles.noticeText}>
            By creating an account, you'll receive emergency alerts and safety notifications. Your
            information will be used solely for emergency management purposes.
          </Text>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <StatusBar style="light" />

      <LinearGradient colors={['#0F172A', '#DC2626', '#0F172A']} style={styles.gradient}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons name="alert-circle" size={48} color="#EF4444" />
            </View>
            <Text style={styles.title}>Join MINEMA Alert</Text>
            <Text style={styles.subtitle}>Create your emergency management account</Text>
          </View>

          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <View style={styles.progressDots}>
              <View style={[styles.progressDot, currentStep >= 1 && styles.progressDotActive]}>
                {currentStep > 1 ? (
                  <Ionicons name="checkmark" size={16} color="#FFF" />
                ) : (
                  <Text style={styles.progressDotText}>1</Text>
                )}
              </View>
              <View style={[styles.progressLine, currentStep > 1 && styles.progressLineActive]} />
              <View style={[styles.progressDot, currentStep >= 2 && styles.progressDotActive]}>
                <Text style={styles.progressDotText}>2</Text>
              </View>
            </View>
            <View style={styles.progressLabels}>
              <Text style={styles.progressLabel}>Personal Info</Text>
              <Text style={styles.progressLabel}>Security & Terms</Text>
            </View>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {currentStep === 1 ? renderStep1() : renderStep2()}
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            {currentStep === 2 && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setCurrentStep(1)}
                disabled={loading}
              >
                <Ionicons name="arrow-back" size={20} color="#FFF" />
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.nextButton, currentStep === 2 && styles.nextButtonSingle]}
              onPress={currentStep === 1 ? handleNext : handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Text style={styles.nextButtonText}>
                    {currentStep === 1 ? 'Continue' : 'Create Account'}
                  </Text>
                  {currentStep === 1 && <Ionicons name="arrow-forward" size={20} color="#FFF" />}
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Sign In Link */}
          <TouchableOpacity
            style={styles.signInLink}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.signInLinkText}>
              Already have an account? <Text style={styles.signInLinkBold}>Sign In</Text>
            </Text>
          </TouchableOpacity>

          {/* Emergency Contact */}
          <View style={styles.emergencyContainer}>
            <Ionicons name="warning-outline" size={16} color="#EF4444" />
            <Text style={styles.emergencyText}>
              Emergency: <Text style={styles.emergencyBold}>112</Text> | MINEMA:{' '}
              <Text style={styles.emergencyBold}>+250-788-000-000</Text>
            </Text>
          </View>
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
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  logoContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  progressDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(148, 163, 184, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDotActive: {
    backgroundColor: '#EF4444',
  },
  progressDotText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  progressLine: {
    width: 48,
    height: 2,
    backgroundColor: 'rgba(148, 163, 184, 0.3)',
  },
  progressLineActive: {
    backgroundColor: '#EF4444',
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  formContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  inputContainer: {
    marginBottom: 16,
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E2E8F0',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
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
    fontSize: 14,
    fontWeight: '500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginLeft: 4,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  pickerButtonText: {
    flex: 1,
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 12,
  },
  passwordStrength: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  passwordStrengthBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(148, 163, 184, 0.3)',
    borderRadius: 2,
    marginRight: 8,
  },
  passwordStrengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  passwordStrengthText: {
    fontSize: 12,
    fontWeight: '600',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: 'rgba(148, 163, 184, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  checkboxText: {
    flex: 1,
    fontSize: 13,
    color: '#E2E8F0',
    lineHeight: 18,
  },
  link: {
    color: '#EF4444',
    fontWeight: '600',
  },
  noticeBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  noticeContent: {
    flex: 1,
    marginLeft: 12,
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#60A5FA',
    marginBottom: 4,
  },
  noticeText: {
    fontSize: 12,
    color: '#93C5FD',
    lineHeight: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  backButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.3)',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  backButtonText: {
    color: '#E2E8F0',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  nextButtonSingle: {
    flex: 1,
  },
  nextButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  signInLink: {
    alignItems: 'center',
    marginBottom: 16,
  },
  signInLinkText: {
    fontSize: 14,
    color: '#94A3B8',
  },
  signInLinkBold: {
    color: '#EF4444',
    fontWeight: '600',
  },
  emergencyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    gap: 8,
  },
  emergencyText: {
    fontSize: 12,
    color: '#FCA5A5',
  },
  emergencyBold: {
    fontWeight: '700',
    color: '#FEE2E2',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalScroll: {
    maxHeight: 300,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.2)',
  },
  modalItemText: {
    fontSize: 16,
    color: '#E2E8F0',
  },
  modalItemTextSelected: {
    color: '#EF4444',
    fontWeight: '600',
  },
  modalCloseButton: {
    marginTop: 16,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SignupScreen;