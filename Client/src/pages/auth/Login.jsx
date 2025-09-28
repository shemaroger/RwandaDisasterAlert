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

  const fromPath = location.state?.from?.pathname;
  const redirectMessage = location.state?.message;
  const successMessage = location.state?.message;
  const prefillUsername = location.state?.username || location.state?.email;

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
      <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-red-900 to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-white font-medium">Loading MINEMA Alert...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 h-screen w-screen overflow-hidden bg-gradient-to-br from-slate-900 via-red-900 to-slate-900">
      {/* Background Image */}
      <div className="absolute inset-0 w-full h-full">
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat opacity-40"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-slate-900/80 via-red-900/60 to-slate-900/80" />
      </div>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        <>
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
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </>
      </div>

      {/* Main Container - Full Screen Fixed */}
      <div className="relative z-10 fixed inset-0 flex flex-col items-center justify-center p-4">
        {/* Login Card - Full Screen Centered */}
        <div className="w-full max-w-md flex flex-col items-center justify-center">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-red-500/20 to-red-700/20 backdrop-blur-sm border border-red-400/30 mb-2 shadow-2xl">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white mb-1 tracking-tight">
              MINEMA Alert
            </h1>
            <p className="text-red-300/80 font-medium text-sm">
              Emergency Management System
            </p>
            <p className="text-slate-400 text-xs mt-1">
              Ministry of Emergency Management - Rwanda
            </p>
          </div>

          {/* Messages and Form Container - Fixed Layout */}
          <div className="w-full max-w-md">
            {/* Success Message */}
            {successMessage && successMessage.includes('created successfully') && (
              <div className="mb-4 p-3 rounded-lg border backdrop-blur-md bg-green-500/10 border-green-400/30 text-green-300 flex items-start">
                <CheckCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm">Registration Successful</p>
                  <p className="text-xs mt-1 opacity-90">{successMessage}</p>
                </div>
              </div>
            )}

            {/* Redirect Message */}
            {redirectMessage && !successMessage && (
              <div className="mb-4 p-3 rounded-lg border backdrop-blur-md bg-blue-500/10 border-blue-400/30 text-blue-300 flex items-start">
                <Shield className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm">Access Required</p>
                  <p className="text-xs mt-1 opacity-90">{redirectMessage}</p>
                </div>
              </div>
            )}

            {/* Error Alert */}
            {error && (
              <div className="mb-4 p-3 rounded-lg border backdrop-blur-md bg-red-500/10 border-red-400/30 text-red-300 flex items-start">
                <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm">Sign In Failed</p>
                  <p className="text-xs mt-1 opacity-90">{error}</p>
                </div>
              </div>
            )}

            {/* Login Method Toggle */}
            <div className="mb-3">
              <div className="flex bg-slate-800/50 backdrop-blur-sm rounded-lg p-1 border border-slate-700/50">
                <button
                  type="button"
                  onClick={() => setLoginMethod('username')}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all duration-200 ${
                    loginMethod === 'username'
                      ? 'bg-red-600 text-white shadow-lg'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <User className="w-4 h-4 inline mr-1.5" />
                  Username
                </button>
                <button
                  type="button"
                  onClick={() => setLoginMethod('email')}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all duration-200 ${
                    loginMethod === 'email'
                      ? 'bg-red-600 text-white shadow-lg'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <Mail className="w-4 h-4 inline mr-1.5" />
                  Email
                </button>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Username/Email Input */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1">
                  {loginMethod === 'email' ? 'Email Address' : 'Username'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
                    {loginMethod === 'email' ? (
                      <Mail className="h-4 w-4 text-red-400/60" />
                    ) : (
                      <User className="h-4 w-4 text-red-400/60" />
                    )}
                  </div>
                  <input
                    type={loginMethod === 'email' ? 'email' : 'text'}
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    disabled={loading}
                    className={`block w-full pl-10 pr-3.5 py-2.5 bg-transparent border rounded-lg text-white placeholder-slate-400/60 focus:outline-none focus:ring-0 transition-all duration-300 font-medium backdrop-blur-sm text-sm ${
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
                  <p className="mt-1 text-xs text-red-400 flex items-center">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    {getFieldError('username')}
                  </p>
                )}
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
                    <Lock className="h-4 w-4 text-red-400/60" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={loading}
                    className={`block w-full pl-10 pr-10 py-2.5 bg-transparent border rounded-lg text-white placeholder-slate-400/60 focus:outline-none focus:ring-0 transition-all duration-300 font-medium backdrop-blur-sm text-sm ${
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
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center disabled:cursor-not-allowed z-10"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-red-400/60 hover:text-red-400 transition-colors" />
                    ) : (
                      <Eye className="h-4 w-4 text-red-400/60 hover:text-red-400 transition-colors" />
                    )}
                  </button>
                </div>
                {getFieldError('password') && (
                  <p className="mt-1 text-xs text-red-400 flex items-center">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    {getFieldError('password')}
                  </p>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="remember-me"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={loading}
                    className="h-3.5 w-3.5 text-red-600 focus:ring-red-500 border-slate-600 rounded bg-transparent"
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
                className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-semibold rounded-lg text-white transition-all duration-300 transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.9), rgba(220, 38, 38, 0.9))',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 10px 20px rgba(239, 68, 68, 0.2)'
                }}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Sign In to MINEMA
                  </>
                )}
              </button>
            </form>

            {/* Sign Up Link */}
            <div className="mt-3">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-600/50" />
                </div>
                <div className="relative flex justify-center text-xs my-1.5">
                  <span className="px-3 bg-transparent text-slate-400 font-medium">Don't have an account?</span>
                </div>
              </div>
              <div className="mt-1.5">
                <Link
                  to="/signup"
                  className="w-full inline-flex items-center justify-center py-2 px-4 border border-red-400/30 rounded-lg text-red-300 bg-red-500/10 hover:bg-red-500/20 font-medium transition-all duration-200 backdrop-blur-sm text-sm"
                >
                  <User className="h-3.5 w-3.5 mr-1.5" />
                  Create Emergency Account
                </Link>
              </div>
            </div>

            {/* Emergency Contact Info */}
            <div className="mt-2 p-2.5 bg-red-500/10 rounded-lg border border-red-400/30 backdrop-blur-sm text-xs">
              <div className="flex items-start">
                <AlertTriangle className="h-3.5 w-3.5 text-red-400 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-semibold text-red-300 mb-0.5">Emergency Contacts</h4>
                  <p className="text-red-200 text-xs">
                    Emergency: <span className="font-bold">112</span> | MINEMA: <span className="font-bold">+250-788-000-000</span>
                  </p>
                </div>
              </div>
            </div>

            {/* System Status */}
            <div className="mt-2 flex items-center justify-center space-x-2">
              <div className="flex items-center space-x-1.5">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse shadow-sm shadow-green-400/50"></div>
                <span className="text-xs font-medium text-green-400">System Operational</span>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-2 text-center text-xs text-slate-400">
              <p>© 2024 MINEMA - Ministry of Emergency Management</p>
              <p className="mt-0.5 text-slate-500">Republic of Rwanda</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;