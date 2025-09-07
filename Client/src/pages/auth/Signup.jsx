// pages/auth/Signup.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, Eye, EyeOff, User, Mail, Lock, Phone, MapPin, Globe, Check, ArrowLeft, CheckCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Signup = () => {
  const navigate = useNavigate();
  const { register, loading, error } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    password2: '',
    first_name: '',
    last_name: '',
    phone: '',
    preferred_language: 'rw',
    district: '',
    accepted_terms: false
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState(null);

  // Rwanda districts
  const rwandaDistricts = [
    'Bugesera', 'Burera', 'Gakenke', 'Gasabo', 'Gatsibo', 'Gicumbi', 
    'Gisagara', 'Huye', 'Kamonyi', 'Karongi', 'Kayonza', 'Kicukiro', 
    'Kirehe', 'Muhanga', 'Musanze', 'Ngoma', 'Ngororero', 'Nyabihu', 
    'Nyagatare', 'Nyamagabe', 'Nyanza', 'Nyarugenge', 'Nyaruguru', 
    'Rubavu', 'Ruhango', 'Rulindo', 'Rusizi', 'Rutsiro', 'Rwamagana'
  ];

  const validateStep1 = () => {
    const errors = {};
    
    if (!formData.first_name) {
      errors.first_name = 'First name is required';
    } else if (formData.first_name.length < 2) {
      errors.first_name = 'First name must be at least 2 characters';
    }
    
    if (!formData.last_name) {
      errors.last_name = 'Last name is required';
    } else if (formData.last_name.length < 2) {
      errors.last_name = 'Last name must be at least 2 characters';
    }
    
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (formData.phone && !/^\+?[0-9\s\-\(\)]{10,}$/.test(formData.phone)) {
      errors.phone = 'Please enter a valid phone number';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = () => {
    const errors = {};
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = 'Password must contain uppercase, lowercase, and number';
    }
    
    if (!formData.password2) {
      errors.password2 = 'Please confirm your password';
    } else if (formData.password !== formData.password2) {
      errors.password2 = 'Passwords do not match';
    }

    if (!formData.accepted_terms) {
      errors.accepted_terms = 'You must accept the terms and conditions';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (currentStep === 1) {
      if (validateStep1()) {
        setCurrentStep(2);
      }
      return;
    }

    if (!validateStep2()) return;

    try {
      const result = await register(formData);
      
      // Set success data
      setSuccessData({
        name: `${formData.first_name} ${formData.last_name}`,
        email: formData.email,
        district: formData.district || 'Not specified',
        language: formData.preferred_language === 'rw' ? 'Kinyarwanda' : 
                 formData.preferred_language === 'en' ? 'English' : 'Français'
      });
      
      setShowSuccess(true);
      
      // Auto-redirect after 5 seconds
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            message: 'Account created successfully! Please sign in to continue.',
            email: formData.email 
          }
        });
      }, 5000);
      
    } catch (err) {
      // Error is handled by AuthContext and displayed via error prop
      console.error('Registration failed:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const getFieldError = (fieldName) => {
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
    if (strength <= 2) return 'bg-red-500';
    if (strength <= 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    const strength = passwordStrength();
    if (strength <= 2) return 'Weak';
    if (strength <= 3) return 'Medium';
    return 'Strong';
  };

  // Success screen component
  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg border border-gray-100 text-center">
          {/* Success Icon */}
          <div className="bg-green-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
            <CheckCircle className="text-green-600 w-12 h-12" />
          </div>

          {/* Success Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to the Network!</h1>
          <p className="text-lg text-gray-600 mb-6">
            Your account has been created successfully
          </p>

          {/* Success Details */}
          <div className="bg-green-50 rounded-lg p-6 mb-6 text-left">
            <h3 className="font-semibold text-green-800 mb-4 flex items-center">
              <Check className="w-4 h-4 mr-2" />
              Account Details
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Name:</span>
                <span className="font-medium text-gray-900">{successData?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium text-gray-900">{successData?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">District:</span>
                <span className="font-medium text-gray-900">{successData?.district}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Language:</span>
                <span className="font-medium text-gray-900">{successData?.language}</span>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start text-left">
              <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-blue-800">What's Next?</h4>
                <ul className="text-xs text-blue-700 mt-2 space-y-1">
                  <li>• You'll receive emergency alerts for your district</li>
                  <li>• Check your email for account verification (if required)</li>
                  <li>• Sign in to access safety features and settings</li>
                  <li>• Download our mobile app for instant notifications</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => navigate('/login', { 
                state: { 
                  message: 'Account created successfully! Please sign in to continue.',
                  email: formData.email 
                }
              })}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-semibold shadow-lg flex items-center justify-center"
            >
              Continue to Sign In
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
            
            <button
              onClick={() => navigate('/')}
              className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Return to Home
            </button>
          </div>

          {/* Auto-redirect notice */}
          <p className="text-xs text-gray-500 mt-4">
            You'll be automatically redirected to sign in in a few seconds...
          </p>

          {/* Footer */}
          <div className="mt-8 text-center text-xs text-gray-500">
            <p>© 2024 MINEMA - Ministry of Emergency Management</p>
            <p className="mt-1">Republic of Rwanda</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg border border-gray-100">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
            <AlertTriangle className="text-green-600 w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Join the Network</h1>
          <p className="text-gray-600">
            Create your RwandaDisasterAlert account
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Stay informed, stay safe
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep >= 1 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {currentStep > 1 ? <Check className="w-4 h-4" /> : '1'}
            </div>
            <div className={`w-16 h-1 ${currentStep > 1 ? 'bg-green-600' : 'bg-gray-200'}`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep >= 2 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              2
            </div>
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>Personal Info</span>
            <span>Security & Terms</span>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6 flex items-start">
            <AlertTriangle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Registration Failed</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {currentStep === 1 ? (
            <>
              {/* Step 1: Personal Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    First Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${
                        getFieldError('first_name') 
                          ? 'border-red-300 bg-red-50' 
                          : 'border-gray-300 bg-gray-50'
                      }`}
                      placeholder="First name"
                      required
                    />
                  </div>
                  {getFieldError('first_name') && (
                    <p className="text-red-600 text-sm mt-1 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      {getFieldError('first_name')}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Last Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${
                        getFieldError('last_name') 
                          ? 'border-red-300 bg-red-50' 
                          : 'border-gray-300 bg-gray-50'
                      }`}
                      placeholder="Last name"
                      required
                    />
                  </div>
                  {getFieldError('last_name') && (
                    <p className="text-red-600 text-sm mt-1 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      {getFieldError('last_name')}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${
                      getFieldError('email') 
                        ? 'border-red-300 bg-red-50' 
                        : 'border-gray-300 bg-gray-50'
                    }`}
                    placeholder="Enter your email address"
                    autoComplete="email"
                    required
                  />
                </div>
                {getFieldError('email') && (
                  <p className="text-red-600 text-sm mt-1 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    {getFieldError('email')}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number <span className="text-gray-500">(Optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${
                      getFieldError('phone') 
                        ? 'border-red-300 bg-red-50' 
                        : 'border-gray-300 bg-gray-50'
                    }`}
                    placeholder="+250 XXX XXX XXX"
                  />
                </div>
                {getFieldError('phone') && (
                  <p className="text-red-600 text-sm mt-1 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    {getFieldError('phone')}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Preferred Language
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Globe className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      name="preferred_language"
                      value={formData.preferred_language}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    >
                      <option value="rw">Kinyarwanda</option>
                      <option value="en">English</option>
                      <option value="fr">Français</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    District
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      name="district"
                      value={formData.district}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    >
                      <option value="">Select District</option>
                      {rwandaDistricts.map(district => (
                        <option key={district} value={district}>{district}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Step 2: Security & Terms */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${
                      getFieldError('password') 
                        ? 'border-red-300 bg-red-50' 
                        : 'border-gray-300 bg-gray-50'
                    }`}
                    placeholder="Create a strong password"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                
                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all ${getPasswordStrengthColor()}`}
                          style={{ width: `${(passwordStrength() / 5) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-600">{getPasswordStrengthText()}</span>
                    </div>
                  </div>
                )}
                
                {getFieldError('password') && (
                  <p className="text-red-600 text-sm mt-1 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    {getFieldError('password')}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="password2"
                    value={formData.password2}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${
                      getFieldError('password2') 
                        ? 'border-red-300 bg-red-50' 
                        : 'border-gray-300 bg-gray-50'
                    }`}
                    placeholder="Confirm your password"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {getFieldError('password2') && (
                  <p className="text-red-600 text-sm mt-1 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    {getFieldError('password2')}
                  </p>
                )}
              </div>

              {/* Terms and Conditions */}
              <div className="space-y-4">
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="accepted_terms"
                    name="accepted_terms"
                    checked={formData.accepted_terms}
                    onChange={handleChange}
                    className="mt-1 mr-3 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    required
                  />
                  <label htmlFor="accepted_terms" className="text-sm text-gray-700">
                    I agree to the{' '}
                    <Link to="/terms" className="text-green-600 hover:text-green-700 underline font-medium">
                      Terms & Conditions
                    </Link>{' '}
                    and{' '}
                    <Link to="/privacy" className="text-green-600 hover:text-green-700 underline font-medium">
                      Privacy Policy
                    </Link>
                  </label>
                </div>
                {getFieldError('accepted_terms') && (
                  <p className="text-red-600 text-sm flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    {getFieldError('accepted_terms')}
                  </p>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-800">Important Notice</h4>
                      <p className="text-xs text-blue-700 mt-1">
                        By creating an account, you'll receive emergency alerts and safety notifications. 
                        Your information will be used solely for emergency management purposes as outlined 
                        in our privacy policy.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Navigation Buttons */}
          <div className="flex space-x-4">
            {currentStep === 2 && (
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 font-medium transition-colors flex items-center justify-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </button>
            )}
            
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold shadow-lg"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Creating Account...
                </div>
              ) : currentStep === 1 ? (
                'Continue'
              ) : (
                'Create Account'
              )}
            </button>
          </div>
        </form>

        {/* Sign In Link */}
        <div className="mt-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Already have an account?</span>
            </div>
          </div>
          <div className="mt-4 text-center">
            <Link 
              to="/login" 
              className="inline-flex items-center justify-center w-full py-3 px-4 border border-green-300 rounded-lg text-green-700 bg-green-50 hover:bg-green-100 font-medium transition-colors"
            >
              Sign In Instead
            </Link>
          </div>
        </div>

        {/* Emergency Contact Info */}
        <div className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800">Emergency Access</h4>
              <p className="text-xs text-yellow-700 mt-1">
                In case of emergency, call 112 for immediate assistance or contact MINEMA at +250-788-000-000
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-gray-500">
          <p>© 2024 MINEMA - Ministry of Emergency Management</p>
          <p className="mt-1">Republic of Rwanda</p>
        </div>
      </div>
    </div>
  );
};

export default Signup;