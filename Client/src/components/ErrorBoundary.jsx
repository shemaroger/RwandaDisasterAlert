// components/ErrorBoundary.jsx
import React from 'react';
import { AlertTriangle, RefreshCw, Phone, Mail } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Generate a unique error ID for tracking
    const errorId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    
    // Log the error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Update state with error details
    this.setState({
      error,
      errorInfo,
      errorId
    });

    // In production, you would send this to your error reporting service
    // Example: Sentry, LogRocket, or custom error tracking
    this.logErrorToService(error, errorInfo, errorId);
  }

  logErrorToService = (error, errorInfo, errorId) => {
    // TODO: Replace with actual error reporting service
    const errorReport = {
      errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.props.userId || 'anonymous'
    };

    // In development, just log to console
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Report');
      console.table(errorReport);
      console.groupEnd();
    }

    // In production, send to error tracking service
    // fetch('/api/errors', {
    //   method: 'POST',
    //   body: JSON.stringify(errorReport),
    //   headers: { 'Content-Type': 'application/json' }
    // }).catch(console.error);
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null 
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-lg w-full text-center">
            {/* Error Icon */}
            <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="text-red-600 w-10 h-10" />
            </div>

            {/* Error Message */}
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Something went wrong
            </h1>
            
            <p className="text-gray-600 mb-6">
              The RwandaDisasterAlert system encountered an unexpected error. 
              Our team has been notified and is working to resolve the issue.
            </p>

            {/* Error ID for support */}
            <div className="bg-gray-50 p-3 rounded-lg mb-6">
              <p className="text-sm text-gray-600">
                Error ID: <span className="font-mono font-medium">{this.state.errorId}</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Please include this ID when reporting the issue
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 mb-6">
              <button
                onClick={this.handleRetry}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </button>
              
              <button
                onClick={this.handleReload}
                className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Reload Page
              </button>
              
              <button
                onClick={this.handleGoHome}
                className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Go to Dashboard
              </button>
            </div>

            {/* Emergency Contact Information */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                Need immediate assistance?
              </h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-center space-x-2 text-red-600">
                  <Phone className="w-4 h-4" />
                  <span className="font-medium">Emergency: 112</span>
                </div>
                
                <div className="flex items-center justify-center space-x-2 text-blue-600">
                  <Phone className="w-4 h-4" />
                  <span>MINEMA: +250-788-000-000</span>
                </div>
                
                <div className="flex items-center justify-center space-x-2 text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span>support@minema.gov.rw</span>
                </div>
              </div>
            </div>

            {/* Development Error Details */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                  Developer Error Details
                </summary>
                <div className="mt-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-red-800">Error Message:</h4>
                    <p className="text-sm text-red-700 font-mono mt-1">
                      {this.state.error.message}
                    </p>
                  </div>
                  
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-red-800">Stack Trace:</h4>
                    <pre className="text-xs text-red-700 bg-red-100 p-2 rounded mt-1 overflow-auto max-h-32">
                      {this.state.error.stack}
                    </pre>
                  </div>
                  
                  {this.state.errorInfo?.componentStack && (
                    <div>
                      <h4 className="text-sm font-medium text-red-800">Component Stack:</h4>
                      <pre className="text-xs text-red-700 bg-red-100 p-2 rounded mt-1 overflow-auto max-h-32">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            {/* Footer */}
            <div className="mt-6 text-xs text-gray-500">
              © 2024 MINEMA - Ministry of Emergency Management
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;