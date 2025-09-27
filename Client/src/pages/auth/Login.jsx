import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AlertTriangle, Eye, EyeOff, User, Lock, Shield, Clock, CheckCircle, Mail, Loader2, ArrowRight, Globe, MapPin, Users, Activity } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import backgroundImage from '../../assets/images/backgroud.jpg';

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-red-900 to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-500 mx-auto mb-6"></div>
          <p className="text-white font-semibold text-lg">Loading MINEMA Alert...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      {/* Full Screen Background */}
      <div className="absolute inset-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${backgroundImage})`
          }}
        />
        {/* Overlay gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-red-900/90 to-slate-900/95" />
        <div className="absolute inset-0 bg-gradient-to-r from-red-600/30 via-transparent to-orange-600/30" />
      </div>

      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {/* Large floating shapes */}
        <div className="absolute top-10 left-10 w-96 h-96 bg-red-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 right-10 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-10 left-1/3 w-72 h-72 bg-yellow-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        {/* Particle effects */}
        <div className="absolute inset-0">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute opacity-20 animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 4}s`,
                animationDuration: `${3 + Math.random() * 3}s`
              }}
            >
              <div className="w-1 h-1 bg-red-400 rounded-full shadow-lg shadow-red-400/50" />
            </div>
          ))}
        </div>
      </div>

      {/* Main Layout - Full Screen Grid */}
      <div className="relative z-10 min-h-screen grid lg:grid-cols-2">
        
        {/* Left Panel - Branding & Hero */}
        <div className="hidden lg:flex flex-col justify-between p-12 xl:p-16">
          {/* Top Brand Section */}
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500/30 to-red-700/30 rounded-xl border border-red-400/40 flex items-center justify-center backdrop-blur-sm">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <div className="text-white font-bold text-lg">MINEMA Alert</div>
              <div className="text-red-300/80 text-sm">Emergency Management</div>
            </div>
          </div>

          {/* Center Hero Content */}
          <div className="text-center max-w-lg mx-auto">
            {/* Large Icon */}
            <div className="mb-12">
              <div className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-red-500/20 to-red-700/20 rounded-3xl border border-red-400/30 backdrop-blur-xl shadow-2xl">
                <AlertTriangle className="w-16 h-16 text-red-400" />
              </div>
            </div>
            
            {/* Hero Text */}
            <h1 className="text-6xl xl:text-7xl font-bold text-white mb-8 leading-none">
              Protecting
              <span className="text-red-400 block mt-2">Rwanda</span>
            </h1>
            
            <p className="text-xl xl:text-2xl text-slate-300 font-light mb-12 leading-relaxed">
              Advanced emergency preparedness, rapid response coordination, and community safety initiatives for all districts.
            </p>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 gap-6 max-w-sm mx-auto">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-left">
                <Clock className="w-8 h-8 text-red-400 mb-3" />
                <h3 className="text-white font-semibold mb-2">24/7 Emergency Response</h3>
                <p className="text-slate-400 text-sm">Round-the-clock monitoring and rapid emergency response across all Rwanda districts.</p>
              </div>
              
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-left">
                <Users className="w-8 h-8 text-orange-400 mb-3" />
                <h3 className="text-white font-semibold mb-2">Community Safety</h3>
                <p className="text-slate-400 text-sm">Connecting citizens, authorities, and emergency services for comprehensive safety coverage.</p>
              </div>
              
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-left">
                <Activity className="w-8 h-8 text-green-400 mb-3" />
                <h3 className="text-white font-semibold mb-2">Real-time Alerts</h3>
                <p className="text-slate-400 text-sm">Instant emergency notifications and safety updates delivered to your community.</p>
              </div>
            </div>
          </div>

          {/* Bottom Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <MapPin className="w-5 h-5 text-slate-400" />
              <div className="text-slate-400">
                <div className="text-sm font-medium">Ministry of Emergency Management</div>
                <div className="text-xs">Republic of Rwanda</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 bg-green-500/10 px-4 py-2 rounded-full border border-green-400/30">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-400 text-sm font-medium">System Online</span>
            </div>
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="flex items-center justify-center p-6 lg:p-12 xl:p-16">
          <div className="w-full max-w-lg">
            
            {/* Mobile Header */}
            <div className="lg:hidden text-center mb-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-500/20 to-red-700/20 rounded-3xl border border-red-400/30 backdrop-blur-xl shadow-2xl mb-6">
                <AlertTriangle className="w-10 h-10 text-red-400" />
              </div>
              <h1 className="text-4xl font-bold text-white mb-3">MINEMA Alert</h1>
              <p className="text-red-300/80 font-medium text-lg">Emergency Management System</p>
              <p className="text-slate-400 mt-2">Ministry of Emergency Management - Rwanda</p>
            </div>

            {/* Login Card */}
            <div className="bg-white/10 backdrop-blur-2xl rounded-3xl p-8 lg:p-10 xl:p-12 border border-white/20 shadow-2xl">
              
              {/* Form Header */}
              <div className="text-center mb-10">
                <h2 className="text-3xl xl:text-4xl font-bold text-white mb-3">Welcome Back</h2>
                <p className="text-slate-300 font-medium text-lg">Sign in to access your emergency dashboard</p>
              </div>

              {/* Status Messages */}
              {successMessage && successMessage.includes('created successfully') && (
                <div className="mb-8 p-5 rounded-2xl bg-green-500/10 border border-green-400/30 backdrop-blur-sm">
                  <div className="flex items-start">
                    <CheckCircle className="h-6 w-6 mr-4 mt-0.5 text-green-400 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-green-300 text-base">Registration Successful</p>
                      <p className="text-sm mt-2 text-green-200/80">{successMessage}</p>
                    </div>
                  </div>
                </div>
              )}

              {redirectMessage && !successMessage && (
                <div className="mb-8 p-5 rounded-2xl bg-blue-500/10 border border-blue-400/30 backdrop-blur-sm">
                  <div className="flex items-start">
                    <Shield className="h-6 w-6 mr-4 mt-0.5 text-blue-400 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-blue-300 text-base">Access Required</p>
                      <p className="text-sm mt-2 text-blue-200/80">{redirectMessage}</p>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="mb-8 p-5 rounded-2xl bg-red-500/10 border border-red-400/30 backdrop-blur-sm">
                  <div className="flex items-start">
                    <AlertTriangle className="h-6 w-6 mr-4 mt-0.5 text-red-400 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-red-300 text-base">Sign In Failed</p>
                      <p className="text-sm mt-2 text-red-200/80">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Login Method Toggle */}
              <div className="mb-8">
                <div className="flex bg-white/10 backdrop-blur-sm rounded-2xl p-1.5 border border-white/20">
                  <button
                    type="button"
                    onClick={() => setLoginMethod('username')}
                    className={`flex-1 py-4 px-6 rounded-xl text-base font-semibold transition-all duration-300 ${
                      loginMethod === 'username' 
                        ? 'bg-red-600 text-white shadow-xl transform scale-105' 
                        : 'text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <User className="w-5 h-5 inline mr-3" />
                    Username
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginMethod('email')}
                    className={`flex-1 py-4 px-6 rounded-xl text-base font-semibold transition-all duration-300 ${
                      loginMethod === 'email' 
                        ? 'bg-red-600 text-white shadow-xl transform scale-105' 
                        : 'text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Mail className="w-5 h-5 inline mr-3" />
                    Email
                  </button>
                </div>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-8">
                
                {/* Username/Email Input */}
                <div>
                  <label className="block text-lg font-semibold text-slate-200 mb-4">
                    {loginMethod === 'email' ? 'Email Address' : 'Username'}
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none z-10">
                      {loginMethod === 'email' ? (
                        <Mail className="h-6 w-6 text-red-400/60 group-focus-within:text-red-400 transition-colors" />
                      ) : (
                        <User className="h-6 w-6 text-red-400/60 group-focus-within:text-red-400 transition-colors" />
                      )}
                    </div>
                    <input
                      type={loginMethod === 'email' ? 'email' : 'text'}
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      disabled={loading}
                      className={`block w-full pl-16 pr-6 py-5 bg-white/10 border-2 rounded-2xl text-white text-lg placeholder-slate-400/60 focus:outline-none focus:ring-0 transition-all duration-300 font-medium backdrop-blur-sm border-white/20 focus:border-red-400 hover:border-white/30 focus:bg-white/15 ${
                        getFieldError('username')
                          ? 'border-red-400/50 bg-red-500/10' 
                          : ''
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
                    <p className="mt-4 text-sm text-red-400 flex items-center font-medium">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      {getFieldError('username')}
                    </p>
                  )}
                </div>

                {/* Password Input */}
                <div>
                  <label className="block text-lg font-semibold text-slate-200 mb-4">
                    Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none z-10">
                      <Lock className="h-6 w-6 text-red-400/60 group-focus-within:text-red-400 transition-colors" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      disabled={loading}
                      className={`block w-full pl-16 pr-16 py-5 bg-white/10 border-2 rounded-2xl text-white text-lg placeholder-slate-400/60 focus:outline-none focus:ring-0 transition-all duration-300 font-medium backdrop-blur-sm border-white/20 focus:border-red-400 hover:border-white/30 focus:bg-white/15 ${
                        getFieldError('password')
                          ? 'border-red-400/50 bg-red-500/10' 
                          : ''
                      }`}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      disabled={loading}
                      className="absolute inset-y-0 right-0 pr-5 flex items-center disabled:cursor-not-allowed z-10"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-6 w-6 text-red-400/60 hover:text-red-400 transition-colors" />
                      ) : (
                        <Eye className="h-6 w-6 text-red-400/60 hover:text-red-400 transition-colors" />
                      )}
                    </button>
                  </div>
                  {getFieldError('password') && (
                    <p className="mt-4 text-sm text-red-400 flex items-center font-medium">
                      <AlertTriangle className="w-4 h-4 mr-2" />
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
                      disabled={loading}
                      className="h-5 w-5 text-red-600 focus:ring-red-500 border-slate-600 rounded bg-white/10"
                    />
                    <label htmlFor="remember-me" className="ml-4 text-slate-300 font-medium text-base">
                      Remember me
                    </label>
                  </div>
                  <Link
                    to="/auth/password-reset"
                    className="text-red-400 hover:text-red-300 font-semibold transition-colors text-base"
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* Sign In Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center items-center py-6 px-8 border border-transparent text-xl font-bold rounded-2xl text-white transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-2xl overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.9), rgba(220, 38, 38, 0.9))',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 25px 50px rgba(239, 68, 68, 0.4)'
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  {loading ? (
                    <>
                      <Loader2 className="h-7 w-7 mr-4 animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <Shield className="h-7 w-7 mr-4" />
                      <span>Access Emergency Dashboard</span>
                      <ArrowRight className="h-6 w-6 ml-4 group-hover:translate-x-2 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              {/* Sign Up Section */}
              <div className="mt-10">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/20" />
                  </div>
                  <div className="relative flex justify-center text-base">
                    <span className="px-6 bg-transparent text-slate-400 font-medium">New to MINEMA Alert?</span>
                  </div>
                </div>
                
                <div className="mt-8">
                  <Link 
                    to="/signup" 
                    className="w-full inline-flex items-center justify-center py-5 px-8 border border-red-400/30 rounded-2xl text-red-300 bg-red-500/10 hover:bg-red-500/20 font-semibold text-lg transition-all duration-300 backdrop-blur-sm group"
                  >
                    <User className="h-6 w-6 mr-4" />
                    <span>Create Emergency Account</span>
                    <ArrowRight className="h-5 w-5 ml-4 group-hover:translate-x-2 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Emergency Contact Card */}
            <div className="mt-8 p-6 bg-red-500/10 rounded-2xl border border-red-400/30 backdrop-blur-sm">
              <div className="flex items-start">
                <AlertTriangle className="h-7 w-7 text-red-400 mt-1 mr-5 flex-shrink-0" />
                <div>
                  <h4 className="text-lg font-bold text-red-300 mb-3">Emergency Contacts</h4>
                  <div className="text-base text-red-200 space-y-2">
                    <p>Emergency Services: <span className="font-bold text-white text-xl">112</span></p>
                    <p>MINEMA Operations: <span className="font-bold text-white">+250-788-000-000</span></p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 text-center text-sm text-slate-400">
              <p>© 2024 MINEMA - Ministry of Emergency Management</p>
              <p className="mt-1 text-slate-500">Republic of Rwanda</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;