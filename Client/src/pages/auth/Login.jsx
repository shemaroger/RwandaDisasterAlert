// pages/auth/Login.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AlertTriangle, Eye, EyeOff, User, Lock, Shield, Clock, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading, error, clearError, getRedirectPath } = useAuth();
  
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [rememberMe, setRememberMe] = useState(false);
  const [loginMethod, setLoginMethod] = useState('username'); // 'username' or 'email'

  // Check for redirect message from protected routes or signup
  const fromPath = location.state?.from?.pathname;
  const redirectMessage = location.state?.message;
  const successMessage = location.state?.message;
  const prefillUsername = location.state?.username || location.state?.email;

  useEffect(() => {
    // Clear any existing errors when component mounts
    clearError();
    
    // Pre-fill username/email from signup redirect
    if (prefillUsername) {
      setFormData(prev => ({
        ...prev,
        username: prefillUsername
      }));
      // Detect if it looks like an email
      if (prefillUsername.includes('@')) {
        setLoginMethod('email');
      }
    }
    
    // Check if user was remembered
    const rememberedUser = localStorage.getItem('remember_user');
    if (rememberedUser === 'true') {
      setRememberMe(true);
    }
  }, [clearError, prefillUsername]);

  const validateForm = () => {
    const errors = {};
    
    if (!formData.username) {
      if (loginMethod === 'email') {
        errors.username = 'Email is required';
      } else {
        errors.username = 'Username is required';
      }
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      console.log("Attempting login with username:", formData.username);
      
      const result = await login(formData.username, formData.password, rememberMe);
      
      console.log("Login successful, user type:", result.user?.user_type);
      
      // Get the correct redirect path based on user type
      const userType = result.user?.user_type;
      const redirectPath = getRedirectPath(userType);
      
      console.log("Redirecting to:", redirectPath);
      
      // Redirect to intended page or user-type specific dashboard
      if (fromPath && fromPath !== '/login') {
        console.log("Redirecting to original path:", fromPath);
        navigate(fromPath, { replace: true });
      } else {
        console.log("Redirecting to user-specific dashboard:", redirectPath);
        navigate(redirectPath, { replace: true });
      }
      
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Auto-detect login method based on input
    if (name === 'username') {
      if (value.includes('@')) {
        setLoginMethod('email');
      } else {
        setLoginMethod('username');
      }
    }
    
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Clear global error when user makes changes
    if (error) {
      clearError();
    }
  };

  const getFieldError = (fieldName) => {
    return validationErrors[fieldName] || '';
  };

  const toggleLoginMethod = () => {
    setLoginMethod(prev => prev === 'username' ? 'email' : 'username');
    setFormData(prev => ({ ...prev, username: '' }));
    setValidationErrors({});
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-100">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
            <AlertTriangle className="text-red-600 w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">
            Sign in to RwandaDisasterAlert
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Emergency Management System
          </p>
        </div>

        {/* Success Message (from signup) */}
        {successMessage && successMessage.includes('created successfully') && (
          <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg mb-6 flex items-start">
            <CheckCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Registration Successful</p>
              <p className="text-sm mt-1">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Redirect Message */}
        {redirectMessage && !successMessage && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 p-4 rounded-lg mb-6 flex items-start">
            <Shield className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Access Required</p>
              <p className="text-sm mt-1">{redirectMessage}</p>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6 flex items-start">
            <AlertTriangle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Sign In Failed</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Login Method Toggle */}
        <div className="mb-6">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setLoginMethod('username')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                loginMethod === 'username' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Username
            </button>
            <button
              type="button"
              onClick={() => setLoginMethod('email')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                loginMethod === 'email' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Email
            </button>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username/Email Field */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {loginMethod === 'email' ? 'Email Address' : 'Username'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={loginMethod === 'email' ? 'email' : 'text'}
                name="username"
                value={formData.username}
                onChange={handleChange}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors ${
                  getFieldError('username') 
                    ? 'border-red-300 bg-red-50' 
                    : 'border-gray-300 bg-gray-50'
                }`}
                placeholder={
                  loginMethod === 'email' 
                    ? 'Enter your email address' 
                    : 'Enter your username'
                }
                autoComplete={loginMethod === 'email' ? 'email' : 'username'}
                required
              />
            </div>
            {getFieldError('username') && (
              <p className="text-red-600 text-sm mt-1 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-1" />
                {getFieldError('username')}
              </p>
            )}
          </div>

          {/* Password Field */}
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
                className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors ${
                  getFieldError('password') 
                    ? 'border-red-300 bg-red-50' 
                    : 'border-gray-300 bg-gray-50'
                }`}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            {getFieldError('password') && (
              <p className="text-red-600 text-sm mt-1 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-1" />
                {getFieldError('password')}
              </p>
            )}
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="remember-me"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                Remember me
              </label>
            </div>
            <Link 
              to="/auth/password-reset" 
              className="text-sm text-red-600 hover:text-red-700 font-medium transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold text-lg shadow-lg"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Signing In...
              </div>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="mt-8 mb-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Don't have an account?</span>
            </div>
          </div>
        </div>

        {/* Sign Up Link */}
        <div className="text-center">
          <Link 
            to="/signup" 
            className="inline-flex items-center justify-center w-full py-3 px-4 border border-red-300 rounded-lg text-red-700 bg-red-50 hover:bg-red-100 font-medium transition-colors"
          >
            Create New Account
          </Link>
        </div>

        {/* User Type Info */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-blue-800">Account Access Levels</h4>
              <div className="text-xs text-blue-700 mt-1 space-y-1">
                <p>• <strong>Citizen:</strong> Receive alerts, report incidents, access safety guides</p>
                <p>• <strong>Operator:</strong> Manage incidents, verify reports, and coordinate responses</p>
                <p>• <strong>Authority:</strong> Create alerts, manage emergency operations, and oversee districts</p>
                <p>• <strong>Administrator:</strong> Full system access, user management, and system configuration</p>
              </div>
            </div>
          </div>
        </div>

        {/* Account Verification Notice */}
        <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-start">
            <Clock className="h-5 w-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800">Account Verification</h4>
              <p className="text-xs text-yellow-700 mt-1">
                New accounts may require verification by MINEMA administrators. Citizens have immediate access to alerts and reporting, while operator and authority roles require approval for enhanced system access.
              </p>
            </div>
          </div>
        </div>

        {/* Emergency Contact Info */}
        <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-red-800">Emergency Access</h4>
              <p className="text-xs text-red-700 mt-1">
                In case of emergency, call <strong>112</strong> for immediate assistance or contact MINEMA at <strong>+250-788-000-000</strong>
              </p>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="mt-6 flex items-center justify-center space-x-2 text-xs text-gray-500">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Emergency System Operational</span>
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

export default Login;