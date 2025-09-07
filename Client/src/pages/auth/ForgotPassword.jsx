// pages/auth/ForgotPassword.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Mail, ArrowLeft, CheckCircle, Clock, Shield } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [validationError, setValidationError] = useState('');

  const validateEmail = (email) => {
    if (!email) {
      return 'Email is required';
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      return 'Please enter a valid email address';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const emailError = validateEmail(email);
    if (emailError) {
      setValidationError(emailError);
      return;
    }

    setLoading(true);
    setError('');
    setValidationError('');

    try {
      // TODO: Replace with actual API call
      // await apiService.resetPassword(email);
      
      // Simulate API call for now
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For demo purposes, always show success
      // In real implementation, this would depend on API response
      setSuccess(true);
      
    } catch (err) {
      setError('Failed to send reset email. Please try again or contact support.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setEmail(e.target.value);
    if (validationError) {
      setValidationError('');
    }
    if (error) {
      setError('');
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-100">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <CheckCircle className="text-green-600 w-10 h-10" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email</h1>
            <p className="text-gray-600">
              Password reset instructions sent
            </p>
          </div>

          {/* Success Message */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <Mail className="h-5 w-5 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <p className="text-sm text-green-800 font-medium">Email Sent Successfully</p>
                <p className="text-sm text-green-700 mt-1">
                  We've sent password reset instructions to <strong>{email}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-4 mb-8">
            <h3 className="font-semibold text-gray-900">Next Steps:</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                  <span className="text-blue-600 font-semibold text-xs">1</span>
                </div>
                <p>Check your email inbox for a message from RwandaDisasterAlert</p>
              </div>
              <div className="flex items-start">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                  <span className="text-blue-600 font-semibold text-xs">2</span>
                </div>
                <p>Click the reset link in the email (valid for 24 hours)</p>
              </div>
              <div className="flex items-start">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                  <span className="text-blue-600 font-semibold text-xs">3</span>
                </div>
                <p>Create a new secure password for your account</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link
              to="/login"
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center justify-center"
            >
              Back to Sign In
            </Link>
            <button
              onClick={() => {
                setSuccess(false);
                setEmail('');
              }}
              className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Send to Different Email
            </button>
          </div>

          {/* Help Section */}
          <div className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-start">
              <Clock className="h-5 w-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-yellow-800">Didn't receive the email?</h4>
                <p className="text-xs text-yellow-700 mt-1">
                  Check your spam folder or contact MINEMA IT support at +250-788-111-222
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-100">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Shield className="text-blue-600 w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Reset Password</h1>
          <p className="text-gray-600">
            Enter your email to receive reset instructions
          </p>
          <p className="text-sm text-gray-500 mt-1">
            RwandaDisasterAlert System
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6 flex items-start">
            <AlertTriangle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Reset Failed</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
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
                value={email}
                onChange={handleChange}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  validationError 
                    ? 'border-red-300 bg-red-50' 
                    : 'border-gray-300 bg-gray-50'
                }`}
                placeholder="Enter your registered email"
                autoComplete="email"
                required
              />
            </div>
            {validationError && (
              <p className="text-red-600 text-sm mt-1 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-1" />
                {validationError}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold shadow-lg"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Sending Reset Email...
              </div>
            ) : (
              'Send Reset Instructions'
            )}
          </button>
        </form>

        {/* Back to Login */}
        <div className="mt-8">
          <Link
            to="/login"
            className="flex items-center justify-center text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Sign In
          </Link>
        </div>

        {/* Security Notice */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-blue-800">Security Notice</h4>
              <p className="text-xs text-blue-700 mt-1">
                Password reset links expire after 24 hours for security. Only accounts registered 
                with MINEMA can request password resets.
              </p>
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-red-800">Need Immediate Access?</h4>
              <p className="text-xs text-red-700 mt-1">
                For emergency access contact MINEMA Operations: <strong>+250-788-000-000</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Alternative Support */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Account issues? Contact IT Support: <br />
            <span className="font-medium">support@minema.gov.rw</span> or <span className="font-medium">+250-788-111-222</span>
          </p>
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

export default ForgotPassword;