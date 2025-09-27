import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AlertTriangle, Eye, EyeOff, User, Lock, Shield, Clock, CheckCircle, Mail, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import backgroundImage from '../../assets/images/background.jpg';

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
  const [loginMethod, setLoginMethod] = useState('username');
  const [mounted, setMounted] = useState(false);

  // Check for redirect message from protected routes or signup
  const fromPath = location.state?.from?.pathname;
  const redirectMessage = location.state?.message;
  const successMessage = location.state?.message;
  const prefillUsername = location.state?.username || location.state?.email;

  // Helper function to check if a route is accessible to a user type
  const checkRouteAccess = (path, userType) => {
    const routeAccess = {
      '/admin': ['admin'],
      '/admin/dashboard': ['admin'],
      '/admin/users': ['admin'],
      '/admin/system': ['admin'],
      '/operator': ['admin', 'operator'],
      '/operator/dashboard': ['admin', 'operator'],
      '/operator/incidents': ['admin', 'operator'],
      '/authority': ['admin', 'authority'],
      '/authority/dashboard': ['admin', 'authority'],
      '/authority/alerts': ['admin', 'authority'],
      '/citizen': ['admin', 'citizen'],
      '/citizen/dashboard': ['admin', 'citizen'],
      '/dashboard': ['admin', 'authority', 'operator', 'citizen'],
    };
    for (const [route, allowedTypes] of Object.entries(routeAccess)) {
      if (path.startsWith(route)) {
        return allowedTypes.includes(userType);
      }
    }
    return true;
  };

  useEffect(() => {
    setMounted(true);
    clearError();
    sessionStorage.removeItem('navigationState');
    localStorage.removeItem('lastVisitedPath');

    if (prefillUsername) {
      setFormData(prev => ({
        ...prev,
        username: prefillUsername
      }));
      if (prefillUsername.includes('@')) {
        setLoginMethod('email');
      }
    }

    const rememberedUser = localStorage.getItem('remember_user');
    if (rememberedUser === 'true') {
      setRememberMe(true);
    }
  }, [clearError, prefillUsername]);

  const validateForm = () => {
    const errors = {};

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;
    try {
      console.log("Attempting login with username:", formData.username);

      sessionStorage.removeItem('navigationState');
      localStorage.removeItem('lastVisitedPath');

      const result = await login(formData.username, formData.password, rememberMe);

      console.log("Login successful, user type:", result.user?.user_type);

      const userType = result.user?.user_type;
      const redirectPath = getRedirectPath(userType);

      console.log("Checking redirect path. FromPath:", fromPath, "UserType:", userType);

      if (fromPath && fromPath !== '/login' && fromPath !== '/logout') {
        const canAccessFromPath = checkRouteAccess(fromPath, userType);

        if (canAccessFromPath) {
          console.log("User can access original path, redirecting to:", fromPath);
          navigate(fromPath, { replace: true, state: null });
        } else {
          console.log("User cannot access original path, redirecting to role-specific dashboard:", redirectPath);
          navigate(redirectPath, { replace: true, state: null });
        }
      } else {
        console.log("No valid fromPath, redirecting to user-specific dashboard:", redirectPath);
        navigate(redirectPath, { replace: true, state: null });
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

    if (name === 'username') {
      if (value.includes('@')) {
        setLoginMethod('email');
      } else {
        setLoginMethod('username');
      }
    }

    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    if (error) {
      clearError();
    }
  };

  const getFieldError = (fieldName) => {
    return validationErrors[fieldName] || '';
  };

  if (!mounted) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-red-900 to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-white font-medium">Loading MINEMA Alert...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-gradient-to-br from-slate-900 via-red-900 to-slate-900">
      {/* Background Image */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40"
          style={{
            backgroundImage: `url(${backgroundImage})`
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-red-900/60 to-slate-900/80" />
      </div>

      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute inset-0">
          {[...Array(30)].map((_, i) => (
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
        </div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: '2s' }} />
      </div>

      {/* Main Container - Full Screen */}
      <div className="relative z-10 min-h-screen w-full flex items-center justify-center p-4">
        <div className="w-full max-w-md mx-auto">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-red-500/20 to-red-700/20 backdrop-blur-sm border border-red-400/30 mb-4 shadow-2xl">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
              MINEMA Alert
            </h1>
            <p className="text-red-300/80 font-medium text-sm">
              Emergency Management System
            </p>
            <p className="text-slate-400 text-xs mt-1">
              Ministry of Emergency Management - Rwanda
            </p>
          </div>

          {/* Success Message */}
          {successMessage && successMessage.includes('created successfully') && (
            <div className="mb-6 p-4 rounded-xl border backdrop-blur-md bg-green-500/10 border-green-400/30 text-green-300 flex items-start">
              <CheckCircle className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm">Registration Successful</p>
                <p className="text-xs mt-1 opacity-90">{successMessage}</p>
              </div>
            </div>
          )}

          {/* Redirect Message */}
          {redirectMessage && !successMessage && (
            <div className="mb-6 p-4 rounded-xl border backdrop-blur-md bg-blue-500/10 border-blue-400/30 text-blue-300 flex items-start">
              <Shield className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm">Access Required</p>
                <p className="text-xs mt-1 opacity-90">{redirectMessage}</p>
              </div>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 rounded-xl border backdrop-blur-md bg-red-500/10 border-red-400/30 text-red-300 flex items-start">
              <AlertTriangle className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm">Sign In Failed</p>
                <p className="text-xs mt-1 opacity-90">{error}</p>
              </div>
            </div>
          )}

          {/* Login Method Toggle */}
          <div className="mb-6">
            <div className="flex bg-slate-800/50 backdrop-blur-sm rounded-xl p-1 border border-slate-700/50">
              <button
                type="button"
                onClick={() => setLoginMethod('username')}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                  loginMethod === 'username'
                    ? 'bg-red-600 text-white shadow-lg'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <User className="w-4 h-4 inline mr-2" />
                Username
              </button>
              <button
                type="button"
                onClick={() => setLoginMethod('email')}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                  loginMethod === 'email'
                    ? 'bg-red-600 text-white shadow-lg'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Mail className="w-4 h-4 inline mr-2" />
                Email
              </button>
            </div>
          </div>

          {/* Login Form - Transparent Background */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username/Email Input */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                {loginMethod === 'email' ? 'Email Address' : 'Username'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                  {loginMethod === 'email' ? (
                    <Mail className="h-5 w-5 text-red-400/60" />
                  ) : (
                    <User className="h-5 w-5 text-red-400/60" />
                  )}
                </div>
                <input
                  type={loginMethod === 'email' ? 'email' : 'text'}
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  disabled={loading}
                  className={`block w-full pl-12 pr-4 py-4 bg-transparent border-2 rounded-xl text-white placeholder-slate-400/60 focus:outline-none focus:ring-0 transition-all duration-300 font-medium backdrop-blur-sm ${
                    getFieldError('username')
                      ? 'border-red-400/50 focus:border-red-400 bg-red-500/5'
                      : 'border-slate-600/50 focus:border-red-500 hover:border-slate-500/70 bg-slate-800/30'
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
                <p className="mt-2 text-xs text-red-400 flex items-center">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {getFieldError('username')}
                </p>
              )}
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                  <Lock className="h-5 w-5 text-red-400/60" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  className={`block w-full pl-12 pr-12 py-4 bg-transparent border-2 rounded-xl text-white placeholder-slate-400/60 focus:outline-none focus:ring-0 transition-all duration-300 font-medium backdrop-blur-sm ${
                    getFieldError('password')
                      ? 'border-red-400/50 focus:border-red-400 bg-red-500/5'
                      : 'border-slate-600/50 focus:border-red-500 hover:border-slate-500/70 bg-slate-800/30'
                  }`}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  disabled={loading}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center disabled:cursor-not-allowed z-10"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-red-400/60 hover:text-red-400 transition-colors" />
                  ) : (
                    <Eye className="h-5 w-5 text-red-400/60 hover:text-red-400 transition-colors" />
                  )}
                </button>
              </div>
              {getFieldError('password') && (
                <p className="mt-2 text-xs text-red-400 flex items-center">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {getFieldError('password')}
                </p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="remember-me"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading}
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-slate-600 rounded bg-transparent"
                />
                <label htmlFor="remember-me" className="ml-2 text-slate-300 font-medium">
                  Remember me
                </label>
              </div>
              <Link
                to="/auth/password-reset"
                className="text-red-400 hover:text-red-300 font-medium transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-base font-semibold rounded-xl text-white transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-2xl"
              style={{
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.9), rgba(220, 38, 38, 0.9))',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 20px 40px rgba(239, 68, 68, 0.3)'
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <Shield className="h-5 w-5 mr-2" />
                  Sign In to MINEMA
                </>
              )}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-600/50" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-transparent text-slate-400 font-medium">Don't have an account?</span>
              </div>
            </div>

            <div className="mt-4">
              <Link
                to="/signup"
                className="w-full inline-flex items-center justify-center py-3 px-4 border border-red-400/30 rounded-xl text-red-300 bg-red-500/10 hover:bg-red-500/20 font-medium transition-all duration-200 backdrop-blur-sm"
              >
                <User className="h-4 w-4 mr-2" />
                Create Emergency Account
              </Link>
            </div>
          </div>

          {/* Emergency Contact Info */}
          <div className="mt-4 p-4 bg-red-500/10 rounded-xl border border-red-400/30 backdrop-blur-sm">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-red-300 mb-1">Emergency Contacts</h4>
                <p className="text-xs text-red-200">
                  Emergency: <span className="font-bold">112</span> | MINEMA Operations: <span className="font-bold">+250-788-000-000</span>
                </p>
              </div>
            </div>
          </div>

          {/* System Status */}
          <div className="mt-6 flex items-center justify-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-sm shadow-green-400/50"></div>
              <span className="text-xs font-medium text-green-400">Emergency System Operational</span>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center text-xs text-slate-400">
            <p>© 2024 MINEMA - Ministry of Emergency Management</p>
            <p className="mt-1 text-slate-500">Republic of Rwanda</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
