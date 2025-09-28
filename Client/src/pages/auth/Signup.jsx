import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, Eye, EyeOff, User, Mail, Lock, Phone, MapPin, Globe, Check, ArrowLeft, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';
import backgroundImage from '../../assets/images/background.jpg';

const Signup = () => {
  const navigate = useNavigate();
  const { register, loading, error } = useAuth();

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
    accepted_terms: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [districts, setDistricts] = useState([]);
  const [loadingDistricts, setLoadingDistricts] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Load districts on component mount
  useEffect(() => {
    setMounted(true);
    const loadDistricts = async () => {
      try {
        // Try to load districts from API if the method exists
        if (apiService && typeof apiService.getDistricts === 'function') {
          const response = await apiService.getDistricts();
          setDistricts(response.results || response);
        } else {
          // Use fallback districts list
          throw new Error('API method not available');
        }
      } catch (error) {
        console.log('Using fallback districts list');
        // Fallback to hardcoded list
        setDistricts([
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
          { id: 'rwamagana', name: 'Rwamagana' }
        ]);
      } finally {
        setLoadingDistricts(false);
      }
    };
    loadDistricts();
  }, []);

  const validateStep1 = () => {
    const errors = {};

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

    // Phone number is optional, so only validate if provided
    if (formData.phone_number?.trim() && !/^\+?[0-9\s\-\(\)]{10,}$/.test(formData.phone_number.trim())) {
      errors.phone_number = 'Please enter a valid phone number (e.g., +250788123456)';
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (currentStep === 1) {
      if (validateStep1()) {
        setCurrentStep(2);
        // Scroll to top of form for better UX
        document.querySelector('form').scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return;
    }

    if (currentStep === 2) {
      if (validateStep2()) {
        try {
          // Prepare data for API (match the backend model fields)
          const registrationData = {
            username: formData.username,
            email: formData.email,
            password: formData.password,
            password_confirm: formData.password_confirm,
            first_name: formData.first_name,
            last_name: formData.last_name,
            phone_number: formData.phone_number || null,
            preferred_language: formData.preferred_language,
            district: formData.district || null
          };

          const result = await register(registrationData);

          // Set success data
          const selectedDistrict = districts.find(d => d.id === formData.district);
          setSuccessData({
            name: `${formData.first_name} ${formData.last_name}`,
            username: formData.username,
            email: formData.email,
            district: selectedDistrict ? selectedDistrict.name : 'Not specified',
            language: formData.preferred_language === 'rw' ? 'Kinyarwanda' :
                      formData.preferred_language === 'en' ? 'English' : 'Français'
          });

          setShowSuccess(true);

          // Auto-redirect after 5 seconds
          setTimeout(() => {
            navigate('/login', {
              state: {
                message: 'Account created successfully! Please sign in to continue.',
                username: formData.username
              }
            });
          }, 5000);
        } catch (err) {
          // Error is handled by AuthContext and displayed via error prop
          console.error('Registration failed:', err);
        }
      }
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

  const handleNextStep = () => {
    if (validateStep1()) {
      setCurrentStep(2);
      // Scroll to top of form for better UX
      document.querySelector('form').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (!mounted) {
    return (
      <div className="fixed inset-0 h-screen w-screen overflow-hidden flex items-center justify-center bg-gradient-to-br from-slate-900 via-red-900 to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-white font-medium">Loading MINEMA Alert...</p>
        </div>
      </div>
    );
  }

  // Success screen component
  if (showSuccess) {
    return (
      <div className="fixed inset-0 h-screen w-screen overflow-hidden bg-gradient-to-br from-slate-900 via-red-900 to-slate-900">
        {/* Background Image */}
        <div className="absolute inset-0 w-full h-full">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40"
            style={{
              backgroundImage: `url(${backgroundImage})`
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-red-900/60 to-slate-900/80" />
        </div>
        {/* Animated Background Elements */}
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute opacity-20 animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            >
              <div className="w-1 h-1 bg-red-400 rounded-full" />
            </div>
          ))}
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-red-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: '2s' }} />
        </div>
        <div className="relative z-10 fixed inset-0 flex items-center justify-center p-4">
          <div className="w-full max-w-lg">
            {/* Success Card */}
            <div className="bg-white/10 backdrop-blur-2xl rounded-2xl p-6 border border-white/20 shadow-2xl text-center">
              {/* Success Icon */}
              <div className="mb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-700/20 border border-green-400/30 shadow-2xl backdrop-blur-sm">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
              </div>
              {/* Success Title */}
              <h1 className="text-2xl font-bold text-white mb-2">Welcome to MINEMA Alert!</h1>
              <p className="text-slate-300 mb-4">
                Your emergency management account has been created successfully
              </p>
              {/* Success Details */}
              <div className="bg-green-500/10 rounded-xl p-4 mb-4 text-left border border-green-400/30 backdrop-blur-sm">
                <h3 className="font-semibold text-green-300 mb-2 flex items-center text-sm">
                  <Check className="w-4 h-4 mr-2" />
                  Account Details
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Name:</span>
                    <span className="font-medium text-white">{successData?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Username:</span>
                    <span className="font-medium text-white">{successData?.username}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Email:</span>
                    <span className="font-medium text-white">{successData?.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">District:</span>
                    <span className="font-medium text-white">{successData?.district}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Language:</span>
                    <span className="font-medium text-white">{successData?.language}</span>
                  </div>
                </div>
              </div>
              {/* Next Steps */}
              <div className="bg-blue-500/10 border border-blue-400/30 rounded-xl p-3 mb-4 text-left backdrop-blur-sm">
                <div className="flex items-start">
                  <AlertTriangle className="h-4 w-4 text-blue-400 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-semibold text-blue-300 mb-1">What's Next?</h4>
                    <ul className="text-xs text-blue-200 space-y-0.5">
                      <li>• Receive emergency alerts for your district</li>
                      <li>• Report incidents and safety concerns</li>
                      <li>• Access safety guides and emergency contacts</li>
                      <li>• Download our mobile app for instant notifications</li>
                    </ul>
                  </div>
                </div>
              </div>
              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  onClick={() => navigate('/login', {
                    state: {
                      message: 'Account created successfully! Please sign in to continue.',
                      username: formData.username
                    }
                  })}
                  className="w-full py-3 px-4 text-sm font-semibold rounded-xl text-white transition-all duration-300 transform hover:scale-[1.02] active:scale-95 shadow-xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.9), rgba(22, 163, 74, 0.9))',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 10px 20px rgba(34, 197, 94, 0.3)'
                  }}
                >
                  Continue to Sign In
                  <ArrowRight className="w-4 h-4 ml-2" />
                </button>

                <button
                  onClick={() => navigate('/')}
                  className="w-full py-2.5 px-4 border border-slate-400/30 rounded-xl text-slate-300 bg-slate-500/10 hover:bg-slate-500/20 font-medium transition-all duration-200 backdrop-blur-sm text-sm"
                >
                  Return to Home
                </button>
              </div>
              {/* Auto-redirect notice */}
              <p className="text-xs text-slate-400 mt-3">
                You'll be automatically redirected to sign in in a few seconds...
              </p>
              {/* Footer */}
              <div className="mt-4 text-center text-xs text-slate-400">
                <p>© 2024 MINEMA - Ministry of Emergency Management</p>
                <p className="mt-0.5 text-slate-500">Republic of Rwanda</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 h-screen w-screen overflow-hidden bg-gradient-to-br from-slate-900 via-red-900 to-slate-900">
      {/* Background Image */}
      <div className="absolute inset-0 w-full h-full">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40"
          style={{
            backgroundImage: `url(${backgroundImage})`
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-red-900/60 to-slate-900/80" />
      </div>
      {/* Animated Background Elements */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute opacity-20 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          >
            <div className="w-1 h-1 bg-red-400 rounded-full" />
          </div>
        ))}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-red-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: '2s' }} />
      </div>
      {/* Main Container */}
      <div className="relative z-10 fixed inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-4">
            <div className="mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-red-500/20 to-red-700/20 backdrop-blur-sm border border-red-400/30 mb-2 shadow-2xl">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white mb-1 tracking-tight">
              Join MINEMA Alert
            </h1>
            <p className="text-red-300/80 font-medium text-sm">
              Create your emergency management account
            </p>
            <p className="text-slate-400 text-xs mt-1">
              Stay informed, stay safe, stay connected
            </p>
          </div>
          {/* Main Form Card */}
          <div className="bg-white/10 backdrop-blur-2xl rounded-2xl p-6 border border-white/20 shadow-2xl">
            {/* Progress Indicator */}
            <div className="mb-4">
              <div className="flex items-center justify-center space-x-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300 ${
                  currentStep >= 1 ? 'bg-red-600 text-white shadow-lg' : 'bg-slate-600/50 text-slate-400'
                }`}>
                  {currentStep > 1 ? <Check className="w-3 h-3" /> : '1'}
                </div>
                <div className={`w-12 h-1 transition-all duration-300 ${currentStep > 1 ? 'bg-red-600' : 'bg-slate-600/50'}`} />
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300 ${
                  currentStep >= 2 ? 'bg-red-600 text-white shadow-lg' : 'bg-slate-600/50 text-slate-400'
                }`}>
                  2
                </div>
              </div>
              <div className="flex justify-between mt-2 text-xs text-slate-400">
                <span>Personal Info</span>
                <span>Security & Terms</span>
              </div>
            </div>
            {/* Error Alert */}
            {error && (
              <div className="mb-4 p-3 rounded-lg border backdrop-blur-md bg-red-500/10 border-red-400/30 text-red-300 flex items-start">
                <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm">Registration Failed</p>
                  <p className="text-xs mt-1 opacity-90">{error}</p>
                </div>
              </div>
            )}
            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {currentStep === 1 ? (
                <>
                  {/* Step 1: Personal Information */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        First Name
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-4 w-4 text-red-400/60" />
                        </div>
                        <input
                          type="text"
                          name="first_name"
                          value={formData.first_name}
                          onChange={handleChange}
                          className={`block w-full pl-9 pr-3 py-2.5 bg-transparent border rounded-lg text-white placeholder-slate-400/60 focus:outline-none focus:ring-0 transition-all duration-300 font-medium backdrop-blur-sm text-sm ${
                            getFieldError('first_name')
                              ? 'border-red-400/50 focus:border-red-400 bg-red-500/5'
                              : 'border-slate-600/50 focus:border-red-500 hover:border-slate-500/70 bg-slate-800/30'
                          }`}
                          placeholder="First name"
                          required
                        />
                      </div>
                      {getFieldError('first_name') && (
                        <p className="mt-1 text-xs text-red-400 flex items-center">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          {getFieldError('first_name')}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Last Name
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-4 w-4 text-red-400/60" />
                        </div>
                        <input
                          type="text"
                          name="last_name"
                          value={formData.last_name}
                          onChange={handleChange}
                          className={`block w-full pl-9 pr-3 py-2.5 bg-transparent border rounded-lg text-white placeholder-slate-400/60 focus:outline-none focus:ring-0 transition-all duration-300 font-medium backdrop-blur-sm text-sm ${
                            getFieldError('last_name')
                              ? 'border-red-400/50 focus:border-red-400 bg-red-500/5'
                              : 'border-slate-600/50 focus:border-red-500 hover:border-slate-500/70 bg-slate-800/30'
                          }`}
                          placeholder="Last name"
                          required
                        />
                      </div>
                      {getFieldError('last_name') && (
                        <p className="mt-1 text-xs text-red-400 flex items-center">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          {getFieldError('last_name')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Username
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-4 w-4 text-red-400/60" />
                      </div>
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        className={`block w-full pl-9 pr-3 py-2.5 bg-transparent border rounded-lg text-white placeholder-slate-400/60 focus:outline-none focus:ring-0 transition-all duration-300 font-medium backdrop-blur-sm text-sm ${
                          getFieldError('username')
                            ? 'border-red-400/50 focus:border-red-400 bg-red-500/5'
                            : 'border-slate-600/50 focus:border-red-500 hover:border-slate-500/70 bg-slate-800/30'
                        }`}
                        placeholder="Choose a username"
                        autoComplete="username"
                        required
                      />
                    </div>
                    {getFieldError('username') && (
                      <p className="mt-1 text-xs text-red-400 flex items-center">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        {getFieldError('username')}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 text-red-400/60" />
                      </div>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`block w-full pl-9 pr-3 py-2.5 bg-transparent border rounded-lg text-white placeholder-slate-400/60 focus:outline-none focus:ring-0 transition-all duration-300 font-medium backdrop-blur-sm text-sm ${
                          getFieldError('email')
                            ? 'border-red-400/50 focus:border-red-400 bg-red-500/5'
                            : 'border-slate-600/50 focus:border-red-500 hover:border-slate-500/70 bg-slate-800/30'
                        }`}
                        placeholder="Enter your email"
                        autoComplete="email"
                        required
                      />
                    </div>
                    {getFieldError('email') && (
                      <p className="mt-1 text-xs text-red-400 flex items-center">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        {getFieldError('email')}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Phone Number <span className="text-slate-400">(Optional)</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-4 w-4 text-red-400/60" />
                      </div>
                      <input
                        type="tel"
                        name="phone_number"
                        value={formData.phone_number}
                        onChange={handleChange}
                        className={`block w-full pl-9 pr-3 py-2.5 bg-transparent border rounded-lg text-white placeholder-slate-400/60 focus:outline-none focus:ring-0 transition-all duration-300 font-medium backdrop-blur-sm text-sm ${
                          getFieldError('phone_number')
                            ? 'border-red-400/50 focus:border-red-400 bg-red-500/5'
                            : 'border-slate-600/50 focus:border-red-500 hover:border-slate-500/70 bg-slate-800/30'
                        }`}
                        placeholder="+250 788 123 456"
                      />
                    </div>
                    {getFieldError('phone_number') && (
                      <p className="mt-1 text-xs text-red-400 flex items-center">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        {getFieldError('phone_number')}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Preferred Language
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Globe className="h-4 w-4 text-red-400/60" />
                        </div>
                        <select
                          name="preferred_language"
                          value={formData.preferred_language}
                          onChange={handleChange}
                          className="block w-full pl-9 pr-3 py-2.5 bg-transparent border rounded-lg text-white focus:outline-none focus:ring-0 transition-all duration-300 font-medium backdrop-blur-sm border-slate-600/50 focus:border-red-500 hover:border-slate-500/70 bg-slate-800/30 text-sm"
                        >
                          <option value="rw" className="bg-slate-800 text-white">Kinyarwanda</option>
                          <option value="en" className="bg-slate-800 text-white">English</option>
                          <option value="fr" className="bg-slate-800 text-white">Français</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        District
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <MapPin className="h-4 w-4 text-red-400/60" />
                        </div>
                        <select
                          name="district"
                          value={formData.district}
                          onChange={handleChange}
                          disabled={loadingDistricts}
                          className="block w-full pl-9 pr-3 py-2.5 bg-transparent border rounded-lg text-white focus:outline-none focus:ring-0 transition-all duration-300 font-medium backdrop-blur-sm border-slate-600/50 focus:border-red-500 hover:border-slate-500/70 bg-slate-800/30 disabled:opacity-50 text-sm"
                        >
                          <option value="" className="bg-slate-800 text-white">
                            {loadingDistricts ? 'Loading districts...' : 'Select District'}
                          </option>
                          {districts.map(district => (
                            <option key={district.id || district.name} value={district.id || district.name} className="bg-slate-800 text-white">
                              {district.name}
                            </option>
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
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 text-red-400/60" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className={`block w-full pl-9 pr-10 py-2.5 bg-transparent border rounded-lg text-white placeholder-slate-400/60 focus:outline-none focus:ring-0 transition-all duration-300 font-medium backdrop-blur-sm text-sm ${
                          getFieldError('password')
                            ? 'border-red-400/50 focus:border-red-400 bg-red-500/5'
                            : 'border-slate-600/50 focus:border-red-500 hover:border-slate-500/70 bg-slate-800/30'
                        }`}
                        placeholder="Create a strong password"
                        autoComplete="new-password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-red-400/60 hover:text-red-400 transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>

                    {/* Password Strength Indicator */}
                    {formData.password && (
                      <div className="mt-2">
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-slate-600/50 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full transition-all ${getPasswordStrengthColor()}`}
                              style={{ width: `${(passwordStrength() / 5) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-400">{getPasswordStrengthText()}</span>
                        </div>
                      </div>
                    )}

                    {getFieldError('password') && (
                      <p className="mt-1 text-xs text-red-400 flex items-center">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        {getFieldError('password')}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 text-red-400/60" />
                      </div>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="password_confirm"
                        value={formData.password_confirm}
                        onChange={handleChange}
                        className={`block w-full pl-9 pr-10 py-2.5 bg-transparent border rounded-lg text-white placeholder-slate-400/60 focus:outline-none focus:ring-0 transition-all duration-300 font-medium backdrop-blur-sm text-sm ${
                          getFieldError('password_confirm')
                            ? 'border-red-400/50 focus:border-red-400 bg-red-500/5'
                            : 'border-slate-600/50 focus:border-red-500 hover:border-slate-500/70 bg-slate-800/30'
                        }`}
                        placeholder="Confirm your password"
                        autoComplete="new-password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-red-400/60 hover:text-red-400 transition-colors"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {getFieldError('password_confirm') && (
                      <p className="mt-1 text-xs text-red-400 flex items-center">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        {getFieldError('password_confirm')}
                      </p>
                    )}
                  </div>
                  {/* Terms and Conditions */}
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <input
                        type="checkbox"
                        id="accepted_terms"
                        name="accepted_terms"
                        checked={formData.accepted_terms}
                        onChange={handleChange}
                        className="mt-0.5 mr-2 h-3.5 w-3.5 text-red-600 focus:ring-red-500 border-slate-600 rounded bg-transparent"
                        required
                      />
                      <label htmlFor="accepted_terms" className="text-xs text-slate-300">
                        I agree to the{' '}
                        <Link to="/terms" className="text-red-400 hover:text-red-300 underline font-medium">
                          Terms & Conditions
                        </Link>{' '}
                        and{' '}
                        <Link to="/privacy" className="text-red-400 hover:text-red-300 underline font-medium">
                          Privacy Policy
                        </Link>
                      </label>
                    </div>
                    {getFieldError('accepted_terms') && (
                      <p className="text-red-400 text-xs flex items-center">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        {getFieldError('accepted_terms')}
                      </p>
                    )}
                    <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-3 backdrop-blur-sm">
                      <div className="flex items-start">
                        <AlertTriangle className="h-4 w-4 text-blue-400 mt-0.5 mr-2 flex-shrink-0" />
                        <div>
                          <h4 className="text-xs font-semibold text-blue-300 mb-1">Important Notice</h4>
                          <p className="text-xs text-blue-200 mt-1">
                            By creating an account, you'll receive emergency alerts and safety notifications.
                            Your information will be used solely for emergency management purposes.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
              {/* Navigation Buttons */}
              <div className="flex space-x-3 mt-4">
                {currentStep === 2 && (
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentStep(1);
                      // Scroll to top of form for better UX
                      document.querySelector('form').scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className="flex-1 py-2.5 px-3 border border-slate-400/30 rounded-lg text-slate-300 bg-slate-500/10 hover:bg-slate-500/20 font-medium transition-all duration-200 backdrop-blur-sm flex items-center justify-center text-sm"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back
                  </button>
                )}

                <button
                  type={currentStep === 1 ? "button" : "submit"}
                  onClick={currentStep === 1 ? handleNextStep : undefined}
                  disabled={loading}
                  className="flex-1 py-2.5 px-3 text-sm font-semibold rounded-lg text-white transition-all duration-300 transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.9), rgba(220, 38, 38, 0.9))',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 10px 20px rgba(239, 68, 68, 0.3)'
                  }}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      {currentStep === 1 ? 'Processing...' : 'Creating...'}
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
            <div className="mt-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-600/50" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-transparent text-slate-400 font-medium">Already have an account?</span>
                </div>
              </div>
              <div className="mt-2 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center w-full py-2 px-3 border border-red-400/30 rounded-lg text-red-300 bg-red-500/10 hover:bg-red-500/20 font-medium transition-all duration-200 backdrop-blur-sm text-sm"
                >
                  Sign In Instead
                </Link>
              </div>
            </div>
          </div>
          {/* Emergency Contact Info */}
          <div className="mt-3 p-3 bg-red-500/10 rounded-lg border border-red-400/30 backdrop-blur-sm">
            <div className="flex items-start">
              <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <h4 className="text-xs font-semibold text-red-300 mb-0.5">Emergency Access</h4>
                <p className="text-xs text-red-200">
                  Emergency: <span className="font-bold">112</span> | MINEMA: <span className="font-bold">+250-788-000-000</span>
                </p>
              </div>
            </div>
          </div>
          {/* Footer */}
          <div className="mt-3 text-center text-xs text-slate-400">
            <p>© 2024 MINEMA - Ministry of Emergency Management</p>
            <p className="mt-0.5 text-slate-500">Republic of Rwanda</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
